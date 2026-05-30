const dotenv = require('dotenv');
dotenv.config();
const http = require('http');
const app = require('./app');

const port = process.env.port || 3000;

const server = http.createServer(app);


server.listen(port,()=>{
    console.log("server is live on port " + port);
})