import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';

import { EmailService } from '../services/email.service';
import { FirebaseService } from '../services/firebase.service';
import { MongoService } from '../services/mongo.service';
import { US_STATES } from '../shared/classes/states';
import { RandomizeInputDirective } from '../shared/directives/randomize-input.directive';
import { MessageDialogComponent } from '../shared/modals/message-dialog/message-dialog.component';
import { SampleNotRegisteredDialogComponent } from '../shared/modals/sample-not-registered-dialog/sample-not-registered-dialog.component';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

type EntryMode = 'user' | 'sample' | 'business' | 'unknown';

type QueryContext = {
  mode: EntryMode;
  userId?: string;
  uniqueId?: string;
  businessId?: string;
  assetId?: string;

  // unified "destination" for notification/routing emails (user/sample => user's email, business => business contact email)
  emailTo?: string | null;

  // business QR validation/association
  businessQrValid?: boolean;
  businessQrAssigned?: boolean;
  truckId?: string | null;
  settings?: any | null;

  businessUser?: {
    userId: string;
    businessName: string;
    contactEmail: string;
    phoneNumber: string;
    role: string;
    status: string;
    settings: {
      notifyOnNewReview: boolean;
      dailySummaryEmail: boolean;
      dailyReportsEnabled: boolean;
      timezone: string;
      dailyReportEndWindow: string;
      dailyReportStartWindow: string;
    };
    createdAt: { $date: string };
    updatedAt: { $date: string };
  } | null;
};

type SubmissionModel = {
  // target identifiers (one of these flows will be present)
  user_id?: string | null;
  uniqueId?: string | null;
  businessId?: string | null;
  assetId?: string | null;

  // form fields
  firstName: string;
  lastName: string;
  state: string;
  licensePlate: string;
  reasonForContacting: string;
  description: string;

  // metadata
  dateSubmitted: string;
  emailTo?: string | null;
};

