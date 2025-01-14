global.replyHandlers = global.replyHandlers || new Map();
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
  await messenger.markMessageSeen(event.sender.id);
 
  console.log(event);
  if (event.message && event.message.reply_to && event.message.reply_to.mid) {
    const repliedToMid = event.message.reply_to.mid;
    const handler = global.replyHandlers.get(repliedToMid);
    
    if (handler) {
      const command = commands.get(handler.commandName);
      if (command && typeof command.replyExecute === "function") {
        try {
          logger.info(`Executing reply for command: ${handler.commandName}`, {
            senderId: senderId,
            messageId: event.message.mid,
          });
          await command.replyExecute(messenger, senderId, event);
          return;
        } catch (error) {
          logger.error(
            `Reply execution error for command: ${handler.commandName}`,
            error,
            {
              senderId: senderId,
              messageId: event.message.mid,
            }
          );
          await messenger.sendTextMessage(senderId, "Reply handling failed.");
          return;
        }
      }
    }
  }

   if (event.message && event.message.quick_reply && event.message.quick_reply.payload) {
    const repliedToMid = event.message.quick_reply.payload;
    const handler = global.replyHandlers.get(repliedToMid);
    
    if (handler) {
      const command = commands.get(handler.commandName);
      if (command && typeof command.replyExecute === "function") {
        try {
          logger.info(`Executing reply for command: ${handler.commandName}`, {
            senderId: senderId,
            messageId: event.message.mid,
          });
          await command.replyExecute(messenger, senderId, event);
          return;
        } catch (error) {
          logger.error(
            `Reply execution error for command: ${handler.commandName}`,
            error,
            {
              senderId: senderId,
              messageId: event.message.mid,
            }
          );
          await messenger.sendTextMessage(senderId, "Reply handling failed.");
          return;
        }
      }
    }
  }
  const config = JSON.parse(await fs.readFile("data/config.json", "utf8"));
  if (!message.startsWith(config.prefix)) return;

  await messenger.sendTypingIndicator(event.sender.id, "typing_on");
  const args = message.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = commands.get(commandName);

  if (!command) {
    logger.warn(`Command not found: ${commandName}`, {
      senderId: senderId,
      messageId: event.message.mid,
    });
    return messenger.sendTextMessage(
      senderId,
      "Command not found.",
      event.message.mid
    );
  }

  if (command.adminOnly) {
    const adminUids = JSON.parse(await fs.readFile("data/admins.json", "utf8"));
    if (!adminUids.includes(parseInt(senderId))) {
      logger.warn(
        `Permission denied for user ${senderId} on command: ${commandName}`,
        {
          senderId: senderId,
          commandName: commandName,
        }
      );
      return messenger.sendTextMessage(
        senderId,
        "You do not have permission to use this command."
      );
    }
  }

  try {
    const start = Date.now();
    logger.info(`Executing command: ${commandName}`, {
      senderId: senderId,
      commandName: commandName,
      timestamp: start,
    });
    await command.execute(messenger, senderId, args, event);
    const duration = Date.now() - start;
    metrics.updateMetrics(commandName, duration); 
    logger.info(`Command executed successfully: ${commandName}`, {
      senderId: senderId,
      duration: duration,
    });
  } catch (error) {
    logger.error(`Command execution error: ${commandName}`, error, {
      senderId: senderId,
      commandName: commandName,
    });
    await messenger.sendTextMessage(senderId, "Command execution failed.");
  }
}

module.exports = {
  loadCommands,
  handleCommand,
  commands,
};
