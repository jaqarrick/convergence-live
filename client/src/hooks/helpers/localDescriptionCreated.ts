import { OfferPayload } from "../../../../Types"

export const localDescriptionCreated = (
	socket: SocketIOClient.Emitter,
	peerConnection: RTCPeerConnection,
	remoteid: string,
	offer: RTCSessionDescriptionInit
) => {
	peerConnection.setLocalDescription(offer)
	console.log(
		`local description set and sent to peer ${remoteid}: ${JSON.stringify(
			offer
		)}`
	)
	const offerPayload: OfferPayload = {
		remoteid: remoteid,
		offer: offer,
	}
	socket.emit("send offer", offerPayload)
}
