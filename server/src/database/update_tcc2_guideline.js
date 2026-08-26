const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const db = new Database(path.join(__dirname, '../../data/academic_whatsapp.db'));

const tcc2Text = fs.readFileSync(path.join(__dirname, '../../data/templates/Criterios_Pesquisa_TCC2_URCA.txt'), 'utf8');

db.prepare(`
  UPDATE transition_guidelines
  SET defaultSources = ?, sourceFileName = 'Criterios_Pesquisa_TCC2_URCA.txt', sourceFileUrl = '/docs/Criterios_Pesquisa_TCC2_URCA.txt', updatedAt = ?
  WHERE id = 'TCC1_TO_TCC2'
`).run(tcc2Text, new Date().toISOString());

console.log('Updated TCC1_TO_TCC2 in transition_guidelines table successfully!');
