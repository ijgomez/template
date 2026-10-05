import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { NodeFormComponent } from './node-form.component';
import { NodeJobsComponent } from './node-jobs.component';
import { ClusterService } from '../../../../../core/services/cluster.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ClusterNode } from '../../../../../core/models/cluster.model';

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

describe('NodeFormComponent', () => {
  let component: NodeFormComponent;
  let fixture: ComponentFixture<NodeFormComponent>;

  function setup(node: ClusterNode = buildNode()) {
    fixture = TestBed.createComponent(NodeFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('node', node);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    const clusterServiceStub: Partial<ClusterService> = {
      findJobsByNode: () => of([]),
      findAllTasks: () => of([]),
    };

    await TestBed.configureTestingModule({
      imports: [NodeFormComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ClusterService, useValue: clusterServiceStub },
        { provide: AuthService, useValue: { hasAction: () => false } },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('renders the node attributes in read-only controls', () => {
    setup(buildNode({ hostname: 'node-alpha', ip: '10.0.0.5' }));
    const el: HTMLElement = fixture.nativeElement;
    const card = el.querySelector('[data-testid="node-form-card"]')!;
    expect(card).not.toBeNull();
    const inputs = card.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
    // All node attribute inputs are read-only and disabled (Req 25.11).
    inputs.forEach((input) => {
      expect(input.hasAttribute('readonly')).toBe(true);
      expect(input.hasAttribute('disabled')).toBe(true);
    });
    const hostnameInput = Array.from(inputs).find((i) => i.value === 'node-alpha');
    expect(hostnameInput).toBeTruthy();
    const ipInput = Array.from(inputs).find((i) => i.value === '10.0.0.5');
    expect(ipInput).toBeTruthy();
  });

  it('exposes the back button with the preserved data-testid', () => {
    setup();
    const el: HTMLElement = fixture.nativeElement;
    const backBtn = el.querySelector('[data-testid="node-detail-btn-back"]');
    expect(backBtn).not.toBeNull();
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
    const el: HTMLElement = fixture.nativeElement;
    const h1 = el.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toContain('cluster.nodes.form.title');
  });

  it('includes an app-node-jobs child with the node id', () => {
    const node = buildNode({ id: 99 });
    setup(node);
    const jobs = fixture.debugElement.children.find((c) => c.componentInstance instanceof NodeJobsComponent);
    expect(jobs).toBeTruthy();
    const jobsComponent = jobs!.componentInstance as NodeJobsComponent;
    expect(jobsComponent.nodeId()).toBe(99);
  });
});
