const express = require('express');
const app = express();
const connectdb = require('./db/db.js');

connectdb();
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Hello World");
})


module.exports = app;