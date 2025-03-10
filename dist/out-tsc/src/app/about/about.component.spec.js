import { TestBed } from '@angular/core/testing';
import { AboutComponent } from './about.component';
describe('AboutComponent', () => {
    let component;
    let fixture;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AboutComponent]
        })
            .compileComponents();
        fixture = TestBed.createComponent(AboutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
