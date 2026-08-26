import { Request, Response } from 'express';
import { prisma } from '../database/db';
import { queueService } from '../services/queue.service';
import { renderTemplateText } from './template.controller';

export const getCampaigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: campaigns });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { logs: true },
    });

    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campanha não encontrada' });
      return;
    }

    const liveProgress = queueService.getProgress(id);

    res.json({
      success: true,
      data: {
        ...campaign,
        liveProgress,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      targetGroup,
      templateId,
      messageContent,
      minDelay,
      maxDelay,
      scheduledAt,
      recurrence,
      recurrenceDays,
      startImmediately,
    } = req.body;

    if (!title || !messageContent || !targetGroup) {
      res.status(400).json({ success: false, error: 'Título, mensagem e público-alvo são obrigatórios' });
      return;
    }

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;
    let attachmentType: string | undefined;

    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
      attachmentName = req.file.originalname;
      attachmentType = req.file.mimetype;
    } else if (templateId) {
      const tpl = await prisma.template.findUnique({ where: { id: templateId } });
      if (tpl?.attachmentUrl) {
        attachmentUrl = tpl.attachmentUrl;
        attachmentName = tpl.attachmentName;
        attachmentType = tpl.attachmentType;
      }
    }

    // Determine target students (ALL explicitly excludes CONCLUIDO)
    const studentFilter: any = {
      group: targetGroup,
      status: targetGroup === 'CONCLUIDO' ? 'ALL' : 'ACTIVE',
    };

    const targetStudents = await prisma.student.findMany({ where: studentFilter });

    if (targetStudents.length === 0) {
      res.status(400).json({
        success: false,
        error: `Nenhum aluno ativo encontrado para o grupo selecionado (${targetGroup}).`,
      });
      return;
    }

    const settings = await prisma.setting.findUnique({ where: { id: 'global' } });
    const isScheduled = Boolean(scheduledAt && new Date(scheduledAt) > new Date());
    const initialStatus = isScheduled ? 'SCHEDULED' : startImmediately ? 'RUNNING' : 'DRAFT';

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        title: title.trim(),
        targetGroup,
        templateId: templateId || null,
        messageContent,
        attachmentUrl,
        attachmentName,
        attachmentType,
        status: initialStatus,
        minDelay: Number(minDelay) || settings?.defaultMinDelay || 5,
        maxDelay: Number(maxDelay) || settings?.defaultMaxDelay || 15,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        recurrence: recurrence || 'NONE',
        recurrenceDays: Number(recurrenceDays) || 0,
        nextRunAt: isScheduled ? new Date(scheduledAt).toISOString() : null,
        totalRecipients: targetStudents.length,
        sentCount: 0,
        failedCount: 0,
      },
    });

    // Create message logs for each student
    for (const student of targetStudents) {
      const rendered = renderTemplateText(messageContent, student, settings?.institutionName);
      await prisma.messageLog.create({
        data: {
          campaignId: campaign.id,
          studentId: student.id,
          recipientName: student.name,
          recipientPhone: student.phone,
          recipientGroup: student.group,
          renderedMessage: rendered,
          hasAttachment: Boolean(attachmentUrl),
          status: 'PENDING',
        },
      });
    }

    // If immediate start requested and not scheduled for future
    if (startImmediately && !isScheduled) {
      queueService.startCampaign(campaign.id).catch((err) => {
        console.error('[Campaign Controller] Erro ao iniciar fila:', err);
      });
    }

    res.status(201).json({
      success: true,
      data: campaign,
      recipientsCount: targetStudents.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const startCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await queueService.startCampaign(id);
    res.json({ success: true, message: 'Disparo iniciado com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const pauseCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = queueService.pauseCampaign(id);
    res.json({ success, message: success ? 'Disparo pausado' : 'Campanha não está em execução' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const resumeCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = queueService.resumeCampaign(id);
    res.json({ success, message: success ? 'Disparo retomado' : 'Campanha não encontrada para retomar' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const cancelCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = queueService.cancelCampaign(id);
    res.json({ success, message: success ? 'Disparo cancelado' : 'Campanha não encontrada' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getCampaignStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const progress = queueService.getProgress(id);
    const campaign = await prisma.campaign.findUnique({ where: { id } });

    res.json({
      success: true,
      data: {
        campaign,
        liveProgress: progress,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const retryFailedCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await queueService.retryFailed(id);
    res.json({ success: true, message: 'Reenvio de falhas iniciado com sucesso' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const deleteCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    queueService.cancelCampaign(id);
    await prisma.campaign.delete({ where: { id } });
    res.json({ success: true, message: 'Campanha excluída com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

