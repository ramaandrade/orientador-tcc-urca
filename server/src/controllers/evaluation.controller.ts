import { Request, Response } from 'express';
import path from 'path';
import { prisma } from '../database/db';
import { aiEvaluatorService } from '../services/ai_evaluator.service';
import { whatsAppService } from '../services/whatsapp.service';
import { pdfGeneratorService } from '../services/pdf_generator.service';

export const getEvaluationsByStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const evaluations = await prisma.evaluation.findMany({ where: { studentId } });
    const student = await prisma.student.findUnique({ where: { id: studentId } });

    res.json({
      success: true,
      data: {
        student,
        evaluations,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getTransitionGuidelines = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const guideline = await prisma.transitionGuideline.findUnique({ where: { id } });
    if (!guideline) {
      res.status(404).json({ success: false, error: 'Diretrizes de transição não encontradas' });
      return;
    }
    res.json({ success: true, data: guideline });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateTransitionGuidelines = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, defaultSources, structureGuidelines } = req.body;
    const uploadedFile = (req.files as any)?.file?.[0] || req.file;

    const updateData: any = { title, defaultSources, structureGuidelines };
    if (uploadedFile) {
      updateData.sourceFileName = uploadedFile.originalname;
      updateData.sourceFileUrl = `/uploads/${uploadedFile.filename}`;
      updateData.sourceFilePath = uploadedFile.path;
    }

    const updated = await prisma.transitionGuideline.upsert({
      where: { id },
      update: updateData,
      create: {
        id,
        stageOrigin: id.startsWith('TPE') ? 'TPE' : 'TCC 1',
        stageTarget: id.startsWith('TPE') ? 'TCC 1' : 'TCC 2',
        title: title || (id.startsWith('TPE') ? 'Diretrizes para TCC 1' : 'Diretrizes para TCC 2'),
        defaultSources: defaultSources || '',
        structureGuidelines: structureGuidelines || '',
        ...updateData,
      }
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getProjectModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const group = (req.params.group as string).trim();
    const model = await prisma.projectModel.findByGroup(group);
    res.json({ success: true, data: model || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const uploadProjectModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const group = (req.params.group || req.body.groupName || 'TPE').trim();
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'O arquivo do Projeto Modelo é obrigatório.' });
      return;
    }
    const normalizedId = group.toUpperCase().replace(/\s+/g, '_');
    const title = req.body.title?.trim() || `Projeto Modelo Padrão — ${group}`;
    const description = req.body.description?.trim() || `Arquivo modelo oficial de referência para discentes em ${group}.`;

    const model = await prisma.projectModel.upsert({
      where: { id: normalizedId },
      update: {
        groupName: group,
        title,
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        filePath: file.path,
        fileSize: file.size,
        fileType: file.mimetype,
        description,
      },
      create: {
        id: normalizedId,
        groupName: group,
        title,
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        filePath: file.path,
        fileSize: file.size,
        fileType: file.mimetype,
        description,
      }
    });

    res.json({ success: true, data: model, message: `Projeto Modelo para ${group} salvo com sucesso!` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteProjectModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const group = (req.params.group as string).trim();
    const normalizedId = group.toUpperCase().replace(/\s+/g, '_');
    const existing = (await prisma.projectModel.findUnique({ where: { id: normalizedId } })) || (await prisma.projectModel.findByGroup(group));
    if (!existing) {
      res.status(404).json({ success: false, error: 'Projeto Modelo não encontrado.' });
      return;
    }
    await prisma.projectModel.delete({ where: { id: existing.id } });
    res.json({ success: true, message: `Projeto Modelo de ${group} excluído com sucesso.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createEvaluationStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, criteriaText, sourceRefText, stageTitle, isPlagiarismCheck, isNextStageRoadmap, targetStage, useGroupModel } = req.body;

    if (!studentId) {
      res.status(400).json({ success: false, error: 'O identificador do aluno é obrigatório' });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const researchFile = files?.file?.[0] || req.file;
    const sourceFile = files?.sourceFile?.[0];

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      res.status(404).json({ success: false, error: 'Aluno não encontrado' });
      return;
    }

    let activeResearchFile = researchFile;
    if (!activeResearchFile) {
      const defaultFileName = `Artigo_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const virtualPath = path.join(uploadsDir, `${Date.now()}-${defaultFileName}`);
      fs.writeFileSync(virtualPath, `Pesquisa Acadêmica de ${student.name}\nTítulo: ${student.topic || 'Não informado'}\nTurma: ${student.group}`);
      activeResearchFile = {
        fieldname: 'file',
        originalname: defaultFileName,
        encoding: '7bit',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        destination: uploadsDir,
        filename: path.basename(virtualPath),
        path: virtualPath,
        size: 2048,
      } as Express.Multer.File;
    }

    const isPlag = isPlagiarismCheck === 'true' || isPlagiarismCheck === true;
    const isRoadmap = isNextStageRoadmap === 'true' || isNextStageRoadmap === true;

    // Determine current stage number
    const existing = await prisma.evaluation.findMany({ where: { studentId } });
    const stageNumber = existing.length + 1;
    let computedTitle = stageTitle?.trim();
    if (!computedTitle) {
      if (isPlag) {
        computedTitle = `Auditoria de Plágio & IA — Etapa ${stageNumber}`;
      } else if (isRoadmap) {
        computedTitle = `Passos para o ${targetStage || 'Próximo Nível'} — Roteiro Didático`;
      } else {
        computedTitle = `Etapa ${stageNumber} — Versão ${stageNumber}`;
      }
    }

    const filePath = activeResearchFile.path;
    const fileUrl = `/uploads/${activeResearchFile.filename}`;
    const fileName = activeResearchFile.originalname;
    const fileType = activeResearchFile.mimetype;
    const fileSize = activeResearchFile.size;

    let sourceFilePath = sourceFile?.path;
    let sourceFileName = sourceFile?.originalname;
    let sourceFileUrl = sourceFile ? `/uploads/${sourceFile.filename}` : undefined;

    // If no explicit source file was attached in this turn, check if student's group has a standard Projeto Modelo
    if (!sourceFilePath && useGroupModel !== 'false' && !isPlag) {
      const groupModel = await prisma.projectModel.findByGroup(student.group);
      if (groupModel && groupModel.filePath) {
        sourceFilePath = groupModel.filePath;
        sourceFileName = `[Projeto Modelo Padrão — ${student.group}] ${groupModel.fileName}`;
        sourceFileUrl = groupModel.fileUrl;
      }
    }

    // Get previous stage evaluation if exists
    const previousStage = existing.length > 0 ? existing[existing.length - 1] : null;

    // Run AI Evaluation
    const aiResult = await aiEvaluatorService.evaluateResearch({
      studentName: student.name,
      studentGroup: student.group,
      studentTopic: student.topic,
      stageNumber,
      stageTitle: computedTitle,
      filePath,
      fileName,
      fileMimeType: fileType,
      sourceFilePath,
      sourceFileName,
      criteriaText: criteriaText?.trim() || (isPlag 
        ? 'Auditoria completa de similaridade web e detecção de padrões de texto sintético gerado por IA.' 
        : isRoadmap 
        ? `Roteiro didático completo e direcionamento estruturado com fontes para ${targetStage || 'a próxima fase'}.`
        : 'Avaliação da consistência metodológica, fundamentação teórica e normas acadêmicas.'),
      sourceRefText: sourceRefText?.trim() || undefined,
      previousStageReport: previousStage?.evaluationReport,
      isPlagiarismCheck: isPlag,
      isNextStageRoadmap: isRoadmap,
      targetStage: targetStage || (student.group === 'TPE' ? 'TCC 1' : 'TCC 2')
    });

    // Store in database
    const evaluation = await prisma.evaluation.create({
      data: {
        studentId,
        stageNumber,
        stageTitle: computedTitle,
        fileName,
        fileUrl,
        fileType,
        fileSize,
        sourceFileName: sourceFileName || null,
        sourceFileUrl: sourceFileUrl || null,
        criteriaText: criteriaText?.trim() || 'Parâmetros acadêmicos gerais',
        sourceRefText: sourceRefText?.trim() || null,
        evaluationReport: aiResult.evaluationReport,
        strengths: aiResult.strengths,
        improvements: aiResult.improvements,
        suggestedGrade: aiResult.suggestedGrade,
        status: 'EVALUATED',
      },
    });

    res.status(201).json({
      success: true,
      data: evaluation,
      message: `Etapa ${stageNumber} avaliada com sucesso pelo Agente!`,
    });
  } catch (err: any) {
    console.error('[Evaluation Controller] Erro ao criar etapa:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const sendEvaluationWhatsApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const evaluation = await prisma.evaluation.findUnique({ where: { id } });
    if (!evaluation) {
      res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
      return;
    }

    const student = await prisma.student.findUnique({ where: { id: evaluation.studentId } });
    if (!student || !student.phone) {
      res.status(400).json({ success: false, error: 'Aluno não possui telefone cadastrado' });
      return;
    }

    // 1. Generate official Academic Evaluation PDF File
    console.log(`[Evaluation Controller] 📄 Gerando arquivo PDF do parecer para ${student.name}...`);
    const pdfDoc = await pdfGeneratorService.generateEvaluationPdf({
      studentName: student.name,
      studentGroup: student.group,
      studentPhone: student.phone,
      studentTopic: student.topic,
      stageTitle: evaluation.stageTitle,
      stageNumber: evaluation.stageNumber,
      fileName: evaluation.fileName,
      suggestedGrade: evaluation.suggestedGrade,
      sourceFileName: evaluation.sourceFileName,
      evaluationReport: evaluation.evaluationReport,
      createdAt: evaluation.createdAt,
    });
    console.log(`[Evaluation Controller] ✅ PDF gerado com sucesso em: ${pdfDoc.filePath}`);

    // 2. Caption for WhatsApp
    const caption = `Olá, *${student.name.split(' ')[0]}*! 🎓\n\nSegue em anexo o *Parecer Didático Oficial* da sua pesquisa (*${evaluation.stageTitle}*).\n\n📄 *Arquivo Avaliado:* ${evaluation.fileName}\n⭐ *Nota/Parecer Preliminar:* ${evaluation.suggestedGrade || 'Aprovado'}\n\nAbra o documento PDF anexo para conferir o diagnóstico detalhado e as orientações passo a passo!\n\nQualquer dúvida, consulte seu orientador no portal acadêmico!`;

    // 3. Send PDF Document Attachment via WhatsApp
    const result = await whatsAppService.sendMessage(student.phone, caption, {
      filePath: pdfDoc.filePath,
      originalName: `Parecer Didático - ${evaluation.stageTitle}.pdf`,
      mimeType: 'application/pdf',
    });

    if (!result.success) {
      res.status(500).json({ success: false, error: result.error || 'Falha ao enviar documento do parecer via WhatsApp' });
      return;
    }

    res.json({
      success: true,
      message: `Arquivo PDF do parecer (${evaluation.stageTitle}) enviado com sucesso para ${student.name} (+${student.phone})`,
      pdfUrl: `/uploads/${path.basename(pdfDoc.filePath)}`,
    });
  } catch (err: any) {
    console.error('[Evaluation Controller] Erro ao enviar PDF do parecer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const downloadEvaluationPdfFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const evaluation = await prisma.evaluation.findUnique({ where: { id } });
    if (!evaluation) {
      res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
      return;
    }

    const student = await prisma.student.findUnique({ where: { id: evaluation.studentId } });
    if (!student) {
      res.status(404).json({ success: false, error: 'Aluno não encontrado' });
      return;
    }

    const pdfDoc = await pdfGeneratorService.generateEvaluationPdf({
      studentName: student.name,
      studentGroup: student.group,
      studentPhone: student.phone,
      studentTopic: student.topic,
      stageTitle: evaluation.stageTitle,
      stageNumber: evaluation.stageNumber,
      fileName: evaluation.fileName,
      suggestedGrade: evaluation.suggestedGrade,
      sourceFileName: evaluation.sourceFileName,
      evaluationReport: evaluation.evaluationReport,
      createdAt: evaluation.createdAt,
    });

    res.download(pdfDoc.filePath, `Parecer_Didatico_${student.name.replace(/\s+/g, '_')}_Etapa_${evaluation.stageNumber}.pdf`);
  } catch (err: any) {
    console.error('[Evaluation Controller] Erro ao baixar PDF:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteEvaluationStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.evaluation.delete({ where: { id } });
    res.json({ success: true, message: 'Etapa de avaliação removida com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
