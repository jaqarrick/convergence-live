export interface PeerObject {
	[key: string]: RTCPeerConnection
}

export interface OfferPayload {
	remoteid: string
	offer: RTCSessionDescriptionInit
}

export interface ICEPayload {
	remoteid: string
	candidate: RTCIceCandidate
}
