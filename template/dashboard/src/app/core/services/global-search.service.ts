import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { SearchEntityType, SearchResultGroup, SearchResultItem } from '../models/global-search.model';
import { InterfaceConfig } from '../models/interface.model';
import { Page } from '../models/page.model';
import { Parameter } from '../models/parameter.model';
import { UserDTO } from '../models/user.model';
import { AuthService } from './auth.service';
import { InterfaceService } from './interface.service';
import { ParameterService } from './parameter.service';
import { UserService } from './user.service';

/** Maximum number of results requested per entity. */
const SEARCH_PAGE_SIZE = 5;

/** Static description of how each entity is searched and mapped (design §4). */
interface EntitySearchConfig<T> {
  type: SearchEntityType;
  labelKey: string;
  /** Any of these actions grants access (same criteria as the route actionGuard). */
  actions: string[];
  seeAllRoute: string;
  seeAllFilterKey: string;
  search: (term: string) => Observable<Page<T>>;
  toItem: (entity: T) => SearchResultItem;
}

/**
 * Facade of the global search. It orchestrates the entity searches
 * (users, parameters, interfaces), applies permissions and normalizes
 * the results into {@link SearchResultGroup}.
 */
@Injectable({ providedIn: 'root' })
export class GlobalSearchService {

  private readonly userService = inject(UserService);
  private readonly parameterService = inject(ParameterService);
  private readonly interfaceService = inject(InterfaceService);
  private readonly authService = inject(AuthService);

  private readonly configs: EntitySearchConfig<unknown>[] = [
    {
      type: 'user',
      labelKey: 'globalSearch.groups.user',
      actions: ['USER_READ', 'USER_WRITE'],
      seeAllRoute: '/administration/security/users',
      seeAllFilterKey: 'username',
      search: (term) => this.userService.findByCriteria({ username: term }, 0, SEARCH_PAGE_SIZE),
      toItem: (u) => {
        const user = u as UserDTO;
        return {
          type: 'user',
          id: user.id ?? 0,
          primary: user.username,
          secondary: user.profileName,
          route: '/administration/security/users',
          queryParams: { view: 'detail', id: String(user.id) },
        };
      },
    },
    {
      type: 'parameter',
      labelKey: 'globalSearch.groups.parameter',
      actions: ['SYSTEM_PARAMETER_READ', 'SYSTEM_PARAMETER_WRITE'],
      seeAllRoute: '/administration/parameters',
      seeAllFilterKey: 'code',
      search: (term) => this.parameterService.findByCriteria({ code: term }, 0, SEARCH_PAGE_SIZE),
      toItem: (p) => {
        const param = p as Parameter;
        return {
          type: 'parameter',
          id: param.id ?? 0,
          primary: param.code,
          secondary: param.type,
          route: '/administration/parameters',
          queryParams: { view: 'detail', code: param.code },
        };
      },
    },
    {
      type: 'interface',
      labelKey: 'globalSearch.groups.interface',
      actions: ['INTERFACES_READ'],
      seeAllRoute: '/interfaces/configuration',
      seeAllFilterKey: 'name',
      search: (term) => this.interfaceService.findConfigurationsByCriteria({ name: term }, 0, SEARCH_PAGE_SIZE),
      toItem: (i) => {
        const iface = i as InterfaceConfig;
        return {
          type: 'interface',
          id: iface.id,
          primary: iface.name,
          secondary: iface.protocol,
          route: '/interfaces/configuration',
          queryParams: { view: 'detail', id: String(iface.id) },
        };
      },
    },
  ];

  /**
   * Searches the given term across the entities allowed for the current user.
   * Entities are queried in parallel; a failure in one entity yields an empty
   * group flagged with `hasError` instead of failing the whole search.
   */
  search(term: string): Observable<SearchResultGroup[]> {
    const allowed = this.configs.filter((c) => c.actions.some((a) => this.authService.hasAction(a)));
    if (allowed.length === 0) {
      return of([]);
    }
    return forkJoin(allowed.map((config) => this.searchEntity(config, term)));
  }

  private searchEntity(config: EntitySearchConfig<unknown>, term: string): Observable<SearchResultGroup> {
    const base = {
      type: config.type,
      labelKey: config.labelKey,
      seeAllRoute: config.seeAllRoute,
      seeAllQueryParams: { [config.seeAllFilterKey]: term },
    };
    return config.search(term).pipe(
      map((page): SearchResultGroup => ({
        ...base,
        items: page.content.map((entity) => config.toItem(entity)),
        totalMatches: page.page?.totalElements ?? page.content.length,
      })),
      catchError(() => of<SearchResultGroup>({ ...base, items: [], totalMatches: 0, hasError: true })),
    );
  }
}
