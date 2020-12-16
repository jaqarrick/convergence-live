export const receiveAnswer = async (
	peerConnection: RTCPeerConnection,
	answer: RTCSessionDescriptionInit
) => {
	console.log("setting remote description")
	if (peerConnection.signalingState !== "stable") {
		await peerConnection.setRemoteDescription(answer)
		console.log("remote description set!")
	} else {
		console.log("remote description already set")
	}
}
