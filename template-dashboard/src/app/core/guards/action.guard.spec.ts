import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { actionGuard } from './action.guard';
import { AuthService } from '../services/auth.service';

describe('actionGuard', () => {
  let authServiceMock: { hasAction: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockState = {} as RouterStateSnapshot;

  function createRouteWithActions(actions: string[]): ActivatedRouteSnapshot {
    return { data: { actions } } as unknown as ActivatedRouteSnapshot;
  }

  function createRouteWithoutActions(): ActivatedRouteSnapshot {
    return { data: {} } as unknown as ActivatedRouteSnapshot;
  }

  beforeEach(() => {
    authServiceMock = {
      hasAction: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should allow navigation when user has the required action', () => {
    authServiceMock.hasAction.mockImplementation((action: string) => action === 'USER_READ');
    const route = createRouteWithActions(['USER_READ']);

    const result = TestBed.runInInjectionContext(() => actionGuard(route, mockState));

    expect(result).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /dashboard when user lacks the required action', () => {
    authServiceMock.hasAction.mockReturnValue(false);
    const route = createRouteWithActions(['USER_WRITE']);

    const result = TestBed.runInInjectionContext(() => actionGuard(route, mockState));

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should allow navigation when user has at least one of multiple required actions (OR logic)', () => {
    authServiceMock.hasAction.mockImplementation((action: string) => action === 'PROFILE_READ');
    const route = createRouteWithActions(['USER_READ', 'PROFILE_READ', 'ACTION_READ']);

    const result = TestBed.runInInjectionContext(() => actionGuard(route, mockState));

    expect(result).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /dashboard when user lacks all of multiple required actions', () => {
    authServiceMock.hasAction.mockReturnValue(false);
    const route = createRouteWithActions(['USER_READ', 'PROFILE_READ', 'ACTION_READ']);

    const result = TestBed.runInInjectionContext(() => actionGuard(route, mockState));

    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should allow navigation when no actions are required (empty array)', () => {
    const route = createRouteWithActions([]);

    const result = TestBed.runInInjectionContext(() => actionGuard(route, mockState));

    expect(result).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(authServiceMock.hasAction).not.toHaveBeenCalled();
  });

  it('should allow navigation when route data has no actions property', () => {
    const route = createRouteWithoutActions();

    const result = TestBed.runInInjectionContext(() => actionGuard(route, mockState));

    expect(result).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(authServiceMock.hasAction).not.toHaveBeenCalled();
  });
});
