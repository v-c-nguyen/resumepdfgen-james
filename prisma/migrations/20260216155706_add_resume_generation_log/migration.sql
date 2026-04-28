-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "jobDescription" TEXT;

-- CreateTable
CREATE TABLE "resume_generation_logs" (
    "id" TEXT NOT NULL,
    "profileName" TEXT,
    "jobDescription" TEXT,
    "resumeText" TEXT NOT NULL,
    "company" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_generation_logs_pkey" PRIMARY KEY ("id")
);
