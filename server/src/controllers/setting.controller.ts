import { Request, Response } from 'express';
import { prisma } from '../database/db';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.setting.findUnique({ where: { id: 'global' } });
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      mockMode,
      defaultMinDelay,
      defaultMaxDelay,
      batchSize,
      batchPauseSeconds,
      institutionName,
      coordinatorName,
    } = req.body;

    const settings = await prisma.setting.upsert({
      where: { id: 'global' },
      update: {
        ...(mockMode !== undefined && { mockMode: Boolean(mockMode) }),
        ...(defaultMinDelay !== undefined && { defaultMinDelay: Number(defaultMinDelay) }),
        ...(defaultMaxDelay !== undefined && { defaultMaxDelay: Number(defaultMaxDelay) }),
        ...(batchSize !== undefined && { batchSize: Number(batchSize) }),
        ...(batchPauseSeconds !== undefined && { batchPauseSeconds: Number(batchPauseSeconds) }),
        ...(institutionName && { institutionName: institutionName.trim() }),
        ...(coordinatorName && { coordinatorName: coordinatorName.trim() }),
      },
      create: {
        id: 'global',
        mockMode: Boolean(mockMode),
        defaultMinDelay: Number(defaultMinDelay) || 5,
        defaultMaxDelay: Number(defaultMaxDelay) || 15,
        batchSize: Number(batchSize) || 20,
        batchPauseSeconds: Number(batchPauseSeconds) || 60,
        institutionName: institutionName?.trim() || 'Coordenação Acadêmica',
        coordinatorName: coordinatorName?.trim() || 'Coordenação de Curso',
      },
    });

    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
