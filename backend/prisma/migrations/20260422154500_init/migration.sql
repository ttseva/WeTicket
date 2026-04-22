-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('client', 'organizer', 'admin');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('theatre', 'cinema', 'concert', 'conference');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'active', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('free', 'blocked', 'group_blocked', 'sold');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'paid', 'cancelled', 'expired', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'wallet', 'sbp');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'success', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "GroupSessionStatus" AS ENUM ('active', 'completed', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('email', 'push');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "date_of_birth" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'client',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "organizers" (
    "organizer_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_name" VARCHAR(255),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "organizers_pkey" PRIMARY KEY ("organizer_id")
);

-- CreateTable
CREATE TABLE "admins" (
    "admin_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "department" VARCHAR(100),
    "last_login" TIMESTAMP(3),

    CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "venues" (
    "venue_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "seats_per_row" INTEGER NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("venue_id")
);

-- CreateTable
CREATE TABLE "events" (
    "event_id" UUID NOT NULL,
    "organizer_id" UUID,
    "venue_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL,
    "date_time" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "venue" VARCHAR(255) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100),
    "min_age" INTEGER NOT NULL DEFAULT 0,
    "poster_url" VARCHAR(500),
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "group_sessions" (
    "session_id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "invite_link" VARCHAR(500) NOT NULL,
    "total_seats" INTEGER NOT NULL,
    "participants_count" INTEGER NOT NULL DEFAULT 0,
    "status" "GroupSessionStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "seats" (
    "seat_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "seat_number" INTEGER NOT NULL,
    "sector" VARCHAR(50),
    "price" DECIMAL(10,2) NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'free',
    "locked_until" TIMESTAMP(3),
    "group_session_id" UUID,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("seat_id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "booking_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "group_session_id" UUID,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "booking_item_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "seat_id" UUID NOT NULL,
    "price_at_booking" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("booking_item_id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "ticket_id" UUID NOT NULL,
    "booking_item_id" UUID NOT NULL,
    "qr_code" VARCHAR(500) NOT NULL,
    "pdf_url" VARCHAR(500),
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "transaction_id" VARCHAR(255),
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "status" "DeliveryStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizers_user_id_key" ON "organizers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_user_id_key" ON "admins"("user_id");

-- CreateIndex
CREATE INDEX "idx_events_category_datetime" ON "events"("category", "date_time");

-- CreateIndex
CREATE INDEX "idx_events_city" ON "events"("city");

-- CreateIndex
CREATE UNIQUE INDEX "group_sessions_invite_link_key" ON "group_sessions"("invite_link");

-- CreateIndex
CREATE INDEX "idx_group_sessions_event_id" ON "group_sessions"("event_id");

-- CreateIndex
CREATE INDEX "idx_seats_status_locked_until" ON "seats"("status", "locked_until");

-- CreateIndex
CREATE UNIQUE INDEX "uq_seat_event_row_number" ON "seats"("event_id", "row_number", "seat_number");

-- CreateIndex
CREATE INDEX "idx_bookings_user_created_at" ON "bookings"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_bookings_event_status" ON "bookings"("event_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_booking_item_booking_seat" ON "booking_items"("booking_id", "seat_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_booking_item_id_key" ON "tickets"("booking_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qr_code_key" ON "tickets"("qr_code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_booking_id_key" ON "payments"("booking_id");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_email_verification_tokens_user_id" ON "email_verification_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "organizers" ADD CONSTRAINT "organizers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("organizer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("venue_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_sessions" ADD CONSTRAINT "group_sessions_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_sessions" ADD CONSTRAINT "group_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_group_session_id_fkey" FOREIGN KEY ("group_session_id") REFERENCES "group_sessions"("session_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_group_session_id_fkey" FOREIGN KEY ("group_session_id") REFERENCES "group_sessions"("session_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("seat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_booking_item_id_fkey" FOREIGN KEY ("booking_item_id") REFERENCES "booking_items"("booking_item_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

