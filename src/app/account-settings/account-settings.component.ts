import { Component, inject } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { User } from 'firebase/auth';
import { AuthService } from '../services/auth.service';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '../shared/modals/message-dialog/message-dialog.component';
import { MongoService } from '../services/mongo.service';

@Component({
  selector: 'app-account-settings',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss'
})
export class AccountSettingsComponent {
  private _snackBar = inject(MatSnackBar);
  user!: User | null;
  messageForm!: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private dialog: MatDialog, private dbService: MongoService) {
    this.authService.getUser().subscribe(user => {
      this.user = user;
      this.getSettings();
    });

    this.messageForm = this.fb.group({
          type: [''],
          message: ['']
    });
  }

  previewMessage() {
    const type = this.messageForm.get('type')?.value;
    const message = this.messageForm.get('message')?.value;

    if (type === 'popup') {
      this.showConfirmationDialog(message);
    } else if (type === 'snackbar') {
      this._snackBar.open(message, 'Ok', { duration: 3000 });
    } else if (type === 'alert') {
      alert(message);
    }
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

  getSettings() {
    if (!this.user?.uid) return;

    this.dbService.getUserSettings(this.user.uid).subscribe({
      next: (settings: any) => {
        this.messageForm.get('type')?.setValue(settings.result.messageStyle);
        this.messageForm.get('message')?.setValue(settings.result.messageBody);
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

  saveSettings() {
    const data = {
      userID: this.user?.uid,
      messageStyle: this.messageForm.get('type')?.value,
      messageBody: this.messageForm.get('message')?.value
    };
    const message = 'Settings saved successfully!';

    this.dbService.insertUserSettings(JSON.stringify(data)).subscribe({
      next: (response: any) => {
        if (data.messageStyle === 'popup') {
          this.showConfirmationDialog(message);
        } else if (data.messageStyle === 'snackbar') {
          this._snackBar.open(message, 'Ok', { duration: 3000 });
        } else if (data.messageStyle === 'alert') {
          alert(message);
        }
      },
      error: (error: any) => {
        this._snackBar.open('Error submitting form, try again.', 'Close');
        this.dbService.insertErrorLog(JSON.stringify({
          fileName: 'account-settings.component.ts',
          method: 'saveSettings()',
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
    })
  }
}
