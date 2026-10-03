import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { PwaUpdateComponent } from './pwa-update.component';
import { PwaUpdateService } from '../../services/pwa-update.service';

describe('PwaUpdateComponent', () => {
  let component: PwaUpdateComponent;
  let fixture: ComponentFixture<PwaUpdateComponent>;
  let pwaUpdateServiceMock: {
    hasUpdate$: Observable<boolean>;
    activateUpdate: ReturnType<typeof vi.fn>;
    dismissUpdate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    pwaUpdateServiceMock = {
      hasUpdate$: of(false),
      activateUpdate: vi.fn(),
      dismissUpdate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PwaUpdateComponent],
      providers: [{ provide: PwaUpdateService, useValue: pwaUpdateServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the update availability observable from the service', () => {
    expect(component.hasUpdate$).toBe(pwaUpdateServiceMock.hasUpdate$);
  });

  it('should request the update when the user accepts it', () => {
    component.onUpdate();

    expect(pwaUpdateServiceMock.activateUpdate).toHaveBeenCalledTimes(1);
  });

  it('should dismiss the update when the user skips it', () => {
    component.onDismiss();

    expect(pwaUpdateServiceMock.dismissUpdate).toHaveBeenCalledTimes(1);
  });
});
