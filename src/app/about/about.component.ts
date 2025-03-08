import { Component } from '@angular/core';
import { BackgroundService } from '../services/background.service';
import { AuthService } from '../services/auth.service';
import { User } from 'firebase/auth';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-about',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {

  user!: User | null;
  isAdmin: boolean = false;

  constructor(private authService: AuthService, private bgService: BackgroundService) {
    this.authService.getUser().subscribe((user) => {
      if (!user) return;

      this.user = user;

      if (this.user?.uid === environment.adminUserId) 
        this.isAdmin = true;
    });
  }

  updateOrderDetails() {
    this.bgService.updateOrderDetails().subscribe({
      next: (data: any) => {
        console.log(data);
      },
      error: (error: any) => {
        console.error(error);
      }
    })
  }
}
