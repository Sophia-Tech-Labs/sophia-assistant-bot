const Message = require("./base");
const db = require("./db");
const {getMainNumber } = require("./functions")
async function messageListener(sock){
const mainNumber = await getMainNumber();
	sock.ev.on("messages.upsert",async({type,messages})=>{
		if(type !== "notify"){
			return;
		}
		for(const message of messages){
			if(!message) return;
			
			console.log(JSON.stringify(message,null,2))
			const m = new Message(sock,message);
		//	if(m.key.fromMe) return;
			if(message.key.remoteJid === mainNumber){
				m.send("How Are You?")
			}
		}
	})
}

module.exports = messageListener;
