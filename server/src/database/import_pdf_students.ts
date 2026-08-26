import { sqlite, initDatabase } from './db';
import crypto from 'crypto';

initDatabase();

interface PDFStudent {
  name: string;
  topic: string;
  group: 'TPE' | 'TCC1' | 'TCC2';
  year?: string;
}

const pdfStudents: PDFStudent[] = [
  // TCCs EM CONSTRUÇÃO (1 a 31)
  {
    name: 'Jhonyelly Soares Silva Brito',
    topic: 'Planejamento Financeiro de MEIs em Juazeiro do Norte',
    group: 'TPE',
    year: '2021',
  },
  {
    name: 'José Erismá Barbosa da Silva',
    topic: 'Finanças Pessoais entre acadêmicos de Economia',
    group: 'TPE',
    year: '2021',
  },
  {
    name: 'Helder José Linhares de Meneses Borges',
    topic: 'Os Direitos Humanos Econômicos e a Plataforma Estratégica de Desenvolvimento de Longo Prazo – Ceará 2050: uma análise através da Teoria Institucional',
    group: 'TPE',
    year: '2022',
  },
  {
    name: 'Fernando Raimundo Gonçalves',
    topic: 'Gestão Financeira no Terceiro Setor: Estudo de caso da organização social instituto de saúde e gestão hospitalar, no município de Fortaleza – Ceará',
    group: 'TPE',
    year: '2022',
  },
  {
    name: 'Carlos Cosman',
    topic: 'A nova economia institucional e a política econômica Brasileira entre 2012 e 2022',
    group: 'TPE',
    year: '2022',
  },
  {
    name: 'Pricila Maria da Silva',
    topic: 'Orçamento público como instrumento de Desenvolvimento: estudo de caso no município de Campos Sales – CE',
    group: 'TPE',
    year: '2022',
  },
  {
    name: 'Glebson Jeova Santos Araujo',
    topic: 'Gamificação: um estudo sobre o potencial de contribuição para a expansão da educação financeira no Brasil',
    group: 'TPE',
    year: '2022',
  },
  {
    name: 'Carine Rodrigues Leite Andrade',
    topic: 'Análise do papel das redes sociais na gestão das empresas do setor de serviços: o caso de bares e restaurantes da cidade do Crato – CE',
    group: 'TPE',
    year: '2022',
  },
  {
    name: 'Jaqueline de Sousa Alves',
    topic: 'Os efeitos da indústria 4.0 na fabricação de calçados: o caso da Grendene no Crato-CE',
    group: 'TPE',
    year: '2023',
  },
  {
    name: 'Brenda Assunção de Oliveira',
    topic: 'Tributação sobre o consumo no Brasil: uma perspectiva econômica-jurídica',
    group: 'TPE',
    year: '2023',
  },
  {
    name: 'Cléa Borges Cruz',
    topic: 'Transformações econômica, jurídica e tecnológica do mercado de pagamentos no Brasil: uma análise sob a ótica das instituições financeiras',
    group: 'TPE',
    year: '2023',
  },
  {
    name: 'Pâmela Dias Ribeiro',
    topic: 'Política fiscal no Ceará entre 2015 e 2022: um estudo através da Nova Economia Institucional',
    group: 'TPE',
    year: '2023',
  },
  {
    name: 'Vanuzia Bernardino da Silva',
    topic: 'O Papel da Nova Economia institucional (NEI) para o Planejamento Estratégico de Desenvolvimento do Estado do Ceará: Ceará 2050',
    group: 'TPE',
    year: '2023',
  },
  {
    name: 'Mariana Gonçalves Vieira',
    topic: 'Os efeitos das redes sociais no ramo de alimentação: o caso do segmento de bolos e doces na cidade de Crato-CE',
    group: 'TPE',
    year: '2023',
  },
  {
    name: 'Maria Sinara Araujo dos Santos',
    topic: 'A regulação econômica no setor financeiro no Brasil entre 2018 e 2022: avanços e desafios',
    group: 'TPE',
    year: '2024',
  },
  {
    name: 'Francisco Antonio da Silva Cardoso',
    topic: 'Indústria 4.0 e a gestão de custos: estudo de caso em uma pequena empresa de acessórios para calçados no município de Juazeiro do Norte, Ceará',
    group: 'TPE',
    year: '2024',
  },
  {
    name: 'Willianny dos Santos Paiva',
    topic: 'Marketing digital como estratégia de negócio no Brasil: uma análise através da maturidade digital das micro e pequenas empresas',
    group: 'TPE',
    year: '2024',
  },
  {
    name: 'Angélica Pereira de Morais',
    topic: 'Impacto do marketing digital nas microempresas de vestuário de Antonina do Norte-CE',
    group: 'TPE',
    year: '2024',
  },
  {
    name: 'Rayara Cardoso Esmeraldo',
    topic: 'Delivery e gestão empresarial: uma análise no setor alimentício na cidade de Crato, entre 2014 a 2023',
    group: 'TPE',
    year: '2024',
  },
  {
    name: 'Guilherme Brito da Silva',
    topic: 'Economia Brasileira no período de 2012 a 2022: uma análise através da Nova Economia Institucional',
    group: 'TPE',
    year: '2024',
  },
  {
    name: 'Andreia Pereira Neves',
    topic: 'Influência da Nova Economia Institucional e da nova gestão pública na administração pública do município de Crato-CE',
    group: 'TPE',
    year: '2024',
  },
  {
    name: 'Fabiano Ferreira Alves',
    topic: 'A Teoria dos Incentivos em Programas de Assistência Social no Brasil: Uma Análise do Bolsa Família',
    group: 'TPE',
    year: '2025',
  },
  {
    name: 'Igor Peixoto de Carvalho',
    topic: 'Inteligência Artificial Na Tomada De Decisão Econômica: Impactos Para Empresas E Instituições No Brasil',
    group: 'TPE',
    year: '2025',
  },
  {
    name: 'Ana Késia Castro Feitosa',
    topic: 'Gestão De Recursos Financeiros Municipais No Contexto Do Crato, Ceará: Sob A Perspectiva Da Nova Economia Institucional',
    group: 'TPE',
    year: '2025',
  },
  {
    name: 'Maria Keury Laine Xavier Batista',
    topic: 'Desafios Institucionais para a Sustentabilidade em Pequenos Municípios: um estudo de caso do Município de Exu-PE',
    group: 'TPE',
    year: '2025',
  },
  {
    name: 'Rubia Soares Santos',
    topic: 'Desigualdades De Gênero Na Educação Empreendedora No Brasil: Uma Análise Sob A Perspectiva Da Nova Economia Institucional',
    group: 'TPE',
    year: '2025',
  },
  {
    name: 'Amanda de Sousa Santos',
    topic: 'Transformações institucionais e tecnológicas no mercado de trabalho brasileiro',
    group: 'TPE',
    year: '2025',
  },
  {
    name: 'Ana Thainá Gomes Valério',
    topic: 'Governança pública no Estado do Ceará: desafios e perspectivas',
    group: 'TPE',
    year: '2025',
  },
  {
    name: 'Elisângela Matias Paz',
    topic: 'Transformações dos Modelos de Negócios no Brasil (2015-2025): desafios e oportunidades na era digital',
    group: 'TPE',
    year: '2025',
  },
  {
    name: 'Keliane Barbosa da Silva',
    topic: 'Cidades Inteligentes e Governança: O caso de Araripe-CE',
    group: 'TPE',
    year: '2025',
  },
  {
    name: 'Luis Alfredo Torquato Coelho',
    topic: 'Cidades Inteligentes e Governança: o caso do município de Tauá-CE',
    group: 'TPE',
    year: '2025',
  },

  // TCC 1 – 2026.2 (32 a 41)
  {
    name: 'João Enrique Barbosa Lima',
    topic: 'O pequeno comércio varejista de hortifruti e sua importância econômica em caririaçu-ce: um estudo de caso.',
    group: 'TCC1',
  },
  {
    name: 'Washington',
    topic: 'Geração Solar Fotovoltaica e Desenvolvimento Sustentável no Ceará: Uma Análise do Alinhamento das Políticas Públicas Estaduais ao ODS 7',
    group: 'TCC1',
  },
  {
    name: 'Denilson de Sales Pinto',
    topic: 'O Impacto da Implantação de Moedas Digitais de Bancos Centrais (CBDCs) na Eficácia das Sanções Internacionais e na Soberania Monetária',
    group: 'TCC1',
  },
  {
    name: 'Emerson Francisco Da Silva',
    topic: 'Instituições Extrativas na Era Digital: Uma análise da erosão da soberania popular sob a ótica do Capitalismo de Vigilância e da Nova Economia Institucional.',
    group: 'TCC1',
  },
  {
    name: 'Everton Cardoso de Oliveira',
    topic: 'O Efeito da Automação sobre as Desigualdades Sociais no Brasil sob a Ótica da Teoria da Justiça Distributiva e da Nova Economia Institucional',
    group: 'TCC1',
  },
  {
    name: 'Francisco Jonathan Sousa Rodrigues',
    topic: 'A governança pública e a redução da desigualdade social no brasil (2010–2025)',
    group: 'TCC1',
  },
  {
    name: 'Juan Gledson',
    topic: 'O Paradoxo da Inclusão Financeira Digital: Financeirização e Superendividamento no Brasil (2022-2026)',
    group: 'TCC1',
  },
  {
    name: 'Juliana',
    topic: 'O Peso do Passado: Path Dependence e a Institucionalização da Autonomia do Banco Central no Brasil e na América Latina.',
    group: 'TCC1',
  },
  {
    name: 'Pedro Ramon de Oliveira Vilar',
    topic: 'Tecnologia versus Escala: Uma análise da inovação disruptiva na eficiência operacional entre bancos incumbentes e digitais no Brasil',
    group: 'TCC1',
  },
  {
    name: 'Raniely',
    topic: 'Regras do Jogo ou Barreiras ao Desenvolvimento? Assimetrias Institucionais na Governança Global',
    group: 'TCC1',
  },

  // TCC 2 – 2026.2 (42 a 44)
  {
    name: 'Émily Ellen Soares Gonçalves',
    topic: 'Estrutura institucional e acesso à tecnologia no Brasil: uma análise à luz da nova economia institucional (nei)',
    group: 'TCC2',
  },
  {
    name: 'Raynara Rodrigues Brito Araújo',
    topic: 'Marketing de influência no brasil (2020–2024): assimetria de informação e custos de transação na economia digital.',
    group: 'TCC2',
  },
  {
    name: 'Claudio Reinaldo Lima Silva',
    topic: 'Cidades inteligentes e governança: o caso do Crato-CE',
    group: 'TCC2',
  },
];

