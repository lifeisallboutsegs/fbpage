const os = require('os');
const { metrics } = require('../../utils/metrics');

module.exports = {
  name: 'status',
  category: 'utility',
  description: 'Show bot status',
  adminOnly: true,
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

    // Format uptime into readable duration
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const parts = [];
      
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      
      return parts.join(' ') || '< 1m';
    };

    // Format load average to 2 decimal places
    const formatLoadAvg = (loadAvg) => 
      loadAvg.map(load => load.toFixed(2)).join(', ');

    const statusMessage = `📊 Bot Status Report
━━━━━━━━━━━━━━━━━━

⏰ Uptime: ${formatUptime(stats.uptime)}

💾 Memory Usage
• Used: ${stats.memory.used}
• Total: ${stats.memory.total}

🖥️ System Info
• Platform: ${stats.system.platform}
• Node.js: ${stats.system.nodeVersion}
• CPU: ${stats.system.cpu}
• Cores: ${stats.system.cores}
• Load Average: ${formatLoadAvg(stats.system.loadAvg)}

📈 Metrics
• Message Count: ${stats.metrics.messageCount}
${Object.entries(stats.metrics.averageLatency)
  .map(([command, avgLatency]) => `• ${command}: ${avgLatency}ms`)
  .join('\n')}`;

    await messenger.sendTextMessage(senderId, statusMessage);
  }
};
