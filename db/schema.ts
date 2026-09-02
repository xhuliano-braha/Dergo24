import { index, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const shipments = sqliteTable('shipments', {
  id: text('id').primaryKey(),
  trackingCode: text('tracking_code').notNull().unique(),
  senderName: text('sender_name').notNull(),
  senderPhone: text('sender_phone').notNull(),
  recipientName: text('recipient_name').notNull(),
  recipientPhone: text('recipient_phone').notNull(),
  pickupCity: text('pickup_city').notNull(),
  deliveryCity: text('delivery_city').notNull(),
  address: text('address').notNull(),
  packageType: text('package_type').notNull(),
  weight: real('weight').notNull(),
  service: text('service').notNull(),
  status: text('status').notNull(),
  price: real('price').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_shipments_status_created_at').on(table.status, table.createdAt),
]);

export const trackingEvents = sqliteTable('tracking_events', {
  id: text('id').primaryKey(),
  shipmentId: text('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  location: text('location').notNull(),
  details: text('details').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_tracking_events_shipment_created').on(table.shipmentId, table.createdAt),
]);
