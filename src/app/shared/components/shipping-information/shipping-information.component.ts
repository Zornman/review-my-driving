import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { MongoService } from '../../../services/mongo.service';
import { Router } from 'express';
import { User } from 'firebase/auth';
import { US_STATES } from '../../classes/states';
import { COUNTRIES } from '../../classes/countries';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-shipping-information',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './shipping-information.component.html',
  styleUrl: './shipping-information.component.scss'
})
export class ShippingInformationComponent {
  shippingInfoForm!: FormGroup;
  user!: User | null;

  states = US_STATES; // Load the array of states
  countries = COUNTRIES; // Load the array of countries

  constructor (private authService: AuthService, private fb: FormBuilder, private cdr: ChangeDetectorRef, private dbService: MongoService, private router: Router) {
    this.shippingInfoForm = this.fb.group({
      userID: [''],
      firstName: [''],
      lastName: [''],
      address1: [''],
      address2: [''],
      city: [''],
      zip: [''],
      region: [''],
      country: [''],
      phone: [''],
      email: ['', [Validators.email]]
    });

    this.authService.getUser().subscribe(user => {
      this.user = user;
      this.load();
    })
  }

  load() {
    if (this.user) {
      this.dbService.getUserShippingInfo(this.user?.uid).subscribe({
        next: (response: any) => {
          if (response.result) {
            this.shippingInfoForm.get('userID')?.setValue(this.user?.uid);
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
          }
        },
        error: (error) => {
          this.dbService.insertErrorLog({
            fileName: 'shipping-information.component.ts',
            method: 'load()',
            timestamp: new Date().toString(),
            error: error
          }).subscribe({
            next: (response: any) => {
                console.log(response);
            },
            error: (error: any) => {
            }
          });
        }
      });
    }
  }

  save() {
    this.dbService.insertUserShippingInfo(this.shippingInfoForm.value).subscribe({
      next: (response: any) => {

      },
      error: (error) => {
        this.dbService.insertErrorLog({
          fileName: 'shipping-information.component.ts',
          method: 'save()',
          timestamp: new Date().toString(),
          error: error
        }).subscribe({
          next: (response: any) => {
              console.log(response);
          },
          error: (error: any) => {
          }
        });
      },
    });
  }
}
