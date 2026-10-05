import { Component, ChangeDetectionStrategy, inject, input, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ClusterService } from '../../../../core/services/cluster.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TpDataTableComponent, TpColumnDirective, ColumnDef } from '../../../../shared/components/data-table';
import { ClusterJob, ClusterTask } from '../../../../core/models/cluster.model';

/** Modal editing mode for the jobs panel. */
type JobModalMode = 'assign' | 'edit';

/** Internal form state for the assign/edit modal. */
interface JobFormData {
  clusterTaskId: number | null;
  priority: number | null;
  enabled: boolean;
}

/**
 * Node jobs component.
 * Manages the jobs (ClusterJob) assigned to a given cluster node:
 * list, assign, edit and delete. All logic lives in the component/signals,
 * never in the template. Reuses tp-data-table and the inline modal pattern.
 */
@Component({
  selector: 'app-node-jobs',
  standalone: true,
  imports: [FormsModule, TranslatePipe, TpDataTableComponent, TpColumnDirective],
  templateUrl: './node-jobs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeJobsComponent implements OnInit {
  private readonly clusterService = inject(ClusterService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  /** The id of the node whose jobs are managed. */
  readonly nodeId = input.required<number>();

  // Data state
  readonly jobs = signal<ClusterJob[]>([]);
  readonly tasks = signal<ClusterTask[]>([]);
  readonly isLoading = signal(false);

  // Modal state
  readonly showModal = signal(false);
  readonly modalMode = signal<JobModalMode>('assign');
  readonly formData = signal<JobFormData>({ clusterTaskId: null, priority: null, enabled: true });

  // Delete confirmation state
  readonly showConfirmDelete = signal(false);
  readonly confirmTaskId = signal<number | null>(null);
  readonly confirmTaskName = signal('');

  /** Permission to mutate jobs. */
  readonly canWrite = this.authService.hasAction('CLUSTER_NODE_WRITE');

  /** Lookup of task id -> name for rendering the jobs table. */
  readonly tasksById = computed(() => {
    const map = new Map<number, ClusterTask>();
    for (const task of this.tasks()) {
      map.set(task.id, task);
    }
    return map;
  });

  /** Tasks not yet assigned to this node, ordered by name. */
  readonly assignableTasks = computed(() => {
    const assigned = new Set(this.jobs().map((j) => j.clusterTaskId));
    return this.tasks()
      .filter((t) => !assigned.has(t.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Whether a new task can be assigned. */
  readonly canAssign = computed(() => this.assignableTasks().length > 0 && this.canWrite);

  /** Whether the priority field is invalid (required and must be >= 0). */
  readonly isPriorityInvalid = computed(() => {
    const value = this.formData().priority;
    if (value === null || value === undefined) {
      return true;
    }
    return value < 0;
  });

  /** Whether the save action in the modal must be disabled. */
  readonly isSaveDisabled = computed(() => {
    const form = this.formData();
    if (this.modalMode() === 'assign' && form.clusterTaskId === null) {
      return true;
    }
    return this.isPriorityInvalid();
  });

  // Column definitions for tp-data-table
  readonly columns: ColumnDef[] = [
    { key: 'task', header: 'cluster.nodes.jobs.fields.task' },
    { key: 'priority', header: 'cluster.nodes.jobs.fields.priority', width: '120px' },
    { key: 'enabled', header: 'cluster.nodes.jobs.fields.enabled', width: '120px' },
    { key: 'actions', header: 'cluster.nodes.jobs.fields.description', width: '120px' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Loads the jobs of the node and the task catalogue.
   */
  loadData(): void {
    this.loadJobs();
    this.clusterService.findAllTasks().subscribe({
      next: (tasks) => this.tasks.set(tasks),
      error: () => this.notificationService.showError('notification.error'),
    });
  }

  /**
   * Reloads the jobs of the node.
   */
  loadJobs(): void {
    this.isLoading.set(true);
    this.clusterService.findJobsByNode(this.nodeId()).subscribe({
      next: (jobs) => {
        this.jobs.set(jobs);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('notification.error');
      },
    });
  }

  /**
   * Resolves the task name for a job row.
   */
  taskName(taskId: number): string {
    return this.tasksById().get(taskId)?.name ?? String(taskId);
  }

  /**
   * Opens the modal in assign mode.
   */
  openAssign(): void {
    if (!this.canAssign()) {
      return;
    }
    this.modalMode.set('assign');
    this.formData.set({ clusterTaskId: null, priority: null, enabled: true });
    this.showModal.set(true);
  }

  /**
   * Opens the modal in edit mode for an existing job.
   */
  openEdit(job: ClusterJob): void {
    if (!this.canWrite) {
      return;
    }
    this.modalMode.set('edit');
    this.formData.set({
      clusterTaskId: job.clusterTaskId,
      priority: job.priority,
      enabled: job.enabled,
    });
    this.showModal.set(true);
  }

  /**
   * Closes the modal without saving.
   */
  closeModal(): void {
    this.showModal.set(false);
  }

  /**
   * Updates a single field of the modal form state.
   */
  updateField<K extends keyof JobFormData>(field: K, value: JobFormData[K]): void {
    this.formData.update((data) => ({ ...data, [field]: value }));
  }

  /**
   * Saves the modal form, either assigning a new job or updating an existing one.
   */
  save(): void {
    if (this.isSaveDisabled()) {
      return;
    }

    const form = this.formData();
    const taskId = form.clusterTaskId;
    if (taskId === null) {
      return;
    }

    const nodeId = this.nodeId();
    const job: ClusterJob = {
      clusterNodeId: nodeId,
      clusterTaskId: taskId,
      priority: form.priority as number,
      enabled: form.enabled,
    };

    const progressId = this.notificationService.showProgress('notification.save.progress');
    const request$ =
      this.modalMode() === 'assign'
        ? this.clusterService.assignJob(nodeId, job)
        : this.clusterService.updateJob(nodeId, taskId, job);

    request$.subscribe({
      next: () => {
        this.notificationService.updateToSuccess(progressId, 'notification.save.success');
        this.showModal.set(false);
        this.loadJobs();
      },
      error: () => {
        this.notificationService.updateToError(progressId, 'notification.save.error');
      },
    });
  }

  /**
   * Opens the delete confirmation dialog for a job.
   */
  confirmDelete(job: ClusterJob): void {
    if (!this.canWrite) {
      return;
    }
    this.confirmTaskId.set(job.clusterTaskId);
    this.confirmTaskName.set(this.taskName(job.clusterTaskId));
    this.showConfirmDelete.set(true);
  }

  /**
   * Cancels the delete confirmation.
   */
  cancelDelete(): void {
    this.showConfirmDelete.set(false);
    this.confirmTaskId.set(null);
    this.confirmTaskName.set('');
  }

  /**
   * Confirms and executes the deletion of a job.
   */
  executeDelete(): void {
    const taskId = this.confirmTaskId();
    if (taskId === null) {
      return;
    }

    this.showConfirmDelete.set(false);
    const progressId = this.notificationService.showProgress('notification.delete.progress');

    this.clusterService.deleteJob(this.nodeId(), taskId).subscribe({
      next: () => {
        this.notificationService.updateToSuccess(progressId, 'notification.delete.success');
        this.confirmTaskId.set(null);
        this.confirmTaskName.set('');
        this.loadJobs();
      },
      error: () => {
        this.notificationService.updateToError(progressId, 'notification.delete.error');
        this.confirmTaskId.set(null);
        this.confirmTaskName.set('');
      },
    });
  }
}
