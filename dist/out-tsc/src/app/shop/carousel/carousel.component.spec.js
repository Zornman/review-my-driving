import { TestBed } from '@angular/core/testing';
import { CarouselComponent } from './carousel.component';
describe('CarouselComponent', () => {
    let component;
    let fixture;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CarouselComponent]
        })
            .compileComponents();
        fixture = TestBed.createComponent(CarouselComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
