import { __decorate, __param } from "tslib";
import { Component, Inject, Input, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
let CarouselComponent = class CarouselComponent {
    platformId;
    images;
    carouselTrack;
    currentIndex = 0;
    track;
    constructor(platformId) {
        this.platformId = platformId;
    }
    ngOnInit() {
        // Ensure any DOM-dependent logic only happens in the browser
        if (isPlatformBrowser(this.platformId)) {
            this.track = document.querySelector('.carousel-track');
            if (!this.track) {
                console.error('Carousel track not found');
            }
        }
    }
    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.track = this.carouselTrack.nativeElement;
            if (!this.track) {
                console.error('Carousel track not found');
            }
            else {
                this.updateCarousel(); // Ensure proper rendering of the carousel
            }
        }
    }
    next() {
        if (isPlatformBrowser(this.platformId) && this.track) {
            const totalItems = this.track.children.length;
            if (this.currentIndex < totalItems - 1) {
                this.currentIndex++;
                this.updateCarousel();
            }
        }
    }
    prev() {
        if (isPlatformBrowser(this.platformId) && this.track) {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateCarousel();
            }
        }
    }
    updateCarousel() {
        if (isPlatformBrowser(this.platformId) && this.track && this.images?.length) {
            const width = this.track.clientWidth;
            this.track.style.transform = `translateX(-${this.currentIndex * width}px)`;
        }
    }
};
__decorate([
    Input()
], CarouselComponent.prototype, "images", void 0);
__decorate([
    ViewChild('carouselTrack')
], CarouselComponent.prototype, "carouselTrack", void 0);
CarouselComponent = __decorate([
    Component({
        selector: 'app-carousel',
        imports: [CommonModule],
        templateUrl: './carousel.component.html',
        styleUrl: './carousel.component.scss'
    }),
    __param(0, Inject(PLATFORM_ID))
], CarouselComponent);
export { CarouselComponent };
