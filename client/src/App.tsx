import React, { useCallback, useState } from "react"
import usePeers from "./hooks/usePeers"
import Video from "./components/Video"
const App: React.FC = () => {
	const [localStream, setLocalStream] = useState<MediaStream>()
	const { allStreams, joinRoom } = usePeers()

	const initLocalVideo = useCallback(async () => {
		const constraints = {
			video: {
				width: 200,
				height: 200,
			},
		}
		setLocalStream(await navigator.mediaDevices.getUserMedia(constraints))
	}, [setLocalStream])
	return (
		<div>
			<h1> Web RTC </h1>
			<h1>welcome to the room!</h1>
			{localStream && <Video stream={localStream} />}
			<button onClick={joinRoom}> join the room </button>
			<button onClick={initLocalVideo}>start video</button>
		</div>
	)
}
export default App
