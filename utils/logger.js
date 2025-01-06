const winston = require('winston');
const path = require('path');

// Dynamically import ESM modules
const loadESMModules = async () => {
  const [chalkModule] = await Promise.all([import('chalk')]);
  const chalk = chalkModule.default;

  // Custom format for console output
  const consoleFormat = winston.format.printf(({ level, message, timestamp }) => {
    const icons = {
      error: chalk.red('✖'),
      warn: chalk.yellow('⚠'),
      info: chalk.blue('ℹ'),
      debug: chalk.grey('🔍'),
      verbose: chalk.cyan('🗣'),
    };

    const colors = {
      error: chalk.red,
      warn: chalk.yellow,
      info: chalk.blue,
      debug: chalk.grey,
      verbose: chalk.cyan,
    };

    return `${chalk.grey(timestamp)} ${icons[level]} ${colors[level](level.toUpperCase())} ${message}`;
  });

  // Custom format for file output (without colors)
  const fileFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  });

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: 'messenger-bot' },
    transports: [
      // Console transport with colors
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          consoleFormat
        ),
      }),
      // File transport for all logs
      new winston.transports.File({
        filename: path.join(__dirname, '../logs/combined.log'),
        format: winston.format.combine(fileFormat),
      }),
      // Separate file for error logs
      new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        format: winston.format.combine(fileFormat),
      }),
    ],
  });

  // Add request logging middleware
  const requestLogger = (req, res, next) => {
    const start = process.hrtime();

    res.on('finish', () => {
      const duration = process.hrtime(start);
      const durationMs = (duration[0] * 1000 + duration[1] / 1e6).toFixed(2);

      logger.debug(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`,
        {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: durationMs,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        }
      );
    });

    next();
  };

  module.exports = { logger, requestLogger };
};

// Execute ESM module loader
loadESMModules().catch((error) => {
  console.error('Error loading ESM modules:', error);
  process.exit(1);
});
