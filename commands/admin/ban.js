const fs = require('fs').promises;

module.exports = {
  name: 'ban',
  category: 'admin',
  adminOnly: true,
  description: 'Ban a user from using the bot',
  async execute(messenger, senderId, args) {
    const userId = args[0];
    if (!userId) return messenger.sendTextMessage(senderId, '❌ Provide a user ID');
    
    const bannedUsers = JSON.parse(await fs.readFile('data/banned.json', 'utf8'));
    if (bannedUsers.includes(userId)) {
      return messenger.sendTextMessage(senderId, '❌ User already banned');
    }
    
    bannedUsers.push(userId);
    await fs.writeFile('data/banned.json', JSON.stringify(bannedUsers, null, 2));
    await messenger.sendTextMessage(senderId, `✅ Banned user ${userId}`);
  }
};