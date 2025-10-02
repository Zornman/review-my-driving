import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormatPhoneDirective } from '../../shared/directives/format-phone.directive';

@Component({
  selector: 'app-business-functions',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatProgressSpinnerModule,
    FormatPhoneDirective
  ],
  templateUrl: './business-functions.component.html',
  styleUrl: './business-functions.component.scss'
})
export class BusinessFunctionsComponent implements OnInit, OnChanges {
  @Input() businessUserInfo: any | null = null;
  isLoading: boolean = false;

  businessUserForm!: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.businessUserForm = this.fb.group({
      userId: [{ value: this.businessUserInfo.userId, disabled: true }],
      businessName: [{ value: this.businessUserInfo.businessName, disabled: false }, [Validators.required]],
      contactEmail: [{ value: this.businessUserInfo.contactEmail, disabled: false}, [Validators.required]],
      contactPhone: [{ value: this.businessUserInfo.phoneNumber, disabled: false}, [Validators.required]],
      notifyOnNewReview: [{ value: this.businessUserInfo.settings.notifyOnNewReview, disabled: false }, [Validators.required]],
      dailySummaryEmail: [{ value: this.businessUserInfo.settings.dailySummaryEmail, disabled: false }, [Validators.required]],
      updatedAt: [{ value: this.businessUserInfo.updatedAt, disabled: true }],
      createdAt: [{ value: this.businessUserInfo.createdAt, disabled: true }]
    });
  }

  ngOnChanges(): void {
    console.log('Business User Info:', this.businessUserInfo);
  }

  onSubmit() {
    if (this.businessUserForm.valid) {
      this.isLoading = true;
      const updatedData = this.businessUserForm.getRawValue();
      console.log('Updated Business User Data:', updatedData);
    }
  }
}
