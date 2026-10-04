import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { NodeJobsComponent } from './node-jobs.component';
import { ClusterService } from '../../../../../core/services/cluster.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ClusterJob, ClusterTask } from '../../../../../core/models/cluster.model';

function buildTask(overrides: Partial<ClusterTask> = {}): ClusterTask {
  return { id: 1, name: 'TASK_A', description: null, nodes: null, minNodes: null, ...overrides };
}

function buildJob(overrides: Partial<ClusterJob> = {}): ClusterJob {
  return { clusterNodeId: 7, clusterTaskId: 1, priority: 1, enabled: true, ...overrides };
}

describe('NodeJobsComponent', () => {
  let component: NodeJobsComponent;
  let fixture: ComponentFixture<NodeJobsComponent>;
  let clusterService: {
    findJobsByNode: ReturnType<typeof vi.fn>;
    findAllTasks: ReturnType<typeof vi.fn>;
    assignJob: ReturnType<typeof vi.fn>;
    updateJob: ReturnType<typeof vi.fn>;
    deleteJob: ReturnType<typeof vi.fn>;
  };
  let canWrite = true;

  function setup(nodeId = 7) {
    fixture = TestBed.createComponent(NodeJobsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('nodeId', nodeId);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    canWrite = true;
    clusterService = {
      findJobsByNode: vi.fn().mockReturnValue(of([buildJob()])),
      findAllTasks: vi.fn().mockReturnValue(of([buildTask({ id: 1, name: 'TASK_A' }), buildTask({ id: 2, name: 'TASK_B' })])),
      assignJob: vi.fn().mockReturnValue(of(buildJob({ clusterTaskId: 2 }))),
      updateJob: vi.fn().mockReturnValue(of(buildJob())),
      deleteJob: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [NodeJobsComponent],
      providers: [
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: ClusterService, useValue: clusterService },
        { provide: AuthService, useValue: { hasAction: () => canWrite } },
      ],
    }).compileComponents();
  });

  it('should create and load jobs + tasks on init', () => {
    setup(7);
    expect(component).toBeTruthy();
    expect(clusterService.findJobsByNode).toHaveBeenCalledWith(7);
    expect(clusterService.findAllTasks).toHaveBeenCalled();
    expect(component.jobs().length).toBe(1);
    expect(component.tasks().length).toBe(2);
  });

  it('assignableTasks excludes already-assigned tasks and sorts by name', () => {
    clusterService.findJobsByNode.mockReturnValue(of([buildJob({ clusterTaskId: 1 })]));
    clusterService.findAllTasks.mockReturnValue(
      of([buildTask({ id: 1, name: 'TASK_A' }), buildTask({ id: 3, name: 'TASK_C' }), buildTask({ id: 2, name: 'TASK_B' })]),
    );
    setup();

    const names = component.assignableTasks().map((t) => t.name);
    expect(names).toEqual(['TASK_B', 'TASK_C']);
  });

  it('canAssign is false when there are no assignable tasks', () => {
    clusterService.findJobsByNode.mockReturnValue(of([buildJob({ clusterTaskId: 1 }), buildJob({ clusterTaskId: 2 })]));
    setup();
    expect(component.assignableTasks().length).toBe(0);
    expect(component.canAssign()).toBe(false);
  });

  it('renders the actions column only when the user can write', () => {
    setup();
    let el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="node-jobs-btn-edit"]')).not.toBeNull();

    canWrite = false;
    setup();
    el = fixture.nativeElement;
    expect(el.querySelector('[data-testid="node-jobs-btn-edit"]')).toBeNull();
  });

  it('openAssign resets the form and opens the modal in assign mode', () => {
    setup();
    component.openAssign();
    expect(component.showModal()).toBe(true);
    expect(component.modalMode()).toBe('assign');
    expect(component.formData().clusterTaskId).toBeNull();
  });

  it('openEdit loads the selected job into the form in edit mode', () => {
    setup();
    component.openEdit(buildJob({ clusterTaskId: 1, priority: 5, enabled: false }));
    expect(component.showModal()).toBe(true);
    expect(component.modalMode()).toBe('edit');
    expect(component.formData().clusterTaskId).toBe(1);
    expect(component.formData().priority).toBe('5');
    expect(component.formData().enabled).toBe(false);
  });

  it('save is disabled in assign mode when no task is selected', () => {
    setup();
    component.openAssign();
    component.updateField('priority', '1');
    expect(component.isSaveDisabled()).toBe(true);
    component.updateField('clusterTaskId', 2);
    expect(component.isSaveDisabled()).toBe(false);
  });

  it('save is disabled when priority is negative', () => {
    setup();
    component.openEdit(buildJob({ clusterTaskId: 1 }));
    component.updateField('priority', '-1');
    expect(component.isSaveDisabled()).toBe(true);
    component.updateField('priority', '0');
    expect(component.isSaveDisabled()).toBe(false);
  });

  it('priority is required: empty priority marks the form invalid and disables save', () => {
    setup();
    component.openAssign();
    component.updateField('clusterTaskId', 2);
    component.updateField('priority', '');
    expect(component.isPriorityInvalid()).toBe(true);
    expect(component.isSaveDisabled()).toBe(true);
    component.updateField('priority', '1');
    expect(component.isPriorityInvalid()).toBe(false);
    expect(component.isSaveDisabled()).toBe(false);
  });

  it('save does not submit when priority is empty', () => {
    setup();
    component.openAssign();
    component.updateField('clusterTaskId', 2);
    component.updateField('priority', '');
    component.save();

    expect(clusterService.assignJob).not.toHaveBeenCalled();
    expect(component.showModal()).toBe(true);
  });

  it('save sends priority as a number when assigning', () => {
    setup();
    component.openAssign();
    component.updateField('clusterTaskId', 2);
    component.updateField('priority', '4');
    component.save();

    expect(clusterService.assignJob).toHaveBeenCalledTimes(1);
    const sent = clusterService.assignJob.mock.calls[0][1] as ClusterJob;
    expect(sent.priority).toBe(4);
    expect(sent.clusterTaskId).toBe(2);
    expect(sent.enabled).toBe(true);
    expect(component.showModal()).toBe(false);
  });

  it('save delegates to updateJob in edit mode', () => {
    setup();
    component.openEdit(buildJob({ clusterTaskId: 1, priority: 2 }));
    component.updateField('priority', '3');
    component.save();

    expect(clusterService.updateJob).toHaveBeenCalledTimes(1);
    const [nodeId, taskId, job] = clusterService.updateJob.mock.calls[0];
    expect(nodeId).toBe(7);
    expect(taskId).toBe(1);
    expect((job as ClusterJob).priority).toBe(3);
  });

  it('confirmDelete opens the dialog and executeDelete delegates to deleteJob', () => {
    setup();
    component.confirmDelete(buildJob({ clusterTaskId: 1 }));
    expect(component.showConfirmDelete()).toBe(true);
    expect(component.confirmTaskId()).toBe(1);

    component.executeDelete();
    expect(clusterService.deleteJob).toHaveBeenCalledWith(7, 1);
    expect(component.showConfirmDelete()).toBe(false);
  });

  it('reloads jobs after a successful assign', () => {
    setup();
    expect(clusterService.findJobsByNode).toHaveBeenCalledTimes(1);
    component.openAssign();
    component.updateField('clusterTaskId', 2);
    component.updateField('priority', '1');
    component.save();
    expect(clusterService.findJobsByNode).toHaveBeenCalledTimes(2);
  });
});
