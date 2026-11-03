import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';

import { GlobalSearchService } from './global-search.service';
import { AuthService } from './auth.service';
import { InterfaceService } from './interface.service';
import { ParameterService } from './parameter.service';
import { UserService } from './user.service';
import { Page } from '../models/page.model';
import { SearchResultGroup } from '../models/global-search.model';

function pageOf<T>(content: T[], totalElements = content.length): Page<T> {
  return { content, page: { size: 5, number: 0, totalElements, totalPages: 1 } };
}

describe('GlobalSearchService', () => {
  let service: GlobalSearchService;
  let granted: Set<string>;

  let userServiceMock: { findByCriteria: ReturnType<typeof vi.fn> };
  let parameterServiceMock: { findByCriteria: ReturnType<typeof vi.fn> };
  let interfaceServiceMock: { findConfigurationsByCriteria: ReturnType<typeof vi.fn> };
  let authServiceMock: { hasAction: ReturnType<typeof vi.fn> };

  const user = { id: 3, username: 'alice', profileName: 'Admin' };
  const param = { id: 7, code: 'MAX_ROWS', type: 'NUMBER' };
  const iface = { id: 9, name: 'ERP', protocol: 'REST' };

  async function run(term: string): Promise<SearchResultGroup[]> {
    return new Promise((resolve, reject) => {
      service.search(term).subscribe({ next: resolve, error: reject });
    });
  }

  beforeEach(() => {
    granted = new Set(['USER_READ', 'SYSTEM_PARAMETER_READ', 'INTERFACES_READ']);

    userServiceMock = { findByCriteria: vi.fn().mockReturnValue(of(pageOf([user], 12))) };
    parameterServiceMock = { findByCriteria: vi.fn().mockReturnValue(of(pageOf([param]))) };
    interfaceServiceMock = { findConfigurationsByCriteria: vi.fn().mockReturnValue(of(pageOf([iface]))) };
    authServiceMock = { hasAction: vi.fn((a: string) => granted.has(a)) };

    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: ParameterService, useValue: parameterServiceMock },
        { provide: InterfaceService, useValue: interfaceServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
    service = TestBed.inject(GlobalSearchService);
  });

  it('should return [] and call no service when the user has no permissions', async () => {
    granted.clear();

    const groups = await run('a');

    expect(groups).toEqual([]);
    expect(userServiceMock.findByCriteria).not.toHaveBeenCalled();
    expect(parameterServiceMock.findByCriteria).not.toHaveBeenCalled();
    expect(interfaceServiceMock.findConfigurationsByCriteria).not.toHaveBeenCalled();
  });

  it('should only query and return groups for permitted entities', async () => {
    granted = new Set(['USER_WRITE']);

    const groups = await run('ali');

    expect(groups.map((g) => g.type)).toEqual(['user']);
    expect(userServiceMock.findByCriteria).toHaveBeenCalledTimes(1);
    expect(parameterServiceMock.findByCriteria).not.toHaveBeenCalled();
    expect(interfaceServiceMock.findConfigurationsByCriteria).not.toHaveBeenCalled();
  });

  it('should only query and return interfaces for a profile with only INTERFACES_READ', async () => {
    granted = new Set(['INTERFACES_READ']);

    const groups = await run('erp');

    expect(groups.map((g) => g.type)).toEqual(['interface']);
    expect(interfaceServiceMock.findConfigurationsByCriteria).toHaveBeenCalledTimes(1);
    expect(userServiceMock.findByCriteria).not.toHaveBeenCalled();
    expect(parameterServiceMock.findByCriteria).not.toHaveBeenCalled();
  });

  it('should exclude users when a profile has parameters and interfaces but no user permission', async () => {
    granted = new Set(['SYSTEM_PARAMETER_WRITE', 'INTERFACES_READ']);

    const groups = await run('a');

    expect(groups.map((g) => g.type)).toEqual(['parameter', 'interface']);
    expect(userServiceMock.findByCriteria).not.toHaveBeenCalled();
  });

  it('should request page 0 with size 5 for each entity', async () => {
    await run('x');

    expect(userServiceMock.findByCriteria).toHaveBeenCalledWith({ username: 'x' }, 0, 5);
    expect(parameterServiceMock.findByCriteria).toHaveBeenCalledWith({ code: 'x' }, 0, 5);
    expect(interfaceServiceMock.findConfigurationsByCriteria).toHaveBeenCalledWith({ name: 'x' }, 0, 5);
  });

  it('should launch all permitted searches in parallel before any completes', () => {
    const pending: Subject<Page<unknown>>[] = [new Subject(), new Subject(), new Subject()];
    userServiceMock.findByCriteria.mockReturnValue(pending[0] as Observable<unknown>);
    parameterServiceMock.findByCriteria.mockReturnValue(pending[1] as Observable<unknown>);
    interfaceServiceMock.findConfigurationsByCriteria.mockReturnValue(pending[2] as Observable<unknown>);

    let result: SearchResultGroup[] | undefined;
    service.search('x').subscribe((g) => (result = g));

    expect(userServiceMock.findByCriteria).toHaveBeenCalledTimes(1);
    expect(parameterServiceMock.findByCriteria).toHaveBeenCalledTimes(1);
    expect(interfaceServiceMock.findConfigurationsByCriteria).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();

    pending.forEach((s) => {
      s.next(pageOf([]));
      s.complete();
    });
    expect(result).toHaveLength(3);
  });

  it('should normalize results into one group per type with item fields', async () => {
    const groups = await run('a');

    expect(groups.map((g) => g.type)).toEqual(['user', 'parameter', 'interface']);

    const [userGroup, paramGroup, ifaceGroup] = groups;
    expect(userGroup.items).toEqual([
      {
        type: 'user',
        id: 3,
        primary: 'alice',
        secondary: 'Admin',
        route: '/administration/security/users',
        queryParams: { view: 'detail', id: '3' },
      },
    ]);
    expect(userGroup.totalMatches).toBe(12);
    expect(userGroup.seeAllRoute).toBe('/administration/security/users');
    expect(userGroup.seeAllQueryParams).toEqual({ username: 'a' });

    expect(paramGroup.items[0]).toMatchObject({
      type: 'parameter',
      id: 7,
      primary: 'MAX_ROWS',
      route: '/administration/parameters',
      queryParams: { view: 'detail', code: 'MAX_ROWS' },
    });
    expect(paramGroup.seeAllQueryParams).toEqual({ code: 'a' });

    expect(ifaceGroup.items[0]).toMatchObject({
      type: 'interface',
      id: 9,
      primary: 'ERP',
      route: '/interfaces/configuration',
      queryParams: { view: 'detail', id: '9' },
    });
    expect(ifaceGroup.seeAllQueryParams).toEqual({ name: 'a' });
  });

  it('should flag only the failing group with hasError while others return results', async () => {
    parameterServiceMock.findByCriteria.mockReturnValue(throwError(() => new Error('boom')));

    const groups = await run('a');

    expect(groups).toHaveLength(3);
    const failed = groups.find((g) => g.type === 'parameter');
    expect(failed).toMatchObject({ hasError: true, items: [], totalMatches: 0 });
    const ok = groups.filter((g) => g.type !== 'parameter');
    expect(ok.every((g) => !g.hasError && g.items.length === 1)).toBe(true);
  });
});
