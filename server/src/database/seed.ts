import { prisma } from './db';

async function main() {
  console.log('[Seed] Inicializando dados padrão acadêmicos...');

  // Default settings
  await prisma.setting.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      mockMode: false,
      defaultMinDelay: 5,
      defaultMaxDelay: 12,
      batchSize: 20,
      batchPauseSeconds: 45,
      institutionName: 'Faculdade de Tecnologia e Ciências',
      coordinatorName: 'Coordenação Geral de TCC e Estágio',
    },
  });

  // Default templates
  const existingTemplates = await prisma.template.count();
  if (existingTemplates === 0) {
    await prisma.template.createMany({
      data: [
        {
          title: 'TPE – Escolha de Orientador e Cronograma',
          group: 'TPE',
          content:
            'Olá, *{nome}*! 👋\n\n' +
            'Aqui é da {instituicao} sobre a disciplina de *TPE (Trabalho de Pesquisa/Estágio)*.\n\n' +
            '📌 *Lembrete Importante:*\n' +
            'O prazo limite para definição do seu orientador e submissão do anteprojeto é dia *{prazo}*.\n\n' +
            'Orientador atual registrado: _{orientador}_\n' +
            'Tema proposto: _{tema}_\n\n' +
            'Caso precise alterar algum dado ou submeter o formulário, acesse o portal acadêmico ou responda esta mensagem.\n\n' +
            'Bons estudos!',
        },
        {
          title: 'TCC1 – Prazo de Envio do Capítulo de Qualificação',
          group: 'TCC1',
          content:
            'Prezado(a) *{nome}*,\n\n' +
            'Informamos que o prazo para envio do capítulo inicial e projeto de qualificação de *TCC 1* encerra-se em *{prazo}*.\n\n' +
            'Orientador(a): *{orientador}*\n' +
            'Linha de Pesquisa: _{tema}_\n\n' +
            '⚠️ *Atenção:* O envio do relatório com o parecer do comitê de ética (quando aplicável) deve ser anexado junto à versão preliminar.\n\n' +
            'Qualquer dúvida, procure a coordenação de TCC.',
        },
        {
          title: 'TCC2 – Agendamento e Convocação de Banca de Defesa',
          group: 'TCC2',
          content:
            'Parabéns, *{nome}*! 🎉\n\n' +
            'Você está na fase final de conclusão de curso (*TCC 2*).\n\n' +
            '📅 A sua banca de defesa final e a entrega da versão definitiva estão agendadas para até *{prazo}*.\n' +
            'Orientador(a): *{orientador}*\n' +
            'Título do Trabalho: *{tema}*\n\n' +
            '📄 Segue em anexo o modelo da Ata de Defesa e o Termo de Autorização para publicação na biblioteca institucional.\n\n' +
            'Sucesso na sua apresentação final!',
        },
        {
          title: 'Aviso Geral – Plantão de Dúvidas sobre TCC e Normas ABNT',
          group: 'ALL',
          content:
            'Olá, *{primeiro_nome}*!\n\n' +
            'A coordenação convida todos os alunos de *{turma}* para o nosso *Plantão de Dúvidas e Normas ABNT* nesta quinta-feira às 19h.\n\n' +
            'A participação é fundamental para evitar ajustes na formatação final do seu trabalho.\n\n' +
            'Contamos com sua presença!',
        },
      ],
    });
  }

  // Seed sample students if empty
  const studentCount = await prisma.student.count();
  if (studentCount === 0) {
    await prisma.student.createMany({
      data: [
        {
          name: 'Mariana Souza Silva',
          phone: '5511987654321',
          originalPhone: '(11) 98765-4321',
          group: 'TPE',
          advisor: 'Prof. Dr. Carlos Mendes',
          topic: 'Impactos da Inteligência Artificial na Educação Infantil',
          email: 'mariana.souza@universidade.edu.br',
          deadline: '15/09/2026',
          status: 'ACTIVE',
        },
        {
          name: 'Lucas Gabriel de Oliveira',
          phone: '5511976543210',
          originalPhone: '11976543210',
          group: 'TCC1',
          advisor: 'Profa. Dra. Juliana Freitas',
          topic: 'Arquitetura de Microsserviços e Otimização de Performance',
          email: 'lucas.oliveira@universidade.edu.br',
          deadline: '30/10/2026',
          status: 'ACTIVE',
        },
        {
          name: 'Beatriz Helena Ramos',
          phone: '5521991234567',
          originalPhone: '+55 (21) 99123-4567',
          group: 'TCC2',
          advisor: 'Prof. Me. Roberto Santos',
          topic: 'Segurança da Informação em Dispositivos IoT Hospitalares',
          email: 'beatriz.ramos@universidade.edu.br',
          deadline: '05/11/2026',
          status: 'ACTIVE',
        },
        {
          name: 'Gabriel Costa Andrade',
          phone: '5531988887777',
          originalPhone: '31988887777',
          group: 'TCC2',
          advisor: 'Profa. Dra. Camila Rocha',
          topic: 'Blockchain aplicada à Rastreabilidade e Auditoria Logística',
          email: 'gabriel.costa@universidade.edu.br',
          deadline: '10/11/2026',
          status: 'ACTIVE',
        },
        {
          name: 'Fernanda Albuquerque Lima',
          phone: '5581981112233',
          originalPhone: '(81) 98111-2233',
          group: 'TPE',
          advisor: 'Prof. Dr. Carlos Mendes',
          topic: 'Eficiência Energética em Edificações Residenciais Sustentáveis',
          email: 'fernanda.alb@universidade.edu.br',
          deadline: '20/09/2026',
          status: 'ACTIVE',
        },
      ],
    });
  }

  console.log('[Seed] Banco de dados populado com sucesso!');
}

main()
  .catch((e) => {
    console.error('[Seed] Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
