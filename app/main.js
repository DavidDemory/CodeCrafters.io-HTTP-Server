const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const parseIndex = (data) => {
  const parsedLines = data.toString().split("\r\n");
  const parsedRequest = parsedLines[0].split(" ");
  const index = parsedRequest[1];

  return index;
}

const retrieveUserAgentHeader = (data) => {
  const parsedLines = data.toString().split("\r\n");
  let userAgentHeader;

  parsedLines.forEach((line) => {
    if(line.startsWith('User-Agent')) {
      userAgentHeader = line.replace('User-Agent: ', '')
    }
  })

  return userAgentHeader;
}

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const index = parseIndex(data);

    let response = 'HTTP/1.1 404 Not Found\r\n\r\n';

    if(index === '/'){
     response = 'HTTP/1.1 200 OK\r\n\r\n';
    } else if (index.startsWith('/echo')) {
      const text = index.replace('/echo/', '');
      response = `HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${text.length}\r\n\r\n${text}`;
    } else if (index === '/user-agent') {
      const userAgentHeader = retrieveUserAgentHeader(data);
      response = `HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${userAgentHeader.length}\r\n\r\n${userAgentHeader}`;
    }

    socket.write(response, 'utf-8', () => {
      socket.end();
      server.close();
    });
  });

  socket.on("close", () => {
    socket.end();
    server.close();
  });
});

server.listen(4221, "localhost");
