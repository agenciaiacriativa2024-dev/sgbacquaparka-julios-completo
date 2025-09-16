const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// Configure a chave da API do Asaas aqui.
// É uma boa prática usar secrets do Firebase: functions.config().asaas.key
const ASAAS_API_KEY = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJmNjUzYjA3LTlhYWItNDM0Ni1iYmNlLTg2ZGNiY2M2Y2E5Nzo6JGFhY2hfOTk0YTVjYjMtM2ZjYy00ZDBhLTkyODYtYTJjZWRiYzZmMzc0";
const ASAAS_API_URL = "https://api.asaas.com/v3";

const asaasApi = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    "access_token": ASAAS_API_KEY,
    "Content-Type": "application/json",
  },
});

// Helper para verificar autenticação e papéis
const assertAuth = (context, requiredRole) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "A função deve ser chamada por um usuário autenticado.",
    );
  }
  if (requiredRole && context.auth.token.role !== requiredRole) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "O usuário não tem permissão para executar esta ação.",
    );
  }
  return context.auth;
};

// 1. Função para gerenciar usuários (Criar/Deletar)
exports.manageUser = functions.https.onCall(async (data, context) => {
  assertAuth(context, "CEO"); // Apenas CEO pode chamar

  const {action, email, role, uid} = data;

  if (action === "create") {
    if (!email || !role) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "Email e role são obrigatórios para criar um usuário.",
      );
    }
    try {
      const userRecord = await admin.auth().createUser({email});
      await admin.auth().setCustomUserClaims(userRecord.uid, {role: role});

      // Salva o usuário na coleção 'users' do Firestore
      await db.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: email,
        role: role,
      });

      // Enviar link de redefinição de senha
      const link = await admin.auth().generatePasswordResetLink(email);
      // Aqui você poderia integrar com um serviço de email para enviar o link.
      // Por simplicidade, retornamos o link para o CEO.
      return {
        success: true,
        message: `Usuário ${email} criado com o papel ${role}.`,
        passwordResetLink: link,
      };
    } catch (error) {
      // Se a criação do usuário falhar, o Firestore não será escrito.
      throw new functions.https.HttpsError("internal", error.message);
    }
  } else if (action === "delete") {
    if (!uid) {
      throw new functions.https.HttpsError(
          "invalid-argument", "UID é obrigatório para deletar um usuário.",
      );
    }
    try {
      // Primeiro deleta do Auth
      await admin.auth().deleteUser(uid);
      // Depois deleta do Firestore
      await db.collection("users").doc(uid).delete();

      return {success: true, message: `Usuário ${uid} deletado.`};
    } catch (error) {
      // Se a exclusão do Auth falhar, a exclusão do Firestore não será tentada.
      // Se a exclusão do Auth for bem-sucedida, mas a do Firestore falhar,
      // teremos um documento órfão no Firestore.
      throw new functions.https.HttpsError("internal", error.message);
    }
  } else {
    throw new functions.https.HttpsError(
        "invalid-argument", "Ação desconhecida. Use 'create' ou 'delete'.",
    );
  }
});

// Função para configurar o primeiro CEO. Deve ser usada apenas uma vez.
exports.setupInitialCEO = functions.https.onCall(async (data, context) => {
  const {email} = data;
  if (!email) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "O email é obrigatório.",
    );
  }

  // 1. Verifica se já existe um CEO
  const listUsersResult = await admin.auth().listUsers(1000);
  const existingCEO = listUsersResult.users.find(
      (user) => user.customClaims && user.customClaims.role === "CEO",
  );

  if (existingCEO) {
    throw new functions.https.HttpsError(
        "already-exists",
        `Um CEO (${existingCEO.email}) já foi configurado. Esta função não pode ser usada novamente.`,
    );
  }

  // 2. Encontra o usuário pelo email
  let userToPromote;
  try {
    userToPromote = await admin.auth().getUserByEmail(email);
  } catch (error) {
    throw new functions.https.HttpsError("not-found", `Usuário com email ${email} não encontrado. Crie o usuário no painel do Firebase primeiro.`);
  }

  // 3. Define a claim 'CEO'
  try {
    await admin.auth().setCustomUserClaims(userToPromote.uid, {role: "CEO"});
    return {
      success: true,
      message: `O usuário ${email} agora é o CEO. Por favor, faça login novamente.`,
    };
  } catch (error) {
    throw new functions.https.HttpsError("internal", "Erro ao definir a permissão de CEO.");
  }
});

// 2. Função para buscar ou criar cliente no Asaas
exports.handleAsaasCustomer = functions.https.onCall(async (data, context) => {
  // Protegido para ser chamado por Secretaria ou CEO
  if (!context.auth || !["CEO", "Secretaria"].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError(
        "permission-denied", "Permissão negada.",
    );
  }

  const {cpf, name, email, phone} = data;
  if (!cpf) {
    throw new functions.https.HttpsError(
        "invalid-argument", "CPF é obrigatório.",
    );
  }

  try {
    // 1. Buscar cliente pelo CPF
    let response = await asaasApi.get(`/customers?cpfCnpj=${cpf}`);
    if (response.data.data.length > 0) {
      return {
        success: true,
        asaasCustomerId: response.data.data[0].id,
        isNew: false,
      };
    }

    // 2. Se não encontrar, criar novo cliente
    response = await asaasApi.post("/customers", {
      name,
      email,
      mobilePhone: phone,
      cpfCnpj: cpf,
    });
    return {
      success: true,
      asaasCustomerId: response.data.id,
      isNew: true,
    };
  } catch (error) {
    throw new functions.https.HttpsError(
        "internal",
        error.response ? error.response.data : error.message,
    );
  }
});

// 3. Função para buscar situação financeira no Asaas
exports.getFinancialStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Não autenticado.");
  }
  const {asaasCustomerId} = data;
  if (!asaasCustomerId) {
    throw new functions.https.HttpsError(
        "invalid-argument", "asaasCustomerId é obrigatório.",
    );
  }

  try {
    const response = await asaasApi.get(
        `/payments?customer=${asaasCustomerId}`,
    );
    const payments = response.data.data;

    const financialStatus = {
      vencidas: payments.filter((p) => p.status === "OVERDUE"),
      aPagar: payments.filter((p) => p.status === "PENDING"),
      pagas: payments.filter((p) => p.status === "CONFIRMED" || p.status === "RECEIVED"),
    };

    return {success: true, status: financialStatus};
  } catch (error) {
    throw new functions.https.HttpsError(
        "internal",
        error.response ? error.response.data : error.message,
    );
  }
});

// 4. Função para gerar um número de passaporte sequencial
exports.generatePassportNumber = functions.https.onCall(async (data, context) => {
  // Protegido para ser chamado por Secretaria ou CEO
  if (!context.auth || !["CEO", "Secretaria"].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError(
        "permission-denied", "Permissão negada.",
    );
  }

  const counterRef = db.collection("counters").doc("passports");

  try {
    let newNumber;
    await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let currentNumber = 0;
      if (counterDoc.exists) {
        currentNumber = counterDoc.data().currentNumber;
      }

      newNumber = currentNumber + 1;

      transaction.set(counterRef, { currentNumber: newNumber }, { merge: true });
    });

    const formattedNumber = String(newNumber).padStart(7, "0");

    return { success: true, passportNumber: formattedNumber };

  } catch (error) {
    console.error("Erro ao gerar número do passaporte:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Não foi possível gerar um novo número de passaporte.",
        error,
    );
  }
});
