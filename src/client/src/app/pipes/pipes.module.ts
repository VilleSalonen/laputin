import { NgModule } from '@angular/core';

import { DurationPipe } from './duration.pipe';
import { PreciseDurationPipe } from './precise-duration.pipe';
import { PreciseDurationWithMsPipe } from './precise-duration-with-ms.pipe';

@NgModule({
    imports: [],
    exports: [DurationPipe, PreciseDurationPipe, PreciseDurationWithMsPipe],
    declarations: [
        DurationPipe,
        PreciseDurationPipe,
        PreciseDurationWithMsPipe
    ],
    providers: []
})
export class PipesModule {}
