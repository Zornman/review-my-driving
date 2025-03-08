import { ngExpressEngine } from '@nguniversal/express-engine';
import { provideServerRendering } from '@angular/platform-server';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

export default async function bootstrap() {
    return bootstrapApplication(AppComponent, {
        ...appConfig,
        providers: [provideServerRendering()]
    });
}
