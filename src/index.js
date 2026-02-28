require('dotenv').config();
const pool = require('./config/db');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const handleGanho = require('./commands/ganho');
const handleGasto = require('./commands/gasto');
const handleSaldo = require('./commands/saldo');
const handleResumo = require('./commands/resumo');
const handleTopCategorias = require('./commands/topCategorias');

const app = express();
app.use(bodyParser.json());

const { TEL_TOKEN, BASE_URL } = process.env;

const TEL_API = `https://api.telegram.org/bot${TEL_TOKEN}`;

const WEBHOOK_END = '/webhook/' + TEL_TOKEN;
const WEBHOOK_URL = `${BASE_URL}${WEBHOOK_END}`;

const setWebhookUrl = async () => {
  await axios.get(`${TEL_API}/setWebhook?url=${WEBHOOK_URL}`);
};

app.post(WEBHOOK_END, async (req, res) => {
  try {
    const update = req.body;
    console.log('Update recebido:', JSON.stringify(update));

    const message = update.message;
    if (!message || !message.text) {
      return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text.trim();

    if (text === '/start') {
      await axios.post(`${TEL_API}/sendMessage`, {
        chat_id: chatId,
        text: `💰 Bem-vindo ao Bot Financeiro!\n\nAqui você pode registrar seus ganhos e gastos e acompanhar sua vida financeira de forma simples 📊\n\n📈 REGISTRAR GANHOS\n👉 /ganho valor categoria\n\nExemplo: /ganho 1000 salario\n\n📉 REGISTRAR GASTOS\n👉 /gasto valor categoria\n\nExemplo: /gasto 50 lanche\n\n💵 VER SALDO TOTAL\n👉 /saldo\n\n📅 RESUMO MENSAL\n• Mês atual:\n👉 /resumo\n\n• Mês específico:\n👉 /resumo ano-mês\n\nExemplo: /resumo 2026-01\n\n🏆 CATEGORIAS MAIS USADAS\nVeja as categorias em que você mais gasta:\n👉 /topcategorias\n━━━━━━━━━━━━━━━━━━━━━━\n💡 Dica: Use categorias simples como:\nmercado, aluguel, transporte, lazer, salario`,
      });
    } else if (text.startsWith('/ganho')) {
      await handleGanho(message);
    } else if (text.startsWith('/gasto')) {
      await handleGasto(message);
    } else if (text === '/saldo') {
      await handleSaldo(message);
    } else if (text.startsWith('/resumo')) {
      await handleResumo(message);
    } else if (text === '/topcategorias') {
      await handleTopCategorias(message);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error.message);
    res.sendStatus(200);
  }
});

app.listen(process.env.PORT || 8080, async () => {
  console.log('app running on port', process.env.PORT || 8080);
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Banco conectado: ', result.rows[0]);
  } catch (err) {
    console.error('Erro ao conectar banco: ', err);
  }

  setWebhookUrl();
});
