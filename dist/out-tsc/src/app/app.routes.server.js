import { RenderMode } from '@angular/ssr';
export const serverRoutes = [
    {
        path: 'product/:id',
        renderMode: RenderMode.Client
    },
    {
        path: 'orderConfirmation/:id',
        renderMode: RenderMode.Client
    },
    {
        path: '**',
        renderMode: RenderMode.Client // Keep prerendering for all other routes
    }
];
