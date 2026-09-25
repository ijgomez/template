import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideRouter } from '@angular/router';
import { expect, within } from 'storybook/test';

import { NotFoundComponent } from './not-found.component';

/**
 * Página 404 (no encontrada). Muestra el código de error y un enlace para
 * volver al dashboard.
 */
const meta: Meta<NotFoundComponent> = {
  title: 'Features/NotFound',
  component: NotFoundComponent,
  tags: ['autodocs'],
  decorators: [
    // El componente usa routerLink, por lo que necesita un Router configurado.
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
};

export default meta;
type Story = StoryObj<NotFoundComponent>;

/**
 * Estado por defecto: código 404, mensaje y enlace al dashboard.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('404')).toBeInTheDocument();
    const link = canvas.getByTestId('link-go-dashboard');
    await expect(link).toBeInTheDocument();
    // RouterLink genera un href absoluto en el navegador; basta comprobar la ruta.
    await expect(link.getAttribute('href')).toMatch(/\/dashboard$/);
  },
};
