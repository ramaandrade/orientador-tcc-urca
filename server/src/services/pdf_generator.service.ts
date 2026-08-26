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

      // --- HEADER ---
      doc.rect(40, 36, doc.page.width - 80, 4).fill(primaryColor);
      doc.moveDown(0.6);

      // Title & Subtitle
      doc.font('Helvetica-Bold').fontSize(14).fillColor(darkColor).text('PARECER DIDÁTICO DE AVALIAÇÃO ACADÊMICA', 40, 48);
      doc.font('Helvetica').fontSize(9).fillColor(mutedColor).text('Coordenação Acadêmica de TPE & TCC | Sistema Orientador IA — URCA', 40, 65);

      // Badge on top right
      const badgeText = data.stageTitle || `Etapa ${data.stageNumber || 1}`;
      const badgeWidth = doc.widthOfString(badgeText, { font: 'Helvetica-Bold', size: 9 }) + 16;
      const badgeX = doc.page.width - 40 - badgeWidth;
      doc.roundedRect(badgeX, 48, badgeWidth, 20, 10).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#166534').text(badgeText, badgeX + 8, 54);

      // --- INFO CARD ---
      const cardY = 82;
      const cardHeight = data.sourceFileName ? 90 : 78;
      doc.roundedRect(40, cardY, doc.page.width - 80, cardHeight, 6).fillAndStroke(cardBg, cardBorder);

      const col1X = 52;
      const col2X = 300;
      let lineY = cardY + 8;
      const step = 14;

      const evalDate = new Date(data.createdAt);
      const dateStr = !isNaN(evalDate.getTime()) 
        ? `${evalDate.toLocaleDateString('pt-BR')} às ${evalDate.toLocaleTimeString('pt-BR')}`
        : new Date().toLocaleDateString('pt-BR');

      // Row 1
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Discente: ', col1X, lineY, { continued: true })
         .font('Helvetica').fillColor('#334155').text(data.studentName);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Turma / Nível: ', col2X, lineY, { continued: true })
         .font('Helvetica').fillColor('#334155').text(data.studentGroup);

      // Row 2
      lineY += step;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('WhatsApp: ', col1X, lineY, { continued: true })
         .font('Helvetica').fillColor('#334155').text(`+${data.studentPhone}`);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Data da Avaliação: ', col2X, lineY, { continued: true })
         .font('Helvetica').fillColor('#334155').text(dateStr);

      // Row 3
      lineY += step;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Arquivo Avaliado: ', col1X, lineY, { continued: true })
         .font('Helvetica').fillColor('#334155').text(data.fileName);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Nota / Conceito: ', col2X, lineY, { continued: true })
         .font('Helvetica-Bold').fillColor(primaryColor).text(data.suggestedGrade || 'Aprovado');

      // Row 4: Topic
      lineY += step;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Título da Pesquisa: ', col1X, lineY, { continued: true })
         .font('Helvetica-Oblique').fillColor('#334155').text(data.studentTopic || 'Não informado', { width: doc.page.width - 100 });

      // Row 5: Source file if present
      if (data.sourceFileName) {
        lineY += step;
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Fonte de Confronto: ', col1X, lineY, { continued: true })
           .font('Helvetica').fillColor('#334155').text(data.sourceFileName);
      }

      // --- SECTION TITLE ---
      const sectionY = cardY + cardHeight + 14;
      doc.rect(40, sectionY, 4, 14).fill(primaryColor);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text('DIAGNÓSTICO DIDÁTICO (INCONFORMIDADES & O QUE FAZER PASSO A PASSO)', 50, sectionY + 2);

      doc.y = sectionY + 22;

      // --- RENDER MARKDOWN REPORT ---
      const rawLines = data.evaluationReport.split('\n');
      
      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (!line) {
          doc.moveDown(0.25);
          continue;
        }

        // Check if page overflow
        if (doc.y > doc.page.height - 60) {
          doc.addPage();
        }

        if (line.startsWith('#### ')) {
          // Major Section (e.g. 1. TÍTULO, 2. INTRODUÇÃO)
          doc.moveDown(0.5);
          const titleText = line.replace(/^####\s*/, '').replace(/\*\*/g, '');
          
          const headerY = doc.y;
          doc.roundedRect(40, headerY, doc.page.width - 80, 18, 4).fillAndStroke('#f1f5f9', '#e2e8f0');
          doc.font('Helvetica-Bold').fontSize(9.5).fillColor(primaryColor).text(titleText, 48, headerY + 4);
          doc.y = headerY + 22;
        } else if (line.startsWith('##### ')) {
          // Subsection (e.g. A. Coerência entre os Pontos)
          doc.moveDown(0.3);
          const subText = line.replace(/^#####\s*/, '').replace(/\*\*/g, '');
          doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor).text(subText, 46);
          doc.moveDown(0.15);
        } else if (line.startsWith('---')) {
          // Horizontal divider
          doc.moveDown(0.2);
          doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
          doc.moveDown(0.2);
        } else if (line.startsWith('* **') || line.startsWith('• **')) {
          // Key items (e.g. * **Análise do Critério:** ...)
          const cleanLine = line.replace(/^[\*•]\s*/, '');
          const match = cleanLine.match(/^\*\*(.*?)\*\*(.*)/);
          if (match) {
            const boldLabel = match[1];
            const restText = match[2].replace(/\*\*/g, '');
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text(`• ${boldLabel}`, 48, doc.y, { continued: true })
               .font('Helvetica').fillColor('#334155').text(restText, { width: doc.page.width - 95 });
          } else {
            doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(`• ${cleanLine.replace(/\*\*/g, '')}`, 48, doc.y, { width: doc.page.width - 95 });
          }
        } else if (/^\d+\.\s+\*\*/.test(line)) {
          // Numbered items with bold title (e.g. 1. **Incongruência...**)
          const numMatch = line.match(/^(\d+\.)\s+\*\*(.*?)\*\*(.*)/);
          if (numMatch) {
            const num = numMatch[1];
            const title = numMatch[2];
            const rest = numMatch[3].replace(/\*\*/g, '');
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text(`   ${num} ${title}`, 52, doc.y, { continued: true })
               .font('Helvetica').fillColor('#334155').text(rest, { width: doc.page.width - 100 });
          } else {
            doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(`   ${line.replace(/\*\*/g, '')}`, 52, doc.y, { width: doc.page.width - 100 });
          }
        } else if (line.startsWith('* ') || line.startsWith('• ') || line.startsWith('- ')) {
          // Sub-bullet solutions
          const cleanSub = line.replace(/^[\*•\-]\s*/, '').replace(/\*\*/g, '');
          doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(`     ↳ ${cleanSub}`, 56, doc.y, { width: doc.page.width - 105 });
        } else {
          // Regular paragraphs
          doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(line.replace(/\*\*/g, ''), 48, doc.y, { width: doc.page.width - 95 });
        }
      }

      // --- PAGE NUMBERING & FOOTER ON ALL PAGES ---
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // Footer line
        const footerY = doc.page.height - 30;
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, footerY - 6).lineTo(doc.page.width - 40, footerY - 6).stroke();

        doc.font('Helvetica').fontSize(7.5).fillColor(mutedColor)
           .text(`Documento oficial de parecer didático gerado pelo Sistema Orientador IA em ${new Date().toLocaleDateString('pt-BR')}`, 40, footerY);

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(mutedColor)
           .text(`Página ${i + 1} de ${totalPages}`, doc.page.width - 120, footerY, { align: 'right', width: 80 });
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
