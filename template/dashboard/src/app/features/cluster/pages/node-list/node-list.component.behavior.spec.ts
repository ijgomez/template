import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';

import { NodeListComponent } from './node-list.component';
import { ClusterNode } from '../../../../core/models/cluster.model';
import { ClusterService } from '../../../../core/services/cluster.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CsvExportService } from '../../../../core/services/csv-export.service';
import { DateService } from '../../../../core/services/date.service';

/** Builds a ClusterNode with sensible defaults. */
function buildNode(overrides: Partial<ClusterNode> = {}): ClusterNode {
  return {
    id: 1,
    hostname: 'node-01',
    ip: '10.0.0.1',
    status: 'ACTIVE',
    master: true,
    freeMemory: 500,
    totalMemory: 1_073_741_824,
    usedMemory: 536_870_912,
    startedAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-02T00:00:00Z',
    ...overrides,
  };
}

/**
 * Behavior tests for NodeListComponent covering the filters, pagination,
 * sorting, master designation flow, CSV export and the rendered toolbar,
 * dialog and form views. Services are stubbed; the real template is rendered.
 */
describe('NodeListComponent (behavior)', () => {
  let fixture: ComponentFixture<NodeListComponent>;
  let component: NodeListComponent;
  let canWrite: boolean;
  let nodes: ClusterNode[];

  const clusterService = {
    findAllNodes: (): Observable<ClusterNode[]> => of(nodes),
    setMaster: (..._a: unknown[]): Observable<unknown> => of(void 0),
    // Needed by the node-jobs component rendered inside the node form.
    findAllTasks: (..._a: unknown[]): Observable<unknown> => of([]),
    findJobsByNode: (..._a: unknown[]): Observable<unknown> => of([]),
  };
  const notificationService = {
    showProgress: (..._a: unknown[]) => 'ntf-1',
    updateToSuccess: (..._a: unknown[]) => undefined,
    updateToError: (..._a: unknown[]) => undefined,
    dismiss: (..._a: unknown[]) => undefined,
  };
  const authService = { hasAction: () => canWrite };
  const csvExportService = { export: (..._a: unknown[]) => undefined };
  const dateService = { toLocalString: (v: string) => `local:${v}`, toLocal: (v: string) => `local:${v}` };

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string): HTMLElement | null => el().querySelector(`[data-testid="${id}"]`);

  const render = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const create = async (): Promise<void> => {
    fixture = TestBed.createComponent(NodeListComponent);
    component = fixture.componentInstance;
    await render();
  };

  beforeEach(async () => {
    canWrite = true;
    nodes = [
      buildNode({ id: 1, hostname: 'alpha', status: 'ACTIVE', master: true }),
      buildNode({ id: 2, hostname: 'bravo', status: 'ACTIVE', master: false }),
      buildNode({ id: 3, hostname: 'charlie', status: 'INACTIVE', master: false, totalMemory: 0, usedMemory: 0 }),
    ];

    await TestBed.configureTestingModule({
      imports: [NodeListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ClusterService, useValue: clusterService },
        { provide: NotificationService, useValue: notificationService },
        { provide: AuthService, useValue: authService },
        { provide: CsvExportService, useValue: csvExportService },
        { provide: DateService, useValue: dateService },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading', () => {
    it('should stop loading and notify an error when the backend fails', async () => {
      vi.spyOn(clusterService, 'findAllNodes').mockReturnValue(throwError(() => new Error('boom')));
      const updateToError = vi.spyOn(notificationService, 'updateToError');

      await create();

      expect(component.isLoading()).toBe(false);
      expect(component.allNodes()).toEqual([]);
      expect(updateToError).toHaveBeenCalledWith('ntf-1', 'notification.error');
    });
  });

  describe('rendered list', () => {
    it('should render the filters, the toolbar and the table', async () => {
      await create();

      expect(byTestId('nodes-filter-form')).toBeTruthy();
      expect(byTestId('filter-hostname')).toBeTruthy();
      expect(byTestId('filter-status')).toBeTruthy();
      expect(byTestId('filter-master')).toBeTruthy();
      expect(byTestId('btn-export')).toBeTruthy();
      expect(byTestId('cluster-nodes-table')).toBeTruthy();
    });

    it('should render the master badge, the placeholder dash and the memory columns', async () => {
      await create();

      const text = el().textContent ?? '';
      expect(text).toContain('MASTER');
      expect(text).toContain('alpha');
      expect(text).toContain('0.50 GB');
      expect(text).toContain('1.00 GB');
      expect(text).toContain('50.0%');
      expect(text).toContain('0.0%');
    });

    it('should show the write actions only with CLUSTER_NODE_WRITE', async () => {
      await create();
      expect(byTestId('btn-edit')).toBeTruthy();
      expect(byTestId('btn-set-master')).toBeTruthy();
    });

    it('should hide the write actions without CLUSTER_NODE_WRITE', async () => {
      canWrite = false;
      await create();

      expect(byTestId('btn-edit')).toBeNull();
      expect(byTestId('btn-set-master')).toBeNull();
    });

    it('should disable set-master for the master node and for inactive nodes', async () => {
      await create();
      const button = byTestId('btn-set-master') as HTMLButtonElement;
      expect(button.disabled).toBe(true);

      component.selectRow(nodes[0]);
      await render();
      expect(button.disabled).toBe(true);

      component.selectRow(nodes[2]);
      await render();
      expect(button.disabled).toBe(true);

      component.selectRow(nodes[1]);
      await render();
      expect(button.disabled).toBe(false);
    });
  });

  describe('filters', () => {
    beforeEach(async () => {
      await create();
    });

    it('should filter by hostname typed in the input', async () => {
      const input = byTestId('filter-hostname') as HTMLInputElement;

      input.value = 'BRA';
      input.dispatchEvent(new Event('input'));
      await render();

      expect(component.filteredNodes().map((n) => n.hostname)).toEqual(['bravo']);
    });

    it('should filter by master flag', () => {
      component.filterMaster.set('true');
      expect(component.filteredNodes().map((n) => n.hostname)).toEqual(['alpha']);

      component.filterMaster.set('false');
      expect(component.filteredNodes().map((n) => n.hostname)).toEqual(['bravo', 'charlie']);
    });

    it('should update the status and master signals from the selects', async () => {
      const status = byTestId('filter-status') as HTMLSelectElement;
      const master = byTestId('filter-master') as HTMLSelectElement;

      status.value = 'INACTIVE';
      status.dispatchEvent(new Event('change'));
      master.value = 'false';
      master.dispatchEvent(new Event('change'));

      expect(component.filterStatus()).toBe('INACTIVE');
      expect(component.filterMaster()).toBe('false');
    });

    it('applyFilters should reset the page and the selection', () => {
      component.currentPage.set(2);
      component.selectRow(nodes[0]);

      component.applyFilters();

      expect(component.currentPage()).toBe(0);
      expect(component.selectedRow()).toBeNull();
    });

    it('should apply the filters on submit', () => {
      component.currentPage.set(2);

      (byTestId('nodes-filter-form') as HTMLFormElement).dispatchEvent(new Event('submit'));

      expect(component.currentPage()).toBe(0);
    });

    it('clearFilters should reset every filter', () => {
      component.filterHostname.set('a');
      component.filterStatus.set('ACTIVE');
      component.filterMaster.set('true');

      byTestId('btn-filter-clear')!.click();

      expect(component.filterHostname()).toBe('');
      expect(component.filterStatus()).toBe('');
      expect(component.filterMaster()).toBe('');
    });
  });

  describe('pagination and sorting', () => {
    beforeEach(async () => {
      await create();
    });

    it('should expose the pagination helpers', () => {
      expect(component.totalElements()).toBe(3);
      expect(component.totalPages()).toBe(1);
      expect(component.showingFrom()).toBe(1);
      expect(component.showingTo()).toBe(3);
    });

    it('should report zero for showingFrom with no results', () => {
      component.filterHostname.set('zzz');

      expect(component.showingFrom()).toBe(0);
      expect(component.totalPages()).toBe(1);
    });

    it('changePageSize should paginate the rows', () => {
      component.changePageSize(2);

      expect(component.pageSize()).toBe(2);
      expect(component.totalPages()).toBe(2);
      expect(component.paginatedNodes()).toHaveLength(2);
    });

    it('goToPage should move to a valid page and ignore invalid ones', () => {
      component.changePageSize(2);

      component.goToPage(1);
      expect(component.currentPage()).toBe(1);
      expect(component.paginatedNodes()).toHaveLength(1);

      component.goToPage(5);
      component.goToPage(-1);
      expect(component.currentPage()).toBe(1);
    });

    it('onSort should sort ascending and descending and reset the page', () => {
      component.currentPage.set(1);

      component.onSort({ column: 'hostname', direction: 'desc' });
      expect(component.filteredNodes().map((n) => n.hostname)).toEqual(['charlie', 'bravo', 'alpha']);
      expect(component.currentPage()).toBe(0);

      component.onSort({ column: 'hostname', direction: 'asc' });
      expect(component.filteredNodes().map((n) => n.hostname)).toEqual(['alpha', 'bravo', 'charlie']);
    });

    it('onSort without direction should keep the original order', () => {
      component.onSort({ column: 'hostname', direction: '' });

      expect(component.filteredNodes().map((n) => n.hostname)).toEqual(['alpha', 'bravo', 'charlie']);
    });
  });

  describe('selection and navigation', () => {
    beforeEach(async () => {
      await create();
    });

    it('selectRow should select and toggle off the same row', () => {
      component.selectRow(nodes[0]);
      expect(component.selectedRow()).toEqual(nodes[0]);

      component.selectRow(nodes[0]);
      expect(component.selectedRow()).toBeNull();
    });

    it('viewSelected and editSelected should open the form for the selected node', () => {
      component.selectRow(nodes[1]);
      component.viewSelected();
      expect(component.viewMode()).toBe('form');
      expect(component.selectedNode()).toEqual(nodes[1]);

      component.backToList();
      // backToList keeps the row selected, so editing reuses the same selection.
      component.editSelected();
      expect(component.viewMode()).toBe('form');
    });

    it('viewSelected should do nothing without a selection', () => {
      component.viewSelected();

      expect(component.viewMode()).toBe('list');
    });

    it('should render the node form and go back to the list', async () => {
      component.openForm(nodes[0]);
      await render();

      expect(el().querySelector('app-node-form')).toBeTruthy();
      expect(byTestId('cluster-nodes-table')).toBeNull();

      component.backToList();
      await render();

      expect(byTestId('cluster-nodes-table')).toBeTruthy();
    });
  });

  describe('restoring the view from the URL', () => {
    it('should open the form when the node is loaded', async () => {
      // Use the real router so the URL actually changes.
      vi.restoreAllMocks();
      await TestBed.inject(Router).navigate([], { queryParams: { view: 'form', id: 2 } });

      await create();

      expect(component.viewMode()).toBe('form');
      expect(component.selectedNode()?.id).toBe(2);
    });

    it('should fall back to the list URL when the node does not exist', async () => {
      vi.restoreAllMocks();
      await TestBed.inject(Router).navigate([], { queryParams: { view: 'form', id: 99 } });
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      await create();

      expect(component.viewMode()).toBe('list');
      expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
    });
  });

  describe('master designation', () => {
    beforeEach(async () => {
      await create();
    });

    it('designateMasterSelected should open the confirmation for a non-master node', async () => {
      component.selectRow(nodes[1]);
      await render();

      byTestId('btn-set-master')!.click();
      await render();

      expect(component.showConfirmDialog()).toBe(true);
      expect(component.confirmNodeHostname()).toBe('bravo');
      expect(byTestId('cluster-nodes-confirm-dialog')).toBeTruthy();
    });

    it('designateMasterSelected should ignore the current master and empty selections', () => {
      component.designateMasterSelected();
      component.selectRow(nodes[0]);
      component.designateMasterSelected();

      expect(component.showConfirmDialog()).toBe(false);
    });

    it('should close the dialog from the cancel and close buttons', async () => {
      component.confirmSetMaster(nodes[1]);
      await render();
      byTestId('cluster-nodes-confirm-cancel')!.click();
      await render();
      expect(byTestId('cluster-nodes-confirm-dialog')).toBeNull();
      expect(component.confirmNodeId()).toBeNull();

      component.confirmSetMaster(nodes[1]);
      await render();
      byTestId('cluster-nodes-confirm-close')!.click();
      await render();
      expect(component.showConfirmDialog()).toBe(false);
    });

    it('should set the master and reload on confirm', async () => {
      const setMaster = vi.spyOn(clusterService, 'setMaster');
      const success = vi.spyOn(notificationService, 'updateToSuccess');
      const reload = vi.spyOn(clusterService, 'findAllNodes');
      component.selectRow(nodes[1]);
      component.confirmSetMaster(nodes[1]);
      await render();

      byTestId('cluster-nodes-confirm-ok')!.click();
      await render();

      expect(setMaster).toHaveBeenCalledWith(2, true);
      expect(success).toHaveBeenCalledWith('ntf-1', 'notification.save.success');
      expect(reload).toHaveBeenCalledTimes(1);
      expect(component.selectedRow()).toBeNull();
      expect(component.showConfirmDialog()).toBe(false);
    });

    it('should notify an error and keep the list when set-master fails', async () => {
      vi.spyOn(clusterService, 'setMaster').mockReturnValue(throwError(() => new Error('boom')));
      const updateToError = vi.spyOn(notificationService, 'updateToError');
      component.confirmSetMaster(nodes[1]);

      component.executeSetMaster();

      expect(updateToError).toHaveBeenCalledWith('ntf-1', 'notification.save.error');
      expect(component.confirmNodeId()).toBeNull();
    });

    it('executeSetMaster should do nothing without a pending node', () => {
      const setMaster = vi.spyOn(clusterService, 'setMaster');

      component.executeSetMaster();

      expect(setMaster).not.toHaveBeenCalled();
    });
  });

  describe('exportCsv', () => {
    beforeEach(async () => {
      await create();
    });

    it('should export the filtered nodes with memory figures', () => {
      const spy = vi.spyOn(csvExportService, 'export');

      byTestId('btn-export')!.click();

      expect(spy).toHaveBeenCalledTimes(1);
      const [headers, rows, name] = spy.mock.calls[0] as unknown as [string[], string[][], string];
      expect(name).toBe('cluster-nodes');
      expect(headers).toHaveLength(9);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual([
        'alpha',
        '10.0.0.1',
        'ACTIVE',
        'MASTER',
        'local:2026-01-01T00:00:00Z',
        'local:2026-01-02T00:00:00Z',
        '0.50',
        '1.00',
        '50.0%',
      ]);
      expect(rows[2][8]).toBe('0%');
    });

    it('should not export when there is nothing to export', () => {
      const spy = vi.spyOn(csvExportService, 'export');
      component.filterHostname.set('zzz');

      component.exportCsv();

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
