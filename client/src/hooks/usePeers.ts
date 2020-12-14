import { useCallback, useState, useEffect } from "react"
import { socket } from "./service/socket"
import { PeerObject } from "../../../Types"
import {
	onSuccess,
	onError,
	receiveOffer,
	receiveIceCandidate,
	localDescriptionCreated,
	handleICECandidate,
	receiveAnswer,
} from "./helpers/peerHelpers"

//STUN Server Configuration
const serverConfig = {
	iceServers: [
		{
			urls: "stun:stun.l.google.com:19302",
		},
	],
}

const usePeers = (localStream: MediaStream | null) => {
	//where all the Peer Connections Live
	const [allPeerConnections, setAllPeerConnections] = useState<PeerObject>()

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

	//this is attached to a simplified button which should initialize the process
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
	//INIT PEER CONNECTION HERE
	useEffect(() => {
		socket.on("ping peers", (remoteid: string) => {
			console.log(`socket ${remoteid} is trying to reach you...`)
			console.log(`init peer connection with ${remoteid}`)
			initNewPeerConnection(remoteid)
		})
	})
	//error handlers
	const [allStreams, setAllStreams] = useState<MediaStream[]>([])

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

	const initNewPeerConnection = useCallback(
		(remoteid: string) => {
			try {
				const peerConnection = new RTCPeerConnection(serverConfig)
				peerConnection.addEventListener("icecandidate", e =>
					handleICECandidate(e, socket)
				)
				peerConnection.addEventListener("track", handleRemoteStreamAdded)
				if (localStream)
					localStream
						.getTracks()
						.forEach((track: MediaStreamTrack) =>
							peerConnection.addTrack(track)
						)
				console.log("created RTC PeerConnection")
				setAllPeerConnections(prevConnections => {
					return { ...prevConnections, [remoteid]: peerConnection }
				})
			} catch (e) {
				console.log(`Failed to create Peer Connection. Error: ${e}`)
				return
			}
			//establish new peer connection and add STUN server config
		},
		[localStream, setAllPeerConnections]
	)

	// The next step is filtering / routing the socket event listeners
	// For example, a socket.on("receive ice candidate") should receive the candidate, but also
	// the socket.id
	// socket.on("receive ice candidate", data => {socketid, candidate} = data)
	// Then find the specific peer connection - currentPC = allPeerConnections.socketid

	return {
		allStreams,
		joinRoom,
	}
}

export default usePeers
