-- CreateTable
CREATE TABLE "auth_attempts" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "identifier_type" TEXT NOT NULL,
    "attempt_type" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_lockouts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locked_until" TIMESTAMP(3) NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_failed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_lockouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_attempts_identifier_attempt_type_created_at_idx" ON "auth_attempts"("identifier", "attempt_type", "created_at");

-- CreateIndex
CREATE INDEX "auth_attempts_ip_address_attempt_type_created_at_idx" ON "auth_attempts"("ip_address", "attempt_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "account_lockouts_email_key" ON "account_lockouts"("email");

-- CreateIndex
CREATE INDEX "account_lockouts_email_locked_until_idx" ON "account_lockouts"("email", "locked_until");
