import { TestBed } from '@angular/core/testing';

import { NgxSimpleDatatableService } from './ngx-simple-datatable.service';

describe('NgxSimpleDatatableService', () => {
  let service: NgxSimpleDatatableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxSimpleDatatableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
