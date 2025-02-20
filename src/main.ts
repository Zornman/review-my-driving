import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { getApps, initializeApp } from 'firebase/app';

function fetchConfig(): Promise<any> {
  return fetch('/.netlify/functions/getEnvironmentVariables')
    .then(response => response.json())
    .then(config => {
      return config.FIREBASE_SERVICE_ACCOUNT;
    })
    .catch(error => {
      console.error('Error loading Netlify config:', error);
      return null;
    });
}

fetchConfig().then(firebaseConfig => {
  if (firebaseConfig) {
    if (!getApps().length) {
      initializeApp(firebaseConfig);
    } else {
      console.warn("Firebase app already initialized, skipping re-initialization.");
    }
  } else {
    console.error("Failed to fetch config.");
  }

  bootstrapApplication(AppComponent, appConfig)
    .catch(err => console.error(err));
});