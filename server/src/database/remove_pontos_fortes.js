const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../../data/academic_whatsapp.db'));

const evals = db.prepare('SELECT id, evaluationReport FROM research_evaluations').all();
let updated = 0;

for (const ev of evals) {
  let rep = ev.evaluationReport;
  let changed = false;

  if (rep.includes('Pontos Fortes Reconhecidos') || rep.includes('Pontos Fortes e Melhorias') || rep.includes('Pontos Fortes em Destaque')) {
    rep = rep.replace(/####\s*(?:1|2)\.\s*⭐\s*Pontos\s*Fortes[\s\S]*?(?=####\s*(?:1|2|3)\.\s*(?:🔍|🚀|🌟|🎯|Diagnóstico))/i, '');
    changed = true;
  }

  if (changed) {
    db.prepare('UPDATE research_evaluations SET evaluationReport = ? WHERE id = ?').run(rep, ev.id);
    updated++;
  }
}

console.log(`Successfully removed Pontos Fortes from ${updated} evaluation records in the database!`);
