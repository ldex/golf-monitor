import { Routes } from '@angular/router';
import { GolfListComponent } from './components/golf-list/golf-list.component';
import { GolfMapComponent } from './components/golf-map/golf-map.component';

export const routes: Routes = [
  { path: '', redirectTo: 'liste', pathMatch: 'full' },
  { path: 'liste', component: GolfListComponent },
  { path: 'carte', component: GolfMapComponent },
  { path: '**', redirectTo: 'liste' }
];
