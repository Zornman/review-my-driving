import { AfterViewInit, Component, ElementRef, Inject, Input, PLATFORM_ID, ViewChild } from '@angular/core';
import { ImageArray } from '../../shared/models/product';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-carousel',
  imports: [ CommonModule ],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss'
})
export class CarouselComponent implements AfterViewInit {
  @Input() images!: ImageArray[];
  @ViewChild('carouselTrack') carouselTrack!: ElementRef;
  private currentIndex: number = 0;
  private track!: HTMLElement;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    // Ensure any DOM-dependent logic only happens in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.track = document.querySelector('.carousel-track') as HTMLElement;

      if (!this.track) {
        console.error('Carousel track not found');
      }
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.track = this.carouselTrack.nativeElement as HTMLElement;
  
      if (!this.track) {
        console.error('Carousel track not found');
      } else {
        this.updateCarousel(); // Ensure proper rendering of the carousel
      }
    }
  }

  next(): void {
    if (isPlatformBrowser(this.platformId) && this.track) {
      const totalItems = this.track.children.length;
      if (this.currentIndex < totalItems - 1) {
        this.currentIndex++;
        this.updateCarousel();
      }
    }
  }

  prev(): void {
    if (isPlatformBrowser(this.platformId) && this.track) {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.updateCarousel();
      }
    }
  }

  private updateCarousel(): void {
    if (isPlatformBrowser(this.platformId) && this.track && this.images?.length) {
      const width = this.track.clientWidth;
      this.track.style.transform = `translateX(-${this.currentIndex * width}px)`;
    }
  }
}