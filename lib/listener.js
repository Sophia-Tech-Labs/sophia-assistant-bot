const Message = require("./base");
const db = require("./db");
const {getMainNumber,isGroup } = require("./functions")
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
		if(isGroup(message)){
			console.log(await sock.groupMetadata(m.jid))
		}
		//	if(m.key.fromMe) return;
			if(m.jid === mainNumber && m.isBot() && m.isPrivate()){
				m.reply(await m.getAIReply())
			} else if(isGroup(message) && m.quoted && m.isQuotedBot()){
				const reply = await m.getAIReplyForGroup();
				m.reply(reply);
			}

			}
		} catch(err){
			console.error("An Error Occured while processing message",err)
		}
	})
}

function groupListener(sock,groupCache){
  sock.ev.on('groups.update', async ([event]) => {
    const metadata = await sock.groupMetadata(event.id)
    groupCache.set(event.id, metadata)
})

sock.ev.on('group-participants.update', async (event) => {
    const metadata = await sock.groupMetadata(event.id)
    groupCache.set(event.id, metadata)
})
}

module.exports = { messageListener,groupListener };
