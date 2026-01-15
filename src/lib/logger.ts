import * as fs from 'fs'
import * as path from 'path'

type LogLevel = 'info' | 'warn' | 'error'

const LOG_DIR = path.join(process.cwd(), 'logs')

/**
 * Ensures the logs directory exists
 */
function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

/**
 * Gets the current date in YYYY-MM-DD format for log file naming
 */
function getDateString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Gets the current timestamp in ISO format
 */
function getTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Formats a log message with timestamp and level
 */
function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = getTimestamp()
  const metaStr = meta !== undefined ? ` ${JSON.stringify(meta)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`
}

/**
 * Writes a message to the appropriate log file
 */
function writeToFile(level: LogLevel, formattedMessage: string): void {
  try {
    ensureLogDir()

    const dateStr = getDateString()
    const filename = level === 'error' ? `error-${dateStr}.log` : `app-${dateStr}.log`
    const filepath = path.join(LOG_DIR, filename)

    fs.appendFileSync(filepath, formattedMessage + '\n', 'utf8')
  } catch (err) {
    // Fallback to console if file writing fails
    console.error('Failed to write to log file:', err)
  }
}

/**
 * Logger that writes to both console and file
 */
export const logger = {
  /**
   * Log informational message
   */
  info(message: string, meta?: unknown): void {
    const formatted = formatMessage('info', message, meta)
    console.log(formatted)
    writeToFile('info', formatted)
  },

  /**
   * Log warning message
   */
  warn(message: string, meta?: unknown): void {
    const formatted = formatMessage('warn', message, meta)
    console.warn(formatted)
    writeToFile('warn', formatted)
  },

  /**
   * Log error message
   */
  error(message: string, meta?: unknown): void {
    const formatted = formatMessage('error', message, meta)
    console.error(formatted)
    writeToFile('error', formatted)
  },
}

export default logger
