import path from 'path';
import { prisma } from '../database/db';
import { whatsAppService } from './whatsapp.service';
import { renderTemplateText } from '../controllers/template.controller';

export interface CampaignProgress {
  campaignId: string;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  total: number;
  processed: number;
  sent: number;
  failed: number;
  currentRecipient?: string;
  logs: {
    id: string;
    studentName: string;
    phone: string;
    status: 'SENT' | 'FAILED';
    time: string;
    error?: string;
  }[];
}

class QueueService {
  private activeCampaigns = new Map<string, { isPaused: boolean; isCancelled: boolean }>();
  private campaignProgress = new Map<string, CampaignProgress>();

  public getProgress(campaignId: string): CampaignProgress | null {
    return this.campaignProgress.get(campaignId) || null;
  }

  public isCampaignRunning(campaignId: string): boolean {
    return this.activeCampaigns.has(campaignId);
  }

  public pauseCampaign(campaignId: string): boolean {
    const active = this.activeCampaigns.get(campaignId);
    if (active) {
      active.isPaused = true;
      const prog = this.campaignProgress.get(campaignId);
      if (prog) prog.status = 'PAUSED';
      prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'PAUSED' }
      }).catch(console.error);
      return true;
    }
    return false;
  }

  public resumeCampaign(campaignId: string): boolean {
    const active = this.activeCampaigns.get(campaignId);
    if (active) {
      active.isPaused = false;
      const prog = this.campaignProgress.get(campaignId);
      if (prog) prog.status = 'RUNNING';
      prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'RUNNING' }
      }).catch(console.error);
      return true;
    }
    return false;
  }

  public cancelCampaign(campaignId: string): boolean {
    const active = this.activeCampaigns.get(campaignId);
    if (active) {
      active.isCancelled = true;
      const prog = this.campaignProgress.get(campaignId);
      if (prog) prog.status = 'CANCELLED';
      prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'CANCELLED' }
      }).catch(console.error);
      this.activeCampaigns.delete(campaignId);
      return true;
    }
    return false;
  }

  public async retryFailed(campaignId: string): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        logs: true,
      },
    });

    if (!campaign) {
      throw new Error('Campanha não encontrada');
    }

    if (this.activeCampaigns.has(campaignId)) {
      throw new Error('Campanha já está em execução');
    }

    const failedLogs = campaign.logs.filter((l: any) => l.status === 'FAILED');
    if (failedLogs.length === 0) {
      throw new Error('Não há mensagens com falha para reenviar nesta campanha');
    }

    // Reset status of failed logs back to PENDING
    for (const log of failedLogs) {
      await prisma.messageLog.update({
        where: { id: log.id },
        data: { status: 'PENDING', errorMessage: null },
      });
    }

    // Reset failed count in campaign
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        failedCount: 0,
        status: 'DRAFT',
      },
    });

    // Launch dispatch queue for the pending items
    await this.startCampaign(campaignId);
  }

  public async startCampaign(campaignId: string): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        logs: {
          include: { student: true }
        }
      }
    });

    if (!campaign) {
      throw new Error('Campanha não encontrada');
    }

    if (this.activeCampaigns.has(campaignId)) {
      throw new Error('Campanha já está em execução');
    }

    const state = { isPaused: false, isCancelled: false };
    this.activeCampaigns.set(campaignId, state);

    let sent = campaign.sentCount;
    let failed = campaign.failedCount;
    let processed = sent + failed;

    // If all logs are already SENT/FAILED (e.g. recurring cycle or completed rerun), reset them to PENDING
    const allProcessed = campaign.logs.length > 0 && campaign.logs.every((l: any) => l.status === 'SENT' || l.status === 'FAILED');
    if (allProcessed) {
      console.log(`[Queue] 🔄 Reiniciando ciclo de envio para a campanha: ${campaign.title}`);
      for (const log of campaign.logs) {
        await prisma.messageLog.update({
          where: { id: log.id },
          data: { status: 'PENDING', errorMessage: null }
        });
      }
      campaign.logs.forEach((l: any) => { l.status = 'PENDING'; });
      sent = 0;
      failed = 0;
      processed = 0;
    }

    const pendingLogs = campaign.logs.filter((l: any) => l.status === 'PENDING');
    const total = campaign.logs.length;

    this.campaignProgress.set(campaignId, {
      campaignId,
      status: 'RUNNING',
      total,
      processed,
      sent,
      failed,
      logs: []
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'RUNNING',
        startedAt: new Date().toISOString()
      }
    });

    // Run queue in background
    (async () => {
      try {
        const settings = await prisma.setting.findUnique({ where: { id: 'global' } });
        const batchSize = settings?.batchSize || 20;
        const batchPauseMs = (settings?.batchPauseSeconds || 60) * 1000;
        let countInCurrentBatch = 0;

        for (const log of pendingLogs) {
          // Check cancellation
          if (state.isCancelled) {
            console.log(`[Queue] Campanha ${campaignId} cancelada.`);
            break;
          }

          // Check pause
          while (state.isPaused) {
            if (state.isCancelled) break;
            await new Promise(res => setTimeout(res, 1000));
          }

          if (state.isCancelled) break;

          // Update progress tracker
          const progress = this.campaignProgress.get(campaignId);
          if (progress) {
            progress.currentRecipient = log.recipientName;
          }

          await prisma.messageLog.update({
            where: { id: log.id },
            data: { status: 'SENDING' }
          });

          // Attachment preparation
          let attachmentData: { filePath: string; originalName: string; mimeType: string } | undefined;
          if (campaign.attachmentUrl) {
            const filePath = path.join(__dirname, '../../uploads', path.basename(campaign.attachmentUrl));
            attachmentData = {
              filePath,
              originalName: campaign.attachmentName || 'anexo_academico.pdf',
              mimeType: campaign.attachmentType || 'application/pdf',
            };
          }

          // Send WhatsApp message
          const sendResult = await whatsAppService.sendMessage(
            log.recipientPhone,
            log.renderedMessage,
            attachmentData
          );

          processed++;

          if (sendResult.success) {
            sent++;
            await prisma.messageLog.update({
              where: { id: log.id },
              data: {
                status: 'SENT',
                sentAt: new Date().toISOString(),
                errorMessage: null
              }
            });

            if (progress) {
              progress.sent = sent;
              progress.processed = processed;
              progress.logs.unshift({
                id: log.id,
                studentName: log.recipientName,
                phone: log.recipientPhone,
                status: 'SENT',
                time: new Date().toLocaleTimeString('pt-BR')
              });
            }
          } else {
            failed++;
            await prisma.messageLog.update({
              where: { id: log.id },
              data: {
                status: 'FAILED',
                errorMessage: sendResult.error || 'Falha de entrega'
              }
            });

            if (progress) {
              progress.failed = failed;
              progress.processed = processed;
              progress.logs.unshift({
                id: log.id,
                studentName: log.recipientName,
                phone: log.recipientPhone,
                status: 'FAILED',
                time: new Date().toLocaleTimeString('pt-BR'),
                error: sendResult.error
              });
            }
          }

          // Update campaign counts periodically
          await prisma.campaign.update({
            where: { id: campaignId },
            data: {
              sentCount: sent,
              failedCount: failed
            }
          });

          countInCurrentBatch++;

          // Check if batch pause is needed
          if (countInCurrentBatch >= batchSize && processed < total) {
            console.log(`[Queue] Atingido lote de ${batchSize} mensagens. Pausa anti-bloqueio de ${batchPauseMs / 1000}s...`);
            countInCurrentBatch = 0;
            await new Promise(res => setTimeout(res, batchPauseMs));
          } else if (processed < total) {
            // Anti-ban random delay
            const min = campaign.minDelay || 5;
            const max = Math.max(min, campaign.maxDelay || 15);
            const randomDelaySec = Math.floor(Math.random() * (max - min + 1)) + min;
            console.log(`[Queue] Aguardando delay anti-bloqueio de ${randomDelaySec}s antes do próximo envio...`);
            await new Promise(res => setTimeout(res, randomDelaySec * 1000));
          }
        }

        // Finalize campaign
        let finalStatus = state.isCancelled ? 'CANCELLED' : 'COMPLETED';
        let nextRunAt: string | null = null;

        if (!state.isCancelled && campaign.recurrence && campaign.recurrence !== 'NONE') {
          let days = 15;
          if (campaign.recurrence === 'DAILY') days = 1;
          else if (campaign.recurrence === 'WEEKLY') days = 7;
          else if (campaign.recurrence === 'BIWEEKLY') days = 15;
          else if (campaign.recurrence === 'MONTHLY') days = 30;
          else if (campaign.recurrence === 'CUSTOM' && campaign.recurrenceDays > 0) days = campaign.recurrenceDays;

          const nextDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          nextRunAt = nextDate.toISOString();
          finalStatus = 'SCHEDULED';
          console.log(`[Queue] 🔄 Campanha recorrente '${campaign.title}' reagendada para ${nextDate.toLocaleString('pt-BR')} (a cada ${days} dias).`);
        }

        await prisma.campaign.update({
          where: { id: campaignId },
          data: {
            status: finalStatus,
            completedAt: new Date().toISOString(),
            nextRunAt,
            scheduledAt: nextRunAt || campaign.scheduledAt,
            sentCount: sent,
            failedCount: failed
          }
        });

        const finalProg = this.campaignProgress.get(campaignId);
        if (finalProg) {
          finalProg.status = finalStatus;
          finalProg.currentRecipient = undefined;
        }

        this.activeCampaigns.delete(campaignId);
        console.log(`[Queue] Campanha ${campaignId} finalizada com status: ${finalStatus}. Enviados: ${sent}, Falhas: ${failed}`);
      } catch (err) {
        console.error(`[Queue] Erro crítico na execução da campanha ${campaignId}:`, err);
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: 'CANCELLED' }
        }).catch(console.error);
        this.activeCampaigns.delete(campaignId);
      }
    })();
  }
}

export const queueService = new QueueService();
