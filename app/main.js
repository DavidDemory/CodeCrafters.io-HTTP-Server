const net = require("net");
const fs = require("fs");
const path = require("path");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const parseStartLine = (data) => {
  const parsedLines = data.toString().split("\r\n");
  const parsedRequest = parsedLines[0].split(" ");
  const method = parsedRequest[0];
  const path = parsedRequest[1];

  return {method, path};
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

const retrieveBody = (data) => {
  const parsedLines = data.toString().split("\r\n\r\n");

  return parsedLines[1];
}


const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const {method, path: rawPath} = parseStartLine(data);

    let response = 'HTTP/1.1 404 Not Found\r\n\r\n';

    if(rawPath === '/'){
     response = 'HTTP/1.1 200 OK\r\n\r\n';
    } else if (rawPath.startsWith('/echo')) {
      const text = rawPath.replace('/echo/', '');
      response = `HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${text.length}\r\n\r\n${text}`;
    } else if (rawPath === '/user-agent') {
      const userAgentHeader = retrieveUserAgentHeader(data);
      response = `HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${userAgentHeader.length}\r\n\r\n${userAgentHeader}`;
    } else if (rawPath.startsWith('/files')) {
      const directoryName = process.argv[3];
      const directory = path.resolve(directoryName);
      if(fs.existsSync(directory)) {
        const fileName = rawPath.replace('/files/', '');
        const filePath = path.resolve(directory, fileName);
        if(method === 'GET') {
          if(fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath);
            response = `HTTP/1.1 200 OK\r\nContent-type: application/octet-stream\r\nContent-length: ${fileContent.length}\r\n\r\n${fileContent}`;
          } else {
            response = 'HTTP/1.1 404 File does not exists\r\n\r\n';
          }
        } else if (method === 'POST') {
          const body = retrieveBody(data);
          fs.writeFileSync(filePath, body);
          response = 'HTTP/1.1 201\r\n\r\n';
        }
      } else {
        response = 'HTTP/1.1 404 Directory does not exists\r\n\r\n';
      }
    }

    socket.write(response, 'utf-8', () => {
      socket.end();
    });
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
