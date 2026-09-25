import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { signal } from '@angular/core';
import { expect, within } from 'storybook/test';

import { OfflineBannerComponent } from './offline-banner.component';
import { ConnectivityService } from '../../services/connectivity.service';

/**
 * Banner que avisa de que la aplicación ha perdido la conexión de red.
 * Su visibilidad depende de la señal `isOnline` de `ConnectivityService`.
 */
const meta: Meta<OfflineBannerComponent> = {
  title: 'Core/OfflineBanner',
  component: OfflineBannerComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<OfflineBannerComponent>;

/**
 * Sin conexión: el banner es visible.
 */
export const Offline: Story = {
  decorators: [
    applicationConfig({
      providers: [{ provide: ConnectivityService, useValue: { isOnline: signal(false) } }],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('offline-banner')).toBeInTheDocument();
  },
};

/**
 * Con conexión: el banner permanece oculto.
 */
export const Online: Story = {
  decorators: [
    applicationConfig({
      providers: [{ provide: ConnectivityService, useValue: { isOnline: signal(true) } }],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId('offline-banner')).not.toBeInTheDocument();
  },
};
