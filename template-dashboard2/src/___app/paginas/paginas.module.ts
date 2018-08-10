import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PaginasRoutingModule } from './paginas-routing.module';
import { PaginaComponent } from '../pagina/pagina.component';

@NgModule({
  imports: [
    CommonModule,
    PaginasRoutingModule
  ],
  declarations: [PaginaComponent]
})
export class PaginasModule { }