function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function syncPDFStudents() {
  const existingStudents = sqlite.prepare('SELECT * FROM students').all() as any[];
  console.log(`[Sync] Total de alunos existentes antes da sincronização: ${existingStudents.length}`);

  let insertedCount = 0;
  let updatedCount = 0;
  const now = new Date().toISOString();

  let placeholderPhoneCounter = 1;

  for (const item of pdfStudents) {
    const normItemName = normalizeStr(item.name);
    
    // Find matching existing student
    const match = existingStudents.find((s) => {
      const normDbName = normalizeStr(s.name);
      return (
        normDbName === normItemName ||
        normDbName.includes(normItemName) ||
        normItemName.includes(normDbName) ||
        (normItemName.split(' ')[0] === normDbName.split(' ')[0] && normItemName.split(' ').pop() === normDbName.split(' ').pop())
      );
    });

    if (match) {
      // Update existing student with full clean name and title
      sqlite.prepare(`
        UPDATE students SET
          name = ?,
          topic = ?,
          "group" = ?,
          updatedAt = ?
        WHERE id = ?
      `).run(item.name, item.topic, item.group, now, match.id);
      
      console.log(`[Sync] 🔄 Atualizado: ${item.name} | Turma: ${item.group} | Título: ${item.topic.substring(0, 40)}...`);
      updatedCount++;
    } else {
      // Insert new student
      const id = crypto.randomUUID();
      const paddedNum = String(placeholderPhoneCounter++).padStart(4, '0');
      const placeholderPhone = `558899000${paddedNum}`;

      sqlite.prepare(`
        INSERT INTO students (
          id, name, phone, originalPhone, "group", topic, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        item.name,
        placeholderPhone,
        placeholderPhone,
        item.group,
        item.topic,
        'ACTIVE',
        now,
        now
      );

      console.log(`[Sync] ➕ Cadastrado Novo: ${item.name} | Turma: ${item.group} | Tel: +${placeholderPhone}`);
      insertedCount++;
    }
  }

  const finalTotal = sqlite.prepare('SELECT COUNT(*) as count FROM students').get() as any;
  console.log(`\n======================================================`);
  console.log(`🎉 Sincronização Concluída!`);
  console.log(`Novos Alunos Cadastrados: ${insertedCount}`);
  console.log(`Alunos Atualizados com Título Completo: ${updatedCount}`);
  console.log(`Total Geral de Alunos no Sistema: ${finalTotal.count}`);
  console.log(`======================================================\n`);
}

syncPDFStudents();
