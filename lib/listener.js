const Message = require("./base");
const db = require("./db");
const { Functions } = require("./functions");
const { getMainNumber, isGroup, isGroupUser } = require("./functions");
async function messageListener(sock) {
  sock.ev.removeAllListeners("messages.upsert");
  const mainNumber = await getMainNumber();
  sock.ev.on("messages.upsert", async ({ type, messages }) => {
    try {
      if (type !== "notify") {
        return;
      }
      for (const message of messages) {
        if (!message) continue;
        if (message.key.remoteJid === "status@broadcast") continue;
        console.log(JSON.stringify(message, null, 2));

        const m = new Message(sock, message);
        if (isGroup(message)) {
          // const group = await sock.groupMetadata(message.key.remoteJid)
          // console.log(group);
          // console.log(await sock.groupMetadata(m.jid))
        }

        //	if(m.key.fromMe) return;
        // For DMs
        const wcgProcessed = await Functions.wcgIntegration.processMessage(
          message.key.remoteJid,
          message?.key?.participantPn || message.key.remoteJid,
          message?.pushName || "player",
          m.convo,
          m
        );
        if (m.jid === mainNumber && m.isBot() && m.isPrivate()) {

          if (wcgProcessed) {
            return; // Don't process as normal message
          }
          await sock.presenceSubscribe(message.key.remoteJid);
          await sock.readMessages([message.key]);
          await new Promise((res) => setTimeout(res, 500));
          await sock.sendPresenceUpdate("composing", message.key.remoteJid);
          await new Promise((res) => setTimeout(res, 1500));
          const result = await m.getAIReply();
          if (!result.functionHandled && result.reply) {
            await m.reply(result.reply);
          }
          await sock.sendPresenceUpdate("paused", message.key.remoteJid);
        }

        // For Groups
        else if (
          isGroup(message) &&
          (await isGroupUser(message)) &&
          ((m.quoted && m.isQuotedBot()) || m.isBotMentioned())
        ) {
          if (
            Functions.wcgIntegration.hasActiveGame(message.key.remoteJid) &&
            !m.isBotMentioned()
          ) {
            return; // Don't respond to regular messages during game unless mentioned
          }
          await sock.presenceSubscribe(message.key.remoteJid);
          await new Promise((res) => setTimeout(res, 500));
          await sock.sendPresenceUpdate("composing", message.key.remoteJid);
          await new Promise((res) => setTimeout(res, 1500));

          const result = await m.getAIReplyForGroup();
          if (!result.functionHandled && result.reply) {
            await m.reply(result.reply);
          }
          await sock.sendPresenceUpdate("paused", message.key.remoteJid);
        }
      }
    } catch (err) {
      console.error("An Error Occured while processing message", err);
    }
  });
}

function groupListener(sock, groupCache) {
  sock.ev.removeAllListeners("groups.update");
  sock.ev.removeAllListeners("group-participants.update");

  sock.ev.on("groups.update", async ([event]) => {
    const metadata = await sock.groupMetadata(event.id);
    groupCache.set(event.id, metadata);
  });

  sock.ev.on("group-participants.update", async (event) => {
    const metadata = await sock.groupMetadata(event.id);
    groupCache.set(event.id, metadata);
  });
}

module.exports = { messageListener, groupListener };
