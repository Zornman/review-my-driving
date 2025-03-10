export class AvailableShippingList {
    uid;
    blueprint_id;
    print_provider_id;
    data;
    links;
    quantity;
    constructor(data) {
        this.uid = data.uid;
        this.blueprint_id = data.blueprint_id;
        this.print_provider_id = data.print_provider_id;
        this.data = data.data;
        this.links = data.links;
        this.quantity = data.quantity;
    }
}
export class ShippingMethod {
    type;
    id;
    attributes;
    constructor(data) {
        this.type = data.type;
        this.id = data.id;
        this.attributes = data.attributes;
    }
}
export class ShippingMethodName {
    name;
    constructor(name) {
        this.name = name;
    }
}
export class AvailableShippingLink {
}
