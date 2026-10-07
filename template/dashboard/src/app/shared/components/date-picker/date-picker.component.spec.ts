import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TpDatePickerComponent } from './date-picker.component';

describe('TpDatePickerComponent', () => {
  let component: TpDatePickerComponent;
  let fixture: ComponentFixture<TpDatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TpDatePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TpDatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the value and notify the form on input change', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);

    const input = fixture.nativeElement.querySelector('input');
    input.value = '2026-10-07';
    input.dispatchEvent(new Event('input'));

    expect(onChange).toHaveBeenCalledWith('2026-10-07');
    expect(component.value()).toBe('2026-10-07');
  });

  it('should disable the native input when setDisabledState is called', () => {
    component.setDisabledState(true);
    fixture.detectChanges();

    expect(component.disabled()).toBe(true);
    expect(fixture.nativeElement.querySelector('input').disabled).toBe(true);
  });
});
