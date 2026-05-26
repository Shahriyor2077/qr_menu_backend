-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE';
