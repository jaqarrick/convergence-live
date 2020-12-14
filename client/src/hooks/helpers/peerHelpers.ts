import { EventEmitter } from "events"
import { Socket } from "socket.io"

const onSuccess = () => console.log("success!")
const onError = (err: Error) => console.error(err)

const handleICECandidate = (
	e: RTCPeerConnectionIceEvent,
	socket: SocketIOClient.Emitter
) => {
	console.log("icecandidate event", e)
	if (e.candidate) {
		console.log("sending ICE candidate!", e.candidate)
		socket.emit("send ICE candidate", e.candidate)
	} else {
		console.log("end of ICE candidates")
	}
}

const localDescriptionCreated = (
	socket: SocketIOClient.Emitter,
	peerConnection: RTCPeerConnection,
	description: RTCSessionDescription
) => {
	peerConnection.setLocalDescription(description)
	console.log(
		`local description set and sent to server: ${JSON.stringify(description)}`
	)
	socket.emit("send offer", description)
}

const receiveIceCandidate = async (
	peerConnection: RTCPeerConnection,
	candidate: RTCIceCandidate
) => {
	await peerConnection.addIceCandidate(candidate)
	console.log("received ICE candidate")
}

const receiveOffer = async (
	peerConnection: RTCPeerConnection,
	offer: RTCSessionDescription,
	localStream: MediaStream,
	socket: SocketIOClient.Emitter
) => {
	console.log("received SDP offer!")
	await peerConnection.setRemoteDescription(offer)
	localStream
		.getTracks()
		.forEach((track: MediaStreamTrack) => peerConnection.addTrack(track))

	await peerConnection.setLocalDescription(await peerConnection.createAnswer())
	socket.emit("send answer", peerConnection.localDescription)
}

const receiveAnswer = async (
	peerConnection: RTCPeerConnection,
	answer: RTCSessionDescription
) => {
	await peerConnection.setRemoteDescription(answer)
	console.log("remote description set!")
}
export {
	onSuccess,
	onError,
	receiveOffer,
	receiveIceCandidate,
	localDescriptionCreated,
	handleICECandidate,
	receiveAnswer,
}
