import cron from 'node-cron';
import { sqlite } from '../database/db';
import { queueService } from './queue.service';

class SchedulerService {
  private isChecking: boolean = false;

  public init(): void {
    // Check every minute for scheduled campaigns that need to run
    cron.schedule('* * * * *', async () => {
      if (this.isChecking) return;
      this.isChecking = true;

      try {
        const nowIso = new Date().toISOString();
        
        // Find campaigns scheduled or recurring ready to run
        const dueCampaigns = sqlite.prepare(`
          SELECT * FROM campaigns
          WHERE status = 'SCHEDULED'
            AND (
              (scheduledAt IS NOT NULL AND scheduledAt <= ?)
              OR (nextRunAt IS NOT NULL AND nextRunAt <= ?)
            )
        `).all(nowIso, nowIso) as any[];

        for (const campaign of dueCampaigns) {
          if (!queueService.isCampaignRunning(campaign.id)) {
            console.log(`[Scheduler] ⏰ Disparando campanha agendada/recorrente: ${campaign.title} (${campaign.id})`);
            try {
              await queueService.startCampaign(campaign.id);
            } catch (err) {
              console.error(`[Scheduler] Falha ao iniciar campanha ${campaign.id}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('[Scheduler] Erro ao verificar campanhas agendadas:', err);
      } finally {
        this.isChecking = false;
      }
    });

    console.log('[Scheduler] Serviço de agendamento e recorrência periódica ativo.');
  }
}

export const schedulerService = new SchedulerService();
