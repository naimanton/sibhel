const PORT = 3000;
const fs = require('fs');
const http = require('http');
const requestResponser = function (request, response) {
	response.write('OK');
	response.end();
};
const server = http.createServer(requestResponser);
server.listen(PORT);
