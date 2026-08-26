// Allow TLS certificates across local/corporate networks
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from 'express';
import cors from 'cors';

import path from 'path';
import fs from 'fs';
import multer from 'multer';

import * as studentCtrl from './controllers/student.controller';
import * as templateCtrl from './controllers/template.controller';
import * as campaignCtrl from './controllers/campaign.controller';
import * as whatsappCtrl from './controllers/whatsapp.controller';
import * as logCtrl from './controllers/log.controller';
import * as settingCtrl from './controllers/setting.controller';
import * as evaluationCtrl from './controllers/evaluation.controller';

import { whatsAppService } from './services/whatsapp.service';
import { schedulerService } from './services/scheduler.service';

const app = express();
const PORT = process.env.PORT || 3001;

// Upload directory setup
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration for uploads (attachments & spreadsheets)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// --- ROUTES ---

// Health & Status
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Students
app.get('/api/students', studentCtrl.getStudents);
app.get('/api/students/sample-template', studentCtrl.downloadSampleSpreadsheet);
app.get('/api/students/:id', studentCtrl.getStudentById);
app.post('/api/students', studentCtrl.createStudent);
app.put('/api/students/:id', studentCtrl.updateStudent);
app.delete('/api/students/:id', studentCtrl.deleteStudent);
app.post('/api/students/import', memoryUpload.single('file'), studentCtrl.importStudents);
app.post('/api/students/batch/clear', studentCtrl.clearStudents);

// Templates
app.get('/api/templates', templateCtrl.getTemplates);
app.get('/api/templates/:id', templateCtrl.getTemplateById);
app.post('/api/templates', upload.single('attachment'), templateCtrl.createTemplate);
app.put('/api/templates/:id', upload.single('attachment'), templateCtrl.updateTemplate);
app.delete('/api/templates/:id', templateCtrl.deleteTemplate);
app.post('/api/templates/preview', templateCtrl.previewTemplate);

// Campaigns & Dispatcher
app.get('/api/campaigns', campaignCtrl.getCampaigns);
app.get('/api/campaigns/:id', campaignCtrl.getCampaignById);
app.get('/api/campaigns/:id/status', campaignCtrl.getCampaignStatus);
app.post('/api/campaigns', upload.single('attachment'), campaignCtrl.createCampaign);
app.post('/api/campaigns/:id/start', campaignCtrl.startCampaign);
app.post('/api/campaigns/:id/pause', campaignCtrl.pauseCampaign);
app.post('/api/campaigns/:id/resume', campaignCtrl.resumeCampaign);
app.post('/api/campaigns/:id/cancel', campaignCtrl.cancelCampaign);
app.post('/api/campaigns/:id/retry-failed', campaignCtrl.retryFailedCampaign);
app.delete('/api/campaigns/:id', campaignCtrl.deleteCampaign);

// WhatsApp Engine
app.get('/api/whatsapp/status', whatsappCtrl.getStatus);
app.post('/api/whatsapp/connect', whatsappCtrl.connect);
app.post('/api/whatsapp/disconnect', whatsappCtrl.disconnect);
app.post('/api/whatsapp/restart', whatsappCtrl.restart);
app.post('/api/whatsapp/toggle-mock', whatsappCtrl.toggleMock);

// Logs & Reports
app.get('/api/logs', logCtrl.getLogs);
app.get('/api/logs/stats', logCtrl.getStats);
app.get('/api/logs/export-csv', logCtrl.exportLogsCsv);

// Settings
app.get('/api/settings', settingCtrl.getSettings);
app.put('/api/settings', settingCtrl.updateSettings);

// Research Evaluations & AI Agent
app.get('/api/evaluations/transition-guidelines/:id', evaluationCtrl.getTransitionGuidelines);
app.put('/api/evaluations/transition-guidelines/:id', upload.single('file'), evaluationCtrl.updateTransitionGuidelines);
app.get('/api/evaluations/student/:studentId', evaluationCtrl.getEvaluationsByStudent);
app.post(
  '/api/evaluations/stage',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'sourceFile', maxCount: 1 },
  ]),
  evaluationCtrl.createEvaluationStage
);
// Project Models (CRUD Projeto Modelo por Turma/Etapa: TPE, TCC 1, TCC 2)
app.get('/api/project-models/:group', evaluationCtrl.getProjectModel);
app.post('/api/project-models/:group', upload.single('file'), evaluationCtrl.uploadProjectModel);
app.delete('/api/project-models/:group', evaluationCtrl.deleteProjectModel);

app.get('/api/evaluations/:id/pdf', evaluationCtrl.downloadEvaluationPdfFile);
app.post('/api/evaluations/:id/send-whatsapp', evaluationCtrl.sendEvaluationWhatsApp);
app.delete('/api/evaluations/:id', evaluationCtrl.deleteEvaluationStage);

// Start server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎓 Disparador WhatsApp Acadêmico - Backend Ativo!`);
  console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`====================================================`);

  // Initialize scheduler and attempt WhatsApp connection
  schedulerService.init();
  whatsAppService.initBaileys().catch((e) => {
    console.warn('[WhatsApp] Inicialização automática adiada:', e.message);
  });
});
