import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSimpleDatatablesComponent } from './ngx-simple-datatables.component';

// NgModule wrapper to support Angular 14+ NgModule-based apps
// This keeps the component standalone while enabling module-style imports.
@NgModule({
  declarations: [NgxSimpleDatatablesComponent],
  imports: [CommonModule],
  exports: [NgxSimpleDatatablesComponent],
})
export class NgxSimpleDatatablesModule {}
