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
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MongoService } from '../services/mongo.service';
import { EmailService } from '../services/email.service';
import { FirebaseService } from '../services/firebase.service';
import { MessageDialogComponent } from '../shared/modals/message-dialog/message-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  imports: [ RandomizeInputDirective, CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, MatTooltipModule, HttpClientModule ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private _snackBar = inject(MatSnackBar);
  states = US_STATES; // Load the array of states
  ngForm!: NgForm;
  user_id!: string | null;
  user_email!: string | null;
  user_settings!: any | null;
  date!: () => string;
  isProcessing: boolean = false;
  isQuickMode: boolean = true; // Flag to toggle quick mode

  formData = {
    user_id: this.user_id,
    firstName: '',
    lastName: '',
    state: '',
    licensePlate: '',
    reasonForContacting: '',
    description: '',
    dateSubmitted: '',
    emailTo: this.user_email
  };

  constructor(
    private route: ActivatedRoute, 
    private dbService: MongoService, 
    private emailService: EmailService,
    private firebaseService: FirebaseService,
    private dialog: MatDialog
  ) 
  { 
    this.date = () => {
      const now = new Date();
    
      const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed, so add 1
      const day = now.getDate().toString().padStart(2, '0'); // Get day and pad if needed
      const year = now.getFullYear(); // Get full year
      const hour = now.getUTCHours();
      const min = now.getUTCMinutes();
      const sec = now.getUTCSeconds();
    
      return `${month}/${day}/${year} ${hour}:${min}:${sec}`;
    };
  }

  async ngOnInit(): Promise<void> {
    // Extract the 'id' query parameter
    this.route.queryParamMap.subscribe(async params => {
      this.user_id = params.get('id'); // Get the value of 'id'

      if (this.user_id) {
        await this.getUserEmail();
        this.getUserSettings();
      }
    });
  }

  async getUserEmail() {
    if (!this.user_id) return;

    await this.firebaseService.getUserByUID(this.user_id).subscribe({
      next: (response: any) => {
        this.formData.user_id = this.user_id;
        this.user_email = response.email;
        this.formData.emailTo = response.email;
        //console.log(this.formData);
      },
      error: (error) => {
        this.dbService.insertErrorLog(JSON.stringify({
          fileName: 'home.component.ts',
          method: 'getUserEmail()',
          timestamp: new Date().toString(),
          error: error
        })).subscribe({
          next: (response: any) => {
              console.log(response);
          },
          error: (error: any) => {
          }
        });
      },
    });
  }

  getUserSettings() {
    if (!this.user_id) return;

    this.dbService.getUserSettings(this.user_id).subscribe({
      next: (settings: any) => {
        this.user_settings = settings.result;
      },
      error: (error: any) => {
        this.dbService.insertErrorLog(JSON.stringify({
          fileName: 'home.component.ts',
          method: 'getUserSettings()',
          timestamp: new Date().toString(),
          error: error
        })).subscribe({
          next: (response: any) => {
              console.log(response);
          },
          error: (error: any) => {
          }
        });
      }
    });
  }

  async submit(form: NgForm) {
    this.isProcessing = true;
    this.ngForm = form;
    await this.insertSubmission();
    await this.sendEmailNotification();
  }

  async submitQuickReview(reasonForContacting: string) {
    this.isProcessing = true;
    this._snackBar.open('Submitting your quick review...', 'Close');
    // Set the form data with the quick review values
    this.formData.reasonForContacting = reasonForContacting;
    this.formData.description = reasonForContacting; // Use the reason as the description
    this.formData.firstName = 'Anonymous';
    this.formData.lastName = 'User';

    await this.insertSubmission();
    await this.sendEmailNotification(true);
  }

  openConfirmMessage() {
    const style = this.user_settings?.messageStyle;
    const msg = this.user_settings?.messageBody;

    if (!style || !msg) {
      this.showConfirmationDialog('Thank you for your submission!');
      return;
    }

    if (style === 'alert') {
      alert(msg);
    } else if (style === 'popup') {
      this.showConfirmationDialog(msg);
    } else if (style === 'snackbar') {
      this._snackBar.open(msg, 'Close');
    } else {
      this.showConfirmationDialog('Thank you for your submission!');
    }
  }

  async sendEmailNotification(isQuickMode: boolean = false) {
    this.emailService.sendSubmissionEmail(JSON.stringify(this.formData)).subscribe({
      next: (response: any) => {
        this.openConfirmMessage();
        this.resetForm();
        this.isProcessing = false;

        if (isQuickMode) {
          this._snackBar.open('Quick review submitted successfully!', 'Close', {
            duration: 3000
          });
        } else {
          this._snackBar.open('Form submitted successfully!', 'Close', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        this._snackBar.open('Error submitting form, try again.', 'Close');
        this.isProcessing = false;
        this.dbService.insertErrorLog(JSON.stringify({
          fileName: 'home.component.ts',
          method: 'sendEmailNotification()',
          timestamp: new Date().toString(),
          error: error
        })).subscribe({
          next: (response: any) => {
              console.log(response);
          },
          error: (error: any) => {
          }
        });
      },
    });
  }

  async insertSubmission() {
    this.formData.user_id = this.user_id;
    this.formData.dateSubmitted = this.date();
    this.dbService.insertSubmission(JSON.stringify(this.formData)).subscribe({
      next: (response: any) => {

      },
      error: (error) => {
        this._snackBar.open('Error submitting form, try again.', 'Close');
        this.isProcessing = false;
        this.dbService.insertErrorLog(JSON.stringify({
          fileName: 'home.component.ts',
          method: 'insertSubmission()',
          timestamp: new Date().toString(),
          error: error
        })).subscribe({
          next: (response: any) => {
              console.log(response);
          },
          error: (error: any) => {
          }
        });
      },
    });
  }

  showConfirmationDialog(msg: string) {
    return this.dialog.open(MessageDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        message: msg
      }
    });
  }

  resetForm() {
    if (this.ngForm) this.ngForm.resetForm(); // Reset the Angular form state
    this.formData = {
      user_id: this.user_id,
      firstName: '',
      lastName: '',
      state: '',
      licensePlate: '',
      reasonForContacting: '',
      description: '',
      dateSubmitted: new Date().getDate().toString(),
      emailTo: this.user_email
    };
  }
}