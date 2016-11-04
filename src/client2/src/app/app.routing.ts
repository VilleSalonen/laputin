import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FilesComponent } from "./files/files.component";
import { TagsComponent } from "./tags/tags.component";

const appRoutes: Routes = [
    { path: '', redirectTo: 'files', pathMatch: 'full' },
    { path: 'files', component: FilesComponent },
    { path: 'tags', component: TagsComponent }
];

export const appRoutingProviders: any[] = [

];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);