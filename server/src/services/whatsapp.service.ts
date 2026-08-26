process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import makeWASocket, {

  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
  WASocket,
  proto,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { prisma } from '../database/db';

export type WhatsAppStatus = 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED' | 'MOCK_ACTIVE';

export interface WhatsAppState {
  status: WhatsAppStatus;
  qrCodeUrl: string | null;
  phoneNumber: string | null;
  userName: string | null;
  isMock: boolean;
  lastError: string | null;
}

class WhatsAppService {
  private socket: WASocket | null = null;
  private qrCodeUrl: string | null = null;
  private status: WhatsAppStatus = 'DISCONNECTED';
  private phoneNumber: string | null = null;
  private userName: string | null = null;
  private lastError: string | null = null;
  private authDir: string = path.join(__dirname, '../../auth_info_baileys');
  private isInitializing: boolean = false;

  constructor() {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  public async getStatus(): Promise<WhatsAppState> {
    const setting = await prisma.setting.findUnique({ where: { id: 'global' } });
    const isMock = setting?.mockMode ?? false;

    return {
      status: isMock ? 'MOCK_ACTIVE' : this.status,
      qrCodeUrl: isMock ? null : this.qrCodeUrl,
      phoneNumber: isMock ? '5511999999999 (Modo Mock)' : this.phoneNumber,
      userName: isMock ? 'Simulador Acadêmico' : this.userName,
      isMock,
      lastError: this.lastError,
    };
  }

  public async setMockMode(enabled: boolean): Promise<WhatsAppState> {
    await prisma.setting.upsert({
      where: { id: 'global' },
      update: { mockMode: enabled },
      create: { id: 'global', mockMode: enabled },
    });

    if (enabled) {
      if (this.socket) {
        try {
          this.socket.end(undefined);
          this.socket = null;
        } catch (e) {}
      }
      this.status = 'MOCK_ACTIVE';
      this.qrCodeUrl = null;
    } else {
      this.status = 'DISCONNECTED';
      this.initBaileys();
    }

    return this.getStatus();
  }

  public async initBaileys(): Promise<void> {
    const setting = await prisma.setting.findUnique({ where: { id: 'global' } });
    if (setting?.mockMode) {
      this.status = 'MOCK_ACTIVE';
      return;
    }

    if (this.isInitializing) return;
    this.isInitializing = true;
    this.status = 'CONNECTING';
    this.lastError = null;

    try {
      // Ensure auth directory exists and is clean if corrupted
      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      
      let version: [number, number, number] = [2, 3000, 1015901307];
      try {
        const fetched = await fetchLatestBaileysVersion();
        if (fetched?.version) {
          version = fetched.version;
        }
      } catch (verErr) {
        console.warn('[WhatsApp] Usando versão padrão do protocolo WhatsApp:', version.join('.'));
      }

      const logger = pino({ level: 'error' });

      this.socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        printQRInTerminal: false,
        browser: Browsers.windows('Desktop'),
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 15000,
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
      });

      this.socket.ev.on('creds.update', saveCreds);

      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCodeUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
            this.status = 'QR_READY';
            this.lastError = null;
            console.log('[WhatsApp] ✅ Novo QR Code gerado com sucesso para leitura.');
          } catch (err: any) {
            console.error('[WhatsApp] Erro ao gerar QR Code Data URL:', err);
          }
        }

        if (connection === 'close') {
          const errorPayload = lastDisconnect?.error as any;
          const statusCode = errorPayload?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          
          this.status = 'DISCONNECTED';
          this.phoneNumber = null;
          this.userName = null;
          this.lastError = errorPayload?.message || 'Conexão encerrada pelo servidor';

          console.log(`[WhatsApp] Conexão encerrada. Código: ${statusCode}. Erro: ${errorPayload?.message || 'N/A'}`);

          if (isLoggedOut || statusCode === 401 || statusCode === 500) {
            // If internal error 500 or logged out, clear corrupted auth state
            console.log('[WhatsApp] Limpando dados de sessão temporários...');
            this.clearAuth();
          }

          // Retry reconnection with cooldown
          setTimeout(() => {
            if (this.status !== 'CONNECTED' && this.status !== 'MOCK_ACTIVE') {
              this.initBaileys();
            }
          }, 6000);
        } else if (connection === 'open') {
          this.status = 'CONNECTED';
          this.qrCodeUrl = null;
          this.lastError = null;
          
          const jid = this.socket?.user?.id || '';
          this.phoneNumber = jid.split(':')[0] || jid.split('@')[0] || '';
          this.userName = this.socket?.user?.name || 'Coordenação Acadêmica';
          
          console.log(`[WhatsApp] 🎉 Conectado com sucesso! Usuário: ${this.userName} (+${this.phoneNumber})`);
        }
      });
    } catch (err: any) {
      console.error('[WhatsApp] Erro na inicialização do Baileys:', err);
      this.status = 'DISCONNECTED';
      this.lastError = err?.message || 'Erro ao inicializar conexão';
      this.clearAuth();
    } finally {
      this.isInitializing = false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.socket) {
        await this.socket.logout();
        this.socket.end(undefined);
        this.socket = null;
      }
    } catch (err) {
      console.warn('[WhatsApp] Aviso durante logout:', err);
    } finally {
      this.clearAuth();
      this.status = 'DISCONNECTED';
      this.qrCodeUrl = null;
      this.phoneNumber = null;
      this.userName = null;
    }
  }

  public async restart(): Promise<void> {
    await this.disconnect();
    await this.initBaileys();
  }

  public clearAuth(): void {
    try {
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true });
        fs.mkdirSync(this.authDir, { recursive: true });
      }
    } catch (err) {
      console.error('[WhatsApp] Falha ao limpar diretório auth:', err);
    }
  }

  public async sendMessage(
    recipientPhone: string,
    messageText: string,
    attachment?: {
      filePath: string;
      originalName: string;
      mimeType: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const setting = await prisma.setting.findUnique({ where: { id: 'global' } });
    
    // Mock Mode Execution
    if (setting?.mockMode || this.status === 'MOCK_ACTIVE') {
      console.log(`[WhatsApp Mock] Simulando envio para ${recipientPhone}:`);
      console.log(`[WhatsApp Mock Content] ${messageText.substring(0, 80)}...`);
      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    if (this.status !== 'CONNECTED' || !this.socket) {
      return {
        success: false,
        error: 'WhatsApp não está conectado. Escaneie o QR Code antes de disparar.',
      };
    }

    try {
      const cleanPhone = recipientPhone.replace(/\D/g, '');
      let jid = `${cleanPhone}@s.whatsapp.net`;

      // Attempt to resolve real WhatsApp JID (handles Brazilian 8/9 digit legacy variations)
      try {
        const results = await this.socket.onWhatsApp(cleanPhone);
        if (results && results.length > 0 && results[0].exists && results[0].jid) {
          jid = results[0].jid;
        }
      } catch (onWaErr) {
        console.warn(`[WhatsApp] Consulta onWhatsApp para ${cleanPhone} falhou, usando JID padrão:`, jid);
      }

      let sentMsg: proto.WebMessageInfo | undefined;

      if (attachment && fs.existsSync(attachment.filePath)) {
        const fileBuffer = fs.readFileSync(attachment.filePath);
        
        if (attachment.mimeType.startsWith('image/')) {
          sentMsg = await this.socket.sendMessage(jid, {
            image: fileBuffer,
            caption: messageText,
          });
        } else {
          sentMsg = await this.socket.sendMessage(jid, {
            document: fileBuffer,
            fileName: attachment.originalName,
            mimetype: attachment.mimeType,
            caption: messageText,
          });
        }
      } else {
        sentMsg = await this.socket.sendMessage(jid, {
          text: messageText,
        });
      }

      return {
        success: true,
        messageId: sentMsg?.key?.id || undefined,
      };
    } catch (err: any) {
      console.error(`[WhatsApp] Falha ao enviar mensagem para ${recipientPhone}:`, err);
      return {
        success: false,
        error: err?.message || 'Falha desconhecida no envio via WhatsApp',
      };
    }
  }
}

export const whatsAppService = new WhatsAppService();
