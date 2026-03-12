import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormatPhoneDirective } from '../../directives/format-phone.directive';

@Component({
  selector: 'app-edit-personal-info',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormatPhoneDirective
  ],
  templateUrl: './edit-personal-info.component.html',
  styleUrl: './edit-personal-info.component.scss'
})
export class EditPersonalInfoComponent implements OnInit {
  personalForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditPersonalInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { driver?: any }
  ) {}

  ngOnInit(): void {
    const driver = this.data?.driver ?? {};

    this.personalForm = this.fb.group({
      name: [driver?.name || '', Validators.required],
      phone: [driver?.phone || '', Validators.required],
      email: [driver?.email || '', Validators.email]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.personalForm.invalid) {
      return;
    }

    this.dialogRef.close(this.personalForm.value);
  }
}
