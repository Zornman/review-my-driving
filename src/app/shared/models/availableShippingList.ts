export class AvailableShippingList {
    uid: string;
    blueprint_id: number;
    print_provider_id: number;
    data: ShippingMethod[];
    links: AvailableShippingLink;
    quantity: number;

    constructor(data: any) {
        this.uid = data.uid;
        this.blueprint_id = data.blueprint_id;
        this.print_provider_id = data.print_provider_id;
        this.data = data.data;
        this.links = data.links;
        this.quantity = data.quantity;
    }
}
  
export class ShippingMethod {
   type: string;
   id: string;
   attributes: ShippingMethodName[];

   constructor(data: any) {
    this.type = data.type;
    this.id = data.id;
    this.attributes = data.attributes;
   }
}
  
export class ShippingMethodName {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}
  
export class AvailableShippingLink {
    [key: string]: string;
}