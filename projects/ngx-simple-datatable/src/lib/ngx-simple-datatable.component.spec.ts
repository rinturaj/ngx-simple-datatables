import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxSimpleDatatableComponent } from './ngx-simple-datatable.component';

describe('NgxSimpleDatatableComponent', () => {
  let component: NgxSimpleDatatableComponent;
  let fixture: ComponentFixture<NgxSimpleDatatableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxSimpleDatatableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NgxSimpleDatatableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
