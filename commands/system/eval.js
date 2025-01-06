const util = require('util');

module.exports = {
  name: 'eval',
  category: 'system',
  adminOnly: true,
  description: 'Evaluate JavaScript code',
  async execute(messenger, senderId, args) {
    try {
      const result = await (async () => {
        return eval(args.join(' '));
      })();
      
      const inspected = util.inspect(result, { depth: 1 });
      await messenger.sendTextMessage(senderId, `📝 Result:\n\`\`\`\n${inspected}\n\`\`\``);
    } catch (error) {
      await messenger.sendTextMessage(senderId, `❌ Error:\n\`\`\`\n${error.message}\n\`\`\``);
    }
  }
};