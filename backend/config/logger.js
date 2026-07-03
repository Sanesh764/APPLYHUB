const winston = require("winston");
const path = require("path");

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level colors
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Define log format for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? "\n" + info.stack : ""}`
  )
);

// Define log format for files (JSON format is better for parsing logs)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.json()
);

// Transports configuration
const transports = [
  // Write all logs with importance level of `error` or less to `error.log`
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/error.log"),
    level: "error",
    format: fileFormat,
  }),
  // Write all logs with importance level of `info` or less to `combined.log`
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/combined.log"),
    format: fileFormat,
  }),
  // Separate file transport for audit logs
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/audit.log"),
    level: "info",
    format: fileFormat,
    label: "audit",
  }),
];

// If we are in development mode, log to console with formatting
if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: "debug",
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      level: "info",
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  transports,
});

module.exports = logger;
