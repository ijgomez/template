import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard.component';
import { ClusterNode } from '../../core/models/cluster.model';
import { InterfaceConfig } from '../../core/models/interface.model';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

describe('DashboardComponent', () => {
  const nodesUrl = `${environment.apiUrl}/administration/cluster/nodes`;
  const usersUrl = `${environment.apiUrl}/administration/security/users/count`;
  const interfacesUrl = `${environment.apiUrl}/interfaces/configuration`;

  const ALL = ['USER_READ', 'INTERFACES_READ', 'CLUSTER_NODE_READ'];

  const buildNode = (id: number, status: ClusterNode['status'], master = false, startedAt = '2026-08-04T19:15:00Z'): ClusterNode => ({
    id,
    hostname: `node-${id}`,
    ip: `10.0.0.${id}`,
    status,
    master,
    freeMemory: 1000,
    totalMemory: 2000,
    usedMemory: 1000,
    startedAt,
    lastModifiedAt: '2026-08-04T19:15:00Z',
  });

  const buildInterface = (id: number, status: InterfaceConfig['status']): InterfaceConfig =>
    ({ id, name: `if-${id}`, protocol: 'REST', checkFrequency: 60, status }) as InterfaceConfig;

  function setup(granted: string[] = ALL) {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { hasAction: (code: string) => granted.includes(code) } },
      ],
    });
    const fixture = TestBed.createComponent(DashboardComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, httpMock };
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('should create and request every permitted block', () => {
    const { component, httpMock } = setup();
    httpMock.expectOne(nodesUrl).flush([]);
    httpMock.expectOne(usersUrl).flush(0);
    httpMock.expectOne(interfacesUrl).flush([]);
    expect(component).toBeTruthy();
  });

  it('should not request blocks without permission', () => {
    const { component, httpMock } = setup([]);
    httpMock.expectNone(nodesUrl);
    httpMock.expectNone(usersUrl);
    httpMock.expectNone(interfacesUrl);
    expect(component.nodesLoading()).toBe(false);
  });

  it('should hide cards without permission but keep their empty slot', () => {
    const { fixture, httpMock } = setup(['INTERFACES_READ']);
    httpMock.expectOne(interfacesUrl).flush([]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="stat-users"]')).toBeNull();
    expect(el.querySelector('[data-testid="stat-cluster-nodes"]')).toBeNull();
    expect(el.querySelector('[data-testid="stat-interfaces"]')).not.toBeNull();
    expect(el.querySelectorAll('.row.mb-4 > .col-xl-4').length).toBe(3);
  });

  it('should accept WRITE authorities for users and nodes, as the backend does', () => {
    const { component, httpMock } = setup(['USER_WRITE', 'CLUSTER_NODE_WRITE']);
    httpMock.expectOne(nodesUrl).flush([]);
    httpMock.expectOne(usersUrl).flush(3);
    httpMock.expectNone(interfacesUrl);
    expect(component.canReadUsers).toBe(true);
    expect(component.canReadNodes).toBe(true);
    expect(component.canReadInterfaces).toBe(false);
  });

  it('should compute nodes, master and uptime from the backend response', () => {
    const { component, httpMock } = setup(['CLUSTER_NODE_READ']);
    httpMock.expectOne(nodesUrl).flush([
      buildNode(1, 'ACTIVE', true),
      buildNode(2, 'ACTIVE'),
      buildNode(3, 'INACTIVE'),
    ]);

    expect(component.totalNodes()).toBe(3);
    expect(component.activeNodes()).toBe(2);
    expect(component.inactiveNodes()).toBe(1);
    expect(component.allNodesOperational()).toBe(false);
    expect(component.masterNode()).toBe('node-1');
    expect(component.uptime()).toMatch(/^\d+d \d+h \d+m$/);
    expect(component.hasHealthException()).toBe(true);
  });

  it('should be silent when every node is ACTIVE', () => {
    const { component, httpMock } = setup(['CLUSTER_NODE_READ']);
    httpMock.expectOne(nodesUrl).flush([buildNode(1, 'ACTIVE'), buildNode(2, 'ACTIVE')]);

    expect(component.allNodesOperational()).toBe(true);
    expect(component.hasHealthException()).toBe(false);
  });

  it('should show real users and interface counts including interfaces in error', () => {
    const { fixture, component, httpMock } = setup(['USER_READ', 'INTERFACES_READ']);
    httpMock.expectOne(usersUrl).flush(148);
    httpMock.expectOne(interfacesUrl).flush([
      buildInterface(1, 'ACTIVE'),
      buildInterface(2, 'ERROR'),
      buildInterface(3, 'INACTIVE'),
    ]);
    fixture.detectChanges();

    expect(component.totalUsers()).toBe(148);
    expect(component.totalInterfaces()).toBe(3);
    expect(component.interfacesWithError()).toBe(1);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="stat-users-value"]')?.textContent).toContain('148');
    expect(el.querySelector('[data-testid="stat-interfaces-error-link"]')?.getAttribute('href')).toBe('/interfaces/configuration');
  });

  it('should not render a reports card or trend', () => {
    const { fixture, httpMock } = setup();
    httpMock.expectOne(nodesUrl).flush([]);
    httpMock.expectOne(usersUrl).flush(1);
    httpMock.expectOne(interfacesUrl).flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="stat-reports"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="stat-active-users"]')).toBeNull();
  });

  it('should isolate failures: one block in error does not affect the others', () => {
    const { component, httpMock } = setup();
    httpMock.expectOne(nodesUrl).flush([buildNode(1, 'ACTIVE')]);
    httpMock.expectOne(usersUrl).error(new ProgressEvent('error'));
    httpMock.expectOne(interfacesUrl).flush([]);

    expect(component.usersError()).toBe(true);
    expect(component.usersLoading()).toBe(false);
    expect(component.nodesError()).toBe(false);
    expect(component.interfacesError()).toBe(false);
    expect(component.totalNodes()).toBe(1);
  });

  it('should set the nodes error state when the request fails', () => {
    const { component, httpMock } = setup(['CLUSTER_NODE_READ']);
    httpMock.expectOne(nodesUrl).error(new ProgressEvent('error'));

    expect(component.nodesError()).toBe(true);
    expect(component.nodesLoading()).toBe(false);
  });

  it('should set freshness after loading and reload relaunches the requests', () => {
    const { component, httpMock } = setup(['USER_READ']);
    expect(component.minutesSinceUpdate()).toBeNull();
    httpMock.expectOne(usersUrl).flush(5);
    expect(component.minutesSinceUpdate()).toBe(0);

    component.reload();
    expect(component.usersLoading()).toBe(true);
    httpMock.expectOne(usersUrl).flush(6);
    expect(component.totalUsers()).toBe(6);
  });
});
