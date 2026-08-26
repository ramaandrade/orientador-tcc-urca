import { Request, Response } from 'express';
import { prisma } from '../database/db';

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId, status, group, limit } = req.query;

    const where: any = {};
    if (campaignId) where.campaignId = String(campaignId);
    if (status && status !== 'ALL') where.status = String(status);
    if (group && group !== 'ALL') where.recipientGroup = String(group);

    const logs = await prisma.messageLog.findMany({
      where,
      take: limit ? Number(limit) : 100,
    });

    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const allStudents = await prisma.student.findMany();
    const totalStudents = allStudents.length;
    const studentsTPE = allStudents.filter(s => s.group.toUpperCase().includes('TPE')).length;
    const studentsTCC1 = allStudents.filter(s => s.group.toUpperCase().replace(/\s+/g, '') === 'TCC1').length;
    const studentsTCC2 = allStudents.filter(s => s.group.toUpperCase().replace(/\s+/g, '') === 'TCC2').length;

    const allCampaigns = await prisma.campaign.findMany();
    const totalCampaigns = allCampaigns.length;
    const activeCampaigns = allCampaigns.filter(c => c.status === 'RUNNING' || c.status === 'PAUSED').length;

    const totalLogs = await prisma.messageLog.count();
    const sentLogs = await prisma.messageLog.count({ where: { status: 'SENT' } });
    const failedLogs = await prisma.messageLog.count({ where: { status: 'FAILED' } });
    const pendingLogs = await prisma.messageLog.count({ where: { status: 'PENDING' } });

    const deliveryRate = totalLogs > 0 ? Number(((sentLogs / (sentLogs + failedLogs || 1)) * 100).toFixed(1)) : 100;

    res.json({
      success: true,
      data: {
        students: {
          total: totalStudents,
          tpe: studentsTPE,
          tcc1: studentsTCC1,
          tcc2: studentsTCC2,
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
        },
        messages: {
          total: totalLogs,
          sent: sentLogs,
          failed: failedLogs,
          pending: pendingLogs,
          deliveryRate,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const exportLogsCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.query;
    const where: any = {};
    if (campaignId) where.campaignId = String(campaignId);

    const logs = await prisma.messageLog.findMany({ where });

    // Build CSV content
    const headers = ['ID', 'Aluno', 'Telefone', 'Turma', 'Status', 'Data Envio', 'Erro', 'Mensagem'];
    const rows = logs.map(l => [
      `"${l.id}"`,
      `"${l.recipientName.replace(/"/g, '""')}"`,
      `"${l.recipientPhone}"`,
      `"${l.recipientGroup}"`,
      `"${l.status}"`,
      `"${l.sentAt || ''}"`,
      `"${(l.errorMessage || '').replace(/"/g, '""')}"`,
      `"${l.renderedMessage.replace(/\n/g, ' ').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio_disparos_academicos.csv"');
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
