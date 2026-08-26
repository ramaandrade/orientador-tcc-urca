import { Request, Response } from 'express';
import { prisma } from '../database/db';
import { sanitizeBrazilianPhone } from '../services/phone.service';
import { parseStudentsSpreadsheet, generateSampleStudentsSpreadsheet } from '../services/importer.service';

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { group, search, status } = req.query;

    const whereClause: any = {};

    if (group && group !== 'ALL') {
      whereClause.group = String(group);
    }

    if (status && status !== 'ALL') {
      whereClause.status = String(status);
    }

    if (search) {
      const q = String(search).trim();
      whereClause.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { advisor: { contains: q } },
        { topic: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: students });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!student) {
      res.status(404).json({ success: false, error: 'Aluno não encontrado' });
      return;
    }

    res.json({ success: true, data: student });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, group, advisor, topic, email, deadline, defenseDate, grade, status } = req.body;

    if (!name || !phone || !group) {
      res.status(400).json({ success: false, error: 'Nome, telefone e turma são obrigatórios' });
      return;
    }

    const phoneResult = sanitizeBrazilianPhone(phone);
    if (!phoneResult.isValid) {
      res.status(400).json({ success: false, error: phoneResult.error });
      return;
    }

    const student = await prisma.student.create({
      data: {
        name: name.trim(),
        phone: phoneResult.sanitized,
        originalPhone: phone.trim(),
        group,
        advisor: advisor?.trim() || null,
        topic: topic?.trim() || null,
        email: email?.trim() || null,
        deadline: deadline?.trim() || null,
        defenseDate: defenseDate?.trim() || null,
        grade: grade?.trim() || null,
        status: status || 'ACTIVE',
      },
    });

    res.status(201).json({ success: true, data: student });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, group, advisor, topic, email, deadline, defenseDate, grade, status } = req.body;

    let phoneSanitized: string | undefined;
    let originalPhone: string | undefined;

    if (phone) {
      const phoneResult = sanitizeBrazilianPhone(phone);
      if (!phoneResult.isValid) {
        res.status(400).json({ success: false, error: phoneResult.error });
        return;
      }
      phoneSanitized = phoneResult.sanitized;
      originalPhone = phone.trim();
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phoneSanitized && { phone: phoneSanitized, originalPhone }),
        ...(group && { group }),
        ...(advisor !== undefined && { advisor: advisor?.trim() || null }),
        ...(topic !== undefined && { topic: topic?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(deadline !== undefined && { deadline: deadline?.trim() || null }),
        ...(defenseDate !== undefined && { defenseDate: defenseDate?.trim() || null }),
        ...(grade !== undefined && { grade: grade?.trim() || null }),
        ...(status && { status }),
      },
    });

    res.json({ success: true, data: student });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.student.delete({ where: { id } });
    res.json({ success: true, message: 'Aluno removido com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const importStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Nenhum arquivo enviado (.xlsx ou .csv)' });
      return;
    }

    const parsed = parseStudentsSpreadsheet(req.file.buffer);

    const validRows = parsed.students.filter((s) => s.isValid);

    if (validRows.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Nenhum registro válido encontrado na planilha.',
        details: parsed,
      });
      return;
    }

    // Insert or update students
    const created: any[] = [];
    for (const item of validRows) {
      const student = await prisma.student.create({
        data: {
          name: item.name,
          phone: item.phone,
          originalPhone: item.originalPhone,
          group: item.group,
          advisor: item.advisor || null,
          topic: item.topic || null,
          email: item.email || null,
          deadline: item.deadline || null,
          defenseDate: item.defenseDate || item.deadline || null,
          grade: item.grade || null,
          status: 'ACTIVE',
        },
      });
      created.push(student);
    }

    res.json({
      success: true,
      data: {
        importedCount: created.length,
        totalInFile: parsed.totalRows,
        invalidCount: parsed.invalidCount,
        invalidRows: parsed.students.filter((s) => !s.isValid),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const downloadSampleSpreadsheet = async (req: Request, res: Response): Promise<void> => {
  try {
    const buffer = generateSampleStudentsSpreadsheet();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="modelo_importacao_alunos_tcc.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const clearStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { group } = req.body;
    const where = group && group !== 'ALL' ? { group } : {};
    const result = await prisma.student.deleteMany({ where });
    res.json({ success: true, count: result.count });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
