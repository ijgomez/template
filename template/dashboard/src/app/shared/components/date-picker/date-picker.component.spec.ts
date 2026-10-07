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

  it('should normalize nullish values in writeValue', () => {
    component.writeValue('2026-10-07');
    expect(component.value()).toBe('2026-10-07');

    component.writeValue(null);
    expect(component.value()).toBe('');

    component.writeValue(undefined);
    expect(component.value()).toBe('');
  });

  it('should mark as touched on blur', () => {
    const onTouched = vi.fn();
    component.registerOnTouched(onTouched);

    const input = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('blur'));

    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('should expose and bind basic input attributes', () => {
    fixture.componentRef.setInput('id', 'birthDate');
    fixture.componentRef.setInput('name', 'birthDate');
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('ariaLabel', 'Fecha de nacimiento');
    fixture.componentRef.setInput('testId', 'birth-date');
    fixture.componentRef.setInput('invalid', true);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.id).toBe('birthDate');
    expect(input.name).toBe('birthDate');
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-label')).toBe('Fecha de nacimiento');
    expect(input.getAttribute('data-testid')).toBe('birth-date');
    expect(input.classList.contains('is-invalid')).toBe(true);
  });
});
