const Message = require("./base");
const db = require("./db");
const {getMainNumber } = require("./functions")
async function messageListener(sock){
const mainNumber = await getMainNumber();
	sock.ev.on("messages.upsert",async({type,messages})=>{
	try{
		if(type !== "notify"){
			return;
		}
		for(const message of messages){
			if(!message) continue;
			if(message.key.remoteJid === "status@broadcast") continue;
			console.log(JSON.stringify(message,null,2))
			const m = new Message(sock,message);
			
			if(m.jid === mainNumber && m.isBot()){
				const reply = m.getAIReply() || "Hey";
				m.send(await m.getAIReply())
			}
		//	if(m.key.fromMe) return;
		}
		} catch(err){
			console.error("An Error Occured while processing message",err)
		}
	})
}

module.exports = messageListener;
