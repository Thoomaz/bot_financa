const pool = require("../config/db");
const axios = require("axios");

const TEL_API = `https://api.telegram.org/bot${process.env.TEL_TOKEN}`;

async function handleSaldo(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;

  const result = await pool.query(
    `SELECT 
            COALESCE(SUM(CASE WHEN tipo = 'GANHO' THEN valor END), 0) AS total_ganhos,
            COALESCE(SUM(CASE WHEN tipo = 'GASTO' THEN valor END), 0) AS total_gastos
        FROM transactions
        WHERE user_id = $1`,
    [userId],
  );

  const totalGanhos = parseFloat(result.rows[0].total_ganhos);
  const totalGastos = parseFloat(result.rows[0].total_gastos);

  const saldo = totalGanhos - totalGastos;

  await axios.post(`${TEL_API}/sendMessage`, {
    chat_id: chatId,
    text: `💵 Seu saldo atual: R$ ${saldo.toFixed(2)}`,
  });
}

module.exports = handleSaldo;