@Component({
  selector: 'app-home',
  imports: [
    RandomizeInputDirective,
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    HttpClientModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  states = US_STATES;

  // page state
  isProcessing = false;
  isSubmitting = false;
  isQuickMode = true;

  // context
  mode: EntryMode = 'unknown';
  user_id: string | null = null;
  user_email: string | null = null;
  user_settings: any | null = null;

  uniqueId: string | null = null;
  businessId: string | null = null;
  assetId: string | null = null;

  // business QR validation state
  businessQrValid: boolean | null = null;
  businessQrAssigned: boolean | null = null;
  businessTruckId: string | null = null;
  private hasShownBusinessQrDialog = false;

  ngForm!: NgForm;

  // quick-review groups (drives the template)
  quickReviewGroups: Array<{ title: string; options: Array<{ label: string; value: string }> }> = [
    {
      title: 'Bad Driving Review',
      options: [
        { label: 'Aggressive Driving', value: 'Aggressive Driving' },
        { label: 'Cut me Off', value: 'Cut Me Off' },
        { label: 'Driving Slow', value: 'Driving Slow' },
        { label: 'Not Paying Attention', value: 'Not Paying Attention' },
        { label: 'You suck at driving', value: 'You suck at driving' },
      ],
    },
    {
      title: 'Good Driving Review',
      options: [
        { label: 'Courteous Driver', value: 'Courteous Driver' },
        { label: 'Used Turn Signals', value: 'Used Turn Signals' },
        { label: 'Excellent Park Job', value: 'Excellent Park Job' },
        { label: 'Let me Merge', value: 'Let me Merge' },
        { label: 'You are a great driver, keep it up!', value: 'You are a great driver, keep it up!' },
      ],
    },
    {
      title: 'Car Review',
      options: [
        { label: 'Looks Brand New', value: 'Looks Brand New' },
        { label: 'Cool Color/Wrap', value: 'Cool Color/Wrap' },
        { label: 'Nice Rims/Wheels', value: 'Nice Rims/Wheels' },
        { label: 'Unique & Eye-Catching', value: 'Unique & Eye-Catching' },
        { label: 'Your car is awesome, I love it!', value: 'Your car is awesome, I love it!' },
      ],
    },
  ];

  formData: SubmissionModel = this.createEmptyFormData();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dbService: MongoService,
    private emailService: EmailService,
    private firebaseService: FirebaseService,
    private dialog: MatDialog
  ) {}

  get isBusinessFlow(): boolean {
    return this.mode === 'business' && !!this.businessId && !!this.assetId;
  }

  get isSubmissionEnabled(): boolean {
    // user/sample flows should always work (existing behavior)
    if (!this.isBusinessFlow) return true;
    // business flow must be validated + assigned to a truck
    return this.businessQrValid === true && this.businessQrAssigned === true;
  }

  get showVehicleFields(): boolean {
    // If we already know the target via user_id or businessId, license plate/state are optional noise.
    return !this.user_id && !this.businessId;
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          id: (params.get('id') || '').trim(),
          uniqueId: (params.get('uniqueId') || '').trim(),
          businessId: (params.get('businessId') || '').trim(),
          assetId: (params.get('assetId') || '').trim(),
        })),
        tap(() => (this.isProcessing = true)),
        switchMap((q) =>
          this.resolveContext$(q).pipe(
            tap((ctx) => this.applyContext(ctx)),
            catchError((error) => {
              console.error('Error resolving context:', error);
              this.snackBar.open('Unable to load QR context. Please try again.', 'Close', { duration: 4000 });

              this.dbService
                .insertErrorLog(
                  JSON.stringify({
                    fileName: 'home.component.ts',
                    method: 'ngOnInit()/resolveContext$',
                    timestamp: new Date().toString(),
                    error,
                  })
                )
                .subscribe();

              // allow the page to still render the manual form
              return of<QueryContext>({ mode: 'unknown' });
            }),
            finalize(() => (this.isProcessing = false))
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private resolveContext$(q: { id: string; uniqueId: string; businessId: string; assetId: string }): Observable<QueryContext> {
    console.log('Resolving context for query params:', q);
  
    // 1) Direct user id
    if (q.id) {
      return forkJoin([this.firebaseService.getUserByUID(q.id), this.dbService.getUserSettings(q.id)]).pipe(
        map(([userResponse, settingsResponse]) => ({
          mode: 'user' as const,
          userId: q.id,
          emailTo: userResponse?.email ?? null,
          settings: (settingsResponse as any)?.result ?? null,
        }))
      );
    }
  
    // 2) Sample uniqueId -> resolve to userId, or show "unclaimed" dialog
    if (q.uniqueId) {
      return this.dbService.getUserByUniqueId(q.uniqueId).pipe(
        switchMap((response: any) => {
          const userId = response?.result?.userId as string | undefined;
          const status = response?.result?.status as string | undefined;
  
          if (userId) {
            return forkJoin([this.firebaseService.getUserByUID(userId), this.dbService.getUserSettings(userId)]).pipe(
              map(([userResponse, settingsResponse]) => ({
                mode: 'sample' as const,
                uniqueId: q.uniqueId,
                userId,
                emailTo: userResponse?.email ?? null,
                settings: (settingsResponse as any)?.result ?? null,
              }))
            );
          }
  
          if (status === 'unclaimed') {
            this.dialog.open(SampleNotRegisteredDialogComponent, {
              width: '400px',
              disableClose: true,
              data: {
                message:
                  'This QR Code is unclaimed. Please contact support for assistance. If you are the owner, please register to claim it.',
                action: 'Claim Now',
                actionCallback: () => this.router.navigate(['/register', q.uniqueId]),
              },
            });
            return EMPTY;
          }
  
          return of<QueryContext>({ mode: 'unknown' });
        })
      );
    }
  
    // 3) Business mode (businessId + assetId)
    if (q.businessId && q.assetId) {
      return this.dbService.getBusinessQrContext(q.businessId, q.assetId).pipe(
        map((response: any) => {
          const result = response?.result ?? response;
          const businessUser = result?.businessUser ?? null;
  
          return {
            mode: 'business' as const,
            businessId: q.businessId,
            assetId: q.assetId,
            businessQrValid: !!result?.exists,
            businessQrAssigned: !!result?.assigned,
            truckId: (result?.truckId as string | null) ?? null,
            businessUser,
            emailTo: businessUser?.contactEmail ?? null,
          };
        }),
        catchError((error) => {
          console.error('Error validating business QR code:', error);
          return of<QueryContext>({
            mode: 'business',
            businessId: q.businessId,
            assetId: q.assetId,
            businessQrValid: false,
            businessQrAssigned: false,
            truckId: null,
            businessUser: null,
            emailTo: null,
          });
        })
      );
    }
  
    return of<QueryContext>({ mode: 'unknown' });
  }

  private applyContext(ctx: QueryContext): void {
    this.mode = ctx.mode;

    this.user_id = ctx.userId ?? null;
    this.uniqueId = ctx.uniqueId ?? null;
    this.businessId = ctx.businessId ?? null;
    this.assetId = ctx.assetId ?? null;

    // IMPORTANT: email can come from user/sample OR business. Use ctx.emailTo, not ctx.businessUser.
    this.user_email = ctx.emailTo ?? null;

    this.user_settings = ctx.settings ?? null;

    this.businessQrValid = typeof ctx.businessQrValid === 'boolean' ? ctx.businessQrValid : null;
    this.businessQrAssigned = typeof ctx.businessQrAssigned === 'boolean' ? ctx.businessQrAssigned : null;
    this.businessTruckId = ctx.truckId ?? null;

    // Ensure outgoing payload always has the right routing fields
    this.formData.user_id = this.user_id;
    this.formData.uniqueId = this.uniqueId;
    this.formData.businessId = this.businessId;
    this.formData.assetId = this.assetId;
    this.formData.emailTo = this.user_email;

    // Show one-time dialogs for business QR state
    if (this.isBusinessFlow && !this.hasShownBusinessQrDialog) {
      this.hasShownBusinessQrDialog = true;

      if (this.businessQrValid === false) {
        this.showConfirmationDialog(
          'Invalid QR Code. This business QR could not be verified. Please contact your fleet manager/support.'
        );
      } else if (this.businessQrValid === true && this.businessQrAssigned === false) {
        this.showConfirmationDialog(
          'This QR Code is real, but it has not been registered to a truck yet. Please ask your business admin/fleet manager to assign this QR code to a truck before submitting feedback.'
        );
      }
    }
  }

  async submit(form: NgForm) {
    if (!this.isSubmissionEnabled) {
      this.snackBar.open('This QR code must be registered to a truck before submitting.', 'Close', { duration: 4000 });
      return;
    }
    this.ngForm = form;
    this.isSubmitting = true;

    const payload = this.buildSubmissionPayload();

    this.dbService
      .insertSubmission(JSON.stringify(payload))
      .pipe(
        switchMap(() => this.emailService.sendSubmissionEmail(JSON.stringify(payload))),
        tap(() => {
          this.openConfirmMessage();
          this.resetForm();
        }),
        catchError((error) => {
          this.snackBar.open('Error submitting form, try again.', 'Close', { duration: 4000 });

          this.dbService
            .insertErrorLog(
              JSON.stringify({
                fileName: 'home.component.ts',
                method: 'submit()',
                timestamp: new Date().toString(),
                error,
              })
            )
            .subscribe();

          return EMPTY;
        }),
        finalize(() => (this.isSubmitting = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  submitQuickReview(reasonForContacting: string) {
    if (!this.isSubmissionEnabled) {
      this.snackBar.open('This QR code must be registered to a truck before submitting.', 'Close', { duration: 4000 });
      return;
    }
    this.isSubmitting = true;
    this.snackBar.open('Submitting your quick review...', 'Close', { duration: 2000 });

    // quick payload (don’t mutate the user’s in-progress long-form fields)
    const payload: SubmissionModel = {
      ...this.buildSubmissionPayload(),
      reasonForContacting,
      description: reasonForContacting,
      firstName: 'Anonymous',
      lastName: 'User',
    };

    this.dbService
      .insertSubmission(JSON.stringify(payload))
      .pipe(
        switchMap(() => this.emailService.sendSubmissionEmail(JSON.stringify(payload))),
        tap(() => {
          this.openConfirmMessage();
          this.resetForm();
        }),
        catchError((error) => {
          this.snackBar.open('Error submitting quick review, try again.', 'Close', { duration: 4000 });

          this.dbService
            .insertErrorLog(
              JSON.stringify({
                fileName: 'home.component.ts',
                method: 'submitQuickReview()',
                timestamp: new Date().toString(),
                error,
              })
            )
            .subscribe();

          return EMPTY;
        }),
        finalize(() => (this.isSubmitting = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private buildSubmissionPayload(): SubmissionModel {
    return {
      ...this.formData,
      user_id: this.user_id,
      uniqueId: this.uniqueId,
      businessId: this.businessId,
      assetId: this.assetId,
      emailTo: this.user_email, // may be null in business mode; backend should handle
      dateSubmitted: new Date().toISOString(),
    };
  }

  private createEmptyFormData(): SubmissionModel {
    return {
      user_id: null,
      uniqueId: null,
      businessId: null,
      assetId: null,
      firstName: '',
      lastName: '',
      state: '',
      licensePlate: '',
      reasonForContacting: '',
      description: '',
      dateSubmitted: '',
      emailTo: null,
    };
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
      this.snackBar.open(msg, 'Close', { duration: 4000 });
    } else {
      this.showConfirmationDialog('Thank you for your submission!');
    }
  }

  showConfirmationDialog(msg: string) {
    return this.dialog.open(MessageDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { message: msg },
    });
  }

  resetForm() {
    if (this.ngForm) this.ngForm.resetForm();
    this.formData = this.createEmptyFormData();

    // re-apply routing fields after reset
    this.formData.user_id = this.user_id;
    this.formData.uniqueId = this.uniqueId;
    this.formData.businessId = this.businessId;
    this.formData.assetId = this.assetId;
    this.formData.emailTo = this.user_email;
  }
}