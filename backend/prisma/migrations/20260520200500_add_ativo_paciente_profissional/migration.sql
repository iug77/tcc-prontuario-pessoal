-- Add ativo to Paciente and Profissional
ALTER TABLE "Paciente" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Profissional" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;
