const fs = require('fs').promises;

module.exports = {
  name: 'unban',
  category: 'admin',
  adminOnly: true,
  description: 'Unban a user',
  async execute(messenger, senderId, args) {
    const userId = args[0];
    if (!userId) return messenger.sendTextMessage(senderId, '❌ Provide a user ID');
    
    let bannedUsers = JSON.parse(await fs.readFile('data/banned.json', 'utf8'));
    if (!bannedUsers.includes(userId)) {
      return messenger.sendTextMessage(senderId, '❌ User not banned');
    }
    
    bannedUsers = bannedUsers.filter(id => id !== userId);
    await fs.writeFile('data/banned.json', JSON.stringify(bannedUsers, null, 2));
    await messenger.sendTextMessage(senderId, `✅ Unbanned user ${userId}`);
  }
};