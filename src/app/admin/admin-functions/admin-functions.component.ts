import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { QRCodeService } from '../../services/qr-code.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PrintifyService } from '../../services/printify.service';
import { MatSelectModule } from '@angular/material/select';
import { Product } from '../../shared/models/product';
import { MongoService } from '../../services/mongo.service';
import { AuthService } from '../../services/auth.service';
import { ViewSampleBatchesComponent } from './view-sample-batches/view-sample-batches.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-functions',
  imports: [
    CommonModule,
    FormsModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ViewSampleBatchesComponent
  ],
  templateUrl: './admin-functions.component.html',
  styleUrl: './admin-functions.component.scss'
})
export class AdminFunctionsComponent implements OnInit {
  private _snackBar = inject(MatSnackBar);
  showBulkCreateForm: boolean = false;
  showBusinessQRForm: boolean = false;
  bulkCreateForm!: FormGroup;
  businessQRForm!: FormGroup;
  products: Product[] = [];
  businessUsers: any[] = [];
  userId: string | undefined = undefined;
  showSampleBatches: boolean = false;
  isGeneratingBusinessQRCodes: boolean = false;

  isInitDailyReportIndexesLoading = false;
  isRunDailyReportSchedulerLoading = false;
  lastDailyReportSchedulerResult: any | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: any, 
    private fb: FormBuilder, 
    private qrCodeService: QRCodeService, 
    private printifyService: PrintifyService,
    private mongoService: MongoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.bulkCreateForm = this.fb.group({
      numberOfCodes: ['', [Validators.required, Validators.pattern('^[1-9][0-9]*$')]], // Ensure it's a positive integer
      productList: ['', Validators.required],
      batchNumber: ['', Validators.required],
      campaignId: ['', Validators.required],
      description: ['', Validators.required],
      notes: ['', Validators.required]
    });

    this.businessQRForm = this.fb.group({
      businessId: ['', Validators.required],
      numberOfCodes: ['', [Validators.required, Validators.pattern('^[1-9][0-9]*$')]],
      productList: ['', Validators.required],
    });

