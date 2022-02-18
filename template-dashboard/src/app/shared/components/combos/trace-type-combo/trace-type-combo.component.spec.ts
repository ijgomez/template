import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraceTypeComboComponent } from './trace-type-combo.component';

describe('TraceTypeComboComponent', () => {
  let component: TraceTypeComboComponent;
  let fixture: ComponentFixture<TraceTypeComboComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraceTypeComboComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TraceTypeComboComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
