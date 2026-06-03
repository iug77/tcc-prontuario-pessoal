-- AlterTable
ALTER TABLE "Registro" ADD COLUMN "parecerMedico" TEXT;
ALTER TABLE "Registro" ADD COLUMN "dataParecer" TIMESTAMP(3);
ALTER TABLE "Registro" ADD COLUMN "parecerProfissionalId" TEXT;

-- AddForeignKey
ALTER TABLE "Registro" ADD CONSTRAINT "Registro_parecerProfissionalId_fkey" FOREIGN KEY ("parecerProfissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;