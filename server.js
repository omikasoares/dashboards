require('dotenv').config();

const path = require('path');
const express = require('express');
const basicAuth = require('express-basic-auth');

const PORT = process.env.PORT || 3000;

// Cada cliente novo: pasta em clients/<slug>/, uma entrada aqui, e duas env
// vars <ENV_PREFIX>_USER / <ENV_PREFIX>_PASSWORD no Portainer (stack
// environment:, nunca .env na VPS). O path vira o roteamento real - nao
// precisa de PathPrefix/stripprefix no Traefik, o Express já resolve.
const CLIENTS = [
  { slug: 'vista1942', path: '/vista-1942', envPrefix: 'VISTA1942' },
  { slug: 'reforma-tributaria', path: '/reforma-tributaria', envPrefix: 'REFORMATRIBUTARIA' },
  { slug: 'financeiro', path: '/financeiro', envPrefix: 'FINANCEIRO' },
  { slug: 'anclivepa-leads-qualificados', path: '/anclivepa-leads-qualificados', envPrefix: 'ANCLIVEPALEADS' },
  { slug: 'dash-comercial-cplay', path: '/dash-comercial-cplay', envPrefix: 'CPLAYCOMERCIAL', optional: true },
  { slug: 'tarefas-tv', path: '/tarefas-tv', public: true },
];

const app = express();

app.get('/healthz', (req, res) => res.send('ok'));

CLIENTS.forEach((client) => {
  // public: painel de TV, sem login (so contagens por projeto e pessoa, sem dados de contato)
  if (client.public) {
    // TV antiga nao confia no certificado de outros hosts: os dados passam pelo mesmo host da pagina
    if (client.slug === 'tarefas-tv') {
      let cache = { at: 0, body: null };
      app.get(client.path + '/dados', async (req, res) => {
        res.set('Cache-Control', 'no-store').type('application/json');
        try {
          if (!cache.body || Date.now() - cache.at > 60000) {
            const r = await fetch('https://webhook.autz.com.br/webhook/tarefas-tv-dados-k7q2', { signal: AbortSignal.timeout(20000) });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            cache = { at: Date.now(), body: await r.text() };
          }
          res.send(cache.body);
        } catch (e) {
          if (cache.body) return res.send(cache.body);
          res.status(502).send('{"erro":"origem indisponivel"}');
        }
      });
    }
    app.use(client.path, express.static(path.join(__dirname, 'clients', client.slug)));
    return;
  }

  const user = process.env[`${client.envPrefix}_USER`];
  const password = process.env[`${client.envPrefix}_PASSWORD`];

  if (!user || !password) {
    // optional: cliente novo ainda sem env vars no Portainer nao derruba os demais
    if (client.optional) {
      console.warn(`Pulando ${client.slug}: defina ${client.envPrefix}_USER e ${client.envPrefix}_PASSWORD no stack.`);
      return;
    }
    throw new Error(`Defina ${client.envPrefix}_USER e ${client.envPrefix}_PASSWORD (.env) para o cliente ${client.slug}.`);
  }

  app.use(
    client.path,
    basicAuth({
      users: { [user]: password },
      challenge: true,
      realm: client.slug,
    }),
    express.static(path.join(__dirname, 'clients', client.slug))
  );
});

app.listen(PORT, () => {
  console.log(`Dashboards rodando em http://localhost:${PORT}`);
  CLIENTS.forEach((c) => console.log(` - ${c.slug}: ${c.path}`));
});
