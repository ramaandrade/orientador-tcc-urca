# Disparador WhatsApp Acadêmico (TPE, TCC1 e TCC2) 🎓📱

Aplicação web desenvolvida para simplificar e automatizar a comunicação de orientadores e coordenações de curso com turmas de conclusão (**TPE**, **TCC1** e **TCC2**) via WhatsApp, com proteção anti-bloqueio, sanitização automática de telefones, biblioteca de modelos com tags dinâmicas e relatórios detalhados de entrega.

---

## ✨ Funcionalidades Principais

1. **Gestão de Contatos e Turmas (RF01 - RF03)**
   - Importação em lote via planilhas **.xlsx** ou **.csv** com detecção inteligente de cabeçalhos.
   - Normalização e sanitização automática de telefones brasileiros (**E.164**: `+55 (DD) 9XXXX-XXXX`).
   - Filtros dinâmicos por turma (**TPE**, **TCC1**, **TCC2**), orientador e status.
   - Download de planilha modelo pré-formatada.

2. **Biblioteca de Modelos de Mensagem (RF04 - RF06)**
   - Modelos acadêmicos prontos para TPE, TCC1 e TCC2.
   - Inserção de variáveis dinâmicas: `{nome}`, `{primeiro_nome}`, `{turma}`, `{orientador}`, `{tema}`, `{prazo}`, `{instituicao}`.
   - Suporte a upload de anexos (**PDFs**, **modelos de ata**, **manuais**, imagens).
   - **Simulador WhatsApp Realista**: Pré-visualizador em tempo real com formato balão de mensagem e markdown do WhatsApp (`*negrito*`, `_itálico_`).

3. **Disparo com Proteção Anti-Bloqueio & Agendamento (RF07 - RF09)**
   - Conexão nativa via **QR Code (Baileys)** sem necessidade de APIs pagas.
   - **Modo Simulação (Mock)** integrado para testes rápidos sem aparelho físico.
   - Fila de envio com **delay randômico customizável** (ex: 5s a 15s) e **pausas automáticas por lote** (ex: pausa a cada 20 mensagens) para evitar detecção de spam.
   - Controles de **Pausar**, **Retomar** e **Cancelar** disparo em tempo real.
   - Agendamento de envios com data e hora.

4. **Histórico, Logs & Relatórios (RF10 - RF11)**
   - Rastreamento individual por aluno (`Pendente`, `Enviando`, `Enviado`, `Falha`).
   - Download do relatório completo de auditoria e entrega em formato **CSV**.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js v18+ instalado.

### 1. Iniciar Servidor Backend e Frontend Simultaneamente
Na raiz da pasta `academic-whatsapp-sender`:

```bash
# Instalar dependências raiz
npm install

# Iniciar backend e frontend com um único comando
npm run dev
```

Ou execute separadamente:

```bash
# Terminal 1 - Backend (Porta 3001)
cd server
npm run dev

# Terminal 2 - Frontend (Porta 5173)
cd client
npm run dev
```

- **Frontend (Painel Web)**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

---

## 🔒 Conformidade LGPD & Segurança
- Todos os dados de alunos, orientadores e relatórios são salvos localmente em banco **SQLite** embutido, sem compartilhamento com servidores de terceiros.
