CREATE TYPE "public"."gift_status" AS ENUM('pending', 'redeemed');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('pending', 'fulfilled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."two_factor_method" AS ENUM('totp', 'sms');--> statement-breakpoint
CREATE TABLE "gifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(128) NOT NULL,
	"senderUserId" integer NOT NULL,
	"recipientEmail" varchar(320) NOT NULL,
	"recipientName" varchar(255),
	"message" text,
	"productKey" varchar(32) NOT NULL,
	"stripeSessionId" varchar(255) NOT NULL,
	"amountCents" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'usd' NOT NULL,
	"status" "gift_status" DEFAULT 'pending' NOT NULL,
	"redeemedByUserId" integer,
	"redeemedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gifts_token_unique" UNIQUE("token"),
	CONSTRAINT "gifts_stripeSessionId_unique" UNIQUE("stripeSessionId")
);
--> statement-breakpoint
CREATE TABLE "pending_two_factor" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(128) NOT NULL,
	"userId" integer NOT NULL,
	"openId" varchar(64) NOT NULL,
	"userName" text,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_two_factor_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"stripeSessionId" varchar(255) NOT NULL,
	"stripePaymentIntentId" varchar(255),
	"productKey" varchar(32) NOT NULL,
	"amountCents" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'usd' NOT NULL,
	"status" "purchase_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_stripeSessionId_unique" UNIQUE("stripeSessionId")
);
--> statement-breakpoint
CREATE TABLE "two_factor_auth" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"method" "two_factor_method" NOT NULL,
	"totpSecret" text,
	"phoneNumber" varchar(32),
	"isEnabled" boolean DEFAULT false NOT NULL,
	"backupCodes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "two_factor_auth_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
