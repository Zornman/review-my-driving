import { Directive, HostListener, Renderer2, ElementRef } from '@angular/core';

@Directive({
  selector: '[randomizeInput]',
  standalone: true
})
export class RandomizeInputDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  // Focus event
  @HostListener('focus') onFocus() {
    if (this.performAction(5)) {
        this.el.nativeElement.blur();
    }
  }

  // Blur event
  @HostListener('blur') onBlur() {
    if (this.performAction(3)) {
        let currentValue = this.el.nativeElement.value;
        this.renderer.setProperty(this.el.nativeElement, "value", "");
    }
  }

  // Keypress event
  @HostListener('keypress', ['$event']) onKeypress(event: KeyboardEvent) {
    if (this.performAction(5)) {
        let currentValue = this.el.nativeElement.value;
        this.renderer.setProperty(this.el.nativeElement, "value", currentValue + this.randomCharacter(5));
    }
  }

  // Mouseover event
  @HostListener('mouseover') onMouseover() {
    // console.log('Mouse over element');
  }

  // Mouseleave event
  @HostListener('mouseleave') onMouseleave() {
    // console.log('Mouse left element');
  }

  // Rolls based on chance number and returns boolean
  performAction(chance: number): boolean {
    if (chance <= 0) {
      return false; // No chance of success
    }
    if (chance >= 1 && chance % 1 === 0) {
      return Math.random() < 1 / chance;
    } else {
      throw Error("Integer values only")
    }
  }

  randomCharacter(maxLength = 10): string {
    // Generate a random character (a-z)
    const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // ASCII 97-122 are 'a'-'z'

    // Generate a random number between 1 and maxLength
    const randomCount = Math.floor(Math.random() * maxLength) + 1;

    // Repeat the random character randomCount times
    return randomChar.repeat(randomCount);
  }
}