const {default:makeWASocket,Browsers,DisconnectReason } = require("baileys");
const pino = require("pino");
const { useSQLAuthState } = require("./auth");
const NodeCache = require('node-cache');
const db = require("./db");
const msgRetryCounterCache = new NodeCache();
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
const { messageListener,groupListener } = require("./listener")
const{ Boom } = require("@hapi/boom");
async function startBot(){
const apikey = process.env.SOPHIA_API_KEY;
if(!apikey){
	throw new Error("Please add apikey to environmental variables")
}
const checkUser = await db.query("SELECT * FROM users WHERE api_key = $1",[apikey]);
	if(checkUser.length === 0){
		throw new Error("User Not Found")
	}
	async function connect(){
	const { state,saveCreds } = await useSQLAuthState(apikey);
	const sock = makeWASocket({
		auth:state,
		logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
		browser: Browsers.macOS("Safari"),
		markOnlineOnConnect: true, 
		msgRetryCounterCache,
		cachedGroupMetadata: async (jid) => groupCache.get(jid),
		generateHighQualityLinkPreview: true,
	})
	sock.ev.on("connection.update",async (update)=>{
		try{
			const { connection, lastDisconnect } = update;
			if(connection === "open"){
				console.log('✅ Connected to WhatsApp successfully.');
				const mainNumber = await db.query("SELECT main_phone FROM users WHERE api_key = $1;",[apikey]);
				console.log("Main Phone number Found :",mainNumber[0].main_phone);

				if(mainNumber.length === 0){
					console.log("No Main Phone Number")
					return;
				}
				const userName = await db.query("SELECT name FROM users WHERE api_key = $1",[apikey])
				//await sock.sendMessage(mainNumber[0].main_phone+"@s.whatsapp.net",{text:`Heya ${userName[0].name} 😚, Sophia Assistant Here. Surprise Surprise i'm Alive 🥳🥳 soo hyd`});				
			} if(connection === "close"){
				const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
					if (reason === DisconnectReason.loggedOut){
					       console.error('❌ Bot logged out. Deleting session and stopping...');
					       const userID = await db.query("SELECT id FROM users where api_key = $1",[apikey])
					      await db.query("DELETE FROM sessions WHERE user_id = $1",[userID[0].id]);  
					          
					    } else if(reason === DisconnectReason.restartRequired){
					    	console.log("Server Restart Required");
					    	startBot()
					    }
					    else if (reason === DisconnectReason.multideviceMismatch) {
					                    console.error('multideviceMismatch... Restarting connection...');
					                    connect();			                    
					          }
					 
				}
			} 	catch(error){
			console.error("Connection Error: ",error);
		}
	})
	//sock.ev.removeAllListeners();
	messageListener(sock);
	groupListener(sock,groupCache);
	
	}
	await connect()
	
}
module.exports = startBot;
