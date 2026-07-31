import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import * as fc from 'fast-check';

import { actionGuard } from './action.guard';
import { AuthService } from '../services/auth.service';

/**
 * Property-based test for actionGuard redirect behavior.
 *
 * **Validates: Requirements 5.5**
 *
 * Property 8: Action guard redirects unauthorized users.
 * For any route with required actions, a user who lacks ALL those actions
 * is always redirected to /dashboard and the guard returns false.
 */
describe('actionGuard - Property 8: Action guard redirects unauthorized users', () => {
  const ALL_ACTIONS = [
    'DASHBOARD_READ',
    'REPORT_EXECUTE',
    'INTERFACES_READ',
    'USER_READ',
    'USER_WRITE',
    'PROFILE_READ',
    'PROFILE_WRITE',
    'ACTION_READ',
    'SYSTEM_PARAMETER_READ',
    'SYSTEM_PARAMETER_WRITE',
    'SYSTEM_LOG_READ',
    'CLUSTER_NODE_READ',
    'CLUSTER_NODE_WRITE',
    'CLUSTER_LOCK_READ',
  ];

  let authServiceMock: { hasAction: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockState = {} as RouterStateSnapshot;

  /**
   * Arbitrary that generates a non-empty subset of actions from ALL_ACTIONS.
   * These represent the required actions for a route.
   */
  const requiredActionsArb = fc
    .subarray(ALL_ACTIONS, { minLength: 1, maxLength: ALL_ACTIONS.length })
    .filter((arr) => arr.length > 0);

  /**
   * Arbitrary that generates a set of user actions that is disjoint from the required actions.
   * This represents a user who lacks ALL required actions for the route.
   */
  function userActionsDisjointFrom(requiredActions: string[]): fc.Arbitrary<string[]> {
    const available = ALL_ACTIONS.filter((a) => !requiredActions.includes(a));
    if (available.length === 0) {
      return fc.constant([]);
    }
    return fc.subarray(available, { minLength: 0, maxLength: available.length });
  }

  function createRouteWithActions(actions: string[]): ActivatedRouteSnapshot {
    return { data: { actions } } as unknown as ActivatedRouteSnapshot;
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

  it('should always redirect to /dashboard when user lacks ALL required actions', () => {
    fc.assert(
      fc.property(
        requiredActionsArb.chain((requiredActions) =>
          userActionsDisjointFrom(requiredActions).map((userActions) => ({
            requiredActions,
            userActions,
          })),
        ),
        ({ requiredActions, userActions }) => {
          const userActionSet = new Set(userActions);
          authServiceMock.hasAction.mockImplementation((action: string) =>
            userActionSet.has(action),
          );
          routerMock.navigate.mockClear();

          const route = createRouteWithActions(requiredActions);
          const result = TestBed.runInInjectionContext(() => actionGuard(route, mockState));

          expect(result).toBe(false);
          expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should always redirect when user has every action EXCEPT the single required one', () => {
    const singleRequiredActionArb = fc.constantFrom(...ALL_ACTIONS);

    fc.assert(
      fc.property(singleRequiredActionArb, (requiredAction) => {
        const userActions = new Set(ALL_ACTIONS.filter((a) => a !== requiredAction));
        authServiceMock.hasAction.mockImplementation((action: string) => userActions.has(action));
        routerMock.navigate.mockClear();

        const route = createRouteWithActions([requiredAction]);
        const result = TestBed.runInInjectionContext(() => actionGuard(route, mockState));

        expect(result).toBe(false);
        expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
      }),
      { numRuns: 100 },
    );
  });

  it('should always redirect when user has NO actions and route requires arbitrary actions', () => {
    fc.assert(
      fc.property(requiredActionsArb, (requiredActions) => {
        authServiceMock.hasAction.mockReturnValue(false);
        routerMock.navigate.mockClear();

        const route = createRouteWithActions(requiredActions);
        const result = TestBed.runInInjectionContext(() => actionGuard(route, mockState));

        expect(result).toBe(false);
        expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
      }),
      { numRuns: 100 },
    );
  });
});
