import { __decorate, __param } from "tslib";
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
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
let AuthService = class AuthService {
    platformId;
    router;
    auth = getAuth(app);
    userSubject = new BehaviorSubject(null);
    user$ = this.userSubject.asObservable(); // Expose as observable
    constructor(platformId, router) {
        this.platformId = platformId;
        this.router = router;
        // Ensure Firebase Auth state is set correctly before emitting
        onAuthStateChanged(this.auth, (user) => {
            //console.log('AuthService: User state updated:', user);
            this.userSubject.next(user);
        });
    }
    googleSignIn() {
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
    signOut() {
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
    signUpWithEmail(email, password, displayName) {
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
    signInWithEmail(email, password) {
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
    getUser() {
        return this.user$;
    }
};
AuthService = __decorate([
    Injectable({
        providedIn: 'root',
    }),
    __param(0, Inject(PLATFORM_ID))
], AuthService);
export { AuthService };
