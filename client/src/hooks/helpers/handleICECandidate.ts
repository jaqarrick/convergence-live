import { ICEPayload } from "../../../../Types"

export const handleICECandidate = (
	e: RTCPeerConnectionIceEvent,
	remoteid: string,
	socket: SocketIOClient.Emitter
) => {
	console.log("icecandidate event", e)
	if (e.candidate) {
		console.log("sending ICE candidate!", e.candidate)
		const ICEPayload: ICEPayload = {
			remoteid: remoteid,
			candidate: e.candidate,
		}
		socket.emit("send ICE candidate", ICEPayload)
	} else {
		console.log("end of ICE candidates")
	}
}
