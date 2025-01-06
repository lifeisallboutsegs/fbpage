const { exec } = require('child_process');
module.exports = {
  name: 'shell',
  category: 'system',
  adminOnly: true,
  async execute(messenger, senderId, args) {
    exec(args.join(' '), async (error, stdout, stderr) => {
      if (error) {
        await messenger.sendTextMessage(senderId, `Error: ${error.message}`);
        return;
      }
      await messenger.sendTextMessage(senderId, `Output:\n${stdout}${stderr ? '\nErrors:\n' + stderr : ''}`);
    });
  }
};