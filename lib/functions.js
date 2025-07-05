const Database = require("better-sqlite3");
const newdb = new Database("function.db");
const db = require("./db");
const axios = require("axios")
async function getMainNumber(){
	const apikey = process.env.SOPHIA_API_KEY;
	const results = await db.query("SELECT main_phone FROM users WHERE api_key = $1",[apikey]);
	if(results.length === 0){
		throw new Error("Main Phone Number Not found")
	}
	return results[0].main_phone+"@s.whatsapp.net"
}

class Functions{
	changeTone(tone){
		newdb.prepare(`
CREATE TABLE IF NOT EXISTS settings(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	tone TEXT NOT NULL DEFAULT "default"
)
		`).run();
		  const row = newdb.prepare('SELECT id FROM settings WHERE id = 1').get();
		  if(row) {
		    newdb.prepare('UPDATE settings SET tone = ? WHERE id = 1').run(tone);
		  } else {
		    newdb.prepare('INSERT INTO settings (id, tone) VALUES (1, ?)').run(tone);
		  }
		
	}
	getTone(){
	try{
		const row = newdb.prepare('SELECT tone FROM settings WHERE id = ?').get(1);
		const tone = row ? row.tone : "default";
		return tone 
		} catch(error){
			return "default";
		}
	}
}
module.exports = { getMainNumber,Functions }
