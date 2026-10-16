import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { NodeListComponent } from './node-list.component';
import { ClusterNode } from '../../../../../core/models/cluster.model';
import { ClusterService } from '../../../../../core/services/cluster.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { CsvExportService } from '../../../../../core/services/csv-export.service';

/** Builds a ClusterNode with sensible defaults. */
function buildNode(overrides: Partial<ClusterNode> = {}): ClusterNode {
  return {
    id: 1,
    hostname: 'node-01',
    ip: '10.0.0.1',
    status: 'ACTIVE',
    master: true,
    freeMemory: 500,
    totalMemory: 1000,
    usedMemory: 500,
    startedAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('NodeListComponent', () => {
  let component: NodeListComponent;
  let fixture: ComponentFixture<NodeListComponent>;

  /** Loads the given nodes into the component and renders the list. */
  function setup(nodes: ClusterNode[] = [buildNode()]) {
    const clusterService = {
      findAllNodes: vi.fn().mockReturnValue(of(nodes)),
      setMaster: vi.fn().mockReturnValue(of(void 0)),
    };
    const notificationService = {
      showProgress: vi.fn().mockReturnValue('ntf-1'),
      updateToSuccess: vi.fn(),
      updateToError: vi.fn(),
      dismiss: vi.fn(),
    };
    const authService = { hasAction: vi.fn().mockReturnValue(true) };
    const csvExportService = { export: vi.fn() };

    TestBed.configureTestingModule({
      imports: [NodeListComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ClusterService, useValue: clusterService },
        { provide: NotificationService, useValue: notificationService },
        { provide: AuthService, useValue: authService },
        { provide: CsvExportService, useValue: csvExportService },
      ],
    });

    fixture = TestBed.createComponent(NodeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> loadNodes
  }

  it('should create and load the nodes', () => {
    setup([buildNode(), buildNode({ id: 2, hostname: 'node-02', status: 'INACTIVE', master: false })]);
    expect(component).toBeTruthy();
    expect(component.allNodes().length).toBe(2);
  });

  it('should filter nodes by status', () => {
    setup([
      buildNode({ id: 1, status: 'ACTIVE' }),
      buildNode({ id: 2, hostname: 'node-02', status: 'INACTIVE', master: false }),
    ]);

    component.filterStatus.set('INACTIVE');
    const filtered = component.filteredNodes();
    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('INACTIVE');
  });

  describe('status badge (accessibility: not color-only)', () => {
    it('should render a success icon for an ACTIVE node', () => {
      setup([buildNode({ status: 'ACTIVE' })]);
      const icon = fixture.nativeElement.querySelector('.badge .bi.bi-check-circle-fill');
      expect(icon).toBeTruthy();
      // The icon is decorative; the text already conveys the status.
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });

    it('should render an error icon for an INACTIVE node', () => {
      setup([buildNode({ status: 'INACTIVE', master: false })]);
      const icon = fixture.nativeElement.querySelector('.badge .bi.bi-x-circle-fill');
      expect(icon).toBeTruthy();
    });
  });
});
