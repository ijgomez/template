import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportExecuteComponent } from './report-execute.component';

describe('ReportExecuteComponent', () => {
  let component: ReportExecuteComponent;
  let fixture: ComponentFixture<ReportExecuteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportExecuteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportExecuteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
