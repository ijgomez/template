import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { TpProfileSelectComponent } from './profile-select.component';
import { UserService } from '../../../core/services/user.service';
import { ProfileRef } from '../../../core/models/user.model';

const profiles: ProfileRef[] = [
  { id: 10, name: 'Admin' },
  { id: 20, name: 'User' },
];

describe('TpProfileSelectComponent', () => {
  let component: TpProfileSelectComponent;
  let fixture: ComponentFixture<TpProfileSelectComponent>;
  let userService: {
    getProfiles: ReturnType<typeof vi.fn>;
  };

  /** Configures the TestBed and creates the fixture. detectChanges triggers ngOnInit. */
  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TpProfileSelectComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: UserService, useValue: userService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TpProfileSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> loadProfiles
  }

  beforeEach(() => {
    userService = {
      getProfiles: vi.fn().mockReturnValue(of(profiles)),
    };
  });

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  // ─── Profile loading ────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should load profiles from the service', async () => {
      await setup();
      expect(userService.getProfiles).toHaveBeenCalledTimes(1);
      expect(component.profiles()).toEqual(profiles);
    });

    it('should leave profiles empty when the service fails', async () => {
      userService.getProfiles.mockReturnValue(throwError(() => new Error('boom')));
      await setup();
      expect(component.profiles()).toEqual([]);
    });
  });

  // ─── ControlValueAccessor ───────────────────────────────────

  describe('writeValue', () => {
    it('should set the selected id from the model value', async () => {
      await setup();
      component.writeValue(20);
      expect(component.selectedId()).toBe(20);
    });

    it('should keep the selected profile when the list loads after the model value', async () => {
      await setup();
      component.writeValue(20);
      fixture.detectChanges();

      expect(component.selectedId()).toBe(20);
      expect(fixture.nativeElement.querySelector('select').value).toBe('20');
    });

    it('should reset the selection to null when written null', async () => {
      await setup();
      component.writeValue(10);
      component.writeValue(null);
      expect(component.selectedId()).toBeNull();
    });
  });

  describe('onSelectionChange', () => {
    it('should update the selection and propagate the value', async () => {
      await setup();
      const onChange = vi.fn();
      const onTouched = vi.fn();
      component.registerOnChange(onChange);
      component.registerOnTouched(onTouched);

      component.onSelectionChange(10);

      expect(component.selectedId()).toBe(10);
      expect(onChange).toHaveBeenCalledWith(10);
      expect(onTouched).toHaveBeenCalledTimes(1);
    });

    it('should propagate null when the empty option is selected', async () => {
      await setup();
      const onChange = vi.fn();
      component.registerOnChange(onChange);

      component.onSelectionChange(null);

      expect(component.selectedId()).toBeNull();
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('setDisabledState', () => {
    it('should toggle the disabled signal', async () => {
      await setup();
      component.setDisabledState(true);
      expect(component.disabled()).toBe(true);
      component.setDisabledState(false);
      expect(component.disabled()).toBe(false);
    });
  });
});
