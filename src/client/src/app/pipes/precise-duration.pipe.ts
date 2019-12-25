import { Pipe, PipeTransform } from '@angular/core';

export function formatPreciseDuration(secondsWithDecimals: number): string {
    // Pad to 2 or 3 digits, default is 2
    function pad(n: number, z?: number) {
        z = z || 2;
        return ('00' + n).slice(-z);
    }

    let milliseconds = secondsWithDecimals * 1000;

    const ms = milliseconds % 1000;
    milliseconds = (milliseconds - ms) / 1000;
    const secs = milliseconds % 60;
    milliseconds = (milliseconds - secs) / 60;
    const mins = milliseconds % 60;
    const hrs = (milliseconds - mins) / 60;

    return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
}

@Pipe({ name: 'preciseDuration' })
export class PreciseDurationPipe implements PipeTransform {
    transform(secondsWithDecimals: number): string {
        return formatPreciseDuration(secondsWithDecimals);
    }
}
