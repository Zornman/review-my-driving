export class Product {
    id;
    title;
    description = '';
    safety_information;
    tags;
    options;
    variants;
    images;
    created_at;
    updated_at;
    visible;
    is_locked;
    is_printify_express_eligible;
    is_printify_express_enabled;
    is_economy_shipping_eligible;
    is_economy_shipping_enabled;
    blueprint_id;
    user_id;
    shop_id;
    print_provider_id;
    print_areas;
    views;
    sales_channel_properties;
    constructor(data) {
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
    name;
    type;
    values;
    constructor(data) {
        this.name = data.name;
        this.type = data.type;
        this.values = (data.values || []).map((value) => new OptionValue(value));
    }
}
export class OptionValue {
    id;
    title;
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
    }
}
export class Variant {
    id;
    sku;
    cost;
    price;
    title;
    grams;
    is_enabled;
    is_default;
    is_available;
    is_printify_express_eligible;
    options;
    constructor(data) {
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
    src;
    variant_ids;
    position;
    is_default;
    constructor(data) {
        this.src = data.src;
        this.variant_ids = data.variant_ids || [];
        this.position = data.position;
        this.is_default = data.is_default;
    }
}
export class PrintArea {
    variant_ids;
    placeholders;
    background;
    constructor(data) {
        this.variant_ids = data.variant_ids || [];
        this.placeholders = (data.placeholders || []).map((placeholder) => new Placeholder(placeholder));
        this.background = data.background;
    }
}
export class Placeholder {
    position;
    images;
    constructor(data) {
        this.position = data.position;
        this.images = (data.images || []).map((image) => new PlaceholderImage(image));
    }
}
export class PlaceholderImage {
    id;
    name;
    type;
    height;
    width;
    x;
    y;
    scale;
    angle;
    src;
    font_family;
    font_size;
    font_weight;
    font_color;
    input_text;
    constructor(data) {
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
    id;
    label;
    position;
    files;
    constructor(data) {
        this.id = data.id;
        this.label = data.label;
        this.position = data.position;
        this.files = (data.files || []).map((file) => new ViewFile(file));
    }
}
export class ViewFile {
    src;
    variant_ids;
    constructor(data) {
        this.src = data.src;
        this.variant_ids = data.variant_ids || [];
    }
}
