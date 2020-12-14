import { useCallback, useState, useEffect } from "react"
import { socket } from "./service/socket"
//STUN Server Configuration
const serverConfig = {
	iceServers: [
		{
			urls: "stun:stun.l.google.com:19302",
		},
	],
}

const usePeers = () => {
	//SIGNALING / SOCKET CONFIGURATION
	//when a final socket id is decided by the server, it is sent to the client
	//this id is stored in the component state
	//this gets around an error of multiple socket ids being supplied to a single connection
	const [mySocketId, setMySocketId] = useState<string>()
	useEffect(() => {
		socket.on("confirm id", () => {
			console.log(`my socket id is ${socket.id}`)
			setMySocketId(socket.id)
		})
	}, [setMySocketId])

	//simplified socket message send
	//might have to include deps in the params
	const sendSocketMessage = useCallback(
		(message: string, messageContent: any) => {
			socket.emit(message, messageContent)
		},
		[]
	)

	//this is a simplified button which should initialize the process
	//of the peer exchange

	const joinRoom = useCallback(() => {
		console.log("request to join room")
		if (mySocketId) socket.emit("join room", mySocketId)
	}, [mySocketId])

	//once the server confirms a successful join, the socket pings other peers in the room
	useEffect(() => {
		socket.on("confirm join", (roomid: string) => {
			console.log(`Currently in room: ${roomid}`)
			if (mySocketId && roomid) socket.emit("ping peers", roomid)
		})
	}, [mySocketId])

	//peer listens for these pings
	useEffect(() => {
		socket.on("ping peers", (message: string) => {
			console.log(message)
		})
	})
	//error handlers
	const onSuccess = useCallback(() => console.log("success!"), [])
	const onError = useCallback((error: Error) => console.error(error), [])
	const [allStreams, setAllStreams] = useState<MediaStream[]>([])

	const handleICECandidate = useCallback(
		e => {
			console.log("icecandidate event", e)
			if (e.candidate) {
				console.log("sent ICE candidate to signaling server / peers")
				sendSocketMessage("send ICE candidate", e.candidate)
			} else {
				console.log(`end of ICE candidates`)
			}
		},
		[sendSocketMessage]
	)

	//when a remote stream is added to a peer conn, the stream is added
	//to an array of MediaStreams
	const handleRemoteStreamAdded = useCallback(
		e => {
			console.log("remote stream received")
			const remoteStream = new MediaStream()
			remoteStream.addTrack(e.track)
			setAllStreams(prevStreams => [...prevStreams, remoteStream])
		},
		[setAllStreams]
	)

	const initNewPeerConnection = useCallback(() => {
		const peerConnection = new RTCPeerConnection(serverConfig)
		peerConnection.addEventListener("icecandidate", handleICECandidate)
		peerConnection.addEventListener("track", handleRemoteStreamAdded)

		const localDescriptionCreated = (
			description: RTCSessionDescriptionInit
		) => {
			peerConnection.setLocalDescription(description)
			console.log(
				`local SDP set and sent to server: ${JSON.stringify(description)}`
			)
			sendSocketMessage("send offer", description)
		}
	}, [])

	return {
		allStreams,
		joinRoom,
	}
}

export default usePeers
