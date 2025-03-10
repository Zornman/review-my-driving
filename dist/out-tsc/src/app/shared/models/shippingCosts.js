export class ShippingCost {
    firstItem;
    additionalItems;
    constructor(firstItem, additionalItems) {
        this.firstItem = firstItem;
        this.additionalItems = additionalItems;
    }
}
export class Money {
    amount;
    currency;
    constructor(amount, currency) {
        this.amount = amount;
        this.currency = currency;
    }
}
export class HandlingTime {
    from;
    to;
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }
}
export class Country {
    code;
    constructor(code) {
        this.code = code;
    }
}
export class Attributes {
    shippingType;
    country;
    variantId;
    shippingPlanId;
    handlingTime;
    shippingCost;
    constructor(shippingType, country, variantId, shippingPlanId, handlingTime, shippingCost) {
        this.shippingType = shippingType;
        this.country = country;
        this.variantId = variantId;
        this.shippingPlanId = shippingPlanId;
        this.handlingTime = handlingTime;
        this.shippingCost = shippingCost;
    }
}
export class DataItem {
    type;
    id;
    attributes;
    uid;
    constructor(type, id, attributes, uid) {
        this.type = type;
        this.id = id;
        this.attributes = attributes;
        this.uid = uid;
    }
}
export class DataData {
    data;
    error;
    constructor(data, error) {
        this.data = data;
        this.error = error;
    }
}
export class ShippingData {
    shipping_info;
    type;
    constructor(data, type) {
        this.shipping_info = data;
        this.type = type;
    }
}
