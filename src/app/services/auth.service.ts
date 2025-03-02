import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';

const firebaseConfig = {
    apiKey: "AIzaSyD4_-XfMZSfXrYQJ92Z3Rx22bMSRMofL40",
    authDomain: "review-my-driving.firebaseapp.com",
    projectId: "review-my-driving",
    storageBucket: "review-my-driving.firebasestorage.app",
    messagingSenderId: "1012437740422",
    appId: "1:1012437740422:web:36737aa05fff20e1b79a07",
    measurementId: "G-590DHD4Z5N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = getAuth(app);
  private userSubject = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSubject.asObservable(); // Expose as observable

  constructor(@Inject(PLATFORM_ID) private platformId: any, private router: Router) {
    // Ensure Firebase Auth state is set correctly before emitting
    onAuthStateChanged(this.auth, (user) => {
      //console.log('AuthService: User state updated:', user);
      this.userSubject.next(user);
    });
  }

  googleSignIn(): Promise<void> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider)
      .then((result) => {
        //console.log('User signed in:', result.user);
        this.userSubject.next(result.user); // 🔥 Update state immediately after login
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('userToken', result.user.uid);
        }
      })
      .catch((error) => {
        console.error('Error during sign-in:', error);
      });
  }

  signOut(): Promise<void> {
    return signOut(this.auth)
      .then(() => {
        this.userSubject.next(null); // 🔥 Ensure state updates immediately after logout
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('userToken');
        }
        this.router.navigateByUrl('/login');
      })
      .catch((error) => {
        console.error('Error during sign-out:', error);
      });
  }

  // Email/Password Sign-Up
  signUpWithEmail(email: string, password: string, displayName: string): Promise<void> {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        return updateProfile(user, { displayName }).then(() => {
          this.userSubject.next(user); // 🔥 Update user state
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('userToken', user.uid);
          }
        });
      })
      .catch((error) => {
        console.error('Email/Password registration failed:', error);
        throw error;
      });
  }

  signInWithEmail(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        this.userSubject.next(user); // 🔥 Update state immediately after login
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('userToken', user.uid);
        }
      })
      .catch((error) => {
        console.error('Email/Password login failed:', error);
        throw error;
      });
  }

  getUser(): Observable<User | null> {
    return this.user$;
  }
}