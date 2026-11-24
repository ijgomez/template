import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { NodeFormComponent } from './node-form.component';
import { NodeJobsComponent } from '../../components/node-jobs/node-jobs.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ClusterNode } from '../../../../core/models/cluster.model';
import enJson from '../../../../../assets/i18n/en.json';
import esJson from '../../../../../assets/i18n/es.json';

const GB = 1_073_741_824;

function buildNode(overrides: Partial<ClusterNode> = {}): ClusterNode {
  return {
    id: 42,
    hostname: 'node-alpha',
    ip: '10.0.0.5',
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

function buildDetail(overrides: Partial<ClusterNode> = {}): ClusterNode {
  return buildNode({
    processors: 8,
    fsTotalSpace: 100 * GB,
    fsFreeSpace: 25 * GB,
    fsUsableSpace: 20 * GB,
    filesystem: 'overlay (overlay) - /opt/app',
    jvmProperties: { 'java.version': '21.0.1', 'user.language': 'es', 'os.name': 'Linux' },
    environmentProperties: { PATH: '/usr/bin', HOME: '/home/app', LANG: 'en_US' },
    ...overrides,
  });
}

describe('NodeFormComponent', () => {
  let component: NodeFormComponent;
  let fixture: ComponentFixture<NodeFormComponent>;
  let http: HttpTestingController;

  /** Creates the component; the detail request is NOT answered. */
  function setup(node: ClusterNode = buildNode()) {
    fixture = TestBed.createComponent(NodeFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('node', node);
    fixture.detectChanges();
  }

  function detailRequest(id = 42) {
    return http.expectOne((r) => r.method === 'GET' && r.url.endsWith(`/nodes/${id}`));
  }

  /** Creates the component and answers the detail request with the given body. */
  function setupWithDetail(detail: ClusterNode | null, node: ClusterNode = buildNode()) {
    setup(node);
    detailRequest(node.id).flush(detail);
    fixture.detectChanges();
  }

  function q<T extends HTMLElement = HTMLElement>(testId: string): T | null {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(`[data-testid="${testId}"]`);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: AuthService, useValue: { hasAction: () => false } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('renders the node attributes in read-only controls', () => {
    setup(buildNode({ hostname: 'node-alpha', ip: '10.0.0.5' }));
    const el: HTMLElement = fixture.nativeElement;
    const card = el.querySelector<HTMLElement>('[data-testid="node-form-card"]');
    expect(card).not.toBeNull();
    const inputs = card?.querySelectorAll('input') ?? [];
    expect(inputs.length).toBeGreaterThan(0);
    // All node attribute inputs are read-only and disabled (Req 25.11).
    inputs.forEach((input) => {
      // Filter inputs are editable and only exist after the detail is loaded.
      expect(input.hasAttribute('readonly')).toBe(true);
      expect(input.hasAttribute('disabled')).toBe(true);
    });
    const hostnameInput = Array.from(inputs).find((i) => i.value === 'node-alpha');
    expect(hostnameInput).toBeTruthy();
    const ipInput = Array.from(inputs).find((i) => i.value === '10.0.0.5');
    expect(ipInput).toBeTruthy();
  });

  it('formats memory with formatGb/formatFreePercent (dot decimals, no locale pipe)', () => {
    setup(buildNode({ usedMemory: 3 * GB, totalMemory: 4 * GB }));
    const value = (id: string) => (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${id}`)?.value;
    expect(value('node-used-memory')).toBe('3.00 GB');
    expect(value('node-total-memory')).toBe('4.00 GB');
    expect(value('node-free-memory')).toBe('25.0%');
  });

  it('shows memory percent as "-" without suffix when total memory is 0', () => {
    setup(buildNode({ usedMemory: 0, totalMemory: 0 }));
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#node-free-memory');
    expect(input?.value).toBe('-');
  });

  it('renders the status as a disabled select with the active option selected', () => {
    setup(buildNode({ status: 'ACTIVE' }));
    const select = q<HTMLSelectElement>('node-form-status-select');
    expect(select).not.toBeNull();
    expect(select?.hasAttribute('disabled')).toBe(true);
    const options = Array.from(select?.querySelectorAll('option') ?? []);
    expect(options.map((o) => o.value)).toEqual(['ACTIVE', 'INACTIVE']);
    expect(options.find((o) => o.value === 'ACTIVE')?.selected).toBe(true);
  });

  it('selects the inactive option when the node is inactive', () => {
    setup(buildNode({ status: 'INACTIVE' }));
    const select = q<HTMLSelectElement>('node-form-status-select');
    const inactiveOption = Array.from(select?.querySelectorAll('option') ?? []).find((o) => o.value === 'INACTIVE');
    expect(inactiveOption?.selected).toBe(true);
  });

  it('exposes the back button with the preserved data-testid', () => {
    setup();
    expect(q('node-detail-btn-back')).not.toBeNull();
  });

  it('onBack() emits the back output', () => {
    setup();
    const spy = vi.fn();
    component.back.subscribe(spy);
    component.onBack();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders an <h1> with the form title translation key', () => {
    setup();
    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toContain('cluster.nodes.form.title');
  });

  it('includes an app-node-jobs child with the node id', () => {
    setup(buildNode({ id: 99 }));
    const jobs = fixture.debugElement.children.find((c) => c.componentInstance instanceof NodeJobsComponent);
    expect(jobs).toBeTruthy();
    const jobsComponent: NodeJobsComponent | undefined = jobs?.componentInstance;
    expect(jobsComponent?.nodeId()).toBe(99);
  });

  describe('extended info', () => {
    it('requests GET /nodes/{id} for the node detail', () => {
      setup(buildNode({ id: 7 }));
      const req = detailRequest(7);
      expect(req.request.method).toBe('GET');
      req.flush(buildDetail({ id: 7 }));
    });

    it('shows each new field when informed', () => {
      setupWithDetail(buildDetail());

      expect(q<HTMLInputElement>('node-form-processors')?.value).toBe('8');
      expect(q<HTMLInputElement>('node-form-filesystem')?.value).toBe('overlay (overlay) - /opt/app');
      expect(q<HTMLInputElement>('node-form-fs-total')?.value).toBe('100.00');
      expect(q<HTMLInputElement>('node-form-fs-free')?.value).toBe('25.00');
      expect(q<HTMLInputElement>('node-form-fs-free-percent')?.value).toBe('25.0');
      expect(q<HTMLTextAreaElement>('node-form-jvm-text')?.value).toBe(
        'java.version = 21.0.1\nos.name = Linux\nuser.language = es',
      );
      expect(q<HTMLTextAreaElement>('node-form-env-text')?.value).toBe(
        'HOME = /home/app\nLANG = en_US\nPATH = /usr/bin',
      );
    });

    it('shows JVM properties and environment variables in read-only textareas', () => {
      setupWithDetail(buildDetail());
      ['node-form-jvm-text', 'node-form-env-text'].forEach((id) => {
        const area = q<HTMLTextAreaElement>(id);
        expect(area?.tagName).toBe('TEXTAREA');
        expect(area?.readOnly).toBe(true);
      });
    });

    it('renders null values as "-" without errors', () => {
      setupWithDetail(
        buildDetail({
          processors: null,
          fsTotalSpace: null,
          fsFreeSpace: null,
          fsUsableSpace: null,
          filesystem: null,
          jvmProperties: null,
          environmentProperties: null,
        }),
      );

      expect(q<HTMLInputElement>('node-form-processors')?.value).toBe('-');
      expect(q<HTMLInputElement>('node-form-filesystem')?.value).toBe('-');
      expect(q<HTMLInputElement>('node-form-fs-total')?.value).toBe('-');
      expect(q<HTMLInputElement>('node-form-fs-free')?.value).toBe('-');
      expect(q<HTMLInputElement>('node-form-fs-free-percent')?.value).toBe('-');
      expect(q<HTMLTextAreaElement>('node-form-jvm-text')?.value).toBe('');
      expect(q<HTMLTextAreaElement>('node-form-env-text')?.value).toBe('');
      expect(q('node-form-load-error')).toBeNull();
    });

    it('renders absent fields as "-" without errors', () => {
      // buildNode() carries none of the new fields.
      setupWithDetail(buildNode());

      expect(q<HTMLInputElement>('node-form-processors')?.value).toBe('-');
      expect(q<HTMLInputElement>('node-form-fs-free-percent')?.value).toBe('-');
      expect(q<HTMLTextAreaElement>('node-form-jvm-text')?.value).toBe('');
      expect(q<HTMLTextAreaElement>('node-form-env-text')?.value).toBe('');
      expect(q('node-form-load-error')).toBeNull();
    });

    it('shows the load error and no values in the new sections on HTTP error', () => {
      setup();
      detailRequest().flush('boom', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(q('node-form-load-error')?.textContent).toContain('cluster.nodes.form.loadError');
      expect(q<HTMLInputElement>('node-form-processors')?.value).toBe('-');
      expect(q('node-form-jvm-text')).toBeNull();
      expect(q('node-form-env-text')).toBeNull();
    });

    it('shows the load error when the detail does not answer within 30 s', () => {
      vi.useFakeTimers();
      setup();
      detailRequest();

      vi.advanceTimersByTime(29_999);
      fixture.detectChanges();
      expect(q('node-form-load-error')).toBeNull();

      vi.advanceTimersByTime(1);
      fixture.detectChanges();
      expect(q('node-form-load-error')?.textContent).toContain('cluster.nodes.form.loadError');
      expect(q('node-form-jvm-text')).toBeNull();
    });

    it('associates every label with an existing control', () => {
      setupWithDetail(buildDetail());

      const labels = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('label'));
      expect(labels.length).toBeGreaterThan(0);
      labels.forEach((label) => {
        const id = label.getAttribute('for');
        expect(id, `label "${label.textContent?.trim()}" has no "for"`).toBeTruthy();
        expect((fixture.nativeElement as HTMLElement).querySelector(`#${id}`)).not.toBeNull();
      });
      [
        'node-filesystem',
        'node-processors',
        'node-fs-total',
        'node-fs-free',
        'node-fs-free-percent',
        'node-form-jvm-text',
        'node-form-env-text',
      ].forEach((id) => {
        expect((fixture.nativeElement as HTMLElement).querySelector(`label[for="${id}"]`), id).not.toBeNull();
      });
    });
  });
});

describe('cluster.nodes i18n keys', () => {
  const NEW_KEYS = [
    'fields.processors',
    'fields.filesystem',
    'fields.fsTotalGb',
    'fields.fsFreeGb',
    'fields.fsFreePercent',
    'form.sectionResources',
    'form.sectionJvm',
    'form.sectionEnvironment',
    'form.noProperties',
    'form.loadError',
  ];

  function flatten(obj: unknown, prefix = ''): string[] {
    if (obj === null || typeof obj !== 'object') {
      return [prefix];
    }
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      flatten(v, prefix ? `${prefix}.${k}` : k),
    );
  }

  function nodesSection(json: unknown): Record<string, unknown> {
    return (json as { cluster: { nodes: Record<string, unknown> } }).cluster.nodes;
  }

  it('has the same keys in es.json and en.json under cluster.nodes', () => {
    const es = flatten(nodesSection(esJson)).sort();
    const en = flatten(nodesSection(enJson)).sort();
    expect(es).toEqual(en);
  });

  it('defines every new extended-info key with a non-empty text in both languages', () => {
    for (const json of [esJson, enJson]) {
      const keys = new Set(flatten(nodesSection(json)));
      for (const key of NEW_KEYS) {
        expect(keys.has(key), `missing ${key}`).toBe(true);
      }
      const get = (path: string) =>
        path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], nodesSection(json));
      NEW_KEYS.forEach((key) => expect(String(get(key)).trim().length).toBeGreaterThan(0));
    }
  });
});
