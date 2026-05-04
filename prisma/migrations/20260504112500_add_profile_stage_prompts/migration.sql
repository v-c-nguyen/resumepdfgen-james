-- Add separate custom prompt fields for stage-based generation flow
ALTER TABLE "profiles"
ADD COLUMN "customStage1Prompt" TEXT,
ADD COLUMN "customStage2Prompt" TEXT;
