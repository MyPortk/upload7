import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('user'),
  email: text("email").notNull(),
  name: text("name").notNull(),
  department: text("department")
});

export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  barcode: text("barcode").notNull().unique(),
  productName: text("product_name").notNull(),
  productNameAr: text("product_name_ar"),
  productType: text("product_type").notNull(),
  productTypeAr: text("product_type_ar"),
  status: text("status").notNull().default('Available'),
  location: text("location"),
  notes: text("notes"),
  isEquipment: boolean("is_equipment").notNull().default(true),
  maintenanceAvailableDate: date("maintenance_available_date"),
  checkoutCount: text("checkout_count").notNull().default('0'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default('pending'),
  requestDate: timestamp("request_date").notNull().default(sql`CURRENT_TIMESTAMP`),
  approvalDate: timestamp("approval_date"),
  startDate: date("start_date").notNull(),
  returnDate: date("return_date").notNull(),
  startTime: text("start_time"),
  returnTime: text("return_time"),
  purposeOfUse: text("purpose_of_use"),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  itemConditionOnReceive: text("item_condition_on_receive"),
  itemConditionOnReturn: text("item_condition_on_return"),
  returnNotes: text("return_notes"),
  checkoutDate: timestamp("checkout_date"),
  returnedDate: timestamp("returned_date"),
  deliveryRequired: text("delivery_required").default('no'),
  deliveryLocation: text("delivery_location"),
  deliveryStreet: text("delivery_street"),
  deliveryArea: text("delivery_area"),
  googleMapLink: text("google_map_link")
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  image: text("image").notNull(),
  subTypes: text("sub_types").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  isEquipment: boolean("is_equipment").notNull().default(true),
  showQuantity: boolean("show_quantity").notNull().default(true),
  showLocation: boolean("show_location").notNull().default(true),
  showNotes: boolean("show_notes").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: text("is_read").notNull().default('false'),
  relatedId: varchar("related_id"),
  notificationFor: text("notification_for").notNull().default('user'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  oldStatus: text("old_status"),
  newStatus: text("new_status"),
  notes: text("notes"),
  timestamp: timestamp("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const itemEditHistory = pgTable("item_edit_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  fieldName: text("field_name").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  timestamp: timestamp("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const reservationStatusHistory = pgTable("reservation_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").notNull().references(() => reservations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  oldStatus: text("old_status"),
  newStatus: text("new_status").notNull(),
  notes: text("notes"),
  timestamp: timestamp("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const damageReports = pgTable("damage_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id),
  reportedBy: varchar("reported_by").notNull().references(() => users.id),
  reportType: text("report_type").notNull(),
  severity: text("severity").notNull().default('medium'),
  description: text("description").notNull(),
  status: text("status").notNull().default('open'),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: timestamp("resolved_at")
});

export const systemPermissions = pgTable("system_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const damageReportsRelations = relations(damageReports, ({ one }) => ({
  reportedByUser: one(users, {
    fields: [damageReports.reportedBy],
    references: [users.id]
  }),
  item: one(items, {
    fields: [damageReports.itemId],
    references: [items.id]
  })
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  checkoutCount: true
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  requestDate: true,
  approvalDate: true
}).extend({
  startDate: z.union([z.date(), z.string().transform(val => new Date(val + 'T00:00:00'))]),
  returnDate: z.union([z.date(), z.string().transform(val => new Date(val + 'T00:00:00'))])
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

export const insertItemEditHistorySchema = createInsertSchema(itemEditHistory).omit({
  id: true,
  timestamp: true
});

export const insertReservationStatusHistorySchema = createInsertSchema(reservationStatusHistory).omit({
  id: true,
  timestamp: true
});

export const insertDamageReportSchema = createInsertSchema(damageReports).omit({
  id: true,
  createdAt: true,
  resolvedAt: true
});

export const itemEditHistoryRelations = relations(itemEditHistory, ({ one }) => ({
  item: one(items, {
    fields: [itemEditHistory.itemId],
    references: [items.id],
  }),
  user: one(users, {
    fields: [itemEditHistory.userId],
    references: [users.id],
  }),
}));

export const reservationStatusHistoryRelations = relations(reservationStatusHistory, ({ one }) => ({
  reservation: one(reservations, {
    fields: [reservationStatusHistory.reservationId],
    references: [reservations.id],
  }),
  user: one(users, {
    fields: [reservationStatusHistory.userId],
    references: [users.id],
  }),
}));

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertItemEditHistory = z.infer<typeof insertItemEditHistorySchema>;
export type ItemEditHistory = typeof itemEditHistory.$inferSelect;
export type InsertReservationStatusHistory = z.infer<typeof insertReservationStatusHistorySchema>;
export type ReservationStatusHistory = typeof reservationStatusHistory.$inferSelect;
export type InsertDamageReport = z.infer<typeof insertDamageReportSchema>;
export type DamageReport = typeof damageReports.$inferSelect;
export type SystemPermission = typeof systemPermissions.$inferSelect;

export const SYSTEM_PERMISSIONS = {
  SHOW_ASSETS: 'show_assets',
  SHOW_LANGUAGE_TOGGLE: 'show_language_toggle'
} as const;

export const ITEM_STATUSES = ['Available', 'In Use', 'Reserved', 'Maintenance'] as const;

export const EQUIPMENT_CATEGORIES = {
  cameras: {
    name: 'Cameras',
    subTypes: ['Camera', 'Action Cam'] as const,
    image: 'https://lh3.googleusercontent.com/d/1-Z87CTvH0wPvHS9_8kw8mLaKCKXjqil1'
  },
  lenses: {
    name: 'Lenses',
    subTypes: ['Lenses', 'Filter', 'Digital Filter'] as const,
    image: 'https://lh3.googleusercontent.com/d/1-DGepObAXbNEhqw0mIP_tyIcfimwrx2C'
  },
  tripods_stands: {
    name: 'Tripods & Stands',
    subTypes: ['Stands', 'Monopod', 'Small Tripods', 'Backdrop Stands'] as const,
    image: 'https://lh3.googleusercontent.com/d/1FaliGAGLkUnW9KDxxHMvw3KW2DfoH8c1'
  },
  grips: {
    name: 'Grips',
    subTypes: ['Crane', 'Dolly / Wheels Tripod', 'Shoulder Rig', 'Spider Rig', 'Gimbal', 'Slider', 'Rig', 'Rig & Stabilization Gear', 'Camera Support Equipment'] as const,
    image: 'https://lh3.googleusercontent.com/d/1KRw5YhBCA88dYsDDyFZlp6DOnE2Awmfq'
  },
  audio: {
    name: 'Audio',
    subTypes: ['Mic', 'Microphone', 'Wireless Device', 'Recorder', 'Mixer', 'Boom Arm', 'Transmitter', 'Receiver'] as const,
    image: 'https://lh3.googleusercontent.com/d/1gnem5s0ozRwdCf55Nix41RPyhawL6ZGH'
  },
  lighting: {
    name: 'Lighting',
    subTypes: ['LED', 'LED Light', 'LED Ring', 'RGB Lights', 'Soft Box', 'Light', 'Lighting Equipment'] as const,
    image: 'https://lh3.googleusercontent.com/d/15BnN5js0c8P5OlBODZuCb8JPAqY3lSOM'
  },
  studio_accessories: {
    name: 'Studio Accessories',
    subTypes: ['Clapper', 'Reflector', 'Kit', 'Background Screen'] as const,
    image: 'https://lh3.googleusercontent.com/d/1YVvQZqFCuLWnmeRrh76Wrt7qjJAoi3kC'
  },
  bags_cases: {
    name: 'Bags & Cases',
    subTypes: ['Bag', 'Bags & Cases', 'Backpacks'] as const,
    image: 'https://lh3.googleusercontent.com/d/18Am1k51Q8O37uMHwZhyo4UtjJbBaVJ8e'
  },
  batteries_power: {
    name: 'Batteries & Power',
    subTypes: ['Battery', 'Charger', 'Power Bank', 'V-Mount Battery', 'Battery Power Tester', 'Power & Accessories', 'Inverter'] as const,
    image: 'https://lh3.googleusercontent.com/d/1OxWWTanWaURwvd30tdxuIiLkMNJVtdI2'
  },
  cables_adapters: {
    name: 'Cables & Adapters',
    subTypes: ['Cable', 'Socket', 'Extension'] as const,
    image: 'https://lh3.googleusercontent.com/d/1y8yKviZfE6HrOH4AZ3tbO0DlC_wPf4YV'
  },
  monitors_displays: {
    name: 'Monitors & Displays',
    subTypes: ['Monitor', 'Screen', 'Computing & Display'] as const,
    image: 'https://lh3.googleusercontent.com/d/1YbxGiUSJi4evWIAjQ_9KjiZxjV6gRayG'
  },
  storage_devices: {
    name: 'Storage Devices',
    subTypes: ['Storage Devices'] as const,
    image: 'https://lh3.googleusercontent.com/d/1ZIaWGZzBSZcap9GcNWA4mNxD4SSpsVju'
  }
} as const;

export const ASSET_CATEGORIES = {
  softwares: {
    name: 'Softwares',
    subTypes: ['Editing Software', 'Design Software', 'Office Software'] as const,
    image: 'https://lh3.googleusercontent.com/d/1Alz0ej_MoYq6cRlMhopITCC4Sg8Ot97k'
  },
  office_supplies: {
    name: 'Office Supplies',
    subTypes: ['Stationery', 'Desk Items', 'Printer Supplies'] as const,
    image: 'https://lh3.googleusercontent.com/d/1RZriQu75nBvdDofV8tRk1sfwF1Ceujun'
  },
  pantry: {
    name: 'Pantry',
    subTypes: ['Snacks', 'Disposable Items'] as const,
    image: 'https://lh3.googleusercontent.com/d/1wwNa5v7FSsqzHBgO3X1GgVBqQ3Ph9E2E'
  },
  transportation: {
    name: 'Transportation',
    subTypes: ['Vehicles', 'Delivery Equipment', 'Travel Accessories'] as const,
    image: 'https://lh3.googleusercontent.com/d/1B61BfekuF03VybvTy_PrPbN4FOiPDrsR'
  },
  furniture: {
    name: 'Furniture',
    subTypes: ['Chairs', 'Tables', 'Storage Units'] as const,
    image: 'https://lh3.googleusercontent.com/d/1Xf2ofNhcv2ETW-VnE8aNiI15HWTWhMod'
  },
  communication: {
    name: 'Communication',
    subTypes: ['SIM Cards', 'Mobile Devices', 'Internet Devices'] as const,
    image: 'https://lh3.googleusercontent.com/d/1PGXm8SL4bs3v5xYXhoEY5ojpKU1s7dL0'
  },
  uniforms_branding: {
    name: 'Uniforms & Branding',
    subTypes: ['Uniforms', 'Badges', 'Tags', 'T-Shirts', 'Tote Bags', 'Uniform Bags'] as const,
    image: 'https://lh3.googleusercontent.com/d/1VMOY_1cNAfgWoLK7yC1jco3rTcKJg-Ss'
  }
} as const;

export const CATEGORIES = { ...EQUIPMENT_CATEGORIES, ...ASSET_CATEGORIES } as const;
