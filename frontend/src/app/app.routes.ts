import { Routes } from '@angular/router';
import { MainPageComponent } from './components/main-page/main-page';
import { MyPuzzlesComponent } from './components/my-puzzles/my-puzzles';
import { authGuard } from './guards/auth.guard';
import { ProfileComponent } from './components/profile/profile';

export const routes: Routes = [
  { path: '', component: MainPageComponent },
  {
    path: 'my-puzzles',
    component: MyPuzzlesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
