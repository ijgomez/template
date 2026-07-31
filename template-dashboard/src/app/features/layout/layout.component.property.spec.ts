import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import * as fc from 'fast-check';

import { LayoutComponent, NavItem } from './layout.component';
import { AuthService } from '../../core/services/auth.service';

/**
 * Property-based test for navigation visibility matching user actions.
 *
 * **Validates: Requirements 5.6, 7.2, 7.8, 7.9, 7.10, 7.11, 7.12**
 *
 * Property 6: Navigation visibility matches user actions.
 * For any set of actions, visible nav items = menu items whose required action
 * is in user's set; parent sections inherit visibility from children.
 */
describe('LayoutComponent - Property 6: Navigation visibility matches user actions', () => {
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

  /**
   * Arbitrary that generates any subset of ALL_ACTIONS (including empty set).
   */
  const userActionsArb = fc.subarray(ALL_ACTIONS, { minLength: 0, maxLength: ALL_ACTIONS.length });

  /**
   * Pure function that computes expected visibility for a NavItem given a set of user actions.
   * A leaf item is visible if the user has at least one of its required actions.
   * A parent section is visible if at least one of its actions is in the user's set
   * (parent actions = union of children's actions by design).
   */
  function expectedVisibility(item: NavItem, userActionSet: Set<string>): boolean {
    if (!item.actions || item.actions.length === 0) {
      return true;
    }
    return item.actions.some((action) => userActionSet.has(action));
  }

  /**
   * Recursively collects all visible items (at all levels) for a given action set.
   */
  function collectVisibleItems(
    items: NavItem[],
    userActionSet: Set<string>,
  ): NavItem[] {
    const visible: NavItem[] = [];
    for (const item of items) {
      if (expectedVisibility(item, userActionSet)) {
        visible.push(item);
        if (item.children) {
          visible.push(...collectVisibleItems(item.children, userActionSet));
        }
      }
    }
    return visible;
  }

  function createComponent(userActions: string[]): LayoutComponent {
    const userActionSet = new Set(userActions);

    const authServiceMock: Partial<AuthService> = {
      getCurrentUser: () => ({
        username: 'propuser',
        profile: 'TEST',
        actions: userActions,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      }),
      logout: () => of(undefined as unknown as void),
      hasAction: (actionCode: string) => userActionSet.has(actionCode),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    const fixture = TestBed.createComponent(LayoutComponent);
    return fixture.componentInstance;
  }

  it('should show exactly the items whose actions match the user action set', () => {
    fc.assert(
      fc.property(userActionsArb, (userActions) => {
        const component = createComponent(userActions);
        const userActionSet = new Set(userActions);

        for (const item of component.navItems) {
          const actual = component.isItemVisible(item);
          const expected = expectedVisibility(item, userActionSet);
          expect(actual).withContext(
            `Item "${item.labelKey}" visibility mismatch for actions: [${userActions.join(', ')}]`,
          ).toBe(expected);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should show child items only when parent is visible', () => {
    fc.assert(
      fc.property(userActionsArb, (userActions) => {
        const component = createComponent(userActions);
        const userActionSet = new Set(userActions);

        for (const item of component.navItems) {
          if (item.children && !component.isItemVisible(item)) {
            for (const child of item.children) {
              // Parent NOT visible means parent.actions has no intersection with user actions.
              // Since parent.actions is a superset of children's actions by design,
              // children should also not be visible.
              const childVisible = component.isItemVisible(child);
              if (childVisible) {
                // If child is visible but parent is not, this violates the design invariant
                const parentShouldBeVisible = item.actions!.some((a) => userActionSet.has(a));
                expect(parentShouldBeVisible).withContext(
                  `Child "${child.labelKey}" is visible but parent "${item.labelKey}" is not. ` +
                  `User actions: [${userActions.join(', ')}]`,
                ).toBe(true);
              }
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should make parent sections visible when at least one child action is present', () => {
    fc.assert(
      fc.property(userActionsArb.filter((a) => a.length > 0), (userActions) => {
        const component = createComponent(userActions);
        const userActionSet = new Set(userActions);

        for (const item of component.navItems) {
          if (item.children && item.children.length > 0) {
            const anyChildActionPresent = item.children.some(
              (child) => child.actions?.some((a) => userActionSet.has(a)) ?? true,
            );

            if (anyChildActionPresent) {
              expect(component.isItemVisible(item)).withContext(
                `Parent "${item.labelKey}" should be visible because a child has matching actions. ` +
                `User actions: [${userActions.join(', ')}]`,
              ).toBe(true);
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should hide all items when user has no actions', () => {
    const component = createComponent([]);

    for (const item of component.navItems) {
      expect(component.isItemVisible(item)).withContext(
        `Item "${item.labelKey}" should be hidden when user has no actions`,
      ).toBe(false);
    }
  });

  it('should show all items when user has all actions', () => {
    const component = createComponent([...ALL_ACTIONS]);

    for (const item of component.navItems) {
      expect(component.isItemVisible(item)).withContext(
        `Item "${item.labelKey}" should be visible when user has all actions`,
      ).toBe(true);
    }
  });

  it('should maintain consistency: single action makes only related items visible', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_ACTIONS), (singleAction) => {
        const component = createComponent([singleAction]);
        const userActionSet = new Set([singleAction]);

        for (const item of component.navItems) {
          const actual = component.isItemVisible(item);
          const expected = expectedVisibility(item, userActionSet);
          expect(actual).withContext(
            `Item "${item.labelKey}" visibility with single action "${singleAction}"`,
          ).toBe(expected);

          if (item.children && actual) {
            for (const child of item.children) {
              const childActual = component.isItemVisible(child);
              const childExpected = expectedVisibility(child, userActionSet);
              expect(childActual).withContext(
                `Child "${child.labelKey}" visibility with single action "${singleAction}"`,
              ).toBe(childExpected);
            }
          }
        }
      }),
      { numRuns: ALL_ACTIONS.length },
    );
  });
});
