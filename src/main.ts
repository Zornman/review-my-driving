import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyD4_-XfMZSfXrYQJ92Z3Rx22bMSRMofL40",
  authDomain: "review-my-driving.firebaseapp.com",
  projectId: "review-my-driving",
  storageBucket: "review-my-driving.firebasestorage.app",
  messagingSenderId: "1012437740422",
  appId: "1:1012437740422:web:36737aa05fff20e1b79a07",
  measurementId: "G-590DHD4Z5N"
};

initializeApp(firebaseConfig);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
