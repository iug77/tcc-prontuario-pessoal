import { jsPDF } from 'jspdf';

const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

const CORES = {
  primaria: [109, 40, 217],   // roxo
  texto:    [30, 30, 40],
  muted:    [100, 100, 115],
  borda:    [220, 220, 230],
  fundo:    [248, 246, 255],
  alto:     [180, 40, 40],
  baixo:    [30, 100, 200],
};

function parsearJson(str, fallback = []) {
  try { return JSON.parse(str || 'null') ?? fallback; } catch { return fallback; }
}

function formatarData(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function formatarTipo(tipo) {
  const m = { exame: 'Exame', receita: 'Receita', medicamento: 'Medicamento', alergia: 'Alergia', doenca: 'Doença', cirurgia: 'Cirurgia' };
  return m[tipo] || tipo;
}

// Quebra texto longo em linhas que cabem na largura dada
function quebrarTexto(doc, texto, largura) {
  return doc.splitTextToSize(String(texto || ''), largura);
}

export function gerarPdfProntuario({ paciente, registros }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  const verificarPagina = (alturaNeeded = 10) => {
    if (y + alturaNeeded > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
      rodape(doc);
    }
  };

  const rodape = (d) => {
    const pg = d.internal.getCurrentPageInfo().pageNumber;
    d.setFontSize(8);
    d.setTextColor(...CORES.muted);
    d.text(`Prontuário Pessoal de Saúde — Pág. ${pg}`, PAGE_W / 2, PAGE_H - 8, { align: 'center' });
    d.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
  };

  // ── CABEÇALHO ──────────────────────────────────────────────
  doc.setFillColor(...CORES.primaria);
  doc.rect(0, 0, PAGE_W, 28, 'F');

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Prontuário Pessoal de Saúde', MARGIN, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(paciente.nome || '', MARGIN, 19);
  doc.text(`Exportado em ${new Date().toLocaleDateString('pt-BR')}`, PAGE_W - MARGIN, 19, { align: 'right' });

  y = 36;

  // ── DADOS DO PACIENTE ──────────────────────────────────────
  doc.setFillColor(...CORES.fundo);
  doc.roundedRect(MARGIN, y, CONTENT_W, 38, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CORES.primaria);
  doc.text('DADOS DO PACIENTE', MARGIN + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...CORES.texto);

  const col1 = MARGIN + 4;
  const col2 = MARGIN + CONTENT_W / 2 + 4;
  let ly = y + 14;

  const campo = (label, valor, cx, cy) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...CORES.muted);
    doc.text(label, cx, cy);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...CORES.texto);
    doc.text(String(valor || 'Não informado'), cx, cy + 4.5);
  };

  campo('Nome completo', paciente.nome, col1, ly);
  campo('E-mail', paciente.email, col2, ly);
  ly += 10;
  campo('Data de Nascimento', formatarData(paciente.dataNascimento), col1, ly);
  campo('Tipo Sanguíneo', paciente.tipoSanguineo, col2, ly);
  ly += 10;
  campo('Alergias conhecidas', paciente.alergias || 'Nenhuma informada', col1, ly);

  y += 44;

  // ── DIVISOR REGISTROS ─────────────────────────────────────
  doc.setDrawColor(...CORES.borda);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CORES.primaria);
  doc.text(`HISTÓRICO DE REGISTROS (${registros.length})`, MARGIN, y);
  y += 7;

  rodape(doc);

  // ── REGISTROS ─────────────────────────────────────────────
  registros.forEach((reg, idx) => {
    verificarPagina(22);

    // Cabeçalho do registro
    doc.setFillColor(...CORES.primaria);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1.5, 1.5, 'F');
    const tipoLabel = `${idx + 1}. ${formatarTipo(reg.tipo).toUpperCase()}`;
    const dataLabel = formatarData(reg.data);
    doc.text(tipoLabel, MARGIN + 3, y + 5.5);
    doc.text(dataLabel, PAGE_W - MARGIN - 3, y + 5.5, { align: 'right' });
    y += 11;

    // Orgão / Sistema
    if (reg.orgao) {
      verificarPagina(6);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...CORES.muted);
      doc.text('Órgão / Sistema', MARGIN, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES.texto);
      doc.text(reg.orgao, MARGIN + 32, y);
      y += 5;
    }

    // Descrição clínica
    if (reg.descricaoClinica) {
      verificarPagina(12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...CORES.muted);
      doc.text('Descrição Clínica', MARGIN, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES.texto);
      doc.setFontSize(8.5);
      const linhas = quebrarTexto(doc, reg.descricaoClinica, CONTENT_W);
      linhas.forEach(linha => {
        verificarPagina(5);
        doc.text(linha, MARGIN, y);
        y += 4.5;
      });
      y += 1;
    }

    // Insight de IA
    if (reg.insightRegistro) {
      const ins = reg.insightRegistro;
      verificarPagina(8);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...CORES.primaria);
      doc.text('▸ INSIGHT DE IA', MARGIN, y);
      y += 5;

      if (ins.resumo) {
        verificarPagina(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...CORES.texto);
        doc.setFontSize(8.5);
        const linhas = quebrarTexto(doc, ins.resumo, CONTENT_W);
        linhas.forEach(l => { verificarPagina(5); doc.text(l, MARGIN, y); y += 4.5; });
        y += 1;
      }

      // Itens fora da referência
      const foraRef = parsearJson(ins.foraReferenciaJson);
      if (foraRef.length > 0) {
        verificarPagina(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...CORES.alto);
        doc.text('Itens fora da referência:', MARGIN, y);
        y += 4.5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...CORES.texto);
        foraRef.slice(0, 8).forEach(item => {
          verificarPagina(5);
          const linhas = quebrarTexto(doc, `• ${item}`, CONTENT_W - 4);
          linhas.forEach(l => { doc.text(l, MARGIN + 2, y); y += 4.2; });
        });
        y += 1;
      }

      // Recomendações
      const recs = parsearJson(ins.recomendacoesJson);
      if (recs.length > 0) {
        verificarPagina(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...CORES.primaria);
        doc.text('Recomendações:', MARGIN, y);
        y += 4.5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...CORES.texto);
        recs.slice(0, 5).forEach(rec => {
          verificarPagina(5);
          const linhas = quebrarTexto(doc, `• ${rec}`, CONTENT_W - 4);
          linhas.forEach(l => { doc.text(l, MARGIN + 2, y); y += 4.2; });
        });
        y += 1;
      }
    }

    // Parecer médico
    if (reg.parecerMedico) {
      verificarPagina(10);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...[34, 120, 60]);
      doc.text('▸ PARECER MÉDICO', MARGIN, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES.texto);
      doc.setFontSize(8.5);
      const linhasParecer = quebrarTexto(doc, reg.parecerMedico, CONTENT_W);
      linhasParecer.forEach(l => { verificarPagina(5); doc.text(l, MARGIN, y); y += 4.5; });
      y += 1;

      // Assinatura do profissional
      if (reg.parecerProfissional?.nome) {
        verificarPagina(6);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...CORES.muted);
        let assinatura = `Assinado por ${reg.parecerProfissional.nome}`;
        if (reg.parecerProfissional.crm) assinatura += ` · CRM: ${reg.parecerProfissional.crm}`;
        if (reg.parecerProfissional.especialidade) assinatura += ` · ${reg.parecerProfissional.especialidade}`;
        if (reg.dataParecer) assinatura += ` · ${new Date(reg.dataParecer).toLocaleDateString('pt-BR')}`;
        doc.text(assinatura, MARGIN, y);
        y += 5;
      }
    }

    // Separador entre registros
    verificarPagina(6);
    doc.setDrawColor(...CORES.borda);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);
    y += 7;
  });

  // Nome do arquivo: "prontuario_[nome]_[data].pdf"
  const nomeArquivo = `prontuario_${(paciente.nome || 'paciente').toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nomeArquivo);
}
