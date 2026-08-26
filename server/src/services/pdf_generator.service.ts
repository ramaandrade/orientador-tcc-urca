import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface EvaluationPdfData {
  studentName: string;
  studentGroup: string;
  studentPhone: string;
  studentTopic: string;
  stageTitle: string;
  stageNumber: number;
  fileName: string;
  suggestedGrade?: string;
  sourceFileName?: string | null;
  evaluationReport: string;
  createdAt: string | Date;
}

/**
 * Sanitizes markdown string to prevent PDF font encoding artifacts and symbol corruption
 */
function sanitizePdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove all emoji blocks
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/↳/g, '->')                    // Replace unicode arrow with ASCII
    .replace(/—/g, ' - ')                   // Replace em-dash with hyphen
    .replace(/–/g, '-')                    // Replace en-dash with hyphen
    .replace(/[“”]/g, '"')                  // Replace curly quotes
    .replace(/[‘’]/g, "'")
    .trim();
}

export class PdfGeneratorService {
  /**
   * Generates an official academic evaluation PDF file and returns its absolute path
   */
  public async generateEvaluationPdf(data: EvaluationPdfData): Promise<{ filePath: string; fileName: string }> {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeName = data.studentName.replace(/[^a-zA-Z0-9]/g, '_');
    const pdfFileName = `Parecer_Didatico_${safeName}_Etapa_${data.stageNumber || 1}_${Date.now()}.pdf`;
    const outputPath = path.join(uploadDir, pdfFileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 36, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      const primaryColor = '#0f766e'; // Teal
      const darkColor = '#0f172a'; // Slate 900
      const mutedColor = '#64748b'; // Slate 500
      const cardBg = '#f8fafc'; // Slate 50
      const cardBorder = '#cbd5e1';
      const contentWidth = doc.page.width - 80;

      // --- 1. HEADER ACCENT ---
      doc.rect(40, 36, contentWidth, 4).fill(primaryColor);

      // --- 2. HEADER TITLE & SUBTITLE ---
      doc.font('Helvetica-Bold').fontSize(13.5).fillColor(darkColor).text('PARECER DIDÁTICO DE AVALIAÇÃO ACADÊMICA', 40, 48);
      doc.font('Helvetica').fontSize(8.5).fillColor(mutedColor).text('Coordenação Acadêmica de TPE & TCC | Sistema Orientador IA — URCA', 40, 64);

      // --- 3. STAGE BADGE (TOP RIGHT) ---
      const badgeText = sanitizePdfText(data.stageTitle || `Etapa ${data.stageNumber || 1}`);
      const badgeWidth = doc.widthOfString(badgeText, { font: 'Helvetica-Bold', size: 8.5 }) + 16;
      const badgeX = doc.page.width - 40 - badgeWidth;
      doc.roundedRect(badgeX, 46, badgeWidth, 18, 9).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#166534').text(badgeText, badgeX + 8, 51);

      // --- 4. INFO CARD METADATA ---
      const cardY = 78;
      const cardHeight = data.sourceFileName ? 96 : 84;
      doc.roundedRect(40, cardY, contentWidth, cardHeight, 5).fillAndStroke(cardBg, cardBorder);

      const col1X = 50;
      const col2X = 310;
      let lineY = cardY + 7;
      const step = 14;

      const evalDate = new Date(data.createdAt);
      const dateStr = !isNaN(evalDate.getTime()) 
        ? `${evalDate.toLocaleDateString('pt-BR')} às ${evalDate.toLocaleTimeString('pt-BR')}`
        : new Date().toLocaleDateString('pt-BR');

      // Row 1
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Discente: ', col1X, lineY, { continued: true })
         .font('Helvetica').fillColor('#334155').text(sanitizePdfText(data.studentName));
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Turma / Nível: ', col2X, lineY, { continued: true })
         .font('Helvetica').fillColor('#334155').text(sanitizePdfText(data.studentGroup));

      // Row 2
      lineY += step;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('WhatsApp: ', col1X, lineY, { continued: true })
         .font('Helvetica').fillColor('#334155').text(`+${sanitizePdfText(data.studentPhone)}`);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Data da Avaliação: ', col2X, lineY, { continued: true })
         .font('Helvetica').fillColor('#334155').text(dateStr);

      // Row 3
      lineY += step;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Arquivo Avaliado: ', col1X, lineY, { continued: true })
         .font('Helvetica').fillColor('#334155').text(sanitizePdfText(data.fileName));
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Nota / Conceito: ', col2X, lineY, { continued: true })
         .font('Helvetica-Bold').fillColor(primaryColor).text(sanitizePdfText(data.suggestedGrade || 'Aprovado'));

      // Row 4: Topic
      lineY += step;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Título da Pesquisa: ', col1X, lineY, { continued: true })
         .font('Helvetica-Oblique').fillColor('#334155').text(sanitizePdfText(data.studentTopic || 'Não informado'), { width: contentWidth - 30 });

      // Row 5: Source file if present
      if (data.sourceFileName) {
        lineY += step;
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Fonte de Confronto: ', col1X, lineY, { continued: true })
           .font('Helvetica').fillColor('#334155').text(sanitizePdfText(data.sourceFileName), { width: contentWidth - 30 });
      }

      // --- 5. SECTION TITLE ---
      const secY = cardY + cardHeight + 12;
      doc.rect(40, secY, 4, 13).fill(primaryColor);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(darkColor).text('DIAGNÓSTICO DIDÁTICO (INCONFORMIDADES & O QUE FAZER PASSO A PASSO)', 48, secY + 2);

      doc.y = secY + 20;

      // --- 6. RENDER BODY CONTENT WITHOUT DUPLICATE PREAMBLE ---
      let bodyText = data.evaluationReport;
      const firstSectionIdx = bodyText.indexOf('#### ');
      if (firstSectionIdx !== -1) {
        bodyText = bodyText.substring(firstSectionIdx);
      }

      const rawLines = bodyText.split('\n');

      for (let i = 0; i < rawLines.length; i++) {
        const rawLine = rawLines[i].trim();
        if (!rawLine) {
          doc.moveDown(0.2);
          continue;
        }

        const clean = sanitizePdfText(rawLine);
        if (!clean) continue;

        if (clean.startsWith('#### ')) {
          // Major Section Header (e.g. 1. TÍTULO, 2. INTRODUÇÃO)
          if (doc.y > doc.page.height - 85) doc.addPage();
          
          doc.moveDown(0.5);
          const title = clean.replace(/^####\s*/, '').replace(/\*\*/g, '');
          const hY = doc.y;
          doc.roundedRect(40, hY, contentWidth, 18, 3).fillAndStroke('#f1f5f9', '#cbd5e1');
          doc.font('Helvetica-Bold').fontSize(9.5).fillColor(primaryColor).text(title, 48, hY + 4, { width: contentWidth - 16 });
          doc.y = hY + 22;
        } else if (clean.startsWith('##### ')) {
          // Subsection Header (e.g. A. Coerência entre os Pontos)
          if (doc.y > doc.page.height - 65) doc.addPage();
          doc.moveDown(0.3);
          const subTitle = clean.replace(/^#####\s*/, '').replace(/\*\*/g, '');
          doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor).text(subTitle, 44, doc.y, { width: contentWidth - 8 });
          doc.moveDown(0.15);
        } else if (clean.startsWith('---')) {
          // Horizontal divider
          doc.moveDown(0.2);
          doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
          doc.moveDown(0.2);
        } else if (clean.startsWith('* **') || clean.startsWith('• **')) {
          // Bullet point with bold prefix (e.g. * **Análise do Critério:** ...)
          if (doc.y > doc.page.height - 55) doc.addPage();
          const itemText = clean.replace(/^[\*•]\s*/, '');
          const boldMatch = itemText.match(/^\*\*(.*?)\*\*(.*)/);
          if (boldMatch) {
            const label = boldMatch[1].trim();
            const rest = boldMatch[2].replace(/\*\*/g, '').trim();
            if (rest.length > 0) {
              doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text(`• ${label} `, 44, doc.y, {
                continued: true,
                lineGap: 2.5,
                width: contentWidth - 10
              });
              doc.font('Helvetica').fillColor('#334155').text(rest, {
                lineGap: 2.5,
                width: contentWidth - 10
              });
            } else {
              doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text(`• ${label}`, 44, doc.y, {
                lineGap: 2.5,
                width: contentWidth - 10
              });
            }
          } else {
            doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(`• ${itemText.replace(/\*\*/g, '')}`, 44, doc.y, {
              lineGap: 2.5,
              width: contentWidth - 10
            });
          }
          doc.moveDown(0.2);
        } else if (/^\d+\.\s+/.test(clean)) {
          // Numbered items (e.g. 1. O título omite...)
          if (doc.y > doc.page.height - 55) doc.addPage();
          const numMatch = clean.match(/^(\d+\.)\s+(.*)/);
          if (numMatch) {
            const num = numMatch[1];
            const rest = numMatch[2].replace(/\*\*/g, '').trim();
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text(`  ${num} `, 48, doc.y, {
              continued: true,
              lineGap: 2.5,
              width: contentWidth - 16
            });
            doc.font('Helvetica').fillColor('#334155').text(rest, {
              lineGap: 2.5,
              width: contentWidth - 16
            });
          }
          doc.moveDown(0.2);
        } else if (clean.startsWith('* ') || clean.startsWith('• ') || clean.startsWith('- ')) {
          // Solution sub-bullet (e.g. * Ajustar o título...)
          if (doc.y > doc.page.height - 55) doc.addPage();
          const subItem = clean.replace(/^[\*•\-]\s*/, '').replace(/\*\*/g, '').trim();
          doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(`     - ${subItem}`, 52, doc.y, {
            lineGap: 2.5,
            width: contentWidth - 20
          });
          doc.moveDown(0.15);
        } else {
          // Regular paragraph text
          if (doc.y > doc.page.height - 55) doc.addPage();
          doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(clean.replace(/\*\*/g, ''), 44, doc.y, {
            lineGap: 2.5,
            width: contentWidth - 10
          });
          doc.moveDown(0.2);
        }
      }

      // --- 7. FOOTER ON ALL PAGES ---
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        const fY = doc.page.height - 28;
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, fY - 4).lineTo(doc.page.width - 40, fY - 4).stroke();
        doc.font('Helvetica').fontSize(7.5).fillColor(mutedColor).text('Documento oficial de parecer didático gerado pelo Sistema Orientador IA — URCA', 40, fY);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(mutedColor).text(`Página ${i + 1} de ${totalPages}`, doc.page.width - 120, fY, { align: 'right', width: 80 });
      }

      doc.end();

      writeStream.on('finish', () => {
        resolve({ filePath: outputPath, fileName: `Parecer Didático - ${data.stageTitle || 'Etapa ' + data.stageNumber}.pdf` });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    });
  }
}

export const pdfGeneratorService = new PdfGeneratorService();
