-- CreateTable
CREATE TABLE "InsightIA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "resumoClinico" TEXT NOT NULL,
    "alertasJson" TEXT NOT NULL,
    "tendenciasJson" TEXT NOT NULL,
    "pendenciasJson" TEXT NOT NULL,
    "recomendacoesJson" TEXT NOT NULL,
    "confiancaGeral" REAL,
    "modelo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GERADO',
    "feedback" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "InsightIA_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InsightIA_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
