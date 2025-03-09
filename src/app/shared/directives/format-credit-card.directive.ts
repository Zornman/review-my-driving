import { Directive, HostListener, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[formatCC]',
})
export class FormatCreditCardDirective implements OnInit {
  @Input() appCCFormatter: string = ''; // Input to handle initial value
  previousValue: string = '';

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
      if (this.appCCFormatter) {
        this.el.nativeElement.value = this.formatCreditCard(this.appCCFormatter);
      }
  }

  @HostListener('input', ['$event.target.value'])
  onInputChange(value: string): void {
      const cleaned = value.replace(/\D+/g, ''); // Remove non-digit characters
      const formatted = this.formatCreditCard(cleaned);
      this.el.nativeElement.value = formatted;
  }

  private formatCreditCard(value: string): string {
    const cleanValue = value.replace(/\D/g, ''); // Remove non-numeric chars
    const cardType = this.detectCardType(cleanValue);

    switch (cardType) {
      case 'amex': // American Express: 15 digits, format XXXX XXXXXX XXXXX
        return cleanValue
            .slice(0, 15)
            .replace(/^(\d{4})(\d{0,6})(\d{0,5})$/, (_, g1, g2, g3) => 
                [g1, g2, g3].filter(Boolean).join(' ')
            );

      case 'diners': // Diners Club: 14 digits, format XXXX XXXXXX XXXX
        return cleanValue
            .slice(0, 14)
            .replace(/^(\d{4})(\d{0,6})(\d{0,4})$/, (_, g1, g2, g3) => 
                [g1, g2, g3].filter(Boolean).join(' ')
            );

      default: // Visa, Mastercard, Discover, etc.: 16 digits, format XXXX XXXX XXXX XXXX
        return cleanValue
            .slice(0, 16)
            .replace(/(\d{4})(?=\d)/g, '$1 ')
            .trim(); // Remove trailing space if needed
    }
  }

  private detectCardType(number: string): string {
    if (/^3[47]/.test(number)) return 'amex'; // American Express (34, 37)
    if (/^3(0[0-5]|[68])/.test(number)) return 'diners'; // Diners Club (300-305, 36, 38)
    if (/^4/.test(number)) return 'visa'; // Visa (4XXX)
    if (/^5[1-5]/.test(number)) return 'mastercard'; // Mastercard (51-55)
    if (/^6(?:011|5)/.test(number)) return 'discover'; // Discover (6011, 65)
    return 'unknown'; // Default case
  }
}