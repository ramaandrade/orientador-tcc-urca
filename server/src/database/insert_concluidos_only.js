const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../../data/academic_whatsapp.db');
const db = new Database(dbPath);

const concluidosList = [
  {
    name: 'Jhonyelly Soares Silva Brito',
    topic: 'Planejamento Financeiro de MEIs em Juazeiro do Norte',
    defenseDate: '2021',
  },
  {
    name: 'José Erismá Barbosa da Silva',
    topic: 'Finanças Pessoais entre acadêmicos de Economia',
    defenseDate: '2021',
  },
  {
    name: 'Helder José Linhares de Meneses Borges',
    topic: 'Os Direitos Humanos Econômicos e a Plataforma Estratégica de Desenvolvimento de Longo Prazo – Ceará 2050: uma análise através da Teoria Institucional',
    defenseDate: '2022',
  },
  {
    name: 'Fernando Raimundo Gonçalves',
    topic: 'Gestão Financeira no Terceiro Setor: Estudo de caso da organização social instituto de saúde e gestão hospitalar, no município de Fortaleza – Ceará',
    defenseDate: '2022',
  },
  {
    name: 'Carlos Cosman',
    topic: 'A nova economia institucional e a política econômica Brasileira entre 2012 e 2022',
    defenseDate: '2022',
  },
  {
    name: 'Pricila Maria da Silva',
    topic: 'Orçamento público como instrumento de Desenvolvimento: estudo de caso no município de Campos Sales – CE',
    defenseDate: '2022',
  },
  {
    name: 'Glebson Jeova Santos Araujo',
    topic: 'Gamificação: um estudo sobre o potencial de contribuição para a expansão da educação financeira no Brasil',
    defenseDate: '2022',
  },
  {
    name: 'Carine Rodrigues Leite Andrade',
    topic: 'Análise do papel das redes sociais na gestão das empresas do setor de serviços: o caso de bares e restaurantes da cidade do Crato – CE',
    defenseDate: '2022',
  },
  {
    name: 'Jaqueline de Sousa Alves',
    topic: 'Os efeitos da indústria 4.0 na fabricação de calçados: o caso da Grendene no Crato-CE',
    defenseDate: '2023',
  },
  {
    name: 'Brenda Assunção de Oliveira',
    topic: 'Tributação sobre o consumo no Brasil: uma perspectiva econômica-jurídica',
    defenseDate: '2023',
  },
  {
    name: 'Cléa Borges Cruz',
    topic: 'Transformações econômica, jurídica e tecnológica do mercado de pagamentos no Brasil: uma análise sob a ótica das instituições financeiras',
    defenseDate: '2023',
  },
  {
    name: 'Pâmela Dias Ribeiro',
    topic: 'Política fiscal no Ceará entre 2015 e 2022: um estudo através da Nova Economia Institucional',
    defenseDate: '2023',
  },
  {
    name: 'Vanuzia Bernardino da Silva',
    topic: 'O Papel da Nova Economia institucional (NEI) para o Planejamento Estratégico de Desenvolvimento do Estado do Ceará: Ceará 2050',
    defenseDate: '2023',
  },
  {
    name: 'Mariana Gonçalves Vieira',
    topic: 'Os efeitos das redes sociais no ramo de alimentação: o caso do segmento de bolos e doces na cidade de Crato-CE',
    defenseDate: '2023',
  },
  {
    name: 'Maria Sinara Araujo dos Santos',
    topic: 'A regulação econômica no setor financeiro no Brasil entre 2018 e 2022: avanços e desafios',
    defenseDate: '2024',
  },
  {
    name: 'Francisco Antonio da Silva Cardoso',
    topic: 'Indústria 4.0 e a gestão de custos: estudo de caso em uma pequena empresa de acessórios para calçados no município de Juazeiro do Norte, Ceará',
    defenseDate: '2024',
  },
  {
    name: 'Willianny dos Santos Paiva',
    topic: 'Marketing digital como estratégia de negócio no Brasil: uma análise através da maturidade digital das micro e pequenas empresas',
    defenseDate: '2024',
  },
  {
    name: 'Angélica Pereira de Morais',
    topic: 'Impacto do marketing digital nas microempresas de vestuário de Antonina do Norte-CE',
    defenseDate: '2024',
  },
  {
    name: 'Rayara Cardoso Esmeraldo',
    topic: 'Delivery e gestão empresarial: uma análise no setor alimentício na cidade de Crato, entre 2014 a 2023',
    defenseDate: '2024',
  },
  {
    name: 'Guilherme Brito da Silva',
    topic: 'Economia Brasileira no período de 2012 a 2022: uma análise através da Nova Economia Institucional',
    defenseDate: '2024',
  },
  {
    name: 'Andreia Pereira Neves',
    topic: 'Influência da Nova Economia Institucional e da nova gestão pública na administração pública do município de Crato-CE',
    defenseDate: '2024',
  },
  {
    name: 'Fabiano Ferreira Alves',
    topic: 'A Teoria dos Incentivos em Programas de Assistência Social no Brasil: Uma Análise do Bolsa Família',
    defenseDate: '2025',
  },
  {
    name: 'Igor Peixoto de Carvalho',
    topic: 'Inteligência Artificial Na Tomada De Decisão Econômica: Impactos Para Empresas E Instituições No Brasil',
    defenseDate: '2025',
  },
  {
    name: 'Ana Késia Castro Feitosa',
    topic: 'Gestão De Recursos Financeiros Municipais No Contexto Do Crato, Ceará: Sob A Perspectiva Da Nova Economia Institucional',
    defenseDate: '2025',
  },
  {
    name: 'Maria Keury Laine Xavier Batista',
    topic: 'Desafios Institucionais para a Sustentabilidade em Pequenos Municípios: um estudo de caso do Município de Exu-PE',
    defenseDate: '2025',
  },
  {
    name: 'Rubia Soares Santos',
    topic: 'Desigualdades De Gênero Na Educação Empreendedora No Brasil: Uma Análise Sob A Perspectiva Da Nova Economia Institucional',
    defenseDate: '2025',
  },
  {
    name: 'Amanda de Sousa Santos',
    topic: 'Transformações institucionais e tecnológicas no mercado de trabalho brasileiro',
    defenseDate: '2025',
  },
  {
    name: 'Ana Thainá Gomes Valério',
    topic: 'Governança pública no Estado do Ceará: desafios e perspectivas',
    defenseDate: '2025',
  },
  {
    name: 'Elisângela Matias Paz',
    topic: 'Transformações dos Modelos de Negócios no Brasil (2015-2025): desafios e oportunidades na era digital',
    defenseDate: '2025',
  },
  {
    name: 'Keliane Barbosa da Silva',
    topic: 'Cidades Inteligentes e Governança: O caso de Araripe-CE',
    defenseDate: '2025',
  },
  {
    name: 'Luis Alfredo Torquato Coelho',
    topic: 'Cidades Inteligentes e Governança: o caso do município de Tauá-CE',
    defenseDate: '2025',
  },
];

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Get all existing active students
const activeStudents = db.prepare("SELECT * FROM students WHERE \"group\" IN ('TPE', 'TCC1', 'TCC2')").all();
console.log(`Alunos ativos mantidos em TPE, TCC1, TCC2: ${activeStudents.length}`);

