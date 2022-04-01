import { format } from 'winston';
import winston = require('winston');

export function initializeWinston(verbose: boolean) {
    winston.add(
        new winston.transports.Console({
            format: format.combine(format.colorize(), format.simple()),
        })
    );

    if (verbose) {
        winston.level = 'verbose';
    }
}
