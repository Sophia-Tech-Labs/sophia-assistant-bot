class Message{
	constructor(sock,msg){
		this.msg = msg;
		this.sock = sock;
	}

	async send(text){
		await this.sock.sendMessage(this.msg.key.remoteJid,{text:text});
	}
}

module.exports = Message
