import { Directive, HostListener, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[formatExpiryDate]',
})
export class FormatExpiryDateDirective implements OnInit {
    @Input() appCCFormatter: string = ''; // Input to handle initial value
    previousValue: string = '';

    constructor(private el: ElementRef) {}

    ngOnInit(): void {
        if (this.appCCFormatter) {
          this.el.nativeElement.value = this.formatExpiryDate(this.appCCFormatter);
        }
    }

    @HostListener('input', ['$event.target.value'])
    onInputChange(value: string): void {
        const cleaned = value.replace(/\D+/g, ''); // Remove non-digit characters
        const formatted = this.formatExpiryDate(cleaned);
        this.el.nativeElement.value = formatted;
    }

    private formatExpiryDate(value: string): string {
        return value
        .replace(/\D/g, '') // Remove non-numeric characters
        .slice(0, 4) // Limit to MMYY (4 digits max)
        .replace(/^(\d{2})(\d{0,2})$/, (_, mm, yy) => yy ? `${mm}/${yy}` : mm); // Format as MM/YY
    }
}