import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RandomizeInputDirective } from '../shared/directives/randomize-input.directive';
import { MatSnackBar } from '@angular/material/snack-bar';
import { US_STATES } from '../shared/classes/states';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-home',
  imports: [ RandomizeInputDirective, CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, MatTooltipModule, HttpClientModule ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private _snackBar = inject(MatSnackBar);
  states = US_STATES; // Load the array of states

  formData = {
    firstName: '',
    lastName: '',
    // email: '',
    state: '',
    licensePlate: '',
    reasonForContacting: '',
    description: ''
  };

  constructor(private http: HttpClient) { }

  submit(form: NgForm) {
    
    this.http
      .post('/.netlify/functions/sendEmail', this.formData)
      .subscribe({
        next: (response: any) => {
          console.log('Form submission successful:', response);
          this.openSnackBar('Congratulations on being an asshole!', 'Close');
          this.resetForm(form);
        },
        error: (error) => {
          console.error('Error submitting form:', error);
          this.openSnackBar('Error submitting form, try again.', 'Close');
        },
      });
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }

  resetForm(form: NgForm) {
    form.resetForm(); // Reset the Angular form state
    this.formData = {
      firstName: '',
      lastName: '',
      state: '',
      licensePlate: '',
      reasonForContacting: '',
      description: '',
    };
  }
}