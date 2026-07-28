import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaUpdateComponent } from './core/components/pwa-update/pwa-update.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaUpdateComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
