import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '@firebase/auth';
import { AuthService } from '../../services/auth.service';
import { MongoService } from '../../services/mongo.service';
import { COUNTRIES } from '../../shared/classes/countries';
import { US_STATES } from '../../shared/classes/states';
import { FormatPhoneDirective } from '../../shared/directives/format-phone.directive';

@Component({
  selector: 'app-shipping-information',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    FormatPhoneDirective,
  ],
  templateUrl: './shipping-information.component.html',
  styleUrl: './shipping-information.component.scss'
})
export class ShippingInformationComponent {

  private _snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  shippingInfoForm: FormGroup;
  user: User | null = null;

  countries = COUNTRIES;
  states = US_STATES;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private dbService: MongoService,
  ) {
    this.shippingInfoForm = this.fb.group({
      userID: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      smsOptIn: [false],
      firstName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      address1: ['', Validators.required],
      address2: [''],
      country: ['', Validators.required],
      city: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      region: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      zip: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    });

    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.user = user;
        if (this.user) {
          this.loadShippingInfo();
        }
      });
  }

  saveShippingInfo() {
    if (!this.shippingInfoForm.valid) return;

    if (!this.user) {
      this._snackBar.open('user not found.', 'Ok', { duration: 3000 });
      return;
    }

    this._snackBar.open('Saving shipping information...');
    this.shippingInfoForm.get('userID')?.setValue(this.user.uid);

    const cleanedData = JSON.parse(JSON.stringify(this.shippingInfoForm.value));

    this.dbService.insertUserShippingInfo(cleanedData).subscribe({
      next: () => {
        this._snackBar.open('Saved shipping information!', 'Ok', { duration: 3000 });
      },
      error: (error) => {
        this._snackBar.open('Error saving shipping information. Please try again.', 'Ok', { duration: 3000 });
        this.dbService.insertErrorLog(JSON.stringify({
          fileName: 'shipping-information.component.ts',
          method: 'saveShippingInfo()',
          timestamp: new Date().toString(),
          error: error
        })).subscribe({
          next: (response: any) => {
            console.log(response);
          },
          error: () => {
          }
        });
      },
    });

    this._snackBar.dismiss();
  }

  loadShippingInfo() {
    if (!this.user) return;

    this.shippingInfoForm.get('userID')?.setValue(this.user.uid);

    this.dbService.getUserShippingInfo(this.user.uid).subscribe({
      next: (response: any) => {
        if (response.result) {
          this.shippingInfoForm.get('firstName')?.setValue(response.result.firstName);
          this.shippingInfoForm.get('lastName')?.setValue(response.result.lastName);
          this.shippingInfoForm.get('address1')?.setValue(response.result.address1);
          this.shippingInfoForm.get('address2')?.setValue(response.result.address2);
          this.shippingInfoForm.get('city')?.setValue(response.result.city);
          this.shippingInfoForm.get('zip')?.setValue(response.result.zip);
          this.shippingInfoForm.get('region')?.setValue(response.result.region);
          this.shippingInfoForm.get('country')?.setValue(response.result.country);
          this.shippingInfoForm.get('email')?.setValue(response.result.email);
          this.shippingInfoForm.get('phone')?.setValue(response.result.phone);
          this.shippingInfoForm.get('smsOptIn')?.setValue(!!response.result.smsOptIn);
        } else {
        }
      },
      error: (error) => {
        this._snackBar.open('Error loading shipping information. Please try again.', 'Ok', { duration: 3000 });
        this.dbService.insertErrorLog(JSON.stringify({
          fileName: 'shipping-information.component.ts',
          method: 'loadShippingInfo()',
          timestamp: new Date().toString(),
          error: error
        })).subscribe({
          next: (response: any) => {
            console.log(response);
          },
          error: () => {
          }
        });
      }
    });
  }

}