const now = new Date().toISOString();
let inserted = 0;
let skipped = 0;

let phoneCounter = 1;

const insertStmt = db.prepare(`
  INSERT INTO students (id, name, phone, originalPhone, "group", topic, defenseDate, status, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, 'CONCLUIDO', ?, ?, 'DEFENDED', ?, ?)
`);

for (const item of concluidosList) {
  const normName = normalize(item.name);
  
  // Check if student is already among the active students in TPE, TCC1, TCC2
  const existsInActive = activeStudents.some(active => {
    const normActive = normalize(active.name);
    return normActive === normName || normActive.includes(normName) || normName.includes(normActive);
  });

  if (existsInActive) {
    console.log(`[Pular] ${item.name} já está cadastrado em TPE/TCC1/TCC2.`);
    skipped++;
    continue;
  }

  // Check if already in CONCLUIDO
  const existingConcluido = db.prepare("SELECT id FROM students WHERE name = ? AND \"group\" = 'CONCLUIDO'").get(item.name);
  if (existingConcluido) {
    db.prepare("UPDATE students SET topic = ?, defenseDate = ?, updatedAt = ? WHERE id = ?").run(item.topic, item.defenseDate, now, existingConcluido.id);
    continue;
  }

  const id = crypto.randomUUID();
  const padded = String(phoneCounter++).padStart(4, '0');
  const placeholderPhone = `558890000${padded}`;

  insertStmt.run(
    id,
    item.name,
    placeholderPhone,
    placeholderPhone,
    item.topic,
    item.defenseDate,
    now,
    now
  );
  inserted++;
}

console.log(`\n==============================================`);
console.log(`🎉 Inserção Concluída!`);
console.log(`Novos inseridos em CONCLUIDO / EGRESSOS: ${inserted}`);
console.log(`Ignorados por já estarem em TPE/TCC1/TCC2: ${skipped}`);

const summary = db.prepare("SELECT \"group\", count(*) as total FROM students GROUP BY \"group\"").all();
console.log('\n📊 Resumo Atual por Grupo:', summary);
console.log(`==============================================\n`);
