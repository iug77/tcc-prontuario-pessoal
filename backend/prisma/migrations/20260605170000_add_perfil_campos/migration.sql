-- AlterTable
ALTER TABLE "Paciente" ADD COLUMN "alergias" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "dataNascimento" TIMESTAMP(3),
ADD COLUMN "foto" TEXT,
ADD COLUMN "tipoSanguineo" TEXT;

-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN "bio" TEXT,
ADD COLUMN "foto" TEXT;
