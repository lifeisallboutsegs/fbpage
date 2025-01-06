const winston = require('winston');
const chalk = require('chalk');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      const icons = {
        info: chalk.blue('ℹ'),
        warn: chalk.yellow('⚠'),
        error: chalk.red('✖'),
        debug: chalk.gray('🔍')
      };
      return `${chalk.gray(timestamp)} ${icons[level]} ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'bot.log' })
  ]
});

module.exports = { logger };