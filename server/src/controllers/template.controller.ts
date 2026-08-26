import { Request, Response } from 'express';
import { prisma } from '../database/db';

export function renderTemplateText(templateText: string, student: any, institutionName?: string): string {
  if (!templateText) return '';
  const firstName = student.name ? student.name.split(' ')[0] : 'Aluno';
  
  return templateText
    .replace(/{nome}/gi, student.name || '')
    .replace(/{primeiro_nome}/gi, firstName)
    .replace(/{turma}/gi, student.group || '')
    .replace(/{orientador}/gi, student.advisor || 'Coordenação')
    .replace(/{titulo_pesquisa}/gi, student.topic || 'Não informado')
    .replace(/{tema}/gi, student.topic || 'Não informado')
    .replace(/{data_defesa}/gi, student.defenseDate || student.deadline || 'A definir')
    .replace(/{defesa}/gi, student.defenseDate || student.deadline || 'A definir')
    .replace(/{prazo}/gi, student.defenseDate || student.deadline || 'A definir')
    .replace(/{nota}/gi, student.grade || 'Pendente')
    .replace(/{email}/gi, student.email || '')
    .replace(/{instituicao}/gi, institutionName || 'Coordenação Acadêmica');
}

export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { group } = req.query;
    const where = group && group !== 'ALL' ? { OR: [{ group: String(group) }, { group: 'ALL' }] } : {};

    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: templates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getTemplateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const template = await prisma.template.findUnique({ where: { id } });

    if (!template) {
      res.status(404).json({ success: false, error: 'Modelo não encontrado' });
      return;
    }

    res.json({ success: true, data: template });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, group, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, error: 'Título e conteúdo são obrigatórios' });
      return;
    }

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;
    let attachmentType: string | undefined;

    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
      attachmentName = req.file.originalname;
      attachmentType = req.file.mimetype;
    }

    const template = await prisma.template.create({
      data: {
        title: title.trim(),
        group: group || 'ALL',
        content,
        attachmentUrl,
        attachmentName,
        attachmentType,
      },
    });

    res.status(201).json({ success: true, data: template });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, group, content, removeAttachment } = req.body;

    const dataToUpdate: any = {};
    if (title) dataToUpdate.title = title.trim();
    if (group) dataToUpdate.group = group;
    if (content) dataToUpdate.content = content;

    if (req.file) {
      dataToUpdate.attachmentUrl = `/uploads/${req.file.filename}`;
      dataToUpdate.attachmentName = req.file.originalname;
      dataToUpdate.attachmentType = req.file.mimetype;
    } else if (removeAttachment === 'true' || removeAttachment === true) {
      dataToUpdate.attachmentUrl = null;
      dataToUpdate.attachmentName = null;
      dataToUpdate.attachmentType = null;
    }

    const template = await prisma.template.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({ success: true, data: template });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.template.delete({ where: { id } });
    res.json({ success: true, message: 'Modelo excluído com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const previewTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, studentId } = req.body;

    let student: any;
    if (studentId) {
      student = await prisma.student.findUnique({ where: { id: studentId } });
    }

    if (!student) {
      student = {
        name: 'Mariana Souza Silva',
        group: 'TCC2',
        advisor: 'Prof. Dr. Carlos Mendes',
        topic: 'Inteligência Artificial e Ética na Educação',
        deadline: '15/11/2026',
        email: 'mariana.souza@universidade.edu.br',
      };
    }

    const settings = await prisma.setting.findUnique({ where: { id: 'global' } });
    const rendered = renderTemplateText(content || '', student, settings?.institutionName);

    res.json({
      success: true,
      data: {
        rendered,
        student,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
