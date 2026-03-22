/**
 * Logger utility — ห่อ console methods ให้มี prefix และ level control
 */
class Logger {
    info(message, ...args) {
        console.log(`ℹ️  [INFO]  ${message}`, ...args);
    }

    warn(message, ...args) {
        console.warn(`⚠️  [WARN]  ${message}`, ...args);
    }

    error(message, ...args) {
        console.error(`❌ [ERROR] ${message}`, ...args);
    }

    debug(message, ...args) {
        if (process.env.LOG_LEVEL === 'debug') {
            console.log(`🐛 [DEBUG] ${message}`, ...args);
        }
    }
}

module.exports = new Logger();
