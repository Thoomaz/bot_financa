const { text } = require('body-parser');
const pool = require('../config/db');
const axios = require('axios');

const TEL_API = `https://api.telegram.org/bot${process.env.TEL_TOKEN}`;

async function handleTopCategorias(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;

  const result = await pool.query(
    `SELECT
            categoria,
            COUNT(*) AS quantidade,
            SUM(valor) AS total
        FROM transactions
        WHERE user_id = $1
        AND tipo = 'GASTO'
        GROUP BY categoria
        ORDER BY quantidade DESC
        LIMIT 5`,
    [userId],
  );

  if (result.rows.length === 0) {
    return axios.post(`${TEL_API}/sendMessage`, {
      chat_id: chatId,
      text: 'Você ainda não possui gastos cadastrados.',
    });
  }

  let resposta = '🏆 Categorias mais usadas:\n\n';

  result.rows.forEach((row, index) => {

    const quantidade = parseInt(row.quantidade);
    const vezesTexto = quantidade === 1 ? 'vez' : 'vezes';

    resposta += `${index + 1}️⃣ ${row.categoria} — ${quantidade} ${vezesTexto} (R$ ${parseFloat(row.total).toFixed(2)})\n`;
  });

  await axios.post(`${TEL_API}/sendMessage`, {
    chat_id: chatId,
    text: resposta,
  });
}

module.exports = handleTopCategorias;
