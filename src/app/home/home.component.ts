import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  imports: [ FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  reasonForContacting!: string;

  constructor() { }

  onFocusEvent($event: any) {
    if (this.performAction(3)) {
      
    }
  }

  // Rolls based on chance number and returns boolean
  performAction(chance: number): boolean {
    if (chance <= 0) {
      return false; // No chance of success
    }
    if (chance >= 1 && chance % 1 === 0) {
      return Math.random() < 1 / chance;
    } else {
      throw Error("Integer values only")
    }
  }
}
