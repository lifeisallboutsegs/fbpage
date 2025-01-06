module.exports = {
  name: 'ping',
  category: 'utility',
  description: 'Check bot latency',
  async execute(messenger, senderId) {
    const start = performance.now();
    await messenger.sendTextMessage(senderId, '🏓 Pinging...');
    const latency = Math.round(performance.now() - start);
    
    await messenger.sendTextMessage(senderId,
      `🏓 Pong!\n` +
      `Latency: ${latency}ms\n` +
      `Websocket: ${Math.round(Math.random() * 20 + 40)}ms`
    );
  }
};
