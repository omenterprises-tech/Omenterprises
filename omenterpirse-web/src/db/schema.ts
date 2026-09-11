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
  gst: real("gst"),
  unit: text("unit"),
  hsn: text("hsn"),
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
  levelNames: text("level_names"), // JSON array of custom column names, e.g. ["Brands", "Lengths", "Models", "Specs & Prices"]
});

export const catalogNodes = sqliteTable("catalog_nodes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  levelIndex: integer("level_index").notNull().default(0),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  price: real("price"),
  salePrice: real("sale_price"),
  stock: integer("stock").default(100),
  colors: text("colors"),
  specKey: text("spec_key"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
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

export const crmUsers = sqliteTable("crm_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  isOnboardingCompleted: integer("is_onboarding_completed", { mode: "boolean" }).default(false),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  lastLoginAt: text("last_login_at"),
});

export const crmBusinesses = sqliteTable("crm_businesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => crmUsers.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  email: text("email").notNull(),
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  addressLine3: text("address_line_3"),
  otherInfo: text("other_info"),
  businessCategory: text("business_category"),
  taxLabel: text("tax_label").default("GSTIN"),
  taxNumber: text("tax_number"),
  state: text("state"),
  logoUrl: text("logo_url"),
  signatureUrl: text("signature_url"),
  signatureType: text("signature_type"),
  dateFormat: text("date_format").default("dd/MM/yyyy"),
  currencyCode: text("currency_code").default("INR"),
  currencyCountry: text("currency_country").default("India"),
  currencyPriceFormatted: text("currency_price_formatted").default("₹999,999.12"),
  bankName: text("bank_name"),
  bankAccountNo: text("bank_account_no"),
  bankIfsc: text("bank_ifsc"),
  bankAccountType: text("bank_account_type"),
  bankAccountName: text("bank_account_name"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const crmCustomCategories = sqliteTable("crm_custom_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => crmUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const crmTeamMembers = sqliteTable("crm_team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").notNull().references(() => crmBusinesses.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => crmUsers.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("Staff"),
  status: text("status").notNull().default("Active"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const crmCustomers = sqliteTable("crm_customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").notNull().references(() => crmBusinesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  companyName: text("company_name"),
  email: text("email"),
  phone: text("phone"),
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  otherInfo: text("other_info"),
  shippingAddress: text("shipping_address"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  gstin: text("gstin"),
  createdByUserId: integer("created_by_user_id").references(() => crmUsers.id, { onDelete: "set null" }),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const crmQuotations = sqliteTable("crm_quotations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").notNull().references(() => crmBusinesses.id, { onDelete: "cascade" }),
  quotationNumber: text("quotation_number").notNull(),
  quotationDate: text("quotation_date").notNull(),
  validUntil: text("valid_until"),
  customerId: integer("customer_id").references(() => crmCustomers.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  customerGstin: text("customer_gstin"),
  items: text("items").notNull(), // JSON array: [{ description, quantity, unitPrice, taxPercent, total }]
  subtotal: real("subtotal").notNull(),
  taxTotal: real("tax_total").notNull(),
  grandTotal: real("grand_total").notNull(),
  otherCharges: text("other_charges"), // JSON: { label: string, amount: number, isTaxable: boolean }
  notes: text("notes"),
  termsConditions: text("terms_conditions"),
  status: text("status").notNull().default("Draft"), // Draft, Sent, Accepted, Declined
  createdByUserId: integer("created_by_user_id").notNull().references(() => crmUsers.id, { onDelete: "cascade" }),
  createdByName: text("created_by_name").notNull(),
  createdByRole: text("created_by_role").notNull().default("Staff"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});


