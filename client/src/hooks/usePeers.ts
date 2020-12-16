import { useCallback, useState, useEffect } from "react"
import { socket } from "./service/socket"
import { ICEPayload, OfferPayload, PeerObject } from "../../../Types"
import {
	onSuccess,
	onError,
	handleICECandidate,
	receiveOffer,
	receiveICECandidate,
	localDescriptionCreated,
	receiveAnswer,
} from "./helpers/index"

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

	const [currentRoom, setCurrentRoom] = useState<string>()
	//once the server confirms a successful join, the socket pings other peers in the room
	//The current room is set in state
	useEffect(() => {
		socket.on("confirm join", (roomid: string) => {
			console.log(`Currently in room: ${roomid}`)
			setCurrentRoom(roomid)
			if (mySocketId && roomid) socket.emit("ping peers", roomid)
		})
	}, [mySocketId, setCurrentRoom])

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
				// peerConnection.addEventListener("icecandidate", e =>
				// 	handleICECandidate(e, remoteid, socket)
				// )
				peerConnection.addEventListener("track", handleRemoteStreamAdded)

				peerConnection.onnegotiationneeded = () =>
					peerConnection
						.createOffer()
						.then(offer =>
							localDescriptionCreated(socket, peerConnection, remoteid, offer)
						)
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
		[localStream, setAllPeerConnections, handleRemoteStreamAdded]
	)

	//Logging All the Peer Connections
	useEffect(() => {
		console.log(allPeerConnections)
	}, [allPeerConnections])

	//SOCKET EVENT LISTENERS FOR ICE CANDIDATE, SDP OFFER AND ANSWER
	useEffect(() => {
		socket.on("send offer", (offerPayload: OfferPayload) => {
			console.log("received SDP offer")
			//since this is the first time this client is hearing from
			//the remote peer, we need to establish a new PC here
			const { remoteid, offer } = offerPayload

			const peerConnection = new RTCPeerConnection(serverConfig)
			// peerConnection.addEventListener("icecandidate", e =>
			// 	handleICECandidate(e, remoteid, socket)
			// )
			peerConnection.addEventListener("track", handleRemoteStreamAdded)
			setAllPeerConnections(prevConn => {
				return { ...prevConn, [remoteid]: peerConnection }
			})
			//lookup in peerconnection dictionary using remoteid as key
			console.log(`local stream: ${localStream}`)
			if (localStream) {
				receiveOffer(peerConnection, offer, localStream, socket, remoteid)
				console.log("listening for ICE candidates")
				peerConnection.addEventListener("icecandidate", e => {
					handleICECandidate(e, remoteid, socket)
				})
			} else {
				console.error(
					"You've received an SDP offer, but either your local stream isn't connected or something went wrong initializing the peer connection"
				)
			}
		})
	}, [allPeerConnections, localStream, handleRemoteStreamAdded])

	//Socket message for receiving an answer to SDP offer
	useEffect(() => {
		socket.on("send answer", async (answerPayload: OfferPayload) => {
			console.log("received SDP answer!")
			const { remoteid, offer } = answerPayload
			//find the current peer connection in dictionary
			const currentPC = allPeerConnections ? allPeerConnections[remoteid] : null
			if (currentPC) {
				receiveAnswer(currentPC, offer)

				console.log("listening for ICE candidates")
				currentPC.addEventListener("icecandidate", e => {
					handleICECandidate(e, remoteid, socket)
				})
			} else {
				console.error("the current peer connection could not be found")
			}
		})
	}, [allPeerConnections])

	//Socket message for receiving ICE candidates
	useEffect(() => {
		socket.on("send ICE candidate", async (IcePayload: ICEPayload) => {
			console.log("received ICE candidate from remote peer!")
			const { remoteid, candidate } = IcePayload
			const currentPC = allPeerConnections ? allPeerConnections[remoteid] : null
			if (currentPC?.remoteDescription)
				await currentPC?.addIceCandidate(candidate)
		})
	}, [allPeerConnections])

	return {
		allStreams,
		joinRoom,
	}
}

export default usePeers
