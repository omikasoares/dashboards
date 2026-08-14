# Dashboards

Monorepo com os dashboards internos da Autz para clientes. Um servidor Express só, cada cliente atrás do seu próprio Basic Auth, servidos a partir de `dash.autz.com.br/<cliente>`.

## Adicionando um cliente novo

1. Crie `clients/<slug>/` com o `index.html` (e assets) do dashboard.
2. Adicione uma entrada em `CLIENTS` no `server.js`: `{ slug, path: '/<slug>', envPrefix: 'PREFIXO' }`.
3. Adicione `PREFIXO_USER` / `PREFIXO_PASSWORD` no `.env.example` e no `environment:` do `stack.yml`.
4. Cole o `stack.yml` atualizado de novo no Portainer (Stacks → dashboards → Editor → Update).
5. `git push` — nenhuma chave SSH ou Deploy Key nova é necessária, só pra este repo mesmo.

Não precisa mexer no Traefik: como todos os clientes ficam atrás do mesmo `Host(dash.autz.com.br)`, o roteamento por path é resolvido pelo próprio Express (`app.use(client.path, ...)`), não por labels novas.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha as credenciais de cada cliente
npm run dev
```

## Deploy

GitHub Actions → SSH → `deploy.sh` na VPS (Debian 11, Docker Swarm, Traefik). Ver `stack.yml` para a stack completa a colar no Portainer.
