import { TestBed } from '@angular/core/testing';
import { MessageDialogComponent } from './message-dialog.component';
describe('MessageDialogComponent', () => {
    let component;
    let fixture;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MessageDialogComponent]
        })
            .compileComponents();
        fixture = TestBed.createComponent(MessageDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
