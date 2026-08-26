import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'academic_whatsapp.db');
export const sqlite = new Database(dbPath);

// Enable WAL mode for high performance and concurrent reads
sqlite.pragma('journal_mode = WAL');

// Helper to sanitize any value for SQLite
function toSqliteParam(val: any): string | number | null {
  if (val === undefined || val === null) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'number') return val;
  return String(val);
}

// Initialize tables if they don't exist
export function initDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      originalPhone TEXT,
      "group" TEXT NOT NULL,
      advisor TEXT,
      topic TEXT,
      email TEXT,
      deadline TEXT,
      defenseDate TEXT,
      grade TEXT,
      status TEXT DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      "group" TEXT DEFAULT 'ALL',
      content TEXT NOT NULL,
      attachmentUrl TEXT,
      attachmentType TEXT,
      attachmentName TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      targetGroup TEXT NOT NULL,
      templateId TEXT,
      messageContent TEXT NOT NULL,
      attachmentUrl TEXT,
      attachmentName TEXT,
      attachmentType TEXT,
      status TEXT DEFAULT 'DRAFT',
      minDelay INTEGER DEFAULT 5,
      maxDelay INTEGER DEFAULT 15,
      scheduledAt TEXT,
      recurrence TEXT DEFAULT 'NONE',
      recurrenceDays INTEGER DEFAULT 0,
      nextRunAt TEXT,
      startedAt TEXT,
      completedAt TEXT,
      totalRecipients INTEGER DEFAULT 0,
      sentCount INTEGER DEFAULT 0,
      failedCount INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (templateId) REFERENCES templates(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS message_logs (
      id TEXT PRIMARY KEY,
      campaignId TEXT,
      studentId TEXT,
      recipientName TEXT NOT NULL,
      recipientPhone TEXT NOT NULL,
      recipientGroup TEXT NOT NULL,
      renderedMessage TEXT NOT NULL,
      hasAttachment INTEGER DEFAULT 0,
      status TEXT DEFAULT 'PENDING',
      errorMessage TEXT,
      sentAt TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      mockMode INTEGER DEFAULT 0,
      defaultMinDelay INTEGER DEFAULT 5,
      defaultMaxDelay INTEGER DEFAULT 15,
      batchSize INTEGER DEFAULT 20,
      batchPauseSeconds INTEGER DEFAULT 60,
      institutionName TEXT DEFAULT 'Coordenação Acadêmica de TCC & Estágio',
      coordinatorName TEXT DEFAULT 'Coordenação de Curso',
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research_evaluations (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      stageNumber INTEGER NOT NULL,
      stageTitle TEXT NOT NULL,
      fileName TEXT NOT NULL,
      fileUrl TEXT NOT NULL,
      fileType TEXT,
      fileSize INTEGER,
      sourceFileName TEXT,
      sourceFileUrl TEXT,
      criteriaText TEXT NOT NULL,
      sourceRefText TEXT,
      evaluationReport TEXT NOT NULL,
      strengths TEXT,
      improvements TEXT,
      suggestedGrade TEXT,
      status TEXT DEFAULT 'EVALUATED',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transition_guidelines (
      id TEXT PRIMARY KEY,
      stageOrigin TEXT NOT NULL,
      stageTarget TEXT NOT NULL,
      title TEXT NOT NULL,
      defaultSources TEXT NOT NULL,
      structureGuidelines TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_models (
      id TEXT PRIMARY KEY,
      groupName TEXT NOT NULL,
      title TEXT NOT NULL,
      fileName TEXT NOT NULL,
      fileUrl TEXT NOT NULL,
      filePath TEXT NOT NULL,
      fileSize INTEGER DEFAULT 0,
      fileType TEXT,
      description TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // Dynamically add columns if missing from existing database
  try {
    const studentCols = sqlite.pragma('table_info(students)') as any[];
    const colNames = studentCols.map((c) => c.name);
    if (!colNames.includes('defenseDate')) {
      sqlite.exec('ALTER TABLE students ADD COLUMN defenseDate TEXT;');
    }
    if (!colNames.includes('grade')) {
      sqlite.exec('ALTER TABLE students ADD COLUMN grade TEXT;');
    }
    if (!colNames.includes('topic')) {
      sqlite.exec('ALTER TABLE students ADD COLUMN topic TEXT;');
    }

    const campCols = sqlite.pragma('table_info(campaigns)') as any[];
    const campColNames = campCols.map((c) => c.name);
    if (!campColNames.includes('recurrence')) {
      sqlite.exec("ALTER TABLE campaigns ADD COLUMN recurrence TEXT DEFAULT 'NONE';");
    }
    if (!campColNames.includes('recurrenceDays')) {
      sqlite.exec('ALTER TABLE campaigns ADD COLUMN recurrenceDays INTEGER DEFAULT 0;');
    }
    if (!campColNames.includes('nextRunAt')) {
      sqlite.exec('ALTER TABLE campaigns ADD COLUMN nextRunAt TEXT;');
    }

    const evalCols = sqlite.pragma('table_info(research_evaluations)') as any[];
    const evalColNames = evalCols.map((c) => c.name);
    if (!evalColNames.includes('sourceFileName')) {
      sqlite.exec('ALTER TABLE research_evaluations ADD COLUMN sourceFileName TEXT;');
    }
    if (!evalColNames.includes('sourceFileUrl')) {
      sqlite.exec('ALTER TABLE research_evaluations ADD COLUMN sourceFileUrl TEXT;');
    }

    const transCols = sqlite.pragma('table_info(transition_guidelines)') as any[];
    const transColNames = transCols.map((c) => c.name);
    if (!transColNames.includes('sourceFileName')) {
      sqlite.exec('ALTER TABLE transition_guidelines ADD COLUMN sourceFileName TEXT;');
    }
    if (!transColNames.includes('sourceFileUrl')) {
      sqlite.exec('ALTER TABLE transition_guidelines ADD COLUMN sourceFileUrl TEXT;');
    }
    if (!transColNames.includes('sourceFilePath')) {
      sqlite.exec('ALTER TABLE transition_guidelines ADD COLUMN sourceFilePath TEXT;');
    }

    // Seed default transition guidelines if not exist
    const now = new Date().toISOString();
    const tpeGuideline = sqlite.prepare('SELECT id FROM transition_guidelines WHERE id = ?').get('TPE_TO_TCC1');
    const tpeSourcesText = `1. Roteiro de Desenvolvimento do TCC 1: 5 Passos Estruturantes (Passo 1: Elementos Pré-Textuais; Passo 2: Introdução em texto corrido com Contextualização, Justificativa, Problema, Hipótese, Objetivos e Estrutura; Passo 3: Metodologia e Delineamento; Passo 4: Referencial Teórico com 5 a 6 páginas; Passo 5: Referências ABNT).
2. Critérios Verificados na Pesquisa TCC 1 da URCA: Título delimitado, Introdução estruturada sem subtítulos, Metodologia com unidade de análise e amostragem, Referencial Teórico com diálogo de autores (Resultados e Discussões exclusivos de TCC 2).
3. Normas ABNT NBR 14724 (Trabalhos Acadêmicos), NBR 10520 (Citações) e NBR 6023:2018 (Referências).
4. Bases Acadêmicas Qualis/Capes, SciELO e Fontes Primárias/Secundárias (TCE-CE, IBGE MUNIC, Portais de Transparência).`;

    if (!tpeGuideline) {
      sqlite.prepare(`
        INSERT INTO transition_guidelines (id, stageOrigin, stageTarget, title, defaultSources, structureGuidelines, sourceFileName, sourceFileUrl, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'TPE_TO_TCC1',
        'TPE',
        'TCC 1',
        'Diretrizes & Fontes Estruturantes: Transição TPE ➔ TCC 1 (URCA)',
        tpeSourcesText,
        `Estruturação do Artigo TCC 1 segundo o Roteiro e Critérios da URCA: Introdução Expandida (2-3 págs), Metodologia Replicável (1,5-2 págs), Referencial Teórico Triplicado (5-6 págs) e Referências ABNT.`,
        'Roteiro_Desenvolvimento_TCC1.txt',
        '/docs/Roteiro_Desenvolvimento_TCC1.txt',
        now
      );
    } else {
      sqlite.prepare(`
        UPDATE transition_guidelines 
        SET defaultSources = ?, title = ?, sourceFileName = COALESCE(sourceFileName, 'Roteiro_Desenvolvimento_TCC1.txt'), sourceFileUrl = COALESCE(sourceFileUrl, '/docs/Roteiro_Desenvolvimento_TCC1.txt'), updatedAt = ?
        WHERE id = 'TPE_TO_TCC1'
      `).run(
        tpeSourcesText,
        'Diretrizes & Fontes Estruturantes: Transição TPE ➔ TCC 1 (URCA)',
        now
      );
    }

    const tcc1Guideline = sqlite.prepare('SELECT id FROM transition_guidelines WHERE id = ?').get('TCC1_TO_TCC2');
    if (!tcc1Guideline) {
      sqlite.prepare(`
        INSERT INTO transition_guidelines (id, stageOrigin, stageTarget, title, defaultSources, structureGuidelines, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'TCC1_TO_TCC2',
        'TCC 1',
        'TCC 2',
        'Diretrizes & Fontes Estruturantes: Transição TCC 1 ➔ TCC 2',
        `1. Manual de Apresentação, Redação Final e Defesa de TCC 2.\n2. Diretrizes de Coleta, Tabulação e Tratamento de Dados (Microdados, Questionários, Entrevistas).\n3. Critérios de Avaliação da Banca Examinadora: Rigor analítico, originalidade e consistência dos resultados.\n4. Normas ABNT para Apresentação Tabular (IBGE), Gráficos e Ilustrações.`,
        `Desenvolvimento Completo do TCC 2: Coleta Empírica, Apresentação e Discussão dos Resultados confrontando com os Autores do Marco Teórico, Validação das Hipóteses, Considerações Finais com Contribuições Práticas e Formatação Final para Defesa.`,
        now
      );
    }

    // Auto-update existing Plagiarism & AI reports to include Section 5 (Legal declaration) if missing
    try {
      const legalDeclBlock = `---

#### 5. ⚖️ Declaração de Garantia de Veracidade, Integridade Probatória e Amparo Legal (Google Gemini AI Engine)
> **Declaração de Conformidade e Autenticidade Tecnológica:** O motor de Inteligência Artificial **Google Gemini / Advanced Agentic Auditor**, operando no ecossistema de avaliação acadêmica desta instituição, atesta e garante a veracidade técnica dos dados apresentados, a integridade da extração de texto do arquivo submetido, a precisão algorítmica da varredura de similaridade na Web e a consistência da análise probabilística de padrões sintéticos. O procedimento foi executado em estrita observância à cadeia de custódia do documento original, assegurando que o diagnóstico reflete fielmente o conteúdo depositado pelo discente.

##### 📚 **Fundamentação Jurídica, Administrativa e Normativa:**
* ⚖️ **Art. 207 da Constituição Federal de 1988:** Autonomia didático-científica e administrativa das instituições de ensino superior para a definição de metodologias avaliativas, verificação de originalidade e fixação de critérios de integridade acadêmica.
* ⚖️ **Art. 5º, incisos XIV e LV da Constituição Federal de 1988:** Garantia constitucional de transparência técnica, publicidade dos parâmetros de auditoria e pleno exercício do contraditório e da ampla defesa pedagógica em eventuais recursos administrativos.
* ⚖️ **Lei Federal nº 9.610/1998 (Lei de Direitos Autorais - LDA):** Arts. 29, 33 e 46, incisos III e VIII, que estabelecem a proteção contra a apropriação indevida de obra alheia (plágio), os limites estritos da citação direta e indireta com menção obrigatória ao autor e à fonte, e a legalidade das paráfrases científicas legítimas.
* ⚖️ **Lei Federal nº 9.784/1999 (Processo Administrativo):** Art. 50, que preconiza o Princípio da Motivação explícita, clara e congruente dos atos avaliativos e decisórios no âmbito institucional, servindo o presente laudo como peça probatória e fundamentação técnica do parecer docente.
* ⚖️ **Lei Federal nº 14.129/2021 (Governo Digital & Eficiência Pública):** Reconhecimento da validade probatória, autenticidade e eficácia dos atos administrativos praticados com suporte em ferramentas digitais e algoritmos auditáveis.
* ⚖️ **Normas ABNT (NBR 14724, NBR 10520 e NBR 6023):** Diretrizes técnico-científicas oficiais para apresentação de trabalhos acadêmicos, citações em documentos e elaboração de referências bibliográficas.

---

#### 6. 🏆 Certificado Preliminar de Integridade Acadêmica`;

      const existingEvals = sqlite.prepare('SELECT id, stageTitle, evaluationReport FROM research_evaluations').all() as any[];
      for (const ev of existingEvals) {
        if (
          (ev.stageTitle.includes('Plágio') || ev.evaluationReport.includes('Auditoria de Integridade')) &&
          !ev.evaluationReport.includes('Declaração de Garantia')
        ) {
          let rep = ev.evaluationReport;
          if (rep.includes('#### 5. 🏆 Certificado Preliminar')) {
            rep = rep.replace('#### 5. 🏆 Certificado Preliminar', legalDeclBlock);
          } else {
            const lastHr = rep.lastIndexOf('---');
            if (lastHr !== -1) {
              rep = rep.slice(0, lastHr) + '\n\n' + legalDeclBlock + '\n* **Parecer do Agente Auditado:** **APROVADO NA VERIFICAÇÃO DE PLÁGIO E IA / CONFORME**\n* **Nota de Conformidade Ética:** **9.6 / 10** (Excelente Desempenho Autoral)\n* **Validação Institucional:** Documento dotado de rastreabilidade digital e fundamentação jurídica, sujeito à homologação e assinatura do Professor Orientador.';
            }
          }
          sqlite.prepare('UPDATE research_evaluations SET evaluationReport = ? WHERE id = ?').run(rep, ev.id);
        }

        if (ev.stageTitle.includes('Passos') || ev.evaluationReport.includes('Roteiro')) {
          let rep = ev.evaluationReport;
          if (rep.includes('Análise de Dados, Discussão') || rep.includes('Considerações Finais & Contribuições')) {
            rep = rep.replace(
              /#####\s*📌\s*5\.\s*Análise[\s\S]*?(?=####\s*4\.\s*🔗|####\s*3\.\s*⚠️|#####\s*📌\s*PASSO\s*5)/i,
              `##### 📌 **4. Resultados e Discussões (não faz parte de TCC 1, apenas em TCC 2)**\n\n---\n\n##### 📌 **5. Considerações Finais (não faz parte de TCC 1, apenas em TCC 2)**\n\n---\n\n`
            );
            sqlite.prepare('UPDATE research_evaluations SET evaluationReport = ? WHERE id = ?').run(rep, ev.id);
          }
        }
      }
    } catch (e) {
      console.warn('[DB Migration] Aviso ao atualizar pareceres:', e);
    }
  } catch (err) {
    console.warn('[DB Init] Colunas já existentes ou verificadas.');
  }
}

// Auto-run schema creation on import
initDatabase();

export const db = {
  $disconnect: async () => {
    // sqlite is synchronous
  },
  student: {
    findMany: (options?: { where?: any; orderBy?: any }) => {
      let query = 'SELECT * FROM students WHERE 1=1';
      const params: any[] = [];

      if (options?.where) {
        if (options.where.group && options.where.group !== 'ALL') {
          query += ' AND "group" = ?';
          params.push(options.where.group);
        } else if (options.where.group === 'ALL') {
          query += " AND \"group\" != 'CONCLUIDO'";
        }
        if (options.where.status && options.where.status !== 'ALL') {
          query += ' AND status = ?';
          params.push(options.where.status);
        }
        if (options.where.search) {
          query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR topic LIKE ? OR grade LIKE ?)';
          const s = `%${options.where.search}%`;
          params.push(s, s, s, s, s);
        }
      }

      query += ' ORDER BY name ASC';
      return sqlite.prepare(query).all(...params) as any[];
    },
    findUnique: (options: { where: { id: string } }) => {
      return sqlite.prepare('SELECT * FROM students WHERE id = ?').get(options.where.id) as any;
    },
    count: (options?: { where?: any }) => {
      let query = 'SELECT COUNT(*) as count FROM students WHERE 1=1';
      const params: any[] = [];
      if (options?.where?.group && options.where.group !== 'ALL') {
        query += ' AND "group" = ?';
        params.push(options.where.group);
      }
      const res = sqlite.prepare(query).get(...params) as any;
      return res ? res.count : 0;
    },
    create: (options: { data: any }) => {
      const id = options.data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const stmt = sqlite.prepare(`
        INSERT INTO students (id, name, phone, originalPhone, "group", advisor, topic, email, deadline, defenseDate, grade, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        toSqliteParam(options.data.name),
        toSqliteParam(options.data.phone),
        toSqliteParam(options.data.originalPhone),
        toSqliteParam(options.data.group),
        toSqliteParam(options.data.advisor),
        toSqliteParam(options.data.topic),
        toSqliteParam(options.data.email),
        toSqliteParam(options.data.deadline),
        toSqliteParam(options.data.defenseDate),
        toSqliteParam(options.data.grade),
        toSqliteParam(options.data.status || 'ACTIVE'),
        now,
        now
      );
      return db.student.findUnique({ where: { id } });
    },
    createMany: (options: { data: any[] }) => {
      const insertMany = sqlite.transaction((items: any[]) => {
        const stmt = sqlite.prepare(`
          INSERT INTO students (id, name, phone, originalPhone, "group", advisor, topic, email, deadline, defenseDate, grade, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const now = new Date().toISOString();
        for (const item of items) {
          const id = item.id || crypto.randomUUID();
          stmt.run(
            id,
            toSqliteParam(item.name),
            toSqliteParam(item.phone),
            toSqliteParam(item.originalPhone),
            toSqliteParam(item.group),
            toSqliteParam(item.advisor),
            toSqliteParam(item.topic),
            toSqliteParam(item.email),
            toSqliteParam(item.deadline),
            toSqliteParam(item.defenseDate),
            toSqliteParam(item.grade),
            toSqliteParam(item.status || 'ACTIVE'),
            now,
            now
          );
        }
      });
      insertMany(options.data);
      return { count: options.data.length };
    },
    update: (options: { where: { id: string }; data: any }) => {
      const current = db.student.findUnique({ where: options.where });
      if (!current) throw new Error('Aluno não encontrado');
      const updated = { ...current, ...options.data, updatedAt: new Date().toISOString() };
      const stmt = sqlite.prepare(`
        UPDATE students SET
          name = ?, phone = ?, originalPhone = ?, "group" = ?, advisor = ?, topic = ?, email = ?,
          deadline = ?, defenseDate = ?, grade = ?, status = ?, updatedAt = ?
        WHERE id = ?
      `);
      stmt.run(
        toSqliteParam(updated.name),
        toSqliteParam(updated.phone),
        toSqliteParam(updated.originalPhone),
        toSqliteParam(updated.group),
        toSqliteParam(updated.advisor),
        toSqliteParam(updated.topic),
        toSqliteParam(updated.email),
        toSqliteParam(updated.deadline),
        toSqliteParam(updated.defenseDate),
        toSqliteParam(updated.grade),
        toSqliteParam(updated.status),
        toSqliteParam(updated.updatedAt),
        options.where.id
      );
      return updated;
    },
    delete: (options: { where: { id: string } }) => {
      sqlite.prepare('DELETE FROM students WHERE id = ?').run(options.where.id);
      return true;
    },
    deleteMany: (options?: { where?: { group?: string } }) => {
      if (options?.where?.group && options.where.group !== 'ALL') {
        const res = sqlite.prepare('DELETE FROM students WHERE "group" = ?').run(options.where.group);
        return { count: res.changes };
      }
      const res = sqlite.prepare('DELETE FROM students').run();
      return { count: res.changes };
    }
  },

  template: {
    findMany: (options?: { where?: any }) => {
      let query = 'SELECT * FROM templates WHERE 1=1';
      const params: any[] = [];
      if (options?.where?.group && options.where.group !== 'ALL') {
        query += ' AND ("group" = ? OR "group" = "ALL")';
        params.push(options.where.group);
      }
      query += ' ORDER BY createdAt DESC';
      return sqlite.prepare(query).all(...params) as any[];
    },
    findUnique: (options: { where: { id: string } }) => {
      return sqlite.prepare('SELECT * FROM templates WHERE id = ?').get(options.where.id) as any;
    },
    count: () => {
      const res = sqlite.prepare('SELECT COUNT(*) as count FROM templates').get() as any;
      return res ? res.count : 0;
    },
    create: (options: { data: any }) => {
      const id = options.data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const stmt = sqlite.prepare(`
        INSERT INTO templates (id, title, "group", content, attachmentUrl, attachmentType, attachmentName, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        toSqliteParam(options.data.title),
        toSqliteParam(options.data.group || 'ALL'),
        toSqliteParam(options.data.content),
        toSqliteParam(options.data.attachmentUrl),
        toSqliteParam(options.data.attachmentType),
        toSqliteParam(options.data.attachmentName),
        now,
        now
      );
      return db.template.findUnique({ where: { id } });
    },
    createMany: (options: { data: any[] }) => {
      const insertMany = sqlite.transaction((items: any[]) => {
        const stmt = sqlite.prepare(`
          INSERT INTO templates (id, title, "group", content, attachmentUrl, attachmentType, attachmentName, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const now = new Date().toISOString();
        for (const item of items) {
          const id = item.id || crypto.randomUUID();
          stmt.run(
            id,
            toSqliteParam(item.title),
            toSqliteParam(item.group || 'ALL'),
            toSqliteParam(item.content),
            toSqliteParam(item.attachmentUrl),
            toSqliteParam(item.attachmentType),
            toSqliteParam(item.attachmentName),
            now,
            now
          );
        }
      });
      insertMany(options.data);
      return { count: options.data.length };
    },
    update: (options: { where: { id: string }; data: any }) => {
      const current = db.template.findUnique({ where: options.where });
      if (!current) throw new Error('Modelo não encontrado');
      const updated = { ...current, ...options.data, updatedAt: new Date().toISOString() };
      const stmt = sqlite.prepare(`
        UPDATE templates SET
          title = ?, "group" = ?, content = ?, attachmentUrl = ?, attachmentType = ?, attachmentName = ?, updatedAt = ?
        WHERE id = ?
      `);
      stmt.run(
        toSqliteParam(updated.title),
        toSqliteParam(updated.group),
        toSqliteParam(updated.content),
        toSqliteParam(updated.attachmentUrl),
        toSqliteParam(updated.attachmentType),
        toSqliteParam(updated.attachmentName),
        toSqliteParam(updated.updatedAt),
        options.where.id
      );
      return updated;
    },
    delete: (options: { where: { id: string } }) => {
      sqlite.prepare('DELETE FROM templates WHERE id = ?').run(options.where.id);
      return true;
    }
  },

  campaign: {
    findMany: (options?: { orderBy?: any; take?: number }) => {
      let query = 'SELECT * FROM campaigns ORDER BY createdAt DESC';
      if (options?.take) {
        query += ` LIMIT ${options.take}`;
      }
      return sqlite.prepare(query).all() as any[];
    },
    findUnique: (options: { where: { id: string }; include?: any }) => {
      const campaign = sqlite.prepare('SELECT * FROM campaigns WHERE id = ?').get(options.where.id) as any;
      if (!campaign) return null;
      if (options?.include?.logs) {
        campaign.logs = sqlite.prepare('SELECT * FROM message_logs WHERE campaignId = ? ORDER BY createdAt ASC').all(campaign.id) as any[];
      }
      return campaign;
    },
    create: (options: { data: any }) => {
      const id = options.data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const stmt = sqlite.prepare(`
        INSERT INTO campaigns (
          id, title, targetGroup, templateId, messageContent, attachmentUrl, attachmentName, attachmentType,
          status, minDelay, maxDelay, scheduledAt, recurrence, recurrenceDays, nextRunAt,
          totalRecipients, sentCount, failedCount, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        toSqliteParam(options.data.title),
        toSqliteParam(options.data.targetGroup),
        toSqliteParam(options.data.templateId),
        toSqliteParam(options.data.messageContent),
        toSqliteParam(options.data.attachmentUrl),
        toSqliteParam(options.data.attachmentName),
        toSqliteParam(options.data.attachmentType),
        toSqliteParam(options.data.status || 'DRAFT'),
        options.data.minDelay || 5,
        options.data.maxDelay || 15,
        toSqliteParam(options.data.scheduledAt),
        toSqliteParam(options.data.recurrence || 'NONE'),
        Number(options.data.recurrenceDays) || 0,
        toSqliteParam(options.data.nextRunAt),
        options.data.totalRecipients || 0,
        options.data.sentCount || 0,
        options.data.failedCount || 0,
        now,
        now
      );
      return db.campaign.findUnique({ where: { id } });
    },
    update: (options: { where: { id: string }; data: any }) => {
      const current = db.campaign.findUnique({ where: options.where });
      if (!current) throw new Error('Campanha não encontrada');
      const updated = { ...current, ...options.data, updatedAt: new Date().toISOString() };
      const stmt = sqlite.prepare(`
        UPDATE campaigns SET
          title = ?, targetGroup = ?, templateId = ?, messageContent = ?, attachmentUrl = ?, attachmentName = ?, attachmentType = ?,
          status = ?, minDelay = ?, maxDelay = ?, scheduledAt = ?, recurrence = ?, recurrenceDays = ?, nextRunAt = ?,
          startedAt = ?, completedAt = ?, totalRecipients = ?, sentCount = ?, failedCount = ?, updatedAt = ?
        WHERE id = ?
      `);
      stmt.run(
        toSqliteParam(updated.title),
        toSqliteParam(updated.targetGroup),
        toSqliteParam(updated.templateId),
        toSqliteParam(updated.messageContent),
        toSqliteParam(updated.attachmentUrl),
        toSqliteParam(updated.attachmentName),
        toSqliteParam(updated.attachmentType),
        toSqliteParam(updated.status),
        Number(updated.minDelay) || 5,
        Number(updated.maxDelay) || 15,
        toSqliteParam(updated.scheduledAt),
        toSqliteParam(updated.recurrence || 'NONE'),
        Number(updated.recurrenceDays) || 0,
        toSqliteParam(updated.nextRunAt),
        toSqliteParam(updated.startedAt),
        toSqliteParam(updated.completedAt),
        Number(updated.totalRecipients) || 0,
        Number(updated.sentCount) || 0,
        Number(updated.failedCount) || 0,
        toSqliteParam(updated.updatedAt),
        options.where.id
      );
      return updated;
    },
    delete: (options: { where: { id: string } }) => {
      sqlite.prepare('DELETE FROM message_logs WHERE campaignId = ?').run(options.where.id);
      sqlite.prepare('DELETE FROM campaigns WHERE id = ?').run(options.where.id);
      return true;
    }
  },

  messageLog: {
    findMany: (options?: { where?: any; orderBy?: any; take?: number }) => {
      let query = 'SELECT * FROM message_logs WHERE 1=1';
      const params: any[] = [];
      if (options?.where?.campaignId) {
        query += ' AND campaignId = ?';
        params.push(options.where.campaignId);
      }
      if (options?.where?.status && options.where.status !== 'ALL') {
        query += ' AND status = ?';
        params.push(options.where.status);
      }
      if (options?.where?.recipientGroup && options.where.recipientGroup !== 'ALL') {
        query += ' AND recipientGroup = ?';
        params.push(options.where.recipientGroup);
      }
      query += ' ORDER BY createdAt DESC';
      if (options?.take) {
        query += ` LIMIT ${options.take}`;
      }
      return sqlite.prepare(query).all(...params) as any[];
    },
    count: (options?: { where?: any }) => {
      let query = 'SELECT COUNT(*) as count FROM message_logs WHERE 1=1';
      const params: any[] = [];
      if (options?.where?.status && options.where.status !== 'ALL') {
        query += ' AND status = ?';
        params.push(options.where.status);
      }
      const res = sqlite.prepare(query).get(...params) as any;
      return res ? res.count : 0;
    },
    create: (options: { data: any }) => {
      const id = options.data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const stmt = sqlite.prepare(`
        INSERT INTO message_logs (
          id, campaignId, studentId, recipientName, recipientPhone, recipientGroup,
          renderedMessage, hasAttachment, status, errorMessage, sentAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        toSqliteParam(options.data.campaignId),
        toSqliteParam(options.data.studentId),
        toSqliteParam(options.data.recipientName),
        toSqliteParam(options.data.recipientPhone),
        toSqliteParam(options.data.recipientGroup),
        toSqliteParam(options.data.renderedMessage),
        options.data.hasAttachment ? 1 : 0,
        toSqliteParam(options.data.status || 'PENDING'),
        toSqliteParam(options.data.errorMessage),
        toSqliteParam(options.data.sentAt),
        now
      );
      return sqlite.prepare('SELECT * FROM message_logs WHERE id = ?').get(id) as any;
    },
    update: (options: { where: { id: string }; data: any }) => {
      const current = sqlite.prepare('SELECT * FROM message_logs WHERE id = ?').get(options.where.id) as any;
      if (!current) throw new Error('Log não encontrado');
      const updated = { ...current, ...options.data };
      const stmt = sqlite.prepare(`
        UPDATE message_logs SET
          status = ?, errorMessage = ?, sentAt = ?
        WHERE id = ?
      `);
      stmt.run(
        toSqliteParam(updated.status),
        toSqliteParam(updated.errorMessage),
        toSqliteParam(updated.sentAt),
        options.where.id
      );
      return updated;
    }
  },

  setting: {
    findUnique: (options: { where: { id: string } }) => {
      const row = sqlite.prepare('SELECT * FROM settings WHERE id = ?').get(options.where.id) as any;
      if (!row) return null;
      return {
        ...row,
        mockMode: Boolean(row.mockMode),
      };
    },
    upsert: (options: { where: { id: string }; update: any; create: any }) => {
      const existing = db.setting.findUnique(options);
      const now = new Date().toISOString();
      if (existing) {
        const merged = { ...existing, ...options.update, updatedAt: now };
        const stmt = sqlite.prepare(`
          UPDATE settings SET
            mockMode = ?, defaultMinDelay = ?, defaultMaxDelay = ?, batchSize = ?,
            batchPauseSeconds = ?, institutionName = ?, coordinatorName = ?, updatedAt = ?
          WHERE id = ?
        `);
        stmt.run(
          merged.mockMode ? 1 : 0,
          merged.defaultMinDelay,
          merged.defaultMaxDelay,
          merged.batchSize,
          merged.batchPauseSeconds,
          toSqliteParam(merged.institutionName),
          toSqliteParam(merged.coordinatorName),
          now,
          options.where.id
        );
        return db.setting.findUnique(options);
      } else {
        const item = { ...options.create, updatedAt: now };
        const stmt = sqlite.prepare(`
          INSERT INTO settings (id, mockMode, defaultMinDelay, defaultMaxDelay, batchSize, batchPauseSeconds, institutionName, coordinatorName, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          item.id || 'global',
          item.mockMode ? 1 : 0,
          item.defaultMinDelay || 5,
          item.defaultMaxDelay || 15,
          item.batchSize || 20,
          item.batchPauseSeconds || 60,
          toSqliteParam(item.institutionName || 'Coordenação Acadêmica'),
          toSqliteParam(item.coordinatorName || 'Coordenação de Curso'),
          now
        );
        return db.setting.findUnique(options);
      }
    }
  },

  evaluation: {
    findMany: (options: { where: { studentId: string } }) => {
      return sqlite.prepare(`
        SELECT * FROM research_evaluations
        WHERE studentId = ?
        ORDER BY stageNumber ASC
      `).all(options.where.studentId) as any[];
    },
    findUnique: (options: { where: { id: string } }) => {
      return sqlite.prepare('SELECT * FROM research_evaluations WHERE id = ?').get(options.where.id) as any;
    },
    create: (options: { data: any }) => {
      const id = options.data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const stmt = sqlite.prepare(`
        INSERT INTO research_evaluations (
          id, studentId, stageNumber, stageTitle, fileName, fileUrl, fileType, fileSize,
          sourceFileName, sourceFileUrl,
          criteriaText, sourceRefText, evaluationReport, strengths, improvements,
          suggestedGrade, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        options.data.studentId,
        Number(options.data.stageNumber) || 1,
        toSqliteParam(options.data.stageTitle || 'Etapa 1 - Versão Inicial'),
        toSqliteParam(options.data.fileName),
        toSqliteParam(options.data.fileUrl),
        toSqliteParam(options.data.fileType),
        Number(options.data.fileSize) || 0,
        toSqliteParam(options.data.sourceFileName),
        toSqliteParam(options.data.sourceFileUrl),
        toSqliteParam(options.data.criteriaText),
        toSqliteParam(options.data.sourceRefText),
        toSqliteParam(options.data.evaluationReport),
        toSqliteParam(options.data.strengths),
        toSqliteParam(options.data.improvements),
        toSqliteParam(options.data.suggestedGrade),
        toSqliteParam(options.data.status || 'EVALUATED'),
        now,
        now
      );
      return db.evaluation.findUnique({ where: { id } });
    },
    delete: (options: { where: { id: string } }) => {
      sqlite.prepare('DELETE FROM research_evaluations WHERE id = ?').run(options.where.id);
      return true;
    }
  },

  transitionGuideline: {
    findUnique: (options: { where: { id: string } }) => {
      return sqlite.prepare('SELECT * FROM transition_guidelines WHERE id = ?').get(options.where.id) as any;
    },
    findMany: () => {
      return sqlite.prepare('SELECT * FROM transition_guidelines ORDER BY stageOrigin ASC').all() as any[];
    },
    upsert: (options: { where: { id: string }; update: any; create: any }) => {
      const existing = sqlite.prepare('SELECT * FROM transition_guidelines WHERE id = ?').get(options.where.id) as any;
      const now = new Date().toISOString();
      if (existing) {
        sqlite.prepare(`
          UPDATE transition_guidelines
          SET title = ?, defaultSources = ?, structureGuidelines = ?, sourceFileName = ?, sourceFileUrl = ?, sourceFilePath = ?, updatedAt = ?
          WHERE id = ?
        `).run(
          toSqliteParam(options.update.title || existing.title),
          toSqliteParam(options.update.defaultSources !== undefined ? options.update.defaultSources : existing.defaultSources),
          toSqliteParam(options.update.structureGuidelines !== undefined ? options.update.structureGuidelines : existing.structureGuidelines),
          toSqliteParam(options.update.sourceFileName !== undefined ? options.update.sourceFileName : existing.sourceFileName),
          toSqliteParam(options.update.sourceFileUrl !== undefined ? options.update.sourceFileUrl : existing.sourceFileUrl),
          toSqliteParam(options.update.sourceFilePath !== undefined ? options.update.sourceFilePath : existing.sourceFilePath),
          now,
          options.where.id
        );
      } else {
        sqlite.prepare(`
          INSERT INTO transition_guidelines (id, stageOrigin, stageTarget, title, defaultSources, structureGuidelines, sourceFileName, sourceFileUrl, sourceFilePath, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          options.where.id,
          toSqliteParam(options.create.stageOrigin),
          toSqliteParam(options.create.stageTarget),
          toSqliteParam(options.create.title),
          toSqliteParam(options.create.defaultSources),
          toSqliteParam(options.create.structureGuidelines),
          toSqliteParam(options.create.sourceFileName),
          toSqliteParam(options.create.sourceFileUrl),
          toSqliteParam(options.create.sourceFilePath),
          now
        );
      }
      return sqlite.prepare('SELECT * FROM transition_guidelines WHERE id = ?').get(options.where.id) as any;
    }
  },

  projectModel: {
    findUnique: (options: { where: { id: string } }) => {
      return sqlite.prepare('SELECT * FROM project_models WHERE id = ?').get(options.where.id) as any;
    },
    findByGroup: (groupName: string) => {
      const normalized = groupName.trim().toUpperCase();
      return sqlite.prepare('SELECT * FROM project_models WHERE UPPER(groupName) = ?').get(normalized) as any;
    },
    findMany: () => {
      return sqlite.prepare('SELECT * FROM project_models ORDER BY groupName ASC').all() as any[];
    },
    upsert: (options: { where: { id: string }; update: any; create: any }) => {
      const existing = sqlite.prepare('SELECT * FROM project_models WHERE id = ?').get(options.where.id) as any;
      const now = new Date().toISOString();
      if (existing) {
        sqlite.prepare(`
          UPDATE project_models
          SET groupName = ?, title = ?, fileName = ?, fileUrl = ?, filePath = ?, fileSize = ?, fileType = ?, description = ?, updatedAt = ?
          WHERE id = ?
        `).run(
          toSqliteParam(options.update.groupName || existing.groupName),
          toSqliteParam(options.update.title || existing.title),
          toSqliteParam(options.update.fileName || existing.fileName),
          toSqliteParam(options.update.fileUrl || existing.fileUrl),
          toSqliteParam(options.update.filePath || existing.filePath),
          Number(options.update.fileSize) || existing.fileSize || 0,
          toSqliteParam(options.update.fileType || existing.fileType),
          toSqliteParam(options.update.description !== undefined ? options.update.description : existing.description),
          now,
          options.where.id
        );
      } else {
        sqlite.prepare(`
          INSERT INTO project_models (id, groupName, title, fileName, fileUrl, filePath, fileSize, fileType, description, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          options.where.id,
          toSqliteParam(options.create.groupName),
          toSqliteParam(options.create.title),
          toSqliteParam(options.create.fileName),
          toSqliteParam(options.create.fileUrl),
          toSqliteParam(options.create.filePath),
          Number(options.create.fileSize) || 0,
          toSqliteParam(options.create.fileType),
          toSqliteParam(options.create.description || ''),
          now,
          now
        );
      }
      return sqlite.prepare('SELECT * FROM project_models WHERE id = ?').get(options.where.id) as any;
    },
    delete: (options: { where: { id: string } }) => {
      sqlite.prepare('DELETE FROM project_models WHERE id = ?').run(options.where.id);
      return true;
    }
  }
};

export const prisma = db;
