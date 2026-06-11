-- CreateTable
CREATE TABLE "default_prompt_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "stage1Prompt" TEXT,
    "stage2Prompt" TEXT,
    "qaPrompt" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "default_prompt_settings_pkey" PRIMARY KEY ("id")
);
