export function derivarSubtipo(registro) {
  if (registro.tipo !== 'exame') return null;

  const texto = [
    registro.orgao || '',
    registro.descricaoClinica || '',
    registro.insightRegistro?.resumo || ''
  ].join(' ').toLowerCase();

  const marcadoresSangue = [
    /hemograma/, /hematócrito|hematocrito/,
    /eritrócit|eritrocit/, /leucócit|leucocit/, /plaqueta/,
    /\bhemoglobina\b/,
    /glicose|glicemia/, /insulina/, /hba1c|glicada/,
    /colesterol/, /triglicerí|trigliceri/, /\bhdl\b|\bldl\b|\bvldl\b/, /lipidograma/,
    /\btsh\b/, /\bt3\b|\bt4\b/, /tireóide|tireoide/,
    /\bureia\b/, /\bcreatinina\b/, /ácido úrico|acido urico/, /\btfg\b/,
    /\btgo\b|\btgp\b|\bast\b|\balt\b/, /bilirrubina/, /\bggt\b/, /fosfatase alcalina/,
    /ferritina/, /transferrina/, /\btibc\b/, /\bferro\s/,
    /vitamina\s+[bd]/, /\bpsa\b/, /\bpcr\b/,
    /albumina/, /proteína total|proteina total/,
    /\bsódio\b|\bsodio\b/, /potássio|potassio/, /\bcálcio\b|\bcalcio\b/,
    /hemocultura/, /sorologia/, /hemossedimentação|hemossedimentacao/,
  ];

  if (marcadoresSangue.some(r => r.test(texto))) return 'Sangue';

  if (/ecocardiograma/.test(texto))                        return 'Ecocardiograma';
  if (/eletrocardiograma|\becg\b/.test(texto))             return 'ECG';
  if (/holter/.test(texto))                                return 'Holter';
  if (/mamografia/.test(texto))                            return 'Mamografia';
  if (/densitometria|dexa/.test(texto))                    return 'Densitometria';
  if (/ressonância|ressonancia/.test(texto))               return 'Ressonância';
  if (/tomografia/.test(texto))                            return 'Tomografia';
  if (/raio.?x|radiografi/.test(texto))                    return 'Raio-X';
  if (/ultrassom|ultrasonografia|ecografi/.test(texto))    return 'Ultrassom';
  if (/endoscopia/.test(texto))                            return 'Endoscopia';
  if (/colonoscopia/.test(texto))                          return 'Colonoscopia';
  if (/espirometria/.test(texto))                          return 'Espirometria';
  if (/\burina\b|\beas\b/.test(texto))                     return 'Urina';

  if (registro.orgao) {
    const o = registro.orgao.trim();
    return o.charAt(0).toUpperCase() + o.slice(1);
  }
  return null;
}
