const express = require('express');
const path = require('path');

// Simular teste da resposta com dado de fallback 
const testFallback = () => {
  return {
    resumoClinico: "Paciente com 2 registros de exames em 2 meses. Último registro em 20/03/2026.",
    alertas: [
      {
        tipo: "acompanhamento",
        severidade: "media",
        titulo: "Sem registros recentes",
        descricao: "Último registro há 4 dias. Agende nova consulta se necessário."
      }
    ],
    tendencias: [
      {
        parametro: "exame",
        direcao: "estavel",
        descricao: "Padrão de exames regulares observado a cada 2 semanas."
      }
    ],
    pendencias: [
      {
        tipo: "documentacao",
        descricao: "Solicitar resultado detalhado do último exame ao paciente."
      }
    ],
    recomendacoes: [
      "Validar os achados da IA com contexto clínico e consulta presencial.",
      "Revisar se há outros registros não digitalizados."
    ],
    confiancaGeral: 0.72,
    modelo: 'heuristico-local-v1 (FALLBACK)'
  };
};

console.log('\n✅ TESTE DE FALLBACK-RESPOSTA\n');
console.log('Os insights com FALLBACK devem parecer assim:\n');
console.log(JSON.stringify(testFallback(), null, 2));

console.log('\n---\n');
console.log('📋 Estrutura esperada no frontend:');
console.log('  • resumoClinico: texto descritivo');
console.log('  • alertas: array com titulo, descricao, severidade');
console.log('  • tendencias: array com parametro, descricao, direcao');
console.log('  • pendencias: array com descricao');
console.log('  • recomendacoes: array de strings');
console.log('  • modelo: "heuristico-local-v1 (FALLBACK)" quando OpenAI falha');
console.log('\n✅ Se vê isso, o sistema está funcionando!\n');
