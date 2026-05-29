const express = require('express');
const app = express();
const connectdb = require('./db/db.js');
const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
// const orderRoute = require("./routes/orderRoute");

connectdb();
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Hello World");
})
app.use("/api/v1/auth", userRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/shops", userRoute);
app.use("/api/v1/categories", userRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/purchases", userRoute);
app.use("/api/v1/sales", userRoute);
app.use("/api/v1/stock-movements", userRoute);
app.use("/api/v1/reports", userRoute);
app.use("/api/v1/uploads", userRoute);

// app.use("/order", orderRoute);


module.exports = app;