const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/academic_whatsapp.db');
const db = new Database(dbPath);

const res = db.prepare("UPDATE students SET \"group\" = 'TPE' WHERE name LIKE '%Washington%' OR name LIKE '%João Enrique%' OR name LIKE '%Joao Enrique%'").run();
console.log('Alunos atualizados para TPE:', res.changes);

const tpeStudents = db.prepare("SELECT id, name, \"group\", phone, topic FROM students WHERE \"group\" = 'TPE'").all();
console.log('\nLista de TPE:');
tpeStudents.forEach(s => console.log(` - ${s.name} (${s.group}) [Tel: +${s.phone}]`));

const tcc1Students = db.prepare("SELECT id, name, \"group\", phone, topic FROM students WHERE \"group\" = 'TCC1'").all();
console.log('\nLista de TCC 1:');
tcc1Students.forEach(s => console.log(` - ${s.name} (${s.group}) [Tel: +${s.phone}]`));
