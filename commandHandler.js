const { logger } = require("./utils/logger");
const { metrics } = require("./utils/metrics");
const fs = require("fs").promises;
const path = require("path");

const commands = new Map();

async function loadCommands() {
  const commandsPath = path.join(__dirname, "commands");
  const categories = await fs.readdir(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const files = await fs.readdir(categoryPath);

    for (const file of files) {
      if (!file.endsWith(".js")) continue;
      const command = require(path.join(categoryPath, file));
      commands.set(command.name, command);
    }
  }

  logger.info(`Loaded ${commands.size} commands`);
}

async function handleCommand(messenger, senderId, message, event) {
  console.log(event);
  await messenger.markMessageSeen(event.sender.id);
  const config = JSON.parse(await fs.readFile("data/config.json", "utf8"));
  if (!message.startsWith(config.prefix)) return;
  await messenger.sendTypingIndicator(event.sender.id, "typing_on");
  const args = message.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = commands.get(commandName);
  if (!command)
    return messenger.sendTextMessage(senderId, "Command not found.");

  // Check if sender is an admin
  if (command.adminOnly) {
    const adminUids = JSON.parse(await fs.readFile("data/admins.json", "utf8"));
    console.log(adminUids);
    if (!adminUids.includes(parseInt(senderId))) {
      return messenger.sendTextMessage(
        senderId,
        "You do not have permission to use this command."
      );
    }
  }

  try {
    const start = Date.now();
    await command.execute(messenger, senderId, args, event);
    metrics.updateMetrics(commandName, Date.now() - start);
  } catch (error) {
    logger.error(`Command error: ${commandName}`, error);
    await messenger.sendTextMessage(senderId, "Command execution failed.");
  }
}

module.exports = { loadCommands, handleCommand, commands };
