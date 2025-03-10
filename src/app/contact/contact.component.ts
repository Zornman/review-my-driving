import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmailService } from '../services/email.service';
import { MessageDialogComponent } from '../shared/modals/message-dialog/message-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MongoService } from '../services/mongo.service';

@Component({
  selector: 'app-contact',
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule, 
    MatSelectModule, 
    MatInputModule, 
    MatButtonModule, 
    MatTooltipModule, 
    HttpClientModule
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {

  contactForm!: FormGroup;
  date!: () => string;

  constructor(private fb: FormBuilder, private emailService: EmailService, private dialog: MatDialog, private errorService: MongoService) {
    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      reasonForContacting: ['', Validators.required],
      description: ['', Validators.required],
      dateSubmitted: ['']
    });

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

  sendFeedback() {
    if (!this.contactForm.valid) return;

    this.contactForm.get('dateSubmitted')?.setValue(this.date());
    this.emailService.sendContactEmail(JSON.stringify(this.contactForm.value)).subscribe({
      next: (data: any) => {
        this.contactForm.reset();
        this.showConfirmationDialog('Thank you for contacting us, we will do our best to get back to you within 24 hours via email. Have a wonderful day!')
      },
      error: (error: any) => {
        this.errorService.insertErrorLog(JSON.stringify({
          fileName: 'contact.component.ts',
          method: 'sendFeedback()',
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

  showConfirmationDialog(msg: string) {
    return this.dialog.open(MessageDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        message: msg
      }
    });
  }

}
