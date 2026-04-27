const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const pacientes = await prisma.paciente.findMany({ 
      select: { id: true, nome: true },
      take: 3
    });
    console.log('Pacientes:', pacientes);
    
    const registros = await prisma.registro.findMany({
      select: { id: true, tipo: true, pacienteId: true },
      take: 5
    });
    console.log('Registros:', registros);
    
  } finally {
    await prisma.$disconnect();
  }
})();
