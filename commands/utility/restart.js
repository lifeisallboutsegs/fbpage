const { logger } = require("../../utils/logger");
module.exports = {
  name: "restart",
  category: "system",
  adminOnly: true,
  description: "Restarts the bot",
  async execute(messenger, senderId) {
    const restartTime = Date.now();
    await messenger.sendTextMessage(senderId, "🔄 Restarting...");
    logger.info(`Bot restart initiated by ${senderId}`);
    process.exit(0);
  },
};
