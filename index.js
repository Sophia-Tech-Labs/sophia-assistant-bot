require("dotenv").config()
const startBot = require("./lib/connect");
const express = require("express");

const app = express();

app.get("/",(req,res)=>{
	res.send("Whatsapp bot working")
})
startBot()
 const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	console.log("Server Running On Port: ",PORT)
})
