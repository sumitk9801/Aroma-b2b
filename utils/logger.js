const fs = require("fs");
const path = require("path");

const LOGS_DIR = path.join(__dirname, "../logs");

// Self-initializing directory check
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Standardized logging utility class supporting standard console and file-based rotation streams.
 */
class Logger {
    static _write(level, message, file = "combined.log") {
        const timestamp = new Date().toISOString();
        const formattedConsole = `[${timestamp}] [${level}]: ${message}`;
        const formattedFile = JSON.stringify({ timestamp, level, message }) + "\n";

        // 1. Output to standard console stream
        if (level === "ERROR" || level === "SECURITY") {
            console.error(formattedConsole);
        } else {
            console.log(formattedConsole);
        }

        // 2. Output asynchronously to target log file
        const combinedPath = path.join(LOGS_DIR, "combined.log");
        fs.appendFile(combinedPath, formattedFile, (err) => {
            if (err) console.error("Failed to append to combined.log:", err.message);
        });

        if (file !== "combined.log") {
            const specificPath = path.join(LOGS_DIR, file);
            fs.appendFile(specificPath, formattedFile, (err) => {
                if (err) console.error(`Failed to append to ${file}:`, err.message);
            });
        }
    }

    /** Log general system info standard traces */
    static info(message) {
        this._write("INFO", message);
    }

    /** Log non-blocking warn warnings */
    static warn(message) {
        this._write("WARN", message);
    }

    /** Log blocking operational or code exceptions */
    static error(message, stack = "") {
        const fullMsg = stack ? `${message} | Stack: ${stack}` : message;
        this._write("ERROR", fullMsg, "error.log");
    }

    /** Log failed login, token failures, and access denials */
    static security(message) {
        this._write("SECURITY", message, "auth.log");
    }
}

module.exports = Logger;
