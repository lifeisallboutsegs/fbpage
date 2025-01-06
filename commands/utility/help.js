const { commands } = require('../../commandHandler');
const fs = require('fs').promises;

module.exports = {
  name: 'help',
  category: 'utility',
  description: 'Show command list',
  async execute(messenger, senderId, args) {
    const config = JSON.parse(await fs.readFile('data/config.json', 'utf8'));
    
    if (args.length) {
      const command = commands.get(args[0]);
      if (!command) return messenger.sendTextMessage(senderId, '❌ Command not found');
      
      return messenger.sendTextMessage(senderId, 
        `📖 Command: ${command.name}\n` +
        `Category: ${command.category}\n` +
        `Description: ${command.description}\n` +
        `Admin Only: ${command.adminOnly ? 'Yes' : 'No'}`
      );
    }
    
    const categories = {};
    commands.forEach(cmd => {
      if (!categories[cmd.category]) categories[cmd.category] = [];
      categories[cmd.category].push(cmd.name);
    });
    
    let helpText = `🤖 ${config.name} Commands\n\n`;
    for (const [category, cmds] of Object.entries(categories)) {
      helpText += `${category}:\n${cmds.join(', ')}\n\n`;
    }
    helpText += `\nUse ${config.prefix}help <command> for details`;
    
    await messenger.sendTextMessage(senderId, helpText);
  }
};