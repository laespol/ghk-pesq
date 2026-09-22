import { Routes } from '@angular/router';
import { ResponderPesquisaComponent } from './pages/responder-pesquisa/responder-pesquisa.component';

export const routes: Routes = [
  {
    path: '',
    component: ResponderPesquisaComponent
  },
  {
    path: 'responder/:token',
    component: ResponderPesquisaComponent
  },
  {
    path: ':token',
    component: ResponderPesquisaComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
