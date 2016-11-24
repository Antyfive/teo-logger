/*!
 * Logger implementation
 * @author Andrew Teologov <teologov.and@gmail.com>
 * @date 11/24/16
 */

"use strict";

const chalk = require("chalk");
const util = require("util");
const cluster = require("cluster");

/**
 * Parses errors. Expects Error instance, or string with message
 * @returns {Array}
 * @private
 */
function _parseErrors() {
    let errors = [].slice.call(arguments);
    let parsed = [];

    errors.forEach(err => {
        let message = (err instanceof Error) ? err.stack : err.toString();
        parsed.push(message);
    });

    return parsed;
}

/**
 * Parses message
 * @param {*} message
 * @returns {string}
 * @private
 */
function _parseMessage() {
    let message = [].slice.call(arguments).join("|");
    try {
        message = (typeof message === "string") ? message : JSON.stringify(message);
    } catch(e) {
        logger.error(e.stack);
    }

    return message;
}

function _format(message) {
    return util.format("[%s] %s", chalk.cyan(new Date().toString()), message);
}

/**
 * Logs message. Forwards message from child process to master
 * @param {String} message
 * @private
 */
function _log(message) {
    if (cluster.isMaster) {
        // write directly to the log file
        console.log(_format(message));
    }
    else {
        // send to master
        cluster.worker.process.send({
            type: "logging",
            data: {
                message: message,
                workerID: cluster.worker.id,
                pid: cluster.worker.process.pid
            }
        });
    }
}

module.exports = {
    success() {
        let message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(chalk.green((util.format("Success: %s", message))));
    },
    info() {
        let message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(chalk.blue(util.format("Info: %s", message)));
    },
    warn() {
        let message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(chalk.yellow(util.format("Warn: %s", message)));
    },
    error() {
        try {
            let errors = _parseErrors.apply(this, [].slice.call(arguments));
            let message = _parseMessage.apply(this, errors);
            _log(chalk.red(util.format("%s", message)));
        } catch(e) {
            console.error(e.stack);
        }
    },
    fatal() {
        let message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(chalk.red(util.format("Fatal: %s", message)));
    },
    log() {
        let message = _parseMessage.apply(this, [].slice.call(arguments));
        _log(util.format("%s", message));
    }
};
