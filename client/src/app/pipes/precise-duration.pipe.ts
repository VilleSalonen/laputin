import { Pipe, PipeTransform } from '@angular/core';

const MINUTE = 60;
const HOUR = 60 * 60;

export function zpad(initial: number, num = 2, pad = '0'): string {
    let str = '' + initial;
    while (str.length < num) {
        str = pad + str;
    }
    return str;
}

export function formatPreciseDuration(secondsWithDecimals: number): string {
    const ss = ~~secondsWithDecimals % MINUTE;
    const mm = ~~((secondsWithDecimals % HOUR) / MINUTE);
    const hh = ~~(secondsWithDecimals / HOUR);

    return `${zpad(hh)}:${zpad(mm)}:${zpad(ss)}`;
}

@Pipe({ name: 'preciseDuration' })
export class PreciseDurationPipe implements PipeTransform {
    transform(secondsWithDecimals: number): string {
        return formatPreciseDuration(secondsWithDecimals);
    }
}
