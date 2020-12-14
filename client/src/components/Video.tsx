import React, { useRef, useEffect } from "react"

interface Props {
	stream: MediaStream
}
const Video: React.FC<Props> = ({ stream }) => {
	const videoRef = useRef<HTMLVideoElement>(null)
	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.srcObject = stream
			videoRef.current.autoplay = true
		}
	}, [stream])
	return <video ref={videoRef}></video>
}

export default Video
