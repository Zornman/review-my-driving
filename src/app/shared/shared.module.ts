import { NgModule } from '@angular/core';

import { ShippingInformationComponent } from './components/shipping-information/shipping-information.component';

@NgModule({
  declarations: [
    ShippingInformationComponent
  ],
  imports: [ShippingInformationComponent],
  exports: []
})
export class SharedModule {}