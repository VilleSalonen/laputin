import * as moment from 'moment';

export namespace Utils {
    export function formatTimecodeDuration(): string {
        const duration = moment.duration(this.timecode.end - this.timecode.start, 'seconds');

        let result = '';

        const minutes = Math.floor(duration.asMinutes());
        const seconds = duration.seconds();

        if (minutes > 0) {
            result += minutes + ' min ';
        }
        if (seconds > 0) {
            result += seconds + ' sec';
        }

        return result.trim();
    }

    export function formatPreciseDuration(durationInSeconds: number): string {
        const duration = moment.duration(durationInSeconds, 'seconds');

        let result = '';

        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        const milliseconds = parseInt(duration.milliseconds().toFixed(0), 10);

        result += ((hours >= 10) ? hours : '0' + hours);
        result += ':';
        result += (minutes >= 10) ? minutes : '0' + minutes;
        result += ':';
        result += (seconds >= 10) ? seconds : '0' + seconds;
        result += '.';
        result += (milliseconds >= 100) ? milliseconds : (milliseconds >= 10) ? '0' + milliseconds : '00' + milliseconds;

        return result;
    }
}
