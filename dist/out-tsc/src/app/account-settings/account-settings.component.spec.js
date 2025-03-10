import { TestBed } from '@angular/core/testing';
import { AccountSettingsComponent } from './account-settings.component';
describe('AccountSettingsComponent', () => {
    let component;
    let fixture;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AccountSettingsComponent]
        })
            .compileComponents();
        fixture = TestBed.createComponent(AccountSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
