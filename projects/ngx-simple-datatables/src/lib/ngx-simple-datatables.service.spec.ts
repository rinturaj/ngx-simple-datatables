import { TestBed } from "@angular/core/testing";
import { NgxSimpleDatatablesService } from "./ngx-simple-datatables.service";

describe("NgxSimpleDatatableService", () => {
  let service: NgxSimpleDatatablesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxSimpleDatatablesService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
