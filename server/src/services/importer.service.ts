import * as XLSX from 'xlsx';
import { sanitizeBrazilianPhone } from './phone.service';

export interface ImportedStudentRow {
  name: string;
  phone: string;
  originalPhone: string;
  group: 'TPE' | 'TCC1' | 'TCC2';
  advisor?: string;
  topic?: string;
  email?: string;
  deadline?: string;
  defenseDate?: string;
  grade?: string;
  isValid: boolean;
  validationError?: string;
}

export function parseStudentsSpreadsheet(fileBuffer: Buffer): {
  students: ImportedStudentRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
} {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
  
  const students: ImportedStudentRow[] = [];

  for (const row of rawRows) {
    // Flexible header mapping (case-insensitive and trimmed)
    const findValue = (keys: string[]) => {
      for (const [k, v] of Object.entries(row)) {
        const cleanKey = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (keys.some(expected => cleanKey.includes(expected))) {
          return String(v).trim();
        }
      }
      return '';
    };

    const name = findValue(['nome', 'aluno', 'estudante', 'discente']);
    const rawPhone = findValue(['telefone', 'celular', 'whatsapp', 'fone', 'contato']);
    const rawGroup = findValue(['turma', 'grupo', 'etapa', 'fase', 'modulo', 'disciplina']).toUpperCase();
    const advisor = findValue(['orientador', 'professor', 'tutor']);
    const topic = findValue(['titulo da pesquisa', 'titulo', 'tema', 'projeto', 'trabalho']);
    const email = findValue(['email', 'e-mail', 'correio']);
    const defenseDate = findValue(['data da defesa', 'data defesa', 'defesa', 'prazo', 'data', 'limite', 'banca']);
    const grade = findValue(['nota', 'conceito', 'avaliacao', 'media']);

    // Ignore completely empty rows
    if (!name && !rawPhone && !rawGroup) {
      continue;
    }

    let validationError: string | undefined;
    let group: 'TPE' | 'TCC1' | 'TCC2' = 'TCC1';

    if (!name) {
      validationError = 'Nome do aluno não preenchido';
    }

    // Normalize group
    if (rawGroup.includes('TPE') || rawGroup.includes('ESTAGIO') || rawGroup.includes('PESQUISA')) {
      group = 'TPE';
    } else if (rawGroup.includes('TCC 2') || rawGroup.includes('TCC2') || rawGroup.includes('DEFESA') || rawGroup.includes('TCC II')) {
      group = 'TCC2';
    } else {
      group = 'TCC1';
    }

    const phoneResult = sanitizeBrazilianPhone(rawPhone);
    if (!phoneResult.isValid) {
      validationError = validationError ? `${validationError}; ${phoneResult.error}` : phoneResult.error;
    }

    students.push({
      name: name || 'Aluno sem nome',
      phone: phoneResult.sanitized || rawPhone,
      originalPhone: rawPhone,
      group,
      advisor: advisor || undefined,
      topic: topic || undefined,
      email: email || undefined,
      deadline: defenseDate || undefined,
      defenseDate: defenseDate || undefined,
      grade: grade || undefined,
      isValid: !validationError,
      validationError,
    });
  }

  const validCount = students.filter(s => s.isValid).length;
  const invalidCount = students.length - validCount;

  return {
    students,
    totalRows: students.length,
    validCount,
    invalidCount,
  };
}

export function generateSampleStudentsSpreadsheet(): Buffer {
  const sampleData = [
    {
      'Nome': 'Mariana Souza Silva',
      'Telefone': '(11) 98765-4321',
      'Turma': 'TPE',
      'Título da Pesquisa': 'Impactos da IA na Educação Infantil',
      'Data da Defesa': '15/09/2026',
      'Nota': '9.5',
      'Email': 'mariana.souza@universidade.edu.br',
    },
    {
      'Nome': 'Lucas Gabriel de Oliveira',
      'Telefone': '11976543210',
      'Turma': 'TCC1',
      'Título da Pesquisa': 'Arquitetura de Microsserviços e Escalabilidade',
      'Data da Defesa': '30/10/2026',
      'Nota': '10.0',
      'Email': 'lucas.oliveira@universidade.edu.br',
    },
    {
      'Nome': 'Beatriz Helena Ramos',
      'Telefone': '+55 (21) 99123-4567',
      'Turma': 'TCC2',
      'Título da Pesquisa': 'Segurança em Dispositivos IoT na Saúde',
      'Data da Defesa': '05/11/2026',
      'Nota': '9.0',
      'Email': 'beatriz.ramos@universidade.edu.br',
    },
    {
      'Nome': 'Gabriel Costa Andrade',
      'Telefone': '31988887777',
      'Turma': 'TCC2',
      'Título da Pesquisa': 'Blockchain aplicada à Rastreabilidade Logística',
      'Data da Defesa': '10/11/2026',
      'Nota': '9.8',
      'Email': 'gabriel.costa@universidade.edu.br',
    },
    {
      'Nome': 'Fernanda Albuquerque',
      'Telefone': '(81) 98111-2233',
      'Turma': 'TPE',
      'Título da Pesquisa': 'Energias Renováveis em Edificações Sustentáveis',
      'Data da Defesa': '20/09/2026',
      'Nota': '8.5',
      'Email': 'fernanda.alb@universidade.edu.br',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alunos_Academicos');

  // Generate buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
