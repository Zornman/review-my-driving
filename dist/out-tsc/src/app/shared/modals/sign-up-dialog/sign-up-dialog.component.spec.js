import { TestBed } from '@angular/core/testing';
import { SignUpDialogComponent } from './sign-up-dialog.component';
describe('SignUpDialogComponent', () => {
    let component;
    let fixture;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SignUpDialogComponent]
        })
            .compileComponents();
        fixture = TestBed.createComponent(SignUpDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
