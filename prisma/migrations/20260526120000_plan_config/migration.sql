-- CreateTable PlanConfig
CREATE TABLE "PlanConfig" (
  "id"            TEXT         NOT NULL,
  "name"          TEXT         NOT NULL,
  "maxCategories" INTEGER      NOT NULL,
  "maxMenuItems"  INTEGER      NOT NULL,
  "maxAdmins"     INTEGER      NOT NULL,
  "price"         INTEGER      NOT NULL DEFAULT 0,
  "description"   TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlanConfig_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlanConfig_name_key" ON "PlanConfig"("name");

-- Seed default plans
INSERT INTO "PlanConfig" ("id","name","maxCategories","maxMenuItems","maxAdmins","price","description","createdAt","updatedAt")
VALUES
  (gen_random_uuid(),'FREE',       3,   15,   1,      0,     'Bepul tarif — kichik restoranlar uchun',  NOW(), NOW()),
  (gen_random_uuid(),'PRO',        15,  100,  5,  49000,     'Professional tarif',                      NOW(), NOW()),
  (gen_random_uuid(),'ENTERPRISE', -1,  -1,   -1,     0,     'Cheksiz imkoniyatlar',                    NOW(), NOW());

-- AlterTable: change plan column from enum to text (keeping existing values as strings)
ALTER TABLE "Restaurant" ALTER COLUMN "plan" TYPE TEXT;

-- Drop old Plan enum
DROP TYPE IF EXISTS "Plan";
