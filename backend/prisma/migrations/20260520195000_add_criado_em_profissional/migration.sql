-- Add criadoEm to Profissional
ALTER TABLE "Profissional" ADD COLUMN "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
