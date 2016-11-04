import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {FilesComponent} from "./files/files.component";

const appRoutes : Routes = [
    {path: '', redirectTo: 'files', pathMatch: 'full'},
    {path:'files', component: FilesComponent},
];

export const appRoutingProviders: any[] = [

];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);