    this.loadProducts();
    this.loadBusinessUsers();
  }

  loadProducts(): void {
    let cachedProducts = null;

    if (!cachedProducts) {
      this.printifyService.getProducts().subscribe({
        next: (response: any) => {
          this.products = response.map((item: any) => {
              return new Product(item);
          });
  
          this.products = this.products.filter(x => x.visible);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('products', JSON.stringify(this.products));
          }
        },
        error: (error) => {
          console.error('Error loading products:', error);
        },
      });
    } else {
      this.products = JSON.parse(cachedProducts);
    }
  }

  loadBusinessUsers(): void {
    this.mongoService.getAllBusinessUsers().subscribe({
      next: (response: any) => {
        this.businessUsers = response.result || [];
      },
      error: (error) => {
        console.error('Error loading business users:', error);
        this._snackBar.open('Error loading business users.', 'Close', { duration: 3000 });
      },
    });
  }

  toggleBulkCreateForm(): void {
    this.showBulkCreateForm = !this.showBulkCreateForm;
    if (this.showBulkCreateForm) {
      this.bulkCreateForm.reset();
    }
  }

  toggleBusinessQRForm(): void {
    this.showBusinessQRForm = !this.showBusinessQRForm;
    if (this.showBusinessQRForm) {
      this.businessQRForm.reset();
    }
  }

  toggleSampleBatches(): void {
    this.showSampleBatches = !this.showSampleBatches;
  }

  initDailyReportIndexes(): void {
    this.isInitDailyReportIndexesLoading = true;
    this._snackBar.open('Initializing daily report indexes...', 'Close');

    this.mongoService.initDailyReportIndexes().subscribe({
      next: (result: any) => {
        this.isInitDailyReportIndexesLoading = false;
        this._snackBar.open(result?.message ?? 'Indexes initialized.', 'Ok', { duration: 3000 });
      },
      error: (err: any) => {
        this.isInitDailyReportIndexesLoading = false;
        this._snackBar.open(err?.error?.message ?? 'Error initializing indexes.', 'Ok', { duration: 5000 });
      }
    });
  }

  runDailyReportSchedulerOnce(): void {
    this.isRunDailyReportSchedulerLoading = true;
    this.lastDailyReportSchedulerResult = null;
    this._snackBar.open('Running daily report scheduler once...', 'Close');

    this.mongoService.runDailyReportMagicLinksOnce().subscribe({
      next: (result: any) => {
        this.isRunDailyReportSchedulerLoading = false;
        this.lastDailyReportSchedulerResult = result?.result ?? result;
        const sent = this.lastDailyReportSchedulerResult?.emailsSent ?? 0;
        const created = this.lastDailyReportSchedulerResult?.tokensCreated ?? 0;
        this._snackBar.open(`Scheduler finished. Emails: ${sent}, Tokens: ${created}`, 'Ok', { duration: 5000 });
      },
      error: (err: any) => {
        this.isRunDailyReportSchedulerLoading = false;
        this._snackBar.open(err?.error?.message ?? 'Error running scheduler.', 'Ok', { duration: 5000 });
      }
    });
  }

  onGenerateBusinessQRCodes(): void {
    this.isGeneratingBusinessQRCodes = true;
    this._snackBar.open('Processing your request, please wait...', 'Close', { duration: 3000 });

    if (this.businessQRForm.invalid) {
      this.isGeneratingBusinessQRCodes = false;
      this._snackBar.open('Please enter valid data.', 'Close', { duration: 3000 });
      return;
    }

    const numberOfCodes = Number(this.businessQRForm.value.numberOfCodes);
    const businessId = (this.businessQRForm.value.businessId ?? '').toString();
    const productId = this.businessQRForm.value.productList;
    const productType = this.products.find(p => p.id === productId)?.title || 'Unknown Product';
    this.authService.getUser().subscribe((user) => this.userId = user?.uid) || 'admin';

    const selectedBusiness = this.businessUsers.find((b: any) => {
      const id = (b?._id?.$oid ?? b?._id ?? b?.businessId ?? b?.userId ?? '').toString();
      return id === businessId;
    });

    const businessName = selectedBusiness?.businessName ?? 'Business';
    const businessUserId = selectedBusiness?.userId ?? null;

    this._snackBar.open('Generating business QR codes...', 'Close', { duration: 3000 });

    // Call QRCodeService to generate QR codes with business info embedded
    // NOTE: `businessId` is the Mongo business _id (string) so QR→truck matching works.
    this.qrCodeService.generateBusinessQRCodes(numberOfCodes, businessId).then((qrCodeData) => {
      console.log('Business QR codes created successfully:', qrCodeData);

      this._snackBar.open('QR Codes generated, creating custom Printify orders...', 'Close', { duration: 3000 });

      // Map QR codes to Printify product creation requests and MongoDB entries
      const createRequests = qrCodeData.map(async ({ assetId, qrCode }, index) => {
        try {
          const cleanQRCodeBase64 = qrCode.substring(22); // Remove the data URL prefix

          // Create the Printify product with business context
          await this.printifyService.createCustomBusinessPrintifyProduct({
            base64QRCode: cleanQRCodeBase64,
            originalProductId: productId,
            userID: `${businessName}_QRCode_${index + 1}`,
            assetId: assetId,
          }).toPromise();

          // Insert the database entry
          const dbEntry = {
            assetId: assetId,
            businessId: businessId,
            status: 'unassigned',
            createdAt: new Date(),
            updatedAt: new Date(),
            assignedAt: null,
            truckId: null,
            metadata: {
              productType: productType,
              businessId: businessId,
              businessName,
              businessUserId,
              qrCodeIndex: index + 1
            }
          };

          await this.mongoService.insertBusinessQRCodes([dbEntry]).toPromise();
        } catch (error) {
          console.error(`Error processing QR code ${assetId}:`, error);
          throw error;
        }
      });

      // Wait for all Printify requests and database entries to complete
      return Promise.all(createRequests);
    }).then(() => {
      console.log('All business QR codes and Printify products created successfully.');
      this.isGeneratingBusinessQRCodes = false;
      this._snackBar.open(`Generated ${numberOfCodes} QR codes for ${businessName}!`, 'Close', { duration: 3000 });

      // Reset the form and hide
      this.businessQRForm.reset();
      this.showBusinessQRForm = false;
    }).catch((error) => {
      console.error('Error during business QR code generation:', error);
      this.isGeneratingBusinessQRCodes = false;
      this._snackBar.open('An error occurred during QR code generation. Please try again.', 'Close', { duration: 3000 });
    });
  }

  onBulkCreate(): void {
    this._snackBar.open('Processing your request, please wait...', 'Close', { duration: 3000 });

    if (this.bulkCreateForm.invalid) {
      this._snackBar.open('Please enter valid data.', 'Close', { duration: 3000 });
      return;
    }

    const numberOfCodes = Number(this.bulkCreateForm.value.numberOfCodes);
    const productId = this.bulkCreateForm.value.productList;
    const batchNumber = this.bulkCreateForm.value.batchNumber.toString();
    const campaignId = this.bulkCreateForm.value.campaignId.toString();
    this.authService.getUser().subscribe((user) => this.userId = user?.uid) || 'admin';

    const sample_batch = {
      batchNumber: batchNumber,
      campaignId: campaignId,
      productType: this.products.find(p => p.id === productId)?.title || 'Unknown Product',
      description: this.bulkCreateForm.value.description.toString(),
      totalSample: numberOfCodes,
      claimedCount: 0,
      unclaimedCount: numberOfCodes,
      invalidCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: this.userId || 'admin',
      notes: this.bulkCreateForm.value.notes.toString()
    };

    this.mongoService.insertSampleBatch(sample_batch).subscribe({
      next: (response) => {
        this._snackBar.open('Sample Batch created, generating QR Codes...', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error creating sample batch:', error);
        this._snackBar.open('Error creating sample batch. Please try again.', 'Close', { duration: 3000 });
        return;
      }
    });

    this.qrCodeService.generateQRCodeSamples(numberOfCodes).then((qrCodeData) => {
      console.log('Bulk QR codes created successfully:', qrCodeData);

      this._snackBar.open('QR Codes generated, creating custom Printify orders...', 'Close', { duration: 3000 });

      // Map QR codes to Printify product creation requests and MongoDB entries
      const createRequests = qrCodeData.map(async ({ uniqueId, qrCode }, index) => {
        try {
          const cleanQRCodeBase64 = qrCode.substring(22); // Remove the data URL prefix

          // Insert the QR code entry into the database
          const dbEntry = {
            uniqueId: uniqueId,
            userId: null,
            status: 'unclaimed',
            createdAt: new Date(),
            updatedAt: new Date(),
            claimedAt: null,
            metadata: {
              productType: this.products.find(p => p.id === productId)?.title || 'Unknown Product',
              batchNumber: batchNumber,
              campaignId: campaignId,
            },
          };

          // Create the Printify product
          await this.printifyService.createCustomPrintifyProduct({
            base64QRCode: cleanQRCodeBase64,
            originalProductId: productId,
            userID: `${batchNumber}_Sample_${index + 1}`,
          }).toPromise();

          // Insert the database entry
          await this.mongoService.insertSampleMapper(dbEntry).toPromise();
        } catch (error) {
          console.error(`Error processing QR code ${uniqueId}:`, error);
          throw error;
        }
      });

      // Wait for all Printify requests and database entries to complete
      return Promise.all(createRequests);
    }).then(() => {
      console.log('All Printify products and database entries created successfully.');
      this._snackBar.open('All QR Codes and Printify products created successfully!', 'Close', { duration: 3000 });

      // Reset the form and hide the bulk create form
      this.bulkCreateForm.reset();
      this.showBulkCreateForm = false;
    }).catch((error) => {
      console.error('Error during bulk creation process:', error);
      this._snackBar.open('An error occurred during the bulk creation process. Please try again.', 'Close', { duration: 3000 });
    });
  }
}

