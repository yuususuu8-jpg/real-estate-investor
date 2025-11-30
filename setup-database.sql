-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('MANSION', 'APARTMENT', 'BUILDING', 'CONDOMINIUM', 'HOUSE', 'TERRACE');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID');

-- CreateEnum
CREATE TYPE "CalculationStatus" AS ENUM ('DRAFT', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_limits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_month" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculation_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_calculations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "property_type" "PropertyType" NOT NULL,
    "address" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "land_size" DOUBLE PRECISION,
    "building_age" INTEGER,
    "status" "CalculationStatus" NOT NULL DEFAULT 'DRAFT',
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculation_details" (
    "id" TEXT NOT NULL,
    "property_calculation_id" TEXT NOT NULL,
    "monthly_rent" DOUBLE PRECISION,
    "management_fee" DOUBLE PRECISION,
    "repair_reserve" DOUBLE PRECISION,
    "property_tax" DOUBLE PRECISION,
    "insurance_fee" DOUBLE PRECISION,
    "vacancy_rate" DOUBLE PRECISION,
    "loan_amount" DOUBLE PRECISION,
    "loan_interest_rate" DOUBLE PRECISION,
    "loan_period" INTEGER,
    "monthly_loan_payment" DOUBLE PRECISION,
    "gross_yield" DOUBLE PRECISION,
    "net_yield" DOUBLE PRECISION,
    "annual_income" DOUBLE PRECISION,
    "annual_expense" DOUBLE PRECISION,
    "annual_cash_flow" DOUBLE PRECISION,
    "ccr" DOUBLE PRECISION,
    "market_rent_estimate" DOUBLE PRECISION,
    "area_average_yield" DOUBLE PRECISION,
    "ai_risk_score" DOUBLE PRECISION,
    "ai_recommendation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calculation_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_data_cache" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zip_code" TEXT,
    "average_rent" DOUBLE PRECISION,
    "average_price" DOUBLE PRECISION,
    "average_yield" DOUBLE PRECISION,
    "data_source" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_data_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "usage_limits_user_id_key" ON "usage_limits"("user_id");

-- CreateIndex
CREATE INDEX "usage_limits_user_id_idx" ON "usage_limits"("user_id");

-- CreateIndex
CREATE INDEX "property_calculations_user_id_idx" ON "property_calculations"("user_id");

-- CreateIndex
CREATE INDEX "property_calculations_status_idx" ON "property_calculations"("status");

-- CreateIndex
CREATE INDEX "property_calculations_is_favorite_idx" ON "property_calculations"("is_favorite");

-- CreateIndex
CREATE INDEX "property_calculations_created_at_idx" ON "property_calculations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "calculation_details_property_calculation_id_key" ON "calculation_details"("property_calculation_id");

-- CreateIndex
CREATE INDEX "calculation_details_property_calculation_id_idx" ON "calculation_details"("property_calculation_id");

-- CreateIndex
CREATE UNIQUE INDEX "market_data_cache_address_key" ON "market_data_cache"("address");

-- CreateIndex
CREATE INDEX "market_data_cache_address_idx" ON "market_data_cache"("address");

-- CreateIndex
CREATE INDEX "market_data_cache_expires_at_idx" ON "market_data_cache"("expires_at");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_limits" ADD CONSTRAINT "usage_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_calculations" ADD CONSTRAINT "property_calculations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculation_details" ADD CONSTRAINT "calculation_details_property_calculation_id_fkey" FOREIGN KEY ("property_calculation_id") REFERENCES "property_calculations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
