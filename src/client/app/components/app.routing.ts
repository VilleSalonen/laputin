import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {FilesComponent} from "./files.component";
import {TagsComponent} from "./tags.component";
import {DuplicatesComponent} from "./duplicates.component";

const appRoutes : Routes = [
    {path: '', redirectTo: 'files', pathMatch: 'full'},
    {path:'files', component: FilesComponent},
    {path:'tags', component: TagsComponent},
    {path:'duplicates', component: DuplicatesComponent}
];

export const appRoutingProviders: any[] = [

];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);