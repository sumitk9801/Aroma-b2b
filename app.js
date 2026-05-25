const express = require('express');
const app = express();
const connectdb = require('./db/db.js');
const userRoute = require("./routes/userRoute");
// const productRoute = require("./routes/productRoute");
// const orderRoute = require("./routes/orderRoute");

connectdb();
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Hello World");
})
app.use("/user", userRoute);
// app.use("/product", productRoute);
// app.use("/order", orderRoute);


module.exports = app;