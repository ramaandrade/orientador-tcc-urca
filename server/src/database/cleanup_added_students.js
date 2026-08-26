const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/academic_whatsapp.db');
const db = new Database(dbPath);

// Delete newly added students with placeholder phones or CONCLUIDO
const delResult = db.prepare("DELETE FROM students WHERE phone LIKE '558899000%' OR \"group\" = 'CONCLUIDO'").run();
console.log('Total de registros removidos:', delResult.changes);

const remaining = db.prepare('SELECT id, name, phone, "group", topic FROM students ORDER BY "group", name').all();
console.log('\nTotal de alunos mantidos (' + remaining.length + '):');
remaining.forEach(s => console.log(` - [${s.group}] ${s.name} (+${s.phone})`));
