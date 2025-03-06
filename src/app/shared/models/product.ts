export class Product {
  id: string;
  title: string;
  description: string = '';
  safety_information: string;
  tags: string[];
  options: OptionArray[];
  variants: Variant[];
  images: ImageArray[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  is_printify_express_eligible: boolean;
  is_printify_express_enabled: boolean;
  is_economy_shipping_eligible: boolean;
  is_economy_shipping_enabled: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
  print_areas: PrintArea[];
  views: View[];
  sales_channel_properties: any[];

  constructor(data: any) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.safety_information = data.safety_information;
    this.tags = data.tags;
    this.options = data.options;
    this.variants = data.variants;
    this.images = data.images;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.visible = data.visible;
    this.is_locked = data.is_locked;
    this.is_printify_express_eligible = data.is_printify_express_eligible;
    this.is_printify_express_enabled = data.is_printify_express_enabled;
    this.is_economy_shipping_eligible = data.is_economy_shipping_eligible;
    this.is_economy_shipping_enabled = data.is_economy_shipping_enabled;
    this.blueprint_id = data.blueprint_id;
    this.user_id = data.user_id;
    this.shop_id = data.shop_id;
    this.print_provider_id = data.print_provider_id;
    this.print_areas = data.print_areas;
    this.views = data.views;
    this.sales_channel_properties = data.sales_channel_properties;
  }
}

export class OptionArray {
  name: string;
  type: string;
  values: OptionValue[];

  constructor(data: any) {
    this.name = data.name;
    this.type = data.type;
    this.values = (data.values || []).map((value: any) => new OptionValue(value));
  }
}

export class OptionValue {
  id: number;
  title: string;

  constructor(data: any) {
    this.id = data.id;
    this.title = data.title;
  }
}

export class Variant {
  id: number;
  sku: string;
  cost: number;
  price: number;
  title: string;
  grams: number;
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  is_printify_express_eligible: boolean;
  options: number[];

  constructor(data: any) {
    this.id = data.id;
    this.sku = data.sku;
    this.cost = data.cost;
    this.price = data.price;
    this.title = data.title;
    this.grams = data.grams;
    this.is_enabled = data.is_enabled;
    this.is_default = data.is_default;
    this.is_available = data.is_available;
    this.is_printify_express_eligible = data.is_printify_express_eligible;
    this.options = data.options || [];
  }
}

export class ImageArray {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;

  constructor(data: any) {
    this.src = data.src;
    this.variant_ids = data.variant_ids || [];
    this.position = data.position;
    this.is_default = data.is_default;
  }
}

export class PrintArea {
  variant_ids: number[];
  placeholders: Placeholder[];
  background: string;

  constructor(data: any) {
    this.variant_ids = data.variant_ids || [];
    this.placeholders = (data.placeholders || []).map((placeholder: any) => new Placeholder(placeholder));
    this.background = data.background;
  }
}

export class Placeholder {
  position: string;
  images: PlaceholderImage[];

  constructor(data: any) {
    this.position = data.position;
    this.images = (data.images || []).map((image: any) => new PlaceholderImage(image));
  }
}

export class PlaceholderImage {
  id: string;
  name: string;
  type: string;
  height: number;
  width: number;
  x: number;
  y: number;
  scale: number;
  angle: number;
  src?: string;
  font_family?: string;
  font_size?: number;
  font_weight?: number;
  font_color?: string;
  input_text?: string;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.height = data.height;
    this.width = data.width;
    this.x = data.x;
    this.y = data.y;
    this.scale = data.scale;
    this.angle = data.angle;
    this.src = data.src;
    this.font_family = data.font_family;
    this.font_size = data.font_size;
    this.font_weight = data.font_weight;
    this.font_color = data.font_color;
    this.input_text = data.input_text;
  }
}

export class View {
  id: number;
  label: string;
  position: string;
  files: ViewFile[];

  constructor(data: any) {
    this.id = data.id;
    this.label = data.label;
    this.position = data.position;
    this.files = (data.files || []).map((file: any) => new ViewFile(file));
  }
}

export class ViewFile {
  src: string;
  variant_ids: number[];

  constructor(data: any) {
    this.src = data.src;
    this.variant_ids = data.variant_ids || [];
  }
}
