const pool = require("../config/db");
const axios = require("axios");

const TEL_API = `https://api.telegram.org/bot${process.env.TEL_TOKEN}`;

async function handleGanho(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text.trim();

  const parts = text.split(" ");

  if (parts.length < 3) {
    return axios.post(`${TEL_API}/sendMessage`, {
      chat_id: chatId,
      text: "❌ Use o formato:\n/ganho valor categoria\n\nEx: /ganho 1000 salario",
    });
  }

  const valor = parseFloat(parts[1]);
  const categoria = parts.slice(2).join(" ");

  if (isNaN(valor) || valor <= 0) {
    return axios.post(`${TEL_API}/sendMessage`, {
      chat_id: chatId,
      text: "❌ Informe um valor válido.",
    });
  }

  await pool.query(
    `INSERT INTO transactions (user_id, tipo, valor, categoria) VALUES ($1, $2, $3, $4)`,
    [userId, "GANHO", valor, categoria],
  );

  await axios.post(`${TEL_API}/sendmessage`, {
    chat_id: chatId,
    text: `✅ Ganho registrado:\n\n💵 R$ ${valor.toFixed(2)}\n📂 ${categoria}`,
  });
}

module.exports = handleGanho;
