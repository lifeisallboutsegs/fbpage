module.exports = {
  name: 'eval',
  category: 'system',
  adminOnly: true,
  async execute(messenger, senderId, args) {
    try {
      const result = await (async () => {
        return eval(args.join(' '));
      })();
      await messenger.sendTextMessage(senderId, `Result:\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      await messenger.sendTextMessage(senderId, `Error: ${error.message}`);
    }
  }
};