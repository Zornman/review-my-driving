import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MongoService } from './mongo.service';

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

  private isBusinessUserSubject = new BehaviorSubject<boolean | null>(null);
  isBusinessUser$: Observable<boolean | null> = this.isBusinessUserSubject.asObservable();

  private businessUserInfoSubject = new BehaviorSubject<any | null>(null);
  businessUserInfo$: Observable<any | null> = this.businessUserInfoSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private router: Router,
    private mongoService: MongoService
  ) {
    // Ensure Firebase Auth state is set correctly before emitting
    onAuthStateChanged(this.auth, (user) => {
      //console.log('AuthService: User state updated:', user);
      this.userSubject.next(user);

      if (!user) {
        this.isBusinessUserSubject.next(false);
        this.businessUserInfoSubject.next(null);
        return;
      }

      // Best-effort cached value to avoid UI flicker
      const cached = this.getCachedIsBusinessUser(user.uid);
      if (cached !== null) {
        this.isBusinessUserSubject.next(cached);
      } else {
        this.isBusinessUserSubject.next(null);
      }

      // Refresh in background (source of truth)
      void this.refreshBusinessUserFlag(user.uid);
    });
  }

  private businessUserCacheKey(userId: string): string {
    return `isBusinessUser:${userId}`;
  }

  private getCachedIsBusinessUser(userId: string): boolean | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const raw = localStorage.getItem(this.businessUserCacheKey(userId));
    if (raw === '1') return true;
    if (raw === '0') return false;
    return null;
  }

  private setCachedIsBusinessUser(userId: string, value: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.businessUserCacheKey(userId), value ? '1' : '0');
  }

  async refreshBusinessUserFlag(userId?: string): Promise<boolean> {
    const effectiveUserId = userId ?? this.userSubject.value?.uid;
    if (!effectiveUserId) {
      this.isBusinessUserSubject.next(false);
      this.businessUserInfoSubject.next(null);
      return false;
    }

    const response = await firstValueFrom(
      this.mongoService.getBusinessUserInfo(effectiveUserId).pipe(
        catchError((error) => {
          console.error('Error checking business user status:', error);
          return of(null);
        })
      )
    );

    const isBusinessUser = !!(response as any)?.result;
    this.isBusinessUserSubject.next(isBusinessUser);
    this.businessUserInfoSubject.next(isBusinessUser ? (response as any).result : null);
    this.setCachedIsBusinessUser(effectiveUserId, isBusinessUser);
    return isBusinessUser;
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

        void this.refreshBusinessUserFlag(result.user.uid);
      })
      .catch((error) => {
        console.error('Error during sign-in:', error);
      });
  }

  signOut(): Promise<void> {
    return signOut(this.auth)
      .then(() => {
        this.userSubject.next(null); // 🔥 Ensure state updates immediately after logout
        this.isBusinessUserSubject.next(false);
        this.businessUserInfoSubject.next(null);
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

          void this.refreshBusinessUserFlag(user.uid);
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

        void this.refreshBusinessUserFlag(user.uid);
      })
      .catch((error) => {
        console.error('Email/Password login failed:', error);
        throw error;
      });
  }

  getUser(): Observable<User | null> {
    return this.user$;
  }

  getIsBusinessUser(): Observable<boolean | null> {
    return this.isBusinessUser$;
  }

  getBusinessUserInfo(): Observable<any | null> {
    return this.businessUserInfo$;
  }

  sendPasswordResetEmail(email: string): Promise<void> {
    const auth = getAuth();

    return sendPasswordResetEmail(auth, email)
    .then(() => {
      // ✅ Password reset email sent
      console.log('Password reset email sent.');
    })
    .catch((error) => {
      console.error('Error sending password reset email:', error);
    })
  }
}