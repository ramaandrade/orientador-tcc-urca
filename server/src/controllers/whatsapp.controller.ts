import { Request, Response } from 'express';
import { whatsAppService } from '../services/whatsapp.service';

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await whatsAppService.getStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const connect = async (req: Request, res: Response): Promise<void> => {
  try {
    await whatsAppService.initBaileys();
    const status = await whatsAppService.getStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const disconnect = async (req: Request, res: Response): Promise<void> => {
  try {
    await whatsAppService.disconnect();
    const status = await whatsAppService.getStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const restart = async (req: Request, res: Response): Promise<void> => {
  try {
    await whatsAppService.restart();
    const status = await whatsAppService.getStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const toggleMock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enabled } = req.body;
    const status = await whatsAppService.setMockMode(Boolean(enabled));
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
