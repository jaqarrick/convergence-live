import { Socket } from "socket.io"

const app = require("express")()
const server = require("http").createServer(app)
const io = require("socket.io")(server)

interface SocketData {
	ids: string[]
}
const socketData: SocketData = {
	ids: [],
}

io.on("connection", (socket: Socket) => {
	console.log(`a client has connected... the id of the client is ${socket.id}`)
	socket.emit("confirm id", socket.id)
	// handleSocketId(socket.id, "add")
	console.log(Object.keys(socket.rooms))
	socket.on("join room", (socketid: string) => {
		console.log(`socket: ${socketid} would like to join the room`)
		socket.join("chat")
		socket.emit("confirm join", "chat")
	})

	socket.on("ping peers", roomid => {
		console.log(
			`Ping message from socket ${socket.id}, relaying ping to other sockets in room: "${roomid}"`
		)
		const message = `Hi from socket ${socket.id}`
		socket.to(roomid).emit("ping peers", message)
	})
	socket.on("disconnect", () => {
		console.log("A user has disconnected!")
	})
})

const PORT = 5000

server.listen(PORT, (err: Error) => {
	if (err) console.log(err)
	else {
		console.log(`The server is up and running at http://localhost://${PORT}`)
	}
})
