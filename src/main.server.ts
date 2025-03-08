import { renderApplication } from '@angular/platform-server';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load the HTML template (needed for the second argument)
const indexHtmlPath = join(process.cwd(), 'dist/review-my-driving/browser/index.html');
const document = readFileSync(indexHtmlPath, 'utf8');

// Correctly export `render()` as a named function (not default)
export function render(url: string): Promise<string> {
  return renderApplication(() => bootstrapApplication(AppComponent, appConfig), { document, url });
}

export default render;