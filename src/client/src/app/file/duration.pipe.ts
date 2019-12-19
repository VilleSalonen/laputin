import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
    transform(duration: string): string {
        let durationInSeconds = parseFloat(duration);

        const secs = durationInSeconds % 60;
        durationInSeconds = (durationInSeconds - secs) / 60;
        const mins = durationInSeconds % 60;
        const hrs = (durationInSeconds - mins) / 60;

        return (
            (hrs > 0 ? Math.floor(hrs) + ' h ' : '') +
            Math.floor(mins) +
            ' min ' +
            Math.floor(secs) +
            ' s'
        );
    }
}
