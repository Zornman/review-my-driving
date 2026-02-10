import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmailService } from '../services/email.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule, 
    MatSelectModule, 
    MatInputModule, 
    MatButtonModule, 
    MatTooltipModule,
    MatIconModule,
    MatProgressSpinnerModule, 
    HttpClientModule
  ],
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private emailService: EmailService
  ) {}

  ngOnInit(): void {
    // Scroll to top when component initializes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      reasonForContacting: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  sendFeedback(): void {
    // Mark all fields as touched to show validation errors
    Object.keys(this.contactForm.controls).forEach(key => {
      this.contactForm.get(key)?.markAsTouched();
    });

    if (this.contactForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formData = this.contactForm.value;

      this.emailService.sendContactEmail(formData).subscribe({
        next: (response) => {
          this.snackBar.open('Thank you for contacting us! We\'ll get back to you soon.', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            panelClass: ['success-snackbar']
          });
          
          this.contactForm.reset();
          Object.keys(this.contactForm.controls).forEach(key => {
            this.contactForm.get(key)?.setErrors(null);
            this.contactForm.get(key)?.markAsUntouched();
            this.contactForm.get(key)?.markAsPristine();
          });
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error sending contact email:', error);
          this.snackBar.open('Sorry, there was an error sending your message. Please try again.', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
        }
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.contactForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('pattern')) {
      return `Please enter a valid ${this.getFieldLabel(fieldName).toLowerCase()}`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} cannot exceed ${control.errors?.['maxlength'].requiredLength} characters`;
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      firstName: 'First Name',
      lastName: 'Last Name',
      reasonForContacting: 'Reason',
      description: 'Description'
    };
    return labels[fieldName] || fieldName;
  }
}
