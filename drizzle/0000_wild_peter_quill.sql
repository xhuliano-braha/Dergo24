CREATE TABLE `shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`tracking_code` text NOT NULL,
	`sender_name` text NOT NULL,
	`sender_phone` text NOT NULL,
	`recipient_name` text NOT NULL,
	`recipient_phone` text NOT NULL,
	`pickup_city` text NOT NULL,
	`delivery_city` text NOT NULL,
	`address` text NOT NULL,
	`package_type` text NOT NULL,
	`weight` real NOT NULL,
	`service` text NOT NULL,
	`status` text NOT NULL,
	`price` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shipments_tracking_code_unique` ON `shipments` (`tracking_code`);--> statement-breakpoint
CREATE INDEX `idx_shipments_status_created_at` ON `shipments` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `tracking_events` (
	`id` text PRIMARY KEY NOT NULL,
	`shipment_id` text NOT NULL,
	`status` text NOT NULL,
	`location` text NOT NULL,
	`details` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tracking_events_shipment_created` ON `tracking_events` (`shipment_id`,`created_at`);