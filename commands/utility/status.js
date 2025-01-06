const os = require('os');
const { metrics } = require('../../utils/metrics');

module.exports = {
  name: 'status',
  category: 'utility',
  description: 'Show bot status',
  async execute(messenger, senderId) {
    const memory = process.memoryUsage();
    const stats = {
      uptime: process.uptime(),
      memory: {
        used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        cpu: os.cpus()[0].model,
        cores: os.cpus().length,
        loadAvg: os.loadavg()
      },
      metrics: metrics.getStats()
    };
    
    await messenger.sendTextMessage(senderId, 
      `📊 Bot Status:\n${JSON.stringify(stats, null, 2)}`);
  }
};