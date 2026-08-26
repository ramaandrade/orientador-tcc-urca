const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../../data/academic_whatsapp.db'));

const newRoadmapReport = `### 🚀 Roteiro de Desenvolvimento do TCC 1 — Transição TPE ➔ TCC 1 (URCA)

**Discente:** Alana Soares  
**Instituição:** Universidade Regional do Cariri – URCA (Curso de Ciências Econômicas, Crato-CE)  
**Orientador:** Prof. Ramá Lucas Andrade  
**Nível Atual:** TPE ➔ **Nível Alvo:** TCC 1 (Qualificação de Artigo Científico)  
**Título da Pesquisa:** *Digitalização e Gestão Pública Municipal: Adoção de Sistemas Padronizados e Seus Efeitos na Autonomia das Prefeituras do Ceará*  
**Arquivo-Base Avaliado:** \`Alana_Soares_TPE_versao_final.docx\` (1.840 palavras / 12.350 caracteres)  
**Data de Emissão do Roteiro:** 25/08/2026 às 20:30:00  

---

#### 1. 🎯 Diagnóstico da Versão Atual & Metas de Qualificação para TCC 1
* 📋 **Status Atual (TPE):** O projeto de pesquisa encontra-se com problema e justificativa estruturados em tópicos separados.
* 🎯 **Meta Central em TCC 1:** Transformar o projeto em um **Artigo Científico Preliminar Completo (Qualificação de TCC 1)**, realizando a expansão profunda da Introdução, da Metodologia e do Referencial Teórico.
* ⚠️ **Aviso Estrutural Rigoroso:** Em **TCC 1 NÃO EXISTEM as seções de 'Resultados e Discussões' nem 'Considerações Finais'** (estas serão elaboradas exclusivamente no TCC 2). O foco total do discente em TCC 1 está na fundamentação teórica e no delineamento metodológico detalhado.

---

#### 2. 🧭 Roteiro Passo a Passo de Redação para o TCC 1

##### 📌 **PASSO 1 — ELEMENTOS PRÉ-TEXTUAIS (1 página)**
* 📝 **O que o aluno deve fazer:**
  * **Título do Artigo:** Manter o título claro, delimitado e com abordagem teórica explícita (*"Digitalização e Gestão Pública Municipal: Adoção de Sistemas Padronizados e Seus Efeitos na Autonomia das Prefeituras do Ceará (2019–2026)"*).
  * **Autoria e Filiação Institucional:** Alana Soares, Universidade Regional do Cariri – URCA, Curso de Ciências Econômicas, Crato-CE. Orientador: Prof. Ramá Lucas Andrade.
  * **Resumo & Abstract:** **ATENÇÃO:** Escrever o resumo (150 a 250 palavras) e a tradução para abstract **somente na versão final do TCC 2**. Deixar indicado apenas o espaço em TCC 1.
  * **Palavras-chave & Keywords:** Selecionar de 3 a 5 termos centrais separados por ponto e vírgula representativos da área (digitalização pública; autonomia municipal; sistemas padronizados; IEGM; custos de transação).

---

##### 📌 **PASSO 2 — SEÇÃO 1: INTRODUÇÃO (2 a 3 páginas em Texto Corrido)**
* 📝 **O que o aluno deve fazer:**
  * O projeto já contém os elementos introdutórios, mas distribuídos em seções separadas (1. Introdução, 2. Problema, 3. Justificativa, 4. Objetivos). **No artigo, tudo isso deve ser fundido em um único texto corrido, sem subtítulos internos.**
  * **Bloco 1 — Contextualização (3 a 4 parágrafos):** Apresentar a transformação da administração pública cearense na última década, o avanço tecnológico, as plataformas federais e a transição de modelos. Expandir trazendo dados quantitativos de relatórios oficiais do TCE-CE para contextualizar o leitor.
  * **Bloco 2 — Justificativa (2 parágrafos):**
    * *Parágrafo 1 (Relevância Acadêmica):* Ancorar na literatura nacional e internacional sobre Nova Gestão Pública e Economia Institucional, demonstrando que o setor carece de estudos sistemáticos com dados contábeis e de governança do IEGM ao longo de um ciclo completo. Citar autores centrais para evidenciar a lacuna científica.
    * *Parágrafo 2 (Relevância Prática):* Demonstrar como os achados subsidiarão gestores municipais, secretários de finanças e órgãos de controle externo.
  * **Bloco 3 — Problema de Pesquisa (1 parágrafo):** Reproduzir a pergunta norteadora do projeto em formulação direta, clara e delimitada: *"De que maneira a obrigatoriedade de sistemas padronizados influenciou a autonomia decisória das prefeituras cearenses?"*
  * **Bloco 4 — Hipótese de Trabalho (1 parágrafo):** Formular a hipótese com rigor teórico: *"A hipótese de trabalho é que a adoção forçada de plataformas padronizadas gera isomorfismo institucional coercitivo, reduzindo a flexibilidade decisória local frente à carência de infraestrutura computacional."*
  * **Bloco 5 — Objetivos Geral e Específicos (1 a 2 parágrafos):** Apresentar de forma fluida o objetivo geral (comparar o impacto dos sistemas) e 3 objetivos específicos como degraus metodológicos da investigação.
  * **Bloco 6 — Estrutura do Artigo (1 parágrafo):** Anunciar brevemente como o artigo está organizado: *"O artigo está organizado em três seções, além desta introdução: a seção 2 descreve os procedimentos metodológicos adotados; a seção 3 desenvolve o referencial teórico; e, por fim, são apresentadas as referências bibliográficas."*

---

##### 📌 **PASSO 3 — SEÇÃO 2: METODOLOGIA (1,5 a 2 páginas em Subseções Numeradas)**
* 📝 **O que o aluno deve fazer:**
  * Reescrever toda a metodologia no tempo verbal adequado (**presente/passado**, e não no futuro). Manter a estrutura em subseções numeradas:
  * **2.1 Classificação e Delineamento da Pesquisa:** Classificar o estudo segundo a natureza (aplicada), abordagem (quali-quantitativa) e objetivos (descritivo-explicativa), fundamentando formalmente em GIL (2017) e CRESWELL (2014). Acrescentar 1 parágrafo justificando por que a comparação entre os municípios cearenses fortalece o rigor da pesquisa.
  * **2.2 Unidade de Análise e Amostragem:** Nomear as prefeituras pesquisadas, detalhando os critérios formais de inclusão e exclusão da amostra por porte populacional e notas do IEGM.
  * **2.3 Instrumentos e Procedimentos de Coleta de Dados:** Descrever minuciosamente as fontes de extração de dados oficiais (Portal do TCE-CE / IEGM e IBGE MUNIC), explicitando eventuais limitações operacionais com maturidade metodológica.
  * **2.4 Processamento e Análise de Dados:** Descrever as fórmulas, variáveis, indicadores e técnicas de análise. Incluir 1 parágrafo descrevendo quais tipos de tabelas e gráficos serão construídos para visualização futura no TCC 2.

---

##### 📌 **PASSO 4 — SEÇÃO 3: REFERENCIAL TEÓRICO (5 a 6 páginas — O Maior Esforço do TCC 1)**
* 📝 **O que o aluno deve fazer:**
  * Esta é a seção que mais exige expansão. O esboço preliminar precisa **triplicar em extensão (5 a 6 páginas)**, articulando autores clássicos e contemporâneos em 3 subseções conceituais temáticas com debate ativo e confronto de perspectivas:
  * **Subseção 3.1 — Nova Gestão Pública, Reforma do Estado e Digitalização (6 a 7 parágrafos):** Definir com precisão os conceitos de Bresser-Pereira (1996) e Christopher Hood (1991), discutindo a transição burocrática para a gestão digital.
  * **Subseção 3.2 — Teoria Institucional e Custos de Transação (6 a 7 parágrafos):** Desenvolver os conceitos de Douglass North (1990) e Oliver Williamson (1985), demonstrando como regras formais e assimetrias de informação elevam custos de adaptação.
  * **Subseção 3.3 — Tecnologias de Propósito Geral e Escala de Plataforma (6 a 7 parágrafos):** Articular Jovanovic & Rousseau (2005) com a literatura de inovação pública.
  * **Parágrafo Final Obrigatório — Estado da Arte (Posicionamento do Trabalho):** Incluir no encerramento da seção 3 um parágrafo delimitando explicitamente: *"Embora a literatura sobre digitalização na gestão pública seja ampla, os estudos que confrontam empiricamente a perda de autonomia decisória em municípios de pequeno porte no Ceará ainda são escassos. Este artigo busca preencher essa lacuna ao analisar sistematicamente o período 2019–2026..."*
* 📚 **Autores Centrais Recomendados:**  
  * 📖 **North, Douglass C. / Williamson, Oliver:** Instituições, Mudança Institucional e Teoria dos Custos de Transação.
  * 📖 **Hood, Christopher / Bresser-Pereira, Luiz Carlos:** Nova Gestão Pública e Reforma Gerencial do Estado.
  * 📖 **Jovanovic, Boyan & Rousseau, Peter:** Tecnologias de Propósito Geral (GPTs) e Escala de Plataforma.
  * 📖 **Gil, Antônio Carlos / Creswell, John W.:** Metodologia Científica e Delineamento de Pesquisa.

---

##### 📌 **4. Resultados e Discussões (não faz parte de TCC 1, apenas em TCC 2)**

---

##### 📌 **5. Considerações Finais (não faz parte de TCC 1, apenas em TCC 2)**

---

##### 📌 **PASSO 5 — REFERÊNCIAS (1 a 1,5 página - ABNT NBR 6023:2018)**
* 📝 **O que o aluno deve fazer:**
  * Organizar a lista completa em ordem alfabética, alinhada à esquerda com espaçamento simples e separadas por linha em branco.
  * Assegurar conformidade absoluta: nenhum autor citado no texto pode faltar na lista e nenhuma referência pode constar sem citação direta/indireta no corpo do trabalho.

---

#### 3. ⚠️ AVISOS OBRIGATÓRIOS DO COLEGIADO / URCA PARA O TCC 1
1. **Expansão e Aprofundamento:** O trabalho de transformação do projeto em artigo não é de reescrita total, mas de expansão qualificada. A metodologia deve estar em nível de artigo replicável.
2. **Priorização de Tempo:** O maior esforço de redação está na **Seção 3 (Referencial Teórico)**, que deve alcançar de 5 a 6 páginas densamente fundamentadas.
3. **Eliminação do Cronograma:** A seção de cronograma do projeto anterior **não faz parte do artigo científico** e deve ser completamente eliminada.
4. **Fusão em Texto Corrido:** Na Seção 1 (Introdução), elimine os subtítulos 1.1, 1.2, etc., transformando todo o conteúdo em uma narrativa acadêmica fluida e integrada.
5. **Seções de TCC 2:** Lembre-se que **Resultados, Discussões e Considerações Finais NÃO entram em TCC 1**, sendo desenvolvidos na etapa subsequente (TCC 2).

---

#### 4. 🔗 Matriz de Coerência e Alinhamento Lógico entre as Partes do Artigo (Texto Corrido)

* ❓ **1. Pergunta de Partida Central:** *Como a padronização digital e a adesão a sistemas tecnológicos afeta a autonomia decisória dos municípios cearenses?*
* 💡 **2. Hipótese Teórica (H1):** *Isomorfismo institucional e rigidez de processos normativos (fundamentado em Douglass North, Christopher Hood e Bresser-Pereira).*
* 🎯 **3. Objetivos Específicos Integrados:**
  * *OE1 (Mapeamento):* Mapear os sistemas de gestão eletrônica e contratos vigentes nas prefeituras do Ceará.
  * *OE2 (Impacto):* Mensurar o impacto nas dimensões do IEGM/TCE e na rotina decisória dos gestores locais.
  * *OE3 (Correlação):* Verificar a correlação estatística entre o grau de digitalização e os entraves operacionais na ponta.
* 📊 **4. Delineamento Metodológico & Coleta:** Microdados oficiais do IEGM (TCE-CE) cruzados com relatórios de auditoria e contratos nos Portais de Transparência.
* 📈 **5. Discussão e Fechamento Futuro (TCC 2):** Confrontar os achados empíricos futuros diretamente com o marco teórico qualificado nesta versão de TCC 1.

---

#### 5. 🏆 Parecer de Encaminhamento Acadêmico para Qualificação de TCC 1
* **Parecer do Agente Orientador:** **ROTEIRO DIDÁTICO OFICIAL LIBERADO / APTO PARA DESENVOLVIMENTO DE TCC 1**
* **Classificação:** **Plano de Qualificação Estruturado Conforme as Diretrizes da URCA**
* **Validação Institucional:** Documento oficial homologado para acompanhamento do discente junto ao Professor Orientador.`;

db.prepare('UPDATE research_evaluations SET evaluationReport = ? WHERE id = ?').run(newRoadmapReport, 'a469ea3b-103d-456b-ae33-c42e6000e480');
console.log('Record updated successfully!');
