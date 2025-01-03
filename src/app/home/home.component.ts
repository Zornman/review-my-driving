import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RandomizeInputDirective } from '../shared/directives/randomize-input.directive';
import { MatSnackBar } from '@angular/material/snack-bar';
import { US_STATES } from '../shared/classes/states';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [ RandomizeInputDirective, CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, MatTooltipModule ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private _snackBar = inject(MatSnackBar);
  states = US_STATES; // Load the array of states

  formData = {
    firstName: '',
    lastName: '',
    email: '',
    state: '',
    licensePlate: '',
    reasonForContacting: '',
    description: ''
  };

  constructor() { }

  submit() {
    console.log(this.formData);
    this.openSnackBar('Congratulations on being an asshole!', 'Close');
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }
}