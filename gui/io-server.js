const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)

app.get('/', (req, res) => {
  res.send('IO_GLC')
})

server.listen(57743, () => {
  console.log('Socket listening on localhost:57743')
})

module.exports = {
  onSocket: f => {
    io.on('connection', f)
  },
  io
}
