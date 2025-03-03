import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { getApps, initializeApp } from 'firebase/app';

function fetchConfig(): Promise<any> {
  return fetch('/.netlify/functions/getEnvironmentVariables')
    .then(response => response.json())
    .then(config => {
      return { "type": "service_account", "project_id": "review-my-driving", "private_key_id": config.FIREBASE_SERVICE_PRIVATE_KEY_ID, "private_key": "-----BEGIN PRIVATE KEY-----\\n" + config.FIREBASE_SERVICE_ACCOUNT_KEY + "\\n-----END PRIVATE KEY-----\\n", "client_email": "firebase-adminsdk-9ltlf@review-my-driving.iam.gserviceaccount.com", "client_id": "117338358802601525313", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-9ltlf%40review-my-driving.iam.gserviceaccount.com", "universe_domain": "googleapis.com" };
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