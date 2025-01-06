const fs = require('fs').promises;

module.exports = {
  name: 'prefix',
  category: 'utility',
  adminOnly: true,
  description: 'Change command prefix',
  async execute(messenger, senderId, args) {
    const newPrefix = args[0];
    if (!newPrefix) return messenger.sendTextMessage(senderId, '❌ Provide a new prefix');
    
    const config = JSON.parse(await fs.readFile('data/config.json', 'utf8'));
    const oldPrefix = config.prefix;
    config.prefix = newPrefix;
    
    await fs.writeFile('data/config.json', JSON.stringify(config, null, 2));
    await messenger.sendTextMessage(senderId, 
      `✅ Prefix updated: ${oldPrefix} → ${newPrefix}`);
  }
};