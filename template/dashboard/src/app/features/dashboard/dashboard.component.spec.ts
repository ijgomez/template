import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard.component';
import { ClusterNode } from '../../core/models/cluster.model';
import { environment } from '../../../environments/environment';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  const nodesUrl = `${environment.apiUrl}/administration/cluster/nodes`;

  const buildNode = (id: number, status: ClusterNode['status'], master = false): ClusterNode => ({
    id,
    hostname: `node-${id}`,
    ip: `10.0.0.${id}`,
    status,
    master,
    freeMemory: 1000,
    totalMemory: 2000,
    usedMemory: 1000,
    startedAt: '2026-08-04T19:15:00Z',
    lastModifiedAt: '2026-08-04T19:15:00Z',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    httpMock.expectOne(nodesUrl).flush([]);
    expect(component).toBeTruthy();
  });

  it('should expose a fixed set of recent activity entries', () => {
    httpMock.expectOne(nodesUrl).flush([]);
    expect(component.recentActivity.length).toBe(5);
    for (const entry of component.recentActivity) {
      expect(entry.user).toBeTruthy();
      expect(entry.operation).toBeTruthy();
      expect(entry.section).toBeTruthy();
      expect(entry.badgeClass).toContain('bg-');
    }
  });

  it('should expose a last access value', () => {
    httpMock.expectOne(nodesUrl).flush([]);
    expect(component.lastAccess).toBeTruthy();
  });

  it('should compute active and total nodes from the backend response', () => {
    httpMock.expectOne(nodesUrl).flush([
      buildNode(1, 'ACTIVE', true),
      buildNode(2, 'ACTIVE'),
      buildNode(3, 'INACTIVE'),
    ]);

    expect(component.totalNodes()).toBe(3);
    expect(component.activeNodes()).toBe(2);
    expect(component.inactiveNodes()).toBe(1);
    expect(component.allNodesOperational()).toBe(false);
    expect(component.nodesLoading()).toBe(false);
    expect(component.nodesError()).toBe(false);
  });

  it('should mark all nodes operational when every node is ACTIVE', () => {
    httpMock.expectOne(nodesUrl).flush([buildNode(1, 'ACTIVE'), buildNode(2, 'ACTIVE')]);

    expect(component.allNodesOperational()).toBe(true);
    expect(component.inactiveNodes()).toBe(0);
  });

  it('should set the error state when the request fails', () => {
    httpMock.expectOne(nodesUrl).error(new ProgressEvent('error'));

    expect(component.nodesError()).toBe(true);
    expect(component.nodesLoading()).toBe(false);
  });
});
