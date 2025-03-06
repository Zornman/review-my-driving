import { Component } from '@angular/core';
import { BackgroundService } from '../services/background.service';
import { AuthService } from '../services/auth.service';
import { User } from 'firebase/auth';
import { VariablesService } from '../services/variables.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

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

  constructor(private authService: AuthService, private bgService: BackgroundService, private env: VariablesService) {
    this.authService.getUser().subscribe((user) => {
      if (!user) return;

      this.user = user;

      this.env.getEnvironmentVariables().subscribe({
        next: (variables) => {
          if (this.user?.uid === variables.ADMIN_USER_ID) this.isAdmin = true;
        }
      });
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
