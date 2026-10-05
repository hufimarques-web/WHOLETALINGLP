LANDING PAGE | VENDA DE IMOVEIS

Estado: primeira versao de validacao privada, 2026-10-05.
Atualizacao 2026-10-06: primeiro ecra com o angulo "Em 2 minutos",
pergunta sobre os proximos 60 dias e fotografias nas secoes seguintes.
Os 2 minutos sao uma estimativa de preenchimento, nao um prazo de venda.
Entrada local: dist/index.html. Funciona sem compilacao e sem servidor.

Implementado
- Pagina responsiva em portugues de Portugal.
- Secao de identificacao emocional com tres situacoes ilustrativas, explicitamente
  identificadas como exemplos e nao como testemunhos ou negocios reais.
- Angulo de revisao de expectativas de preco, sem avaliacao automatica.
- Comparacao entre expectativa de anuncio e evidencia de venda.
- Explicacao transparente da alternativa de compra para investimento.
- Formulario de quatro etapas com perguntas especificas para terrenos.
- Validacao de campos, telefone e minimo superior ao preco pedido.
- Percurso alternativo sem contacto para quem procura o preco maximo.
- Resumo, revisao de respostas, limpeza e dialogo de privacidade.
- Sem cookies de marketing, analytics, localStorage ou envio de contactos.

Antes do lancamento publico
- Confirmar URL e interface de entrada do CRM real.
- Ligar o envio a um servidor com validacao, deduplicacao e protecao antispam.
- Confirmar identidade da entidade, contacto e informacao de privacidade.
- Definir prazo real para resposta humana antes de o prometer no texto.
- Substituir avisos de previa quando a recolha estiver operacional.
- Configurar medicao apenas apos decisao de privacidade e consentimento aplicavel.
- Testar uma lead ficticia ponta a ponta antes de ativar anuncios.

Integracao prevista
Entrada como Nova lead / Nao contactado. Fotos e documentos dependem das
respostas. Valor de mercado e margem permanecem por analisar, nunca inferidos
apenas da flexibilidade do proprietario. As respostas nao sao persistidas nesta
versao. O resumo e uma simulacao, nao uma confirmacao de registo no CRM.

Verificacao realizada no navegador
- Imagem e 42 icones carregados.
- Sem deslocamento horizontal a 1440, 390 e 320 pixels de largura.
- Campos obrigatorios bloqueiam avanco.
- Terreno apresenta opcoes de viabilidade e area de terreno.
- Proposta anterior aparece apenas quando aplicavel.
- Minimo superior ao preco pedido apresenta erro.
- Escolha do preco maximo mostra percurso sem contacto e permite regressar.
- Telefone invalido apresenta erro.
- Percurso completo produz resumo correto com dados de teste.
- Limpeza de respostas e abertura/fecho de privacidade testados.
- Sem erros de consola no percurso verificado.
- Verificacao sintatica do JavaScript concluida.

Publicacao
Destino solicitado: GitHub hufimarques-web/WHOLETALINGLP e Vercel.
Site estatico: preset Other, sem build, pasta de saida dist.
Configuracao em vercel.json. Nao requer variaveis de ambiente.
Formulario demonstrativo: nao recolhe nem envia contactos para o CRM.
Metadados locais do Sites excluidos do repositorio por .gitignore.

Referencias de estrategia
https://www.youtube.com/watch?v=S6A3Cg_KbDE
https://www.youtube.com/watch?v=zA0B-VwOPn4
https://www.acquisition.com/hubfs/Offer%20Checklists%20-%20PDF%20Downloads/Pricing-Value-Checklist.pdf?hsLang=en
As recomendacoes foram adaptadas; nao constituem garantias de conversao.

Fotografia ilustrativa, nao um imovel negociado pela equipa
Evgeniy Beloshytskiy / Unsplash
https://unsplash.com/photos/old-building-facade-with-balconies-and-windows-8DWKLXdSSGc
https://images.unsplash.com/photo-1757152162231-295a27cc7962
Icones: Lucide 0.468.0 (ISC), distribuicao local em dist/lucide.min.js.

Fotografias adicionais abaixo do primeiro ecra (ilustrativas, nao negocios reais)
casa-herdada.jpg: Samuel Jeronimo / Unsplash (Unsplash License)
https://unsplash.com/photos/old-stone-house-with-overgrown-vines-and-a-lantern-4qMsTSBu5W4
terreno.jpg: Joao / Unsplash (Unsplash License)
https://unsplash.com/photos/a-field-with-a-fence-and-a-lone-tree-in-the-distance-9dixl5h5lyo
interior-obras.jpg: Pexels (Pexels License)
https://www.pexels.com/photo/renovation-of-an-apartmetn-flat-9908376/
moradia-portuguesa.jpg: Pexels (Pexels License)
https://www.pexels.com/photo/abandoned-house-in-village-26775836/
