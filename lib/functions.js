const db = require("./db");
async function getMainNumber(){
	const email = process.env.EMAIL;
	const results = await db.query("SELECT main_phone FROM users WHERE email = $1",[email]);
	return results[0].main_phone+"@s.whatsapp.net"
}
module.exports = { getMainNumber }
