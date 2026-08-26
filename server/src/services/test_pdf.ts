import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

function sanitizeForPdf(str: string): string {
  return str
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/↳/g, '->')
    .replace(/—/g, ' - ')
    .replace(/–/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

async function testPdfGeneration() {
  const outputPath = path.join(process.cwd(), 'uploads/test_parecer.pdf');
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 36, bottom: 40, left: 40, right: 40 },
    bufferPages: true,
  });

  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  const primaryColor = '#0f766e';
  const darkColor = '#0f172a';
  const mutedColor = '#64748b';
  const cardBg = '#f8fafc';
  const cardBorder = '#cbd5e1';
  const contentWidth = doc.page.width - 80;

  // Header Accent
  doc.rect(40, 36, contentWidth, 4).fill(primaryColor);

  // Title & Subtitle
  doc.font('Helvetica-Bold').fontSize(13.5).fillColor(darkColor).text('PARECER DIDATICO DE AVALIACAO ACADEMICA', 40, 48);
  doc.font('Helvetica').fontSize(8.5).fillColor(mutedColor).text('Coordenacao Academica de TPE & TCC | Sistema Orientador IA - URCA', 40, 64);

  // Badge
  const badgeText = 'Etapa 1 - Versao Inicial';
  const badgeWidth = doc.widthOfString(badgeText, { font: 'Helvetica-Bold', size: 8.5 }) + 16;
  const badgeX = doc.page.width - 40 - badgeWidth;
  doc.roundedRect(badgeX, 46, badgeWidth, 18, 9).fillAndStroke('#f0fdf4', '#bbf7d0');
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#166534').text(badgeText, badgeX + 8, 51);

  // Info Card
  const cardY = 78;
  const cardHeight = 84;
  doc.roundedRect(40, cardY, contentWidth, cardHeight, 5).fillAndStroke(cardBg, cardBorder);

  const col1X = 50;
  const col2X = 310;
  let lineY = cardY + 7;
  const step = 14;

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Discente: ', col1X, lineY, { continued: true })
     .font('Helvetica').fillColor('#334155').text('Claudio Reinaldo Lima Silva');
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Turma / Nivel: ', col2X, lineY, { continued: true })
     .font('Helvetica').fillColor('#334155').text('TCC2');

  lineY += step;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('WhatsApp: ', col1X, lineY, { continued: true })
     .font('Helvetica').fillColor('#334155').text('+5588996369972');
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Data da Avaliacao: ', col2X, lineY, { continued: true })
     .font('Helvetica').fillColor('#334155').text('26/08/2026 as 16:02:24');

  lineY += step;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Arquivo Avaliado: ', col1X, lineY, { continued: true })
     .font('Helvetica').fillColor('#334155').text('Artigo_Reinaldo.docx (7543 palavras)');
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Nota / Conceito: ', col2X, lineY, { continued: true })
     .font('Helvetica-Bold').fillColor(primaryColor).text('8.0 / 10 (Conceito B+)');

  lineY += step;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text('Titulo da Pesquisa: ', col1X, lineY, { continued: true })
     .font('Helvetica-Oblique').fillColor('#334155').text('Cidades inteligentes e governanca: o caso do Crato-CE', { width: contentWidth - 30 });

  // Section Title
  const secY = cardY + cardHeight + 12;
  doc.rect(40, secY, 4, 13).fill(primaryColor);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(darkColor).text('DIAGNOSTICO DIDATICO (INCONFORMIDADES & O QUE FAZER PASSO A PASSO)', 48, secY + 2);

  doc.y = secY + 20;

  // Report text sample
  const sampleText = `#### 1. TITULO
* **Analise do Criterio:** O titulo e claro, delimita o tema ("Cidades inteligentes e governanca: o caso do Crato-CE"), o recorte espacial (Crato-CE / contexto empirico) e as lentes teoricas principais.
* **Inconformidades:**
  1. O titulo omite a inclusao expressa de conceitos e abordagens teoricas essenciais utilizadas no resumo, introducao e corpo do texto com o mesmo peso conceitual dado as teorias centrais.
* **Solucao:**
  * Ajustar o titulo para refletir com exatidao o tripe teorico do trabalho ou torna-lo mais sintetico e direto.
  * Sugestao de redacao: "Cidades Inteligentes e Governanca Publica no Municipio do Crato-CE: Uma Analise Institucional e Empirica"

---

#### 2. INTRODUCAO
* **Analise do Criterio:** A contextualizacao e a justificativa utilizam indicadores atualizados. A estrutura do trabalho, o problema e os objetivos estao formulados de forma encadeada.
* **Inconformidades:**
  1. Incongruencia de Referencial na Introducao: Notas de rodape e citacoes detalham origens de indices e conceitos basilares de forma excessivamente didatica/manualesca para um trabalho de nivel superior, sem agregar densidade analitica.
  2. Desalinhamento Temporal / Anacronismo e Incoerencia Citacional: A Introducao cita indicadores e dados recentes de fontes primarias, porem a secao de Metodologia estabelece recorte temporal divergente. Exige-se rigor e consolidacao cronologica.
  3. Problema e Objetivos: O problema de pesquisa e o objetivo geral silenciam categorias conceituais mobilizadas no marco teorico, gerando assimetria entre a introducao e a fundamentacao.
* **Solucao:**
  * Remover ou condensar Notas de Rodape enciclopedicas: Substituir o texto manualesco por uma breve mencao conceitual fluida diretamente no corpo do texto.
  * Harmonizar as datas da Metodologia com a Introducao: Corrigir a redacao metodologica para indicar com clareza a amplitude temporal exata das series de dados analisadas.
  * Reformular o Problema e Objetivo Geral: Incluir explicitamente as categorias teoricas e empiricas estruturantes para que fiquem 100% coerentes com o referencial e os resultados.

---

#### 3. METODOLOGIA
* **Analise do Criterio:** A secao define a pesquisa como aplicada, qualitativa/quantitativa, exploratoria e descritiva, utilizando levantamento documental e bibliografico.
* **Inconformidades:**
  1. Falta de Especificacao do Corpus Documental e Amostragem: O texto cita orgaos e bases de dados, mas nao estabelece os criterios exatos de busca, descritores utilizados, nem os filtros sistematicos que levaram a selecao dos relatorios e bases especificas.
  2. Ausencia de Unidade de Analise Clara: Nao fica explicito se a unidade de analise sao os relatorios institucionais agregados ou os microdados/indicadores secundarios extraidos.
  3. Aplicacao Superficial do Metodo de Analise (Bardin, 2011 / Gil): O autor cita o metodo analitico, mas nao apresenta a grade de categorizacao ou o protocolo de codificacao das variaveis.
* **Solucao:**
  * Inserir Subsecao de Protocolo de Busca: Detalhar os descritores de busca empregados, as bases de dados consultadas e o horizonte temporal exato da coleta.
  * Sistematizar a Analise Documental / Dados: Incluir um quadro sintetico relacionando as dimensoes analiticas propostas no texto com as fontes documentais correspondentes, demonstrando a operacionalizacao tecnica.

---

#### 4. REFERENCIAL TEORICO
* **Analise do Criterio:** O referencial e dividido em subsecoes articuladas. Ha um esforco conceitual claro em conectar economia, tecnologia e ciencias sociais.

##### A. Coerencia entre os Pontos Destacados
* **Inconformidades:**
  1. Fragmentacao de Conceitos: Mistura de teorias normativas profundas com relatorios de consultorias privadas e indicadores empiricos em um unico topico, enfraquecendo o debate conceitual.
  2. Tratamento Reducionista de Autores Seminais: Citacao generica de autores-chave sem operacionalizar seus conceitos centrais para explicar a realidade do objeto investigado.
* **Solucao:**
  * Reorganizar o Referencial Teorico por Eixos Tematicos Limpos: Eixo 1 (Normativo/Filosofico/Conceitual) e Eixo 2 (Economico/Institucional/Empirico).
  * Aprofundar a Teoria: Explicar explicitamente os mecanismos conceituais e institucionais que explicam os fenomenos observados no Brasil.

##### B. Atualizacao do Tema e dos Autores
* **Inconformidades:**
  1. Uso Indevido de Consultoria de Mercado como Referencial Teorico Principal: Relatorios corporativos possuem vies comercial e metodologias fechadas, devendo ser usados apenas com ressalva contextual, e nao como esteio teorico cientifico.
  2. Lacunas na Literatura Critica Contemporanea: Falta dialogar com autores contemporaneos essenciais revisados por pares que discutem o tema no contexto periferico.
  3. Erros na Lista de Referencias (ABNT NBR 6023): Citacoes com URLs brutas de buscadores com parametros de rastreamento no link ou enderecos truncados.
* **Solucao:**
  * Substituir/Reenquadrar Consultorias de Mercado: Rebaixar dados de mercado para meros exemplos empiricos e priorizar literatura cientifica revisada por pares.
  * Limpar e Corrigir as Referencias (ABNT): Sanitizar imediatamente as referencias, removendo links brutos de busca e inserindo o link oficial do periodico ou DOI.

---

#### 5. RESULTADOS E DISCUSSOES (TCC 2)
* **Analise do Criterio:** Apresentacao clara, sistematica e organizada dos dados obtidos na pesquisa (qualitativos e/ou quantitativos), correlacionando com os objetivos propostos.
* **Inconformidades:**
  1. Apresentacao dos Resultados & Normas Tabulares (IBGE/ABNT): Tabelas, graficos e quadros carecem de padronizacao nas normas da Fundacao IBGE e ABNT (ausencia de indicacao precisa de fontes, cabecalhos, notas metodologicas ou unidades de medida).
  2. Fragilidade na Analise Critica e Confrontacao com o Marco Teorico: O texto limita-se a descrever os dados sem interpreta-los a luz dos autores revisados no referencial teorico. Falta confrontar expressamente se os resultados confirmam, contradizem ou refinam os achados da literatura previa.
  3. Validacao de Hipoteses & Reconhecimento das Limitacoes da Pesquisa: Ausencia de declaracao expressa sobre a confirmacao ou refutacao de cada hipotese formulada na introducao, bem como o silenciamento sobre as limitacoes empiricas que restringiram o alcance dos resultados.
* **Solucao:**
  * Padronizacao Tabular e Grafica: Estruturar todos os dados empiricos em tabelas, graficos e quadros claros, inserindo titulos descritivos, fontes e notas de rodape metodologicas no padrao IBGE/ABNT.
  * Confrontacao Teorico-Empirica Aprofundada: Redigir subsecoes dedicadas a cruzar cada achado com os autores seminais do marco teorico (explicando convergencias e divergencias conceituais).
  * Matriz de Validacao das Hipoteses & Limitacoes: Incluir um paragrafo de fechamento detalhando a validacao de cada hipotese e reconhecendo formalmente as limitacoes de campo e de amostra.

---

#### 6. CONSIDERACOES FINAIS (TCC 2)
* **Analise do Criterio:** Sintese conclusiva e resposta direta ao problema central da pesquisa, integrando contribuicoes teoricas e praticas.
* **Inconformidades:**
  1. Resposta Implicita ou Difusa ao Problema Central: O texto nao declara de forma pontual e categorica como a questao central foi respondida com base nas evidencias coletadas.
  2. Ausencia de Recomendacoes Praticas e Aplicadas para Gestores: Falta detalhar o impacto dos resultados para a gestao publica, tomada de decisao empresarial ou formuladores de politicas publicas.
  3. Lacunas na Agenda de Pesquisas Futuras: As sugestoes para novos estudos sao genericas, sem apontar desdobramentos especificos decorrentes das limitacoes encontradas.
* **Solucao:**
  * Sintese Executiva & Resposta Direta: Dedicar o primeiro bloco das consideracoes finais para responder diretamente a pergunta de pesquisa em topicos objetivos e fundamentados.
  * Detalhamento Tripartite das Contribuicoes: Explicar em subtopicos as contribuicoes: (a) teoricas/academicas; (b) metodologicas; e (c) praticas/sociais para gestores e instituicoes.
  * Agenda Propositiva de Pesquisas Futuras: Indicar caminhos metodologicos especificos para investigar as lacunas remanescentes em pesquisas posteriores.

---

#### 7. Parecer Geral & Nota Preliminar da Etapa 1
* **Parecer do Agente:** **Aprovado para Revisao / Necessita de Ajustes Estruturais**
* **Nota Indicada nesta Etapa:** **8.0 / 10** (Conceito B+)`;

  // Parser
  const lines = sampleText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) {
      doc.moveDown(0.2);
      continue;
    }

    const clean = sanitizeForPdf(rawLine);

    if (clean.startsWith('#### ')) {
      // Check page break
      if (doc.y > doc.page.height - 80) doc.addPage();
      
      doc.moveDown(0.5);
      const title = clean.replace(/^####\s*/, '').replace(/\*\*/g, '');
      const hY = doc.y;
      doc.roundedRect(40, hY, contentWidth, 18, 3).fillAndStroke('#f1f5f9', '#cbd5e1');
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(primaryColor).text(title, 48, hY + 4, { width: contentWidth - 16 });
      doc.y = hY + 22;
    } else if (clean.startsWith('##### ')) {
      if (doc.y > doc.page.height - 60) doc.addPage();
      doc.moveDown(0.3);
      const subTitle = clean.replace(/^#####\s*/, '').replace(/\*\*/g, '');
      doc.font('Helvetica-Bold').fontSize(9).fillColor(darkColor).text(subTitle, 44, doc.y, { width: contentWidth - 8 });
      doc.moveDown(0.15);
    } else if (clean.startsWith('---')) {
      doc.moveDown(0.2);
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
      doc.moveDown(0.2);
    } else if (clean.startsWith('* **') || clean.startsWith('• **')) {
      if (doc.y > doc.page.height - 50) doc.addPage();
      const itemText = clean.replace(/^[\*•]\s*/, '');
      const boldMatch = itemText.match(/^\*\*(.*?)\*\*(.*)/);
      if (boldMatch) {
        const label = boldMatch[1].trim();
        const rest = boldMatch[2].replace(/\*\*/g, '').trim();
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(darkColor).text(`• ${label} `, 44, doc.y, {
          continued: rest.length > 0,
          lineGap: 2.5,
          width: contentWidth - 10
        });
        if (rest.length > 0) {
          doc.font('Helvetica').fillColor('#334155').text(rest, {
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
      if (doc.y > doc.page.height - 50) doc.addPage();
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
      if (doc.y > doc.page.height - 50) doc.addPage();
      const subItem = clean.replace(/^[\*•\-]\s*/, '').replace(/\*\*/g, '').trim();
      doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(`     - ${subItem}`, 52, doc.y, {
        lineGap: 2.5,
        width: contentWidth - 20
      });
      doc.moveDown(0.15);
    } else {
      if (doc.y > doc.page.height - 50) doc.addPage();
      doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(clean.replace(/\*\*/g, ''), 44, doc.y, {
        lineGap: 2.5,
        width: contentWidth - 10
      });
      doc.moveDown(0.2);
    }
  }

  // Footer on all pages
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    const fY = doc.page.height - 28;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, fY - 4).lineTo(doc.page.width - 40, fY - 4).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor(mutedColor).text('Documento oficial de parecer didatico gerado pelo Sistema Orientador IA - URCA', 40, fY);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(mutedColor).text(`Pagina ${i + 1} de ${totalPages}`, doc.page.width - 120, fY, { align: 'right', width: 80 });
  }

  doc.end();
  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      console.log('TEST PDF GENERATED SUCCESSFULLY at:', outputPath);
      resolve(outputPath);
    });
  });
}

testPdfGeneration();
