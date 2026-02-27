const pool = require("../config/db");
const axios = require("axios");

const TEL_API = `https://api.telegram.org/bot${process.env.TEL_TOKEN}`;

async function handleResumo(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text.trim();

  const parts = text.split(" ");

  let dataReferencia;

  if (parts.length === 1) {
    dataReferencia = new Date();
  } else {
    const input = parts[1];

    const regex = /^\d{4}-\d{2}$/;

    if (!regex.test(input)) {
      return axios.post(`${TEL_API}/sendMessage`, {
        chat_id: chatId,
        text: "Use o formato:\n/resumo 2025-02",
      });
    }

    dataReferencia = new Date(`${input}-01`);
  }

  const result = await pool.query(
    `SELECT
            COALESCE(SUM(CASE WHEN tipo = 'GANHO' THEN valor END), 0) AS total_ganhos,
            COALESCE(SUM(CASE WHEN tipo = 'GASTO' THEN valor END), 0) AS total_gastos
        FROM transactions
        WHERE user_id = $1
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', $2::date)`,
    [userId, dataReferencia],
  );

  const totalGanhos = parseFloat(result.rows[0].total_ganhos);
  const totalGastos = parseFloat(result.rows[0].total_gastos);
  const saldo = totalGanhos - totalGastos;

  await axios.post(`${TEL_API}/sendMessage`, {
    chat_id: chatId,
    text: `📊 Resumo de ${dataReferencia.toISOString().slice(0, 7)}:\n\n📈 Ganhos: R$ ${totalGanhos.toFixed(2)}\n📉 Gastos: R$ ${totalGastos.toFixed(2)}\n━━━━━━━━━━━━━━\n\n💵 Saldo do mês: R$ ${saldo.toFixed(2)}`,
  });
}

module.exports = handleResumo;
