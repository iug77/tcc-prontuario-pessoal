require('dotenv').config();

async function testarProvedores() {
  console.log('\n====================================');
  console.log('  🧪 TESTE DE PROVEDORES IA');
  console.log('====================================\n');

  // 1. Ollama
  console.log('1️⃣  Ollama (Local)');
  try {
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const res = await fetch(
      `${ollamaBaseUrl}/api/tags`
    );
    if (res.ok) {
      const data = await res.json();
      console.log('  ✅ Ollama funcionando');
      console.log(`  └─ Modelos: ${data.models?.map(m => m.name).join(', ') || 'Nenhum'}\n`);
    } else {
      console.log(`  ❌ Erro: Ollama retornou ${res.status}\n`);
    }
  } catch (e) {
    console.log(`  ❌ Erro: ${e.message}\n`);
  }

  // 2. Heurístico
  console.log('2️⃣  Heurístico (Fallback)');
  console.log('  ✅ Sempre funciona (sem dependências)\n');

  console.log('====================================');
  console.log('  Ordem de execução no sistema:');
  console.log('  1. Ollama → 2. Heurístico');
  console.log('====================================\n');
}

testarProvedores().catch(console.error);
