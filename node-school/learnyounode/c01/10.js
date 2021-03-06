// proxy

// ME --- PROXY --- NET
// link through sockets

var http = require('http')
var net = require('net')
var url = require('url')

const proxy = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.end('Call')
})

// triggerd when server <---(CONNECT)<--- client
proxy.on('connect', (req, cltSocket, head) => {
  console.log(head.toString())

  const srvUrl = 'http://' + req.url
  const urlPart = url.parse(srvUrl)
  console.log('urlPart', urlPart)

  // connect to the DEST site. NOTE only two sockets exist in "ME --- PROXY --- NET" system.
  const srvSocket = net.connect(urlPart.port, urlPart.hostname, () => {
    cltSocket.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: Node.js-Proxy\r\n' + '\r\n') // must be \r\n
    srvSocket.write(head) // srv works as a writable stream
    srvSocket.pipe(cltSocket) // srv works as a readable stream
    cltSocket.pipe(srvSocket)
  })
})

proxy.listen(443, '127.0.0.1', () => {
  const options = {
    port: 443,
    host: '127.0.0.1',
    method: 'CONNECT', // http CONNECT method is for proxy usages
    path: 'dev.xinhulu.com:80' // this port number is necessary, for the options can not identify it 
  }

  const req = http.request(options)

  req.end()

  // triggerd when server --->(CONNECT)---> client
  req.on('connect', (res, socket, head) => {
    console.log('Connected\n')

    socket.write('GET /user/loginpdage HTTP/1.1\r\n' + 'Host: dev.xinhulu.com:80\r\n' + 'Connection: close\r\n' + '\r\n')

    socket.on('data', chunk => {
      console.log(chunk.toString())
      console.log('customer socket consumed this chunk')
    })

    socket.on('end', () => {
      proxy.close()
    })
  })
})
