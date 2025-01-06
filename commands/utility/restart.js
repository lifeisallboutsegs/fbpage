const { logger } = require("../../utils/logger");
const fs = require('fs');

module.exports = {
  name: "restart",
  category: "system",
  adminOnly: true,
  description: "Restarts the bot",
  async execute(messenger, senderId) {
    const restartTime = Date.now();

    
    const restartInfo = {
      restarted: true,
      timestamp: restartTime,
      senderId: senderId,
    };

    fs.writeFileSync('./data/restart.json', JSON.stringify(restartInfo));

    await messenger.sendTextMessage(senderId, "🔄 Restarting...");
    logger.info(`Bot restart initiated by ${senderId}`);
    process.exit(0);
  },
};
