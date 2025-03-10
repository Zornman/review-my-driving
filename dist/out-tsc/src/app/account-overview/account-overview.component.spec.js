import { TestBed } from '@angular/core/testing';
import { AccountOverviewComponent } from './account-overview.component';
describe('AccountOverviewComponent', () => {
    let component;
    let fixture;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AccountOverviewComponent]
        })
            .compileComponents();
        fixture = TestBed.createComponent(AccountOverviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
