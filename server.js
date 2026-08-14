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
];

const app = express();

app.get('/healthz', (req, res) => res.send('ok'));

CLIENTS.forEach((client) => {
  const user = process.env[`${client.envPrefix}_USER`];
  const password = process.env[`${client.envPrefix}_PASSWORD`];

  if (!user || !password) {
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
