// Extrai dados estruturados de uma string de alerta como
// "[ALTO] Hemoglobina: 11.5 g/dL (referência 12-16 g/dL)"
function parsearAlerta(texto) {
  if (!texto || typeof texto !== 'string') return null;

  let status = 'ALTERADO';
  const tagMatch = texto.match(/^\[([^\]]+)\]/i);
  if (tagMatch) {
    const tag = tagMatch[1].toUpperCase();
    if (tag === 'ALTO' || tag === 'ELEVADO') status = 'ALTO';
    else if (tag === 'BAIXO') status = 'BAIXO';
    else if (tag === 'CRITICO' || tag === 'CRÍTICO') status = 'CRITICO';
    else status = tag;
  }

  const limpo = texto.replace(/^\[[^\]]+\]\s*/i, '').replace(/\.$/, '').trim();
  const match = limpo.match(
    /^(.+?):\s*([\d.,]+)\s*([^\s(,/]+)(?:\s*\(referência\s*([\d.,]+)\s*[-–]\s*([\d.,]+))?/i
  );
  if (!match) return null;

  let nome = match[1].trim();
  if (nome.length > 60 || nome.length < 2) return null;
  if (!/^[\p{L}\d\s\-.]+$/u.test(nome)) return null;
  if (/\b(resultado|exame|laudo|paciente)\b/i.test(nome)) return null;
  if (/\b\d{4,}\b/.test(nome)) return null;
  if (/[a-f0-9]{16,}/i.test(nome)) return null;

  nome = nome.replace(/^(soro|sangue|plasma|urina|líquido|liquido)\s+/i, '').trim();
  nome = nome.replace(/^mm\d+\s+/i, '').trim();
  nome = nome.replace(/\s+\d{1,3}$/, '').trim();
  if (!nome || nome.length < 2) return null;

  const valor = parseFloat(match[2].replace(',', '.'));
  if (isNaN(valor)) return null;

  return {
    nome,
    valor,
    unidade: match[3].replace(/[()]/g, '').trim(),
    refMin: match[4] != null ? parseFloat(match[4].replace(',', '.')) : null,
    refMax: match[5] != null ? parseFloat(match[5].replace(',', '.')) : null,
    status,
  };
}

module.exports = { parsearAlerta };
