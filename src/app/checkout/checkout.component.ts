import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Attributes, DataItem, Money, ShippingData } from '../shared/models/shippingCosts';
import { AuthService } from '../services/auth.service';
import { User } from 'firebase/auth';
import { CartItem } from '../shared/models/cartItem';
import { CartSummary } from '../shared/models/cartSummary';
import { ShippingInfo } from '../shared/models/shippingInfo';
import { AvailableShippingList } from '../shared/models/availableShippingList';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ShippingCalculatorService } from '../services/shipping_calculator.service';
import { BehaviorSubject, firstValueFrom, map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { FormatPhoneDirective } from '../shared/directives/format-phone.directive';
import { US_STATES } from '../shared/classes/states';
import { COUNTRIES } from '../shared/classes/countries';
import { MatSnackBar } from '@angular/material/snack-bar';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { CartService } from '../services/shopping_cart.service';
import { MongoService } from '../services/mongo.service';
import { StripeService } from '../services/stripe.service';
import { PrintifyService } from '../services/printify.service';
import { MatStepper, MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import {BreakpointObserver} from '@angular/cdk/layout';
import { ThemeService } from '../services/theme.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '../shared/modals/message-dialog/message-dialog.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-checkout',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule, 
    MatCardModule, 
    MatExpansionModule, 
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    HttpClientModule,
    MatSelectModule,
    MatRadioModule,
    FormatPhoneDirective,
    MatStepperModule,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  private _snackBar = inject(MatSnackBar);
  @ViewChild('stepper') stepper!: MatStepper;

  states = US_STATES; // Load the array of states
  countries = COUNTRIES; // Load the array of countries
  cartSummary: CartSummary[] = [];
  user!: User | null;
  totalCartQuantity: number = 0;
  totalCartCost: number = 0;
  shipping_line_items: CartItem[] = [];
  shippingInfoLoaded: boolean = false;
  shippingInformationProcessed: boolean = false;
  shippingInfo!: ShippingInfo;
  shippingInfoForm!: FormGroup;
  allShippingOptions: string[] = [ "economy", "express", "standard", "priority" ];
  availableShippingOptions: AvailableShippingList[] = [];
  selectedShippingOption!: string;
  shippingOptionsForm!: FormGroup;
  shippingCosts: ShippingData[] = [];
  shippingOptionSelected: boolean = false;
  currentStep = 0; // Track active step

  stepperOrientation!: Observable<StepperOrientation>;

  // Stripe properties
  //#region 
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement: StripeCardElement | null = null;
  cardNumber!: any | null;
  cardExpiry!: any | null;
  cardCvc!: any | null;
  cardNumberError: string | null = null;
  cardExpiryError: string | null = null;
  cardCvcError: string | null = null;
  clientSecret: string = '';
  paymentProcessing: boolean = false;
  stripeElementsValid: boolean = false;
  //#endregion

  // Shipping labels
  //#region 
  standard_shipping_enabled: boolean = false;
  shipping_cost_first_standard!: Money;
  shipping_cost_addl_standard!: Money;
  shipping_total_cost_standard: number = 0;
  shipping_from_standard!: number;
  shipping_to_standard!: number;

  priority_shipping_enabled: boolean = false;
  shipping_cost_first_priority!: Money;
  shipping_cost_addl_priority!: Money;
  shipping_total_cost_priority: number = 0;
  shipping_from_priority!: number;
  shipping_to_priority!: number;

  economy_shipping_enabled: boolean = false;
  shipping_cost_first_economy!: Money;
  shipping_cost_addl_economy!: Money;
  shipping_total_cost_economy: number = 0;
  shipping_from_economy!: number;
  shipping_to_economy!: number;

  express_shipping_enabled: boolean = false;
  shipping_cost_first_express!: Money;
  shipping_cost_addl_express!: Money;
  shipping_total_cost_express: number = 0;
  shipping_from_express!: number;
  shipping_to_express!: number;
  //#endregion

  constructor(private router: Router, 
    private authService: AuthService,
    private shippingService: ShippingCalculatorService, 
    private cartService: CartService,
    private dbService: MongoService,
    private paymentService: StripeService,
    private printifyService: PrintifyService,
    private themeService: ThemeService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) 
  {

    this.shippingInfoForm = this.fb.group({
      userID: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      address1: ['', Validators.required],
      address2: [''], // Optional field
      country: ['', Validators.required],
      city: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      region: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]], // State/Province
      zip: ['', [Validators.required, Validators.pattern(/^\d+$/)]], // Only numbers
      infoProcessed: [false]
    });

    this.shippingOptionsForm = this.fb.group({
      shippingOption: ['', [Validators.required]]
    });

    const breakpointObserver = inject(BreakpointObserver);

    this.stepperOrientation = breakpointObserver
      .observe('(min-width: 800px)')
      .pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { cartSummary: CartSummary[] };
    if (state) {
      this.cartSummary = state.cartSummary;
      this.calculateCartTotal();
    }

    this.authService.getUser().subscribe((user) => {
      this.user = user;
      if (user) {
        this.shippingInfoForm.get('userID')?.setValue(user.uid);
        this.loadUserShippingInfo(user.uid);
      } else {
      }
    });
  }

  getPaymentMethodValid(): boolean {
    return this.cardNumber?._complete && this.cardExpiry?._complete && this.cardCvc?._complete;
  }

  async ngOnInit() {
    try {
      this.stripe = await loadStripe(environment.stripePublishableKey);

      if (!this.stripe) {
        console.log('Stripe failed to load.');
        return;
      }

      this.elements = this.stripe.elements();

      const style = {
        base: {
          fontFamily: '"DynaPuff", sans-serif',
          fontSize: '20px', // Larger font size
          color: (this.themeService.getIsDarkMode()) ? '#E0E0E0' : '#121212', // Default text color
          backgroundColor: 'transparent',
          fontWeight: '700',
          '::placeholder': {
            color: '#888'
          }
        },
        invalid: {
          color: '#ff4d4d',
          iconColor: '#ff4d4d'
        }
      };

      // ✅ Create separate Elements
      // this.cardElement = this.elements.create('card', { style });
      this.cardNumber = this.elements.create('cardNumber', { style });
      this.cardExpiry = this.elements.create('cardExpiry', { style });
      this.cardCvc = this.elements.create('cardCvc', { style });

      // ✅ Mount Elements
      // this.cardElement.mount('#card-element');
      this.cardNumber.mount('#card-number-element');
      this.cardExpiry.mount('#card-expiry-element');
      this.cardCvc.mount('#card-cvc-element');

      // ✅ Add real-time validation
      this.cardNumber.on('change', (event: any) => this.handleValidation(event, 'cardNumber'));
      this.cardNumber.on('blur', (event: any) => this.handleValidation(event, 'cardNumber'));

      this.cardExpiry.on('change', (event: any) => this.handleValidation(event, 'cardExpiry'));
      this.cardExpiry.on('blur', (event: any) => this.handleValidation(event, 'cardExpiry'));

      this.cardCvc.on('change', (event: any) => this.handleValidation(event, 'cardCvc'));
      this.cardCvc.on('blur', (event: any) => this.handleValidation(event, 'cardCvc'));
    } catch (error) {
      console.error('Error loading Stripe:', error);
    }
  }

  handleValidation(event: any, field: string) {
    // ✅ Ensure all elements are complete
    this.stripeElementsValid = this.cardNumber._complete && this.cardExpiry._complete && this.cardCvc._complete;
  }

  async fetchClientSecret() {
    //console.log('fetching client secret');
    this.paymentService.fetchClientSecret(JSON.stringify(this.calculateAmountDue() * 100)).subscribe(response => {
      this.clientSecret = response.clientSecret;
    });
  }

  registrationPage() {
    this.router.navigateByUrl('/register');
  }

  loginPage() {
    this.router.navigateByUrl('/login');
  }

  async confirmShippingOption() {
    this.shippingOptionSelected = true;

    await this.fetchClientSecret();
  }

  async handlePayment() {
    if (!this.stripe || !this.cardNumber || !this.clientSecret) {
      console.error('Stripe or Card Element not initialized');
      return;
    }

    this.paymentProcessing = true;
    this._snackBar.open('Processing payment...');

    const { paymentIntent, error } = await this.stripe.confirmCardPayment(this.clientSecret, {
      payment_method: {
        card: this.cardNumber,
        billing_details: {
          name: this.shippingInfoForm.get('firstName')?.value + ' ' + this.shippingInfoForm.get('lastName')?.value,
          email: this.shippingInfoForm.get('email')?.value
        }
      }
    });

    if (error) {
      console.error('Payment failed:', error.message);
      this._snackBar.open('Payment failed. Please try again.', 'Ok', { duration: 3000 });
      this.paymentProcessing = false;
      return;
    }
  
    // ✅ Step 2: Prepare Order Data for Printify
    const orderData = {
      stripeTransactionId: paymentIntent.id, // Use Stripe transaction ID
      customerInfo: {
        firstName: this.shippingInfoForm.get('firstName')?.value,
        lastName: this.shippingInfoForm.get('lastName')?.value,
        email: this.shippingInfoForm.get('email')?.value,
        phone: this.shippingInfoForm.get('phone')?.value,
        country: this.shippingInfoForm.get('country')?.value,
        region: this.shippingInfoForm.get('region')?.value,
        city: this.shippingInfoForm.get('city')?.value,
        address1: this.shippingInfoForm.get('address1')?.value,
        address2: this.shippingInfoForm.get('address2')?.value,
        zip: this.shippingInfoForm.get('zip')?.value
      },
      products: [
        {}
      ],
      shippingMethod: this.mapShippingMethod() // Printify Shipping Method (Update based on user selection)
    };

    orderData.products = [];

    this.cartSummary.forEach((cartItem) => {
      orderData.products.push({
          printifyId: cartItem.productId,
          variantId: cartItem.variantId,
          quantity: cartItem.quantity
      })
    });

    // ✅ Step 3: Call the Printify Order Function
    this.printifyService.createPrintifyOrder(orderData).subscribe({
      next: (response: any) => {
        //console.log('Order sent to Printify:', response);
        this._snackBar.open('Payment successful, order confirmed!', 'Ok', { duration: 3000 });
        this.cartService.clearCart();
        this.router.navigate(['/orderConfirmation', response.orderId]);
      },
      error: (error) => {
        this._snackBar.open('Failed to place order. Please contact support.', 'Ok');
        this.dbService.insertErrorLog(JSON.stringify({
          fileName: 'checkout.component.ts',
          method: 'handlePayment() - printifyService.createPrintifyOrder',
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

  mapShippingMethod() {
    if (this.shippingOptionsForm.get('shippingOption')?.value === 'standard') {
      return 1;
    } else if (this.shippingOptionsForm.get('shippingOption')?.value === 'express') {
      return 3;
    } else if (this.shippingOptionsForm.get('shippingOption')?.value === 'economy') {
      return 4;
    } else if (this.shippingOptionsForm.get('shippingOption')?.value === 'priority') {
      return 2;
    } else {
      return 0;
    }
  }

  calculateCartTotal() {
    this.totalCartCost = 0;
    this.totalCartQuantity = 0;
    this.cartSummary.forEach((cartItem) => {
      this.totalCartCost += cartItem.totalCost;
      this.totalCartQuantity += cartItem.quantity;
    });
  }

  loadUserShippingInfo(token: string) {
    this._snackBar.open('Loading shipping information...');
    this.dbService.getUserShippingInfo(token).subscribe({
      next: (response: any) => {
        if (response.result) {
          this.shippingInfoForm.get('userID')?.setValue(token);
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

          this.shippingInfoLoaded = true;
          this._snackBar.open('Shipping information loaded!', 'Ok', { duration: 3000 });
        } else {
          this._snackBar.open('No shipping information found.', 'Ok', { duration: 3000 });
        }
      },
      error: (error) => {
        this._snackBar.open('Error loading shipping information. Please try again.', 'Ok', { duration: 3000 });
        this.dbService.insertErrorLog(JSON.stringify({
          fileName: 'checkout.component.ts',
          method: 'loadUserShippingInfo()',
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

  saveUserShippingInfo() {
    if (!this.user) {
      this._snackBar.open('user not found.', 'Ok', { duration: 3000 })
      return;
    }

    if (!this.shippingInfoForm.valid) return;

    this._snackBar.open('Saving shipping information...');

    this.shippingInfoForm.get('userID')?.setValue(this.user?.uid);
    
    this.dbService.insertUserShippingInfo(this.shippingInfoForm.value).subscribe({
      next: (response: any) => {
        this.shippingInfoLoaded = true;
        this.getShippingRates();
        this._snackBar.open('Saved shipping information!', 'Ok', { duration: 3000 });
      },
      error: (error) => {
        this._snackBar.open('Error saving shipping information. Please try again.', 'Ok', { duration: 3000 });
        this.dbService.insertErrorLog(JSON.stringify({
          fileName: 'checkout.component.ts',
          method: 'saveUserShippingInfo()',
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

  onStepChange(event: any) {
    if (event.selectedIndex === 0 && this.shippingInformationProcessed) {
      // this.showConfirmationDialog('Shipping information will need to be reprocessed.');
      this.shippingInformationProcessed = false;
      this.shippingInfoForm.get('infoProcessed')?.setValue(false);
      this.shippingOptionsForm.get('shippingOption')?.setValue('');
    }
  }

  async getShippingRates() {
    if (this.shippingInformationProcessed) {
      this.stepper.next();
      return;
    }

    this.shipping_total_cost_standard = 0;
    this.shipping_total_cost_express = 0;
    this.shipping_total_cost_priority = 0;
    this.shipping_total_cost_economy = 0;

    await this.getAvailableShippingOptions();

    await this.getShippingCosts();
    await this.filterShippingOptionsForOrder();
    this.calculateShippingTotals();

    this.shippingInformationProcessed = true;
    this.shippingInfoForm.get('infoProcessed')?.setValue(true);
    this._snackBar.dismiss();
    this.stepper.next();
  }

  async getAvailableShippingOptions() {
    this._snackBar.open('Getting available shipping options...');
    this.availableShippingOptions = [];

    // Collect promises for all API calls
    const requests = this.cartSummary.map(async (item) => {
      try {
        const response = await firstValueFrom(
          this.shippingService.getAvailableShippingOptions(
            item.product.blueprint_id,
            item.product.print_provider_id
          )
        );
        const shippingOption = response as AvailableShippingList;
        shippingOption.blueprint_id = item.product.blueprint_id;
        shippingOption.print_provider_id = item.product.print_provider_id;
        shippingOption.quantity = item.quantity;
        shippingOption.uid = item.uid;
        return shippingOption;
      } catch (error) {
        console.error(
          `Error getting shipping options for blueprint_id ${item.product.blueprint_id} and print_provider_id ${item.product.print_provider_id}:`,
          error
        );
        throw error;
      }
    });
  
    try {
      // Wait for all API calls to complete
      this.availableShippingOptions = await Promise.all(requests);
      //console.log('Available shipping options:', this.availableShippingOptions);
    } catch (error) {
      this._snackBar.open('Error getting shipping options, please try again.', 'Ok', { duration: 3000 });
      console.error('Error getting available shipping options:', error);
    }
  }

  async filterShippingOptionsForOrder() {
    // Start with a copy of all shipping options
    const initialOptions = new Set(this.allShippingOptions);

    // Iterate through availableShippingOptions to keep only common options
    let filteredOptions = Array.from(initialOptions).filter((shippingOption) =>
      this.availableShippingOptions.every(
        (option) => option.links[shippingOption] !== undefined
      )
    );

    // Iterate through shippingCosts for any that have no data, remove
    this.shippingCosts.forEach((element) => {
      if (element.shipping_info.error) return;

      if (element.shipping_info.data.length <= 0) {
        filteredOptions = filteredOptions.filter((item) => item !== element.type);
      }
    })
  
    // Update the `allShippingOptions` with the filtered list
    this.allShippingOptions = filteredOptions;
  
    // console.log("Final shipping options:", this.allShippingOptions);
  }
  

  async getShippingCosts() {
    this._snackBar.open('Getting shipping costs for available options...');
    const requests: Promise<any>[] = [];
  
    // Collect all API calls into an array of Promises
    this.availableShippingOptions.forEach((option) => {
      Object.keys(option.links).forEach((link) => {
        requests.push(
          this.shippingService.getShippingCosts(
            option.blueprint_id,
            option.print_provider_id,
            link
          ).toPromise() // Convert Observable to Promise
        );
      });
    });
  
    try {
      // Await all API calls (runs in parallel)
      const responses = await Promise.all(requests);
      const allShippingCosts = responses as ShippingData[];
      this.shippingCosts = allShippingCosts;

      //console.log('All shipping costs received:', this.shippingCosts);
    } catch (error) {
      this._snackBar.open('Error getting Shipping Info, please try again.', 'Ok', { duration: 3000 });
      console.error('Error getting Shipping Info:', error);
    }
  }
  
  calculateShippingTotals() {
    this._snackBar.open('Calculating shipping totals...');
    const uniqueShippingPlans = new Array<string>();
    const chosenShippingOptionList = Array<DataItem>();

    this.allShippingOptions.forEach((shipping_type) => {
      // Filter shipping costs by shipping_type
      //console.log(this.shippingCosts);
      const asoCostList = this.shippingCosts.filter((element) => element.type === shipping_type);
      asoCostList.forEach((costList) => {
        if (costList.shipping_info.error) return;

        const countryMatch = costList.shipping_info.data.find((costLineItem) => {
          const attributes = costLineItem.attributes;
          if (attributes.country.code === this.shippingInfoForm.get('country')?.value && attributes.shippingType === shipping_type) {
            return true;
          } else {
            return false;
          }
        });

        if (countryMatch) {
          const foundOption = chosenShippingOptionList.find((x) => x === countryMatch);
          if (!foundOption)
            chosenShippingOptionList.push(countryMatch);
        } else {
          const match = costList.shipping_info.data.find((cli) => {
            const attributes = cli.attributes;
            if (attributes.country.code === "REST_OF_THE_WORLD" && attributes.shippingType === shipping_type) {
              return true;
            } else {
              return false;
            }
          });

          if (!match) return;

          const foundOption = chosenShippingOptionList.find((x) => x === match);
          if (!foundOption)
            chosenShippingOptionList.push(match); 
        }
      });


    });

    console.log(chosenShippingOptionList);
    if (this.cartSummary.length <= 1) {
      chosenShippingOptionList.forEach((dataItem) => {
        const cartItem = this.cartSummary.find((x) => x.uid === this.cartSummary[0].uid);
        //console.log(cartItem);
        this.setShippingRangeLabels(dataItem.attributes);
        if (cartItem)
          this.calcShippingTotals(dataItem.attributes, cartItem.quantity, false);
      });
    } else {
      this.cartSummary.forEach((cartItem, index) => {
        this.allShippingOptions.forEach((shippingOption) => {
          const option = chosenShippingOptionList.find((x) => x.attributes.shippingType === shippingOption);
          
          if (option) {
            this.setShippingRangeLabels(option.attributes);

            if (uniqueShippingPlans.find((x) => x === option.id)) {
              this.calcShippingTotals(option.attributes, cartItem.quantity, true);
            } else
              this.calcShippingTotals(option.attributes, cartItem.quantity, false);

            uniqueShippingPlans.push(option.id);
          }
        });
      });

      console.log(uniqueShippingPlans);
    }
  }

  setShippingRangeLabels(attributes: Attributes) {
    console.log(attributes.shippingType);
    switch (attributes.shippingType.toLowerCase()) {
      case 'standard':
        this.shipping_from_standard = attributes.handlingTime.from;
        this.shipping_to_standard = attributes.handlingTime.to;
      break;
      case 'priority':
        this.shipping_from_priority = attributes.handlingTime.from;
        this.shipping_to_priority = attributes.handlingTime.to;
      break;
      case 'economy':
        this.shipping_from_economy = attributes.handlingTime.from;
        this.shipping_to_economy = attributes.handlingTime.to;
      break;
      case 'express':
        this.shipping_from_express = attributes.handlingTime.from;
        this.shipping_to_express = attributes.handlingTime.to;
      break;
      default:
        //console.log('Error in setting shipping labels');
    }
  }

  calcShippingTotals(attributes: Attributes, quantity: number, skipFirstItem: boolean) {
    const firstItemCost = attributes.shippingCost.firstItem;
    const additionalItemCost = attributes.shippingCost.additionalItems;

    switch (attributes.shippingType.toLowerCase()) {
      case 'standard':
        this.shipping_total_cost_standard += this.calcShippingForLabels(firstItemCost, additionalItemCost, quantity, skipFirstItem);
        this.standard_shipping_enabled = true;
        console.log('standard shipping cost set');
      break;
      case 'priority':
        this.shipping_total_cost_priority += this.calcShippingForLabels(firstItemCost, additionalItemCost, quantity, skipFirstItem);
        this.priority_shipping_enabled = true;
        console.log('priority shipping cost set');
      break;
      case 'economy':
        this.shipping_total_cost_economy += this.calcShippingForLabels(firstItemCost, additionalItemCost, quantity, skipFirstItem);
        this.economy_shipping_enabled = true;
        console.log('economy shipping cost set');
      break;
      case 'express':
        this.shipping_total_cost_express += this.calcShippingForLabels(firstItemCost, additionalItemCost, quantity, skipFirstItem);
        this.express_shipping_enabled = true;
        console.log('express shipping cost set');
      break;
      default:
        //console.log('Error in calcShippingTotals()');
    }
  }

  calcShippingForLabels(firstItem: Money, additionalItem: Money, quantity: number, skipFirstItem: boolean): number {
    let shippingTotal!: number;

    if (!skipFirstItem) {
      if (quantity === 1) {
        shippingTotal = (quantity * firstItem.amount);
      } else if (quantity > 1) {
        shippingTotal = (firstItem.amount + ((quantity - 1) * additionalItem.amount));
      } else {
        shippingTotal = 0;
      }
    } else {
      shippingTotal = (quantity * additionalItem.amount);
    } 
    

    return shippingTotal;
  }

  calculateAmountDue(): number {
    if (this.shippingOptionsForm.get('shippingOption')?.value === 'standard') {
      return ((this.totalCartCost) / 100);
    } else if (this.shippingOptionsForm.get('shippingOption')?.value === 'express') {
      return ((this.shipping_total_cost_express + this.totalCartCost) / 100);
    } else if (this.shippingOptionsForm.get('shippingOption')?.value === 'economy') {
      return ((this.totalCartCost) / 100);
    } else if (this.shippingOptionsForm.get('shippingOption')?.value === 'priority') {
      return ((this.shipping_total_cost_priority + this.totalCartCost) / 100);
    } else {
      return 0;
    }
  }

  getDistinct<T>(array: T[], keyFn?: (item: T) => any): T[] {
    const seen = new Set();
    return array.filter((item) => {
      const key = keyFn ? keyFn(item) : item;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
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
