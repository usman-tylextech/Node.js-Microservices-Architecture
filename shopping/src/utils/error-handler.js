const { createLogger, transports, format } = require('winston');
const { AppError } = require('./app-errors');

const LogErrors = createLogger({
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} - ${level}: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'app_error.log' })
    ]
});

class ErrorLogger {
    constructor() {}

    async logError(err) {
        const stackTrace = this.extractStackTrace(err);

        console.log('==================== Start Error Logger ===============');
        LogErrors.log({
            private: true,
            level: 'error',
            message: `${new Date()} - ${err.message || 'No error message'} - ${stackTrace}`
        });
        console.log('==================== End Error Logger ===============');
    }

    isTrustError(error) {
        return error instanceof AppError && error.isOperational;
    }

    extractStackTrace(error) {
        if (error.stack) {
            // Extract the first line of the stack trace
            const stackLines = error.stack.split('\n');
            if (stackLines.length > 1) {
                return stackLines[1].trim(); // The second line contains the file name and line number
            }
        }
        return 'No stack trace available';
    }
}

const errorLogger = new ErrorLogger();

process.on('unhandledRejection', (reason, promise) => {
    console.log(reason, 'UNHANDLED REJECTION');
    throw reason; // this will be caught by uncaughtException handler
});

process.on('uncaughtException', async (error) => {
    await errorLogger.logError(error);
    if (!errorLogger.isTrustError(error)) {
        process.exit(1); // exit the process for non-operational errors
    }
});

const ErrorHandler = async (err, req, res, next) => {
    if (err) {
        await errorLogger.logError(err);
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Internal Server Error';

        if (errorLogger.isTrustError(err)) {
            if (err.errorStack) {
                return res.status(statusCode).json({ 'message': err.errorStack });
            }
            return res.status(statusCode).json({ 'message': message });
        } else {
            return res.status(statusCode).json({ 'message': message });
        }
    }
    next();
};

module.exports = ErrorHandler;
