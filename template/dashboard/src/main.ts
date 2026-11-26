// Bootstrap JS: only Dropdown is used (data-bs-toggle="dropdown" in the layout).
// Importing the module registers its data-API; avoids shipping the full bundle.
import 'bootstrap/js/src/dropdown.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

try {
  await bootstrapApplication(App, appConfig);
} catch (err) {
  console.error(err);
}
