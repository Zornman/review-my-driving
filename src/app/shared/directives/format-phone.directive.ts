import { Directive, HostListener, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[formatPhone]',
})
export class FormatPhoneDirective implements OnInit {
    @Input() appPhoneFormatter: string = ''; // Input to handle initial value

    constructor(private el: ElementRef) {}

    ngOnInit(): void {
        if (this.appPhoneFormatter) {
          this.el.nativeElement.value = this.formatPhoneNumber(this.appPhoneFormatter);
        }
    }

    @HostListener('input', ['$event.target.value'])
    onInputChange(value: string): void {
        const cleaned = value.replace(/\D+/g, ''); // Remove non-digit characters
        const formatted = this.formatPhoneNumber(cleaned);
        this.el.nativeElement.value = formatted;
    }

    private formatPhoneNumber(value: string): string {
        if (value.length <= 3) {
        return `(${value}`;
        } else if (value.length <= 6) {
        return `(${value.slice(0, 3)}) ${value.slice(3)}`;
        } else {
        return `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
        }
    }
}