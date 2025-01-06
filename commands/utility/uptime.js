const { metrics } = require('../../utils/metrics');

module.exports = {
  name: 'uptime',
  category: 'utility',
  description: 'Show bot uptime',
  async execute(messenger, senderId) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    await messenger.sendTextMessage(senderId,
      `⏱️ Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s`);
  }
};