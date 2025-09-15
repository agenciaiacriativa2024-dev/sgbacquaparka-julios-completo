# sgbacquaparka-julios-completo
sgbacquaparka-julios-completo
Você é um engenheiro de software sênior, especialista em desenvolvimento de aplicações web completas (full-stack). Sua tarefa é criar um Progressive Web App (PWA) robusto e seguro para a gestão de acessos de um parque aquático. A aplicação deve ser construída em um único arquivo HTML para o front-end e utilizar Firebase para o back-end, com integração à API de pagamentos Asaas.
O objetivo é gerar todos os arquivos e funcionalidades de uma só vez, prontos para deploy e teste.
1. Tecnologias e Configurações:
•	Front-end: HTML, CSS com TailwindCSS, e JavaScript (vanilla, sem frameworks). A aplicação deve ser uma Single Page Application (SPA), onde a navegação entre telas é simulada exibindo e ocultando divs.
•	Back-end & Infraestrutura:
o	Firebase Authentication: Para login com email/senha e controle de acesso baseado em papéis (roles).
o	Firestore Database: Para armazenar todos os dados da aplicação (usuários, passaportes, planos, etc.).
o	Firebase Storage: Para armazenar fotos de rosto e documentos dos sócios.
o	Firebase Hosting: Onde a aplicação será hospedada.
o	Firebase Functions: Para toda a comunicação segura com a API do Asaas e para tarefas administrativas (como criar usuários). É crucial que a chave da API Asaas NUNCA seja exposta no lado do cliente.
•	API de Pagamentos e Configurações Firebase em documento em anexo.

2. Estrutura de Arquivos a Serem Gerados:
•	index.html: Arquivo principal contendo todo o HTML, CSS (via CDN do TailwindCSS), e o código JavaScript da aplicação.
•	manifest.json: Arquivo de manifesto para a PWA.
•	service-worker.js: Service worker básico para funcionalidades offline.
•	functions/index.js: Código para as Firebase Cloud Functions (Node.js).
•	firestore.rules: Regras de segurança para o Firestore.
•	________________________________________
•	3. Detalhamento das Funcionalidades e Telas (index.html):
•	Estrutura Geral do index.html:
•	Use a CDN do TailwindCSS no <head>.
•	Crie uma div container para cada "tela" da aplicação (ex: <div id="tela-login">, <div id="tela-ceo-home">, etc.). Apenas uma div de tela deve ser visível por vez.
•	Implemente um sistema de roteamento simples em JavaScript que altera a visibilidade das divs de tela.
•	Utilize o SDK do Firebase (v9, modular) importado via CDN.
•	Inclua uma biblioteca de geração de QR Code (ex: qrcode.min.js via CDN).
•	Telas Comuns:
•	Tela de Login:
•	UI: Logomarca, campo "Usuário" (email), campo "Senha", botão "Entrar".
•	Lógica: Autenticar com signInWithEmailAndPassword. Após o login, verifique o papel (role) do usuário (custom claim) e redirecione para a tela inicial correspondente (CEO, Secretaria, Portaria, SócioFamiliar).
•	Fluxo do Usuário 'CEO':
•	Tela Inicial (CEO):
•	UI: Botões "Gerenciar Usuários", "Gerenciar Passaportes", "Gerenciar Planos", e "Sair".
•	Tela Gerenciar Usuários:
•	UI: Formulário para criar novo usuário (campo 'email', select 'Tipo de Usuário' com opções 'CEO', 'Secretaria', 'Portaria'), botão "Criar Usuário". Lista de usuários existentes com email, tipo e um ícone de lixeira para excluir. Botão "Voltar" flutuante.
•	Lógica:
•	"Criar Usuário": Chama uma Cloud Function que: 1) Cria o usuário no Firebase Auth via Admin SDK. 2) Define uma custom claim com o tipo de usuário. 3) Gera e envia um link de redefinição de senha para o email do novo usuário.
•	Excluir: Chama uma Cloud Function para remover o usuário do Auth.
•	Tela Gerenciar Planos:
•	UI: Formulário para "Novo Plano" ('Nome', 'Valor Mensal', 'Descrição'), botão "Salvar Plano". Lista de planos existentes com nome, valor, descrição, e botões "Editar" e "Excluir". Botão "Voltar" flutuante.
•	Lógica: CRUD completo na coleção plans do Firestore. A exclusão deve pedir confirmação.
•	Fluxo dos Usuários 'CEO' e 'Secretaria':
•	Tela Gerenciar Passaportes:
•	UI: Botão "Criar Novo Passaporte". Formulário de busca (select para buscar por 'Número do Passaporte', 'Nome do Responsável', 'CPF', 'Nome do Titular'), botão "Buscar" e "Limpar". Lista dos últimos 20 passaportes criados ('Número', 'Responsável', botão 'Editar'). Botão "Voltar" flutuante.
•	Lógica: Busca e listagem da coleção passports no Firestore.
•	Tela Criar Novo Passaporte:
•	UI: Formulário "Dados do Responsável Financeiro" ('Nome Completo', 'CPF', 'Data de Nascimento', 'Email', 'Telefone', 'Endereço', select 'Plano' populado da coleção plans). Botão "Criar Passaporte". Botão "Voltar" flutuante.
•	Lógica: Ao clicar em "Criar Passaporte":
•	Chama uma Cloud Function que busca o cliente no Asaas pelo CPF. Se não existir, cria um novo cliente no Asaas e obtém o id do cliente (cus_...).
•	Cria um usuário no Firebase Auth com o email fornecido (mesma lógica de "Criar Usuário" do CEO). Define a custom claim como 'SócioFamiliar'.
•	Salva os dados do formulário e o asaasCustomerId em um novo documento na coleção passports no Firestore. O ID do documento pode ser o número do passaporte gerado.
•	Mostra mensagem de sucesso e limpa o formulário.
•	Tela Editar Passaporte:
•	UI: Campos não editáveis ('Número do Passaporte', 'Nome', 'CPF', 'Data de Nascimento'). Campos editáveis ('Email', 'Telefone', 'Endereço', 'Plano'). Botão "Adicionar Carteirinha". Lista de carteirinhas em carrossel de cards (Foto, QR Code, Nome, Nascimento, Parentesco, Número do Passaporte). Cada card tem um botão "Editar".
•	Lógica: Atualiza o documento na coleção passports. A lista de carteirinhas é lida de uma subcoleção cards dentro do documento do passaporte.
•	Tela Adicionar/Editar Carteirinha:
•	UI: Formulário ('Grau de Parentesco' em um select, 'Nome Completo', 'CPF/Documento', 'Data de Nascimento'). Botão "Tirar Foto Rosto". Botão "Tirar Foto Documento". Botão "Salvar"/"Adicionar Carteirinha". Botão "Voltar" flutuante.
•	Lógica da Câmera:
•	Use <input type="file" accept="image/*" capture>.
•	Ao capturar, use a API Canvas do JavaScript para:
•	Redimensionar a imagem para uma proporção 3x4.
•	Comprimir a imagem usando canvas.toDataURL('image/jpeg', quality) para atingir os tamanhos máximos: 150kb (rosto) e 400kb (documento).
•	Faça o upload do blob resultante para o Firebase Storage, em um caminho como passports/{passportId}/{cardId}_face.jpg.
•	Lógica de Salvar:
•	Ao "Adicionar", gere um QR Code com dados únicos (ex: {passportId}/{cardId}).
•	Crie/atualize o documento na subcoleção cards do passaporte correspondente no Firestore, salvando todos os dados do formulário e as URLs das fotos do Storage.
•	Fluxo do Usuário 'Portaria':
•	Tela Inicial (Portaria):
•	UI: Interface de leitor de QR Code ocupando a maior parte da tela. Botão "Sair".
•	Lógica:
•	Use uma biblioteca JS (ex: html5-qrcode) para escanear o QR Code.
•	Após a leitura, extraia os IDs (passportId, cardId) e busque os dados da carteirinha no Firestore.
•	Chame uma Cloud Function que recebe o asaasCustomerId do passaporte e verifica a situação financeira no Asaas (busca por cobranças com status PENDING ou OVERDUE).
•	Exiba um modal com: Foto, Nome, Nascimento, Parentesco e "Situação Financeira".
•	Mostre os botões "Liberar Acesso" e "Encaminhar à Secretaria".
•	Ao clicar, registre um log em uma coleção access_logs no Firestore com a data, hora, cardId, e a ação tomada.
•	Retorne automaticamente para a tela de leitura.
•	Fluxo do Usuário 'SócioFamiliar':
•	Tela Inicial (SócioFamiliar):
•	UI: Card com 'Número do Passaporte', 'Nome do Responsável', 'Plano'. Botão "Situação Financeira". Botão "Adicionar Carteirinha". Carrossel de cards das carteirinhas. Seção "Situação Financeira" abaixo. Botão "Sair".
•	Lógica:
•	Carrega os dados do passaporte do Firestore (passports/{docId}) onde docId está associado ao UID do usuário logado.
•	Botão "Situação Financeira":
•	Ao carregar a tela, o botão inicia com fundo transparente e uma animação de "buscando".
•	Chama a Cloud Function que verifica as cobranças no Asaas.
•	Com base na resposta, o botão muda de cor e ícone: Verde (OK), Amarelo (1 vencida), Vermelho (>1 vencida ou bloqueado).
•	Ao clicar, rola a página para a seção "Situação Financeira".
•	Seção "Situação Financeira":
•	Populada com os dados retornados pela Cloud Function, divididos em "Vencidas", "A Pagar", "Pagas". Cada item deve mostrar valor, vencimento e um link para o boleto/pagamento (se aplicável).
•	Adicionar Carteirinha: Mesma tela de "Adicionar" do admin, mas sem os botões de tirar foto de documento e com lógica de salvar simplificada (apenas cria a carteirinha no Firestore sem foto).
•	________________________________________
•	4. Firebase Cloud Functions (functions/index.js):
•	Crie funções HTTP acionáveis para as seguintes tarefas, sempre protegendo-as para que só possam ser chamadas por usuários autenticados:
•	manageUser(data, context): Para criar/deletar usuários e definir custom claims. Apenas o 'CEO' pode chamar.
•	handleAsaasCustomer(data, context): Recebe um CPF, busca ou cria o cliente no Asaas e retorna o asaasCustomerId.
•	getFinancialStatus(data, context): Recebe um asaasCustomerId, consulta a API do Asaas e retorna um objeto estruturado com as listas de cobranças vencidas, a pagar e pagas.
•	________________________________________
•	5. Regras de Segurança (firestore.rules):
•	Implemente regras de segurança detalhadas para garantir que:
•	Usuários só possam ler/escrever os dados aos quais têm permissão.
•	Um 'SócioFamiliar' só pode ler e editar seu próprio passaporte e carteirinhas.
•	'Secretaria' e 'CEO' podem ler/escrever em todos os passaportes.
•	'CEO' pode gerenciar a coleção users_roles (se usada para os papéis) e plans.
•	'Portaria' só pode ler dados de carteirinhas e escrever em access_logs.
