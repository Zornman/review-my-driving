import { renderApplication } from '@angular/platform-server';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Load the HTML template (needed for the second argument)
const browserDistPath = join(process.cwd(), 'dist/review-my-driving/browser');
const indexCsrHtmlPath = join(browserDistPath, 'index.csr.html');
const indexHtmlPath = join(browserDistPath, 'index.html');
const document = readFileSync(existsSync(indexCsrHtmlPath) ? indexCsrHtmlPath : indexHtmlPath, 'utf8');

// Correctly export `render()` as a named function (not default)
export function render(url: string): Promise<string> {
  return renderApplication(() => bootstrapApplication(AppComponent, config), { document, url });
}

export default render;