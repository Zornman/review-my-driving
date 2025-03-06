export class ShippingCost {
    firstItem: Money;
    additionalItems: Money;
  
    constructor(firstItem: Money, additionalItems: Money) {
      this.firstItem = firstItem;
      this.additionalItems = additionalItems;
    }
}
  
export class Money {
    amount: number;
    currency: string;
  
    constructor(amount: number, currency: string) {
      this.amount = amount;
      this.currency = currency;
    }
}
  
export class HandlingTime {
    from: number;
    to: number;
  
    constructor(from: number, to: number) {
      this.from = from;
      this.to = to;
    }
}
  
export class Country {
    code: string;
  
    constructor(code: string) {
      this.code = code;
    }
}
  
export class Attributes {
    shippingType: string;
    country: Country;
    variantId: number;
    shippingPlanId: string;
    handlingTime: HandlingTime;
    shippingCost: ShippingCost;
  
    constructor(
      shippingType: string,
      country: Country,
      variantId: number,
      shippingPlanId: string,
      handlingTime: HandlingTime,
      shippingCost: ShippingCost
    ) {
      this.shippingType = shippingType;
      this.country = country;
      this.variantId = variantId;
      this.shippingPlanId = shippingPlanId;
      this.handlingTime = handlingTime;
      this.shippingCost = shippingCost;
    }
}
  
export class DataItem {
    type: string;
    id: string;
    attributes: Attributes;
    uid: string;
  
    constructor(type: string, id: string, attributes: Attributes, uid: string) {
      this.type = type;
      this.id = id;
      this.attributes = attributes;
      this.uid = uid;
    }
}

export class DataData {
  data: DataItem[];
  error: string | null;

  constructor(data: DataItem[], error: string) {
    this.data = data;
    this.error = error;
  }
}
  
export class ShippingData {
    shipping_info: DataData;
    type: string;
  
    constructor(data: DataData, type: string) {
      this.shipping_info = data;
      this.type = type;
    }
}
  