import { __decorate } from "tslib";
import { Directive, HostListener } from '@angular/core';
let RandomizeInputDirective = class RandomizeInputDirective {
    el;
    renderer;
    constructor(el, renderer) {
        this.el = el;
        this.renderer = renderer;
    }
    // Focus event
    onFocus() {
        if (this.performAction(7)) {
            this.el.nativeElement.blur();
        }
    }
    // Blur event
    onBlur() {
        if (this.performAction(5)) {
            const currentValue = this.el.nativeElement.value;
            this.renderer.setProperty(this.el.nativeElement, "value", "");
        }
    }
    // Keypress event
    onKeypress(event) {
        if (this.performAction(10)) {
            const currentValue = this.el.nativeElement.value;
            this.renderer.setProperty(this.el.nativeElement, "value", currentValue + this.randomCharacter(1));
        }
    }
    // Mouseover event
    onMouseover() {
        // console.log('Mouse over element');
    }
    // Mouseleave event
    onMouseleave() {
        // console.log('Mouse left element');
    }
    // Rolls based on chance number and returns boolean
    performAction(chance) {
        if (chance <= 0) {
            return false; // No chance of success
        }
        if (chance >= 1 && chance % 1 === 0) {
            return Math.random() < 1 / chance;
        }
        else {
            throw Error("Integer values only");
        }
    }
    randomCharacter(maxLength = 10) {
        // Generate a random character (a-z)
        const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // ASCII 97-122 are 'a'-'z'
        // Generate a random number between 1 and maxLength
        const randomCount = Math.floor(Math.random() * maxLength) + 1;
        // Repeat the random character randomCount times
        return randomChar.repeat(randomCount);
    }
};
__decorate([
    HostListener('focus')
], RandomizeInputDirective.prototype, "onFocus", null);
__decorate([
    HostListener('blur')
], RandomizeInputDirective.prototype, "onBlur", null);
__decorate([
    HostListener('keypress', ['$event'])
], RandomizeInputDirective.prototype, "onKeypress", null);
__decorate([
    HostListener('mouseover')
], RandomizeInputDirective.prototype, "onMouseover", null);
__decorate([
    HostListener('mouseleave')
], RandomizeInputDirective.prototype, "onMouseleave", null);
RandomizeInputDirective = __decorate([
    Directive({
        selector: '[randomizeInput]',
        standalone: true
    })
], RandomizeInputDirective);
export { RandomizeInputDirective };
