-- Add Stage 3 and Stage 4 custom prompt fields for profiles.
ALTER TABLE "profiles"
ADD COLUMN "customStage3Prompt" TEXT,
ADD COLUMN "customStage4Prompt" TEXT;
