import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportEngineComboComponent } from './report-engine-combo.component';

describe('ReportEngineComboComponent', () => {
  let component: ReportEngineComboComponent;
  let fixture: ComponentFixture<ReportEngineComboComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportEngineComboComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportEngineComboComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
