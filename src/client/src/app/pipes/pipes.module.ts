import { NgModule } from '@angular/core';

import { DurationPipe } from './duration.pipe';
import { PreciseDurationPipe } from './precise-duration.pipe';

@NgModule({
    imports: [],
    exports: [DurationPipe, PreciseDurationPipe],
    declarations: [DurationPipe, PreciseDurationPipe],
    providers: []
})
export class PipesModule {}
