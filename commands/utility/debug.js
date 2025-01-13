const { logger } = require('../../utils/logger');
const fs = require('fs').promises;

module.exports = {
  name: 'debug',
  category: 'utility',
  adminOnly: true,
  description: 'Set debug level',
  async execute(messenger, senderId, args) {
    const level = args[0]?.toLowerCase();
    const validLevels = Object.keys(logger.levels);
    
    if (!validLevels.includes(level)) {
      logger.warn('Invalid debug level attempted', {
        attemptedLevel: level,
        senderId
      });
      
      return messenger.sendTextMessage(
        senderId,
        `❌ Invalid level. Valid levels are: ${validLevels.join(', ')}`
      );
    }
    
    const oldLevel = logger.level;
    logger.level = level;
    
    const config = JSON.parse(await fs.readFile('data/config.json', 'utf8'));
    config.debugLevel = level;
    await fs.writeFile('data/config.json', JSON.stringify(config, null, 2));
    
    logger.info('Debug level changed', {
      oldLevel,
      newLevel: level,
      senderId
    });
    
    await messenger.sendTextMessage(
      senderId,
      `✅ Debug level changed from ${oldLevel} to ${level}`
    );
  }
};
