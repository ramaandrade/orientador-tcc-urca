const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/academic_whatsapp.db');
const db = new Database(dbPath);

const namesConcluidos = [
  'Jhonyelly Soares Silva Brito',
  'José Erismá Barbosa da Silva',
  'Helder José Linhares de Meneses Borges',
  'Fernando Raimundo Gonçalves',
  'Carlos Cosman',
  'Pricila Maria da Silva',
  'Glebson Jeova Santos Araujo',
  'Carine Rodrigues Leite Andrade',
  'Jaqueline de Sousa Alves',
  'Brenda Assunção de Oliveira',
  'Cléa Borges Cruz',
  'Pâmela Dias Ribeiro',
  'Vanuzia Bernardino da Silva',
  'Mariana Gonçalves Vieira',
  'Maria Sinara Araujo dos Santos',
  'Francisco Antonio da Silva Cardoso',
  'Willianny dos Santos Paiva',
  'Angélica Pereira de Morais',
  'Rayara Cardoso Esmeraldo',
  'Guilherme Brito da Silva',
  'Andreia Pereira Neves',
  'Fabiano Ferreira Alves',
  'Igor Peixoto de Carvalho',
  'Ana Késia Castro Feitosa',
  'Maria Keury Laine Xavier Batista',
  'Rubia Soares Santos',
  'Amanda de Sousa Santos',
  'Ana Thainá Gomes Valério',
  'Elisângela Matias Paz',
  'Keliane Barbosa da Silva',
  'Luis Alfredo Torquato Coelho'
];

let count = 0;
const stmt = db.prepare("UPDATE students SET \"group\" = 'CONCLUIDO', status = 'DEFENDED' WHERE name = ?");

for (const name of namesConcluidos) {
  const res = stmt.run(name);
  if (res.changes > 0) count += res.changes;
}

console.log('✅ Atualizados com sucesso para CONCLUIDO / DEFENDED:', count);

const counts = db.prepare("SELECT \"group\", count(*) as total FROM students GROUP BY \"group\"").all();
console.log('📊 Distribuição atual por grupo:', counts);
