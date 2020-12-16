import { OfferPayload } from "../../../../Types"

export const receiveOffer = async (
	peerConnection: RTCPeerConnection,
	offer: RTCSessionDescriptionInit,
	localStream: MediaStream,
	socket: SocketIOClient.Emitter,
	remoteid: string
) => {
	console.log("received SDP offer!")
	console.log(`Signaling State: ${peerConnection.signalingState}`)
	if (peerConnection.signalingState === "stable") {
		await peerConnection.setRemoteDescription(offer)
		console.log("remote description set after receiving offer!")
		localStream
			.getTracks()
			.forEach((track: MediaStreamTrack) => peerConnection.addTrack(track))
		await peerConnection.setLocalDescription(
			await peerConnection.createAnswer()
		)
		if (peerConnection.localDescription) {
			const answerPayload: OfferPayload = {
				remoteid: remoteid,
				offer: peerConnection.localDescription,
			}
			console.log("sending answer to offer!")
			socket.emit("send answer", answerPayload)
		}
	}
}
