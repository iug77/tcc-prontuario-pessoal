-- Add crmValidado to Profissional
-- Existing professionals become validated (true), new ones default to false (pending)
ALTER TABLE "Profissional" ADD COLUMN "crmValidado" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profissional" ALTER COLUMN "crmValidado" SET DEFAULT false;
