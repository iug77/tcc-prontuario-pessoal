-- CreateTable
CREATE TABLE "InsightRegistro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registroId" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "conclusao" TEXT NOT NULL,
    "foraReferenciaJson" TEXT NOT NULL,
    "itensNormaisJson" TEXT NOT NULL,
    "itensAlteradosJson" TEXT NOT NULL,
    "valoresImportantesJson" TEXT NOT NULL,
    "alertasJson" TEXT NOT NULL,
    "pendenciasJson" TEXT NOT NULL,
    "recomendacoesJson" TEXT NOT NULL,
    "diagnosticoExtracaoJson" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "geradoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "InsightRegistro_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "Registro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InsightRegistro_registroId_key" ON "InsightRegistro"("registroId");
