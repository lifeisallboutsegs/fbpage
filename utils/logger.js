const winston = require('winston');
const path = require('path');
const morgan = require('morgan');
const chalk = require('chalk');
const DailyRotateFile = require('winston-daily-rotate-file');

async function loadESMPackage(packageName) {
  return (await import(packageName));
}

// Custom log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
};


const detailedFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});


const consoleFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const icons = {
    error: '🔥',
    warn: '⚠️',
    info: 'ℹ️',
    http: '🌐',
    debug: '🔍',
    trace: '📍',
  };

  const levelColors = {
    error: chalk.red,
    warn: chalk.yellow,
    info: chalk.blue,
    http: chalk.cyan,
    debug: chalk.magenta,
    trace: chalk.gray,
  };

  const colorize = levelColors[level] || chalk.white; // Default to `chalk.white` if no color defined for `level`.

  let msg = `${chalk.gray(timestamp)} ${icons[level] || ''} ${colorize(level.toUpperCase())} ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += `\n${chalk.gray(JSON.stringify(metadata, null, 2))}`;
  }
  return msg;
});



const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    winston.format.json()
  ),
  transports: [

    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        consoleFormat
      ),
    }),
    

    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/%DATE%-combined.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(detailedFormat),
    }),


    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/%DATE%-error.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: winston.format.combine(detailedFormat),
    }),
  ],
});


const morganMiddleware = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }
);


const performanceLogger = (req, res, next) => {
  const start = process.hrtime();


  if (Object.keys(req.body).length > 0) {
    logger.debug('Request body:', { body: req.body });
  }

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationMs = (duration[0] * 1000 + duration[1] / 1e6).toFixed(2);

    logger.http('Request completed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${durationMs}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};


const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    user: req.user,
  });
  next(err);
};

module.exports = {
  logger,
  morganMiddleware,
  performanceLogger,
  errorLogger,
};
