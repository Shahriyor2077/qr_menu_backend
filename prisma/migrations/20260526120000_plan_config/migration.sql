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
  (gen_random_uuid(),'DEMO',     10,  50,   1,      0,     'Sinab ko''rish uchun bepul tarif',  NOW(), NOW()),
  (gen_random_uuid(),'STARTER',   5,  30,   1,  29000,     'Kichik restoranlar uchun',          NOW(), NOW()),
  (gen_random_uuid(),'BUSINESS', 15, 100,   5,  79000,     'O''rta biznes uchun',               NOW(), NOW()),
  (gen_random_uuid(),'PREMIUM', 100, 500,  20, 199000,     'Cheksiz imkoniyatlar',              NOW(), NOW());

-- Step 1: Drop the enum default so we can change the column type
ALTER TABLE "Restaurant" ALTER COLUMN "plan" DROP DEFAULT;

-- Step 2: Change plan column from enum to text
ALTER TABLE "Restaurant" ALTER COLUMN "plan" TYPE TEXT USING "plan"::text;

-- Step 3: Set new text default
ALTER TABLE "Restaurant" ALTER COLUMN "plan" SET DEFAULT 'STARTER';

-- Step 4: Drop old Plan enum (CASCADE removes leftover dependencies)
DROP TYPE IF EXISTS "Plan" CASCADE;
