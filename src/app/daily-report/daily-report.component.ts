import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MongoService } from '../services/mongo.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-daily-report',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './daily-report.component.html',
  styleUrl: './daily-report.component.scss'
})
export class DailyReportComponent implements OnInit, OnDestroy {
  token: string | null = null;

  isSubmitting = false;
  submitError: string | null = null;
  submitted = false;

  form: FormGroup;

  readonly photoSlots = [
    { key: 'front', label: 'Front of truck' },
    { key: 'back', label: 'Back of truck' },
    { key: 'sideDriver', label: 'Driver-side of truck' },
    { key: 'sidePassenger', label: 'Passenger-side of truck' },
  ] as const;

  private readonly slotKeys: string[] = this.photoSlots.map(s => s.key);
  private readonly photoFiles = new Map<string, File>();
  private readonly photoPreviews = new Map<string, string>();

  activeSlotKey: string = this.photoSlots[0].key;

  isDragOver = false;

  constructor(private route: ActivatedRoute, private fb: FormBuilder, private mongoService: MongoService) {
    this.form = this.fb.group({
      odometer: [null, [Validators.required, Validators.min(0)]],
      issues: [''],
      issuesSummary: ['', [Validators.maxLength(1000)]],
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  ngOnDestroy(): void {
    for (const url of this.photoPreviews.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
  }

  get requiresIssuesSummary(): boolean {
    const val = (this.form.get('issues')?.value ?? '').toString().trim().toLowerCase();
    return val === 'yes' || val === 'true';
  }

  previewUrlFor(slotKey: string): string | null {
    return this.photoPreviews.get(slotKey) ?? null;
  }

  fileNameFor(slotKey: string): string | null {
    return this.photoFiles.get(slotKey)?.name ?? null;
  }

  labelFor(slotKey: string): string {
    const slot = this.photoSlots.find(s => s.key === slotKey);
    return slot?.label ?? slotKey;
  }

  setActiveSlot(slotKey: string): void {
    if (!this.slotKeys.includes(slotKey)) return;
    this.activeSlotKey = slotKey;
  }

  isActiveSlot(slotKey: string): boolean {
    return this.activeSlotKey === slotKey;
  }

  get photoCount(): number {
    return this.photoFiles.size;
  }

  get photosComplete(): boolean {
    return this.photoCount === this.slotKeys.length;
  }

  get photoProgressPercent(): number {
    return Math.round((this.photoCount / this.slotKeys.length) * 100);
  }

  get missingPhotoLabels(): string[] {
    return this.slotKeys
      .filter(k => !this.photoFiles.get(k))
      .map(k => this.labelFor(k));
  }

  openPickerFor(slotKey: string, inputEl: HTMLInputElement): void {
    this.setActiveSlot(slotKey);
    if (!this.token || this.isSubmitting) return;
    inputEl.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input?.files ?? []);
    if (!files.length) return;

    this.submitError = null;
    this.assignFiles(files);

    // allow re-selecting the same file(s)
    input.value = '';
  }

  private assignFiles(files: File[]): void {
    const maxBytes = 8 * 1024 * 1024;

    // find first empty slot; otherwise start at active slot
    const firstEmptyIndex = this.slotKeys.findIndex(k => !this.photoFiles.get(k));
    let slotIndex = firstEmptyIndex >= 0 ? firstEmptyIndex : Math.max(0, this.slotKeys.indexOf(this.activeSlotKey));

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.submitError = 'Please upload image files only.';
        continue;
      }

      if (file.size > maxBytes) {
        this.submitError = 'Each image must be 8MB or less.';
        continue;
      }

      if (slotIndex >= this.slotKeys.length) break;
      const slotKey = this.slotKeys[slotIndex];
      this.setPhoto(slotKey, file);
      slotIndex += 1;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.isSubmitting || !this.token) return;
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.isSubmitting || !this.token) return;

    this.isDragOver = false;
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (!files.length) return;

    this.submitError = null;
    this.assignFiles(files);
  }

  private setPhoto(slotKey: string, file: File): void {
    const existingUrl = this.photoPreviews.get(slotKey);
    if (existingUrl) {
      try {
        URL.revokeObjectURL(existingUrl);
      } catch {
        // ignore
      }
    }

    this.photoFiles.set(slotKey, file);
    this.photoPreviews.set(slotKey, URL.createObjectURL(file));
  }

  clearPhoto(slotKey: string): void {
    const url = this.photoPreviews.get(slotKey);
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    this.photoPreviews.delete(slotKey);
    this.photoFiles.delete(slotKey);
  }

  private validateBeforeSubmit(): string | null {
    if (!this.token) return 'This link is missing a token. Please request a new daily report link.';
    if (this.form.invalid) return 'Please fill in the required fields.';

    const odometerVal = this.form.get('odometer')?.value;
    if (odometerVal === null || odometerVal === undefined || odometerVal === '') {
      return 'Odometer is required.';
    }

    // Require all 4 photos for now (can relax later)
    const missing = this.missingPhotoLabels;
    if (missing.length) return `Missing required photos: ${missing.join(', ')}`;

    const issues = (this.form.get('issues')?.value ?? '').toString().trim().toLowerCase();
    if ((issues === 'yes' || issues === 'true') && !(this.form.get('issuesSummary')?.value ?? '').toString().trim()) {
      return 'Please describe the issues you noticed.';
    }

    return null;
  }

  async submit(): Promise<void> {
    this.submitError = null;
    const validationError = this.validateBeforeSubmit();
    if (validationError) {
      this.submitError = validationError;
      return;
    }

    this.isSubmitting = true;
    try {
      if (!this.token) {
        this.submitError = 'Missing token.';
        return;
      }

      // 1) Upload each required photo to MongoDB GridFS
      const uploaded = await Promise.all(
        this.slotKeys.map(async (slotKey) => {
          const file = this.photoFiles.get(slotKey);
          if (!file) {
            throw new Error(`Missing required photo: ${this.labelFor(slotKey)}`);
          }

          const fd = new FormData();
          fd.append('token', this.token as string);
          fd.append('slot', slotKey);
          fd.append('file', file, file.name);

          const resp: any = await firstValueFrom(this.mongoService.uploadDailyReportPhotoByToken(fd));
          const photo = resp?.photo;
          if (!photo?.mongoFileId) {
            throw new Error(`Upload failed for ${this.labelFor(slotKey)}`);
          }

          return {
            slot: slotKey,
            mongoFileId: String(photo.mongoFileId),
            fileName: photo.fileName ?? file.name,
            contentType: photo.contentType ?? file.type,
            size: typeof photo.size === 'number' ? photo.size : file.size,
          };
        })
      );

      // 2) Submit the report with uploaded photo references
      const body = {
        token: this.token,
        odometer: Number(this.form.get('odometer')?.value),
        issues: (this.form.get('issues')?.value ?? '').toString(),
        issuesSummary: (this.form.get('issuesSummary')?.value ?? '').toString(),
        photos: uploaded,
      };

      await firstValueFrom(this.mongoService.submitDailyReportByToken(body));

      this.submitted = true;
    } catch {
      this.submitError = 'Something went wrong. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
