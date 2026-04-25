type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogData {
  [key: string]: any
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production'

  private log(level: LogLevel, message: string, data?: LogData) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: 'qresto-saas',
      ...data,
    }

    if (!this.isProduction) {
      console[level](`[${logEntry.level}] ${message}`, data || '')
      return
    }

    console.log(JSON.stringify(logEntry))
  }

  info(message: string, data?: LogData) {
    this.log('info', message, data)
  }

  warn(message: string, data?: LogData) {
    this.log('warn', message, data)
  }

  error(message: string, data?: LogData) {
    this.log('error', message, data)
  }

  debug(message: string, data?: LogData) {
    if (!this.isProduction) {
      this.log('debug', message, data)
    }
  }
}

export const logger = new Logger()

