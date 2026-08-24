import { sqliteTable, text, integer, blob, real, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  fullName: text("full_name"),
  role: text("role").default("user"), // user, admin
  address: text("address"), // Default shipping address
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  lastLoginAt: text("last_login_at"),
});

export const otpVerifications = sqliteTable("otp_verifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});


export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: real("base_price").notNull(),
  salePrice: real("sale_price"),
  images: text("images"), // JSON string array of URLs
  category: text("category"),
  tags: text("tags"),       // comma-separated tags
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  specifications: text("specifications"), // JSON string array of { key: string, value: string }
  colorImages: text("color_images"),       // JSON string map of color -> images array
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const productVariations = sqliteTable("product_variations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  size: text("size").notNull(), // This is the weight (e.g., 100g)
  stock: integer("stock").notNull().default(0),
  sku: text("sku"),
  mrp: real("mrp"),
  salePrice: real("sale_price"),
  color: text("color"),
  imageUrl: text("image_url"),
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id), 
  productId: integer("product_id").references(() => products.id),
  variationId: integer("variation_id").references(() => productVariations.id),
  quantity: integer("quantity").notNull().default(1),
  price: real("price").notNull(),
});


export const navigationMenu = sqliteTable("navigation_menu", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  href: text("href").notNull(),
  order: integer("order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  imageUrl: text("image_url"),
});

export const pageSections = sqliteTable("page_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  menuId: integer("menu_id").notNull().references(() => navigationMenu.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  productIds: text("product_ids").notNull(), // Comma-separated or JSON string of product IDs
  displayOrder: integer("display_order").notNull().default(0),
});



export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  totalAmount: real("total_amount").notNull(),
  status: text("status").default("Order Placed"), // Order Placed, Processing, Shipped, In Transit, Out for Delivery, Delivered, Cancelled
  shippingAddress: text("shipping_address"),
  paymentId: text("payment_id"),
  razorpayOrderId: text("razorpay_order_id"),
  paymentMode: text("payment_mode"),
  paymentStatus: text("payment_status"),
  amountPaid: real("amount_paid"),
  razorpayPaymentId: text("razorpay_payment_id"),
  orderStatus: text("order_status").default("0_PLACED"), // Valid states: '0_PLACED', '1_CONFIRMED', '2_PROCESSING', 'CANCELLED'
  shippingStatus: text("shipping_status").default("PENDING"), // Valid states: 'PENDING', '3_AWB_GENERATED', '4_PICKUP_REQUESTED', 'PICKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'SHIPMENT_CANCELLED'
  awbNumber: text("awb_number"),
  shippingDetails: text("shipping_details"),
  cancelReason: text("cancel_reason"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  variationId: integer("variation_id").references(() => productVariations.id),
  quantity: integer("quantity").notNull().default(1),
  price: real("price").notNull(),
  size: text("size").notNull(),
  color: text("color"),
  customizations: text("customizations"), // JSON string
});

export const homeCategoryBanners = sqliteTable("home_category_banners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  mobileImageUrl: text("mobile_image_url"),
  linkHref: text("link_href").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const homeTabs = sqliteTable("home_tabs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  linkHref: text("link_href"),
  imageUrl: text("image_url"), // Path to icon or image
  displayOrder: integer("display_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const packageTiers = sqliteTable("package_tiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  maxWeightGrams: integer("max_weight_grams").notNull(),
  lengthCm: integer("length_cm").notNull(),
  breadthCm: integer("breadth_cm").notNull(),
  heightCm: integer("height_cm").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("max_weight_idx").on(table.maxWeightGrams)
]);

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  tagline: text("tagline"),
});

export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const brandLengths = sqliteTable("brand_lengths", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  lengthInMeters: text("length_in_meters").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const brandModels = sqliteTable("brand_models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandLengthId: integer("brand_length_id").references(() => brandLengths.id, { onDelete: "cascade" }),
  brandId: integer("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const brandVariations = sqliteTable("brand_variations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  modelId: integer("model_id").references(() => brandModels.id, { onDelete: "cascade" }),
  brandId: integer("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  thickness: text("thickness"),
  colors: text("colors"),
  price: real("price").notNull(),
  salePrice: real("sale_price"),
  stock: integer("stock").notNull().default(100),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

