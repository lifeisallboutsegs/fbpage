const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

module.exports = {
  name: 'shell',
  category: 'system',
  adminOnly: true,
  description: 'Execute shell commands',
  async execute(messenger, senderId, args) {
    try {
      const { stdout, stderr } = await execAsync(args.join(' '));
      let response = '';
      
      if (stdout) response += `📤 Output:\n\`\`\`\n${stdout}\n\`\`\`\n`;
      if (stderr) response += `⚠️ Stderr:\n\`\`\`\n${stderr}\n\`\`\``;
      
      await messenger.sendTextMessage(senderId, response || '✅ Command executed (no output)');
    } catch (error) {
      await messenger.sendTextMessage(senderId, `❌ Error:\n\`\`\`\n${error.message}\n\`\`\``);
    }
  }
};