const { logger } = require('../../utils/logger');
const fs = require('fs').promises;

module.exports = {
  name: 'debug',
  category: 'utility',
  adminOnly: true,
  description: 'Set debug level',
  async execute(messenger, senderId, args) {
    const level = args[0]?.toLowerCase();
    const validLevels = ['error', 'warn', 'info', 'debug'];
    
    if (!validLevels.includes(level)) {
      return messenger.sendTextMessage(senderId, 
        `❌ Invalid level. Use: ${validLevels.join(', ')}`);
    }
    
    logger.level = level;
    const config = JSON.parse(await fs.readFile('data/config.json', 'utf8'));
    config.debugLevel = level;
    await fs.writeFile('data/config.json', JSON.stringify(config, null, 2));
    
    await messenger.sendTextMessage(senderId, `✅ Debug level set to ${level}`);
  }
};