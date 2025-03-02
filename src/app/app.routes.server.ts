import { RenderMode, ServerRoute } from '@angular/ssr';
import { readFileSync } from 'fs';
import { join } from 'path';

export function getPrerenderParams(): Record<string, string[]> {
  try {
    const filePath = join(process.cwd(), 'src/assets/products.txt');
    const productIds = readFileSync(filePath, 'utf-8').split('\n').map(id => id.trim()).filter(Boolean);
    return { id: productIds };
  } catch (error) {
    console.error('Error reading products.txt:', error);
    return { id: [] };
  }
}

export const serverRoutes: ServerRoute[] = [
  {
    path: 'product/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'orderConfirmation/:id',
    renderMode: RenderMode.Client // Disable prerendering for orderConfirmation
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender // Keep prerendering for all other routes
  }
];
