const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../../data/academic_whatsapp.db'));

const evals = db.prepare('SELECT id, evaluationReport FROM research_evaluations').all();
let updated = 0;

for (const ev of evals) {
  let rep = ev.evaluationReport;
  let changed = false;

  if (rep.includes('Parâmetros Estabelecidos') || rep.includes('Parâmetros do Professor')) {
    rep = rep.replace(/####\s*(?:1|2)\.\s*🎯\s*Parâmetros[\s\S]*?(?=####\s*(?:1|2|3)\.\s*(?:⭐|🔍|🚀|🌟|🎯|Diagnóstico|Pontos))/i, '');
    changed = true;
  }

  if (rep.includes('Fontes e Diretrizes Estruturantes Fixadas pelo Colegiado')) {
    rep = rep.replace(/####\s*2\.\s*📚\s*Fontes[\s\S]*?(?=####\s*(?:2|3)\.\s*🧭)/i, '');
    changed = true;
  }

  if (changed) {
    db.prepare('UPDATE research_evaluations SET evaluationReport = ? WHERE id = ?').run(rep, ev.id);
    updated++;
  }
}

console.log(`Successfully cleaned ${updated} evaluation records in the database!`);
