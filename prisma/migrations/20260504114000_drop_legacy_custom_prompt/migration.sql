-- Remove legacy prompt field after stage prompt migration.
ALTER TABLE "profiles"
DROP COLUMN "customPrompt";
