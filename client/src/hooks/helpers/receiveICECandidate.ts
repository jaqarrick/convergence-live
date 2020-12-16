export const receiveICECandidate = async (
	peerConnection: RTCPeerConnection,
	candidate: RTCIceCandidate
) => {
	await peerConnection.addIceCandidate(candidate)
	console.log("received ICE candidate")
}
