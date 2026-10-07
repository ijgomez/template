import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Injectable, inject } from '@angular/core';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';

import { ConnectivityService } from './connectivity.service';
import { NotificationService } from './notification.service';
import { UserService } from './user.service';
import { UserDTO } from '../models/user.model';

const mockUser: UserDTO = {
  id: 1,
  username: 'demo',
  firstName: 'Demo',
  lastName: 'User',
  email: 'demo@example.com',
  profileId: 2,
  profileName: 'Admin',
  reportIds: [10],
  lastAccess: null,
  createdAt: null,
  lastModifiedAt: null,
};

@Injectable()
class HttpClientStoryMock {
  get(url: string): unknown {
    if (url.endsWith('/count')) return of(7);
    if (url.endsWith('/references')) return of([{ id: 2, name: 'Admin' }]);
    if (url.endsWith('/reports/all')) return of([{ id: 10, name: 'Usage report' }]);
    if (url.match(/\/administration\/security\/users\/\d+$/)) return of(mockUser);
    return of({
      content: [mockUser],
      page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
    });
  }

  post(url: string, body: unknown): unknown {
    if (url.match(/\/administration\/security\/users$/)) return of(body);
    return of({
      content: [mockUser],
      page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
    });
  }

  put(_url: string, body: unknown): unknown {
    return of(body);
  }

  delete(): unknown {
    return of(undefined);
  }
}

@Component({
  selector: 'tp-user-service-coverage-harness',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" data-testid="run-user-service" (click)="run()">Run user service</button>
    <span data-testid="user-service-count">{{ calls }}</span>
  `,
})
class UserServiceCoverageHarnessComponent {
  private readonly userService = inject(UserService);

  calls = 0;

  run(): void {
    const criteria = {
      username: 'demo',
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      profileId: 2,
    };

    this.userService.findByCriteria({}, 0, 10).subscribe(() => this.calls++);
    this.userService.findByCriteria(criteria, 1, 20, 'username,asc').subscribe(() => this.calls++);
    this.userService.findAllByCriteria(criteria, 'username,desc').subscribe(() => this.calls++);
    this.userService.countByCriteria(criteria).subscribe(() => this.calls++);
    this.userService.findById(1).subscribe(() => this.calls++);
    this.userService.create(mockUser).subscribe(() => this.calls++);
    this.userService.update(1, mockUser).subscribe(() => this.calls++);
    this.userService.delete(1).subscribe(() => this.calls++);
    this.userService.getProfiles().subscribe(() => this.calls++);
    this.userService.getReports().subscribe(() => this.calls++);
  }
}

@Component({
  selector: 'tp-notification-service-coverage-harness',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" data-testid="run-notification-service" (click)="run()">Run notification service</button>
    <span data-testid="notification-count">{{ count }}</span>
  `,
})
class NotificationServiceCoverageHarnessComponent {
  private readonly notificationService = inject(NotificationService);

  count = 0;

  run(): void {
    const progressId = this.notificationService.showProgress('notification.progress');
    this.notificationService.updateToSuccess(progressId, 'notification.success');

    const progressId2 = this.notificationService.showProgress('notification.progress');
    this.notificationService.updateToError(progressId2, 'notification.error');

    this.notificationService.showSuccess('notification.success');
    this.notificationService.showError('notification.error', 'Backend detail message');

    this.notificationService.dismiss(progressId2);

    this.notificationService.notifications$.subscribe((items) => {
      this.count = items.length;
    });
  }
}

@Component({
  selector: 'tp-connectivity-service-coverage-harness',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" data-testid="run-connectivity-service" (click)="run()">Run connectivity service</button>
    <span data-testid="connectivity-state">{{ connectivityService.isOnline() ? 'online' : 'offline' }}</span>
  `,
})
class ConnectivityServiceCoverageHarnessComponent {
  readonly connectivityService = inject(ConnectivityService);

  run(): void {
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    this.connectivityService.ngOnDestroy();
  }
}

const meta: Meta = {
  title: 'Core/ServicesCoverageHarness',
  decorators: [
    moduleMetadata({
      imports: [
        UserServiceCoverageHarnessComponent,
        NotificationServiceCoverageHarnessComponent,
        ConnectivityServiceCoverageHarnessComponent,
      ],
    }),
    applicationConfig({
      providers: [{ provide: HttpClient, useClass: HttpClientStoryMock }],
    }),
  ],
};

export default meta;

type Story = StoryObj;

export const UserServiceHarness: Story = {
  render: () => ({
    template: '<tp-user-service-coverage-harness />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('run-user-service'));
    await expect(canvas.getByTestId('user-service-count')).toHaveTextContent('10');
  },
};

export const NotificationServiceHarness: Story = {
  render: () => ({
    template: '<tp-notification-service-coverage-harness />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('run-notification-service'));
    await expect(canvas.getByTestId('notification-count')).toBeInTheDocument();
  },
};

export const ConnectivityServiceHarness: Story = {
  render: () => ({
    template: '<tp-connectivity-service-coverage-harness />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('run-connectivity-service'));
    await expect(canvas.getByTestId('connectivity-state')).toHaveTextContent('online');
  },
};
