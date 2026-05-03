-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firmwares" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_sha256" CHAR(64) NOT NULL,
    "storage_path" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "firmwares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installations" (
    "id" UUID NOT NULL,
    "firmware_id" UUID,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "client_version" TEXT,
    "windows_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "firmwares_is_active_created_at_idx" ON "firmwares"("is_active", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "firmwares_name_version_key" ON "firmwares"("name", "version");

-- CreateIndex
CREATE INDEX "installations_status_created_at_idx" ON "installations"("status", "created_at");

-- CreateIndex
CREATE INDEX "installations_firmware_id_idx" ON "installations"("firmware_id");

-- AddForeignKey
ALTER TABLE "installations" ADD CONSTRAINT "installations_firmware_id_fkey" FOREIGN KEY ("firmware_id") REFERENCES "firmwares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

