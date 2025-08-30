import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxSimpleDatatablesComponent } from "./ngx-simple-datatables.component";

describe("NgxSimpleDatatableComponent", () => {
  let component: NgxSimpleDatatablesComponent;
  let fixture: ComponentFixture<NgxSimpleDatatablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxSimpleDatatablesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxSimpleDatatablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
