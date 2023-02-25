var http = require("http");
// 내부IP, 내 컴퓨터 주소
var hostname = "127.0.0.1";
var port = 8080;

const server = http.createServer(function (req, res) {
  const path = req.url;
  const method = req.method;

  if (path === "/products") {
    if (method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      const products = JSON.stringify([
        {
          name: "농구공",
          price: 5000,
        },
      ]);
      res.end(products);
    } else if (method === "POST") {
    }
  } else {
    res.end("Good Bye");
  }
});

server.listen(port, hostname);
console.log("d-market server on");
