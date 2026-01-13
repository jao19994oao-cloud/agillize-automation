# Segurança e gerenciamento de segredos (resumo)

Este arquivo descreve recomendações para tratar segredos (variáveis de ambiente) antes de subir o sistema para produção.

- Nunca comite o arquivo `.env` no repositório. Use `.env.example` para documentar as variáveis necessárias.
- Em produção, não use arquivos de texto com segredos no repositório. Utilize: Secrets Manager (AWS Secrets Manager, Azure Key Vault), HashiCorp Vault, ou variáveis de ambiente do provedor (Heroku / Vercel / Azure App Service / Docker Swarm / Kubernetes Secrets).
- Rotacione credenciais regularmente e limite permissões (principle of least privilege).
- Não exponha `JWT_SECRET` no código. Ele deve ser fornecido via ambiente seguro e rotacionado quando necessário.

Passos práticos

1. Local (desenvolvimento)
   - Use o arquivo `.env` localmente apenas para conveniência.
   - Adicione `.env` ao `.gitignore` do `backend/`:

```
# backend/.gitignore (adicionar)
.env
```

2. Em produção / CI
   - Configure as variáveis de ambiente no painel do provedor (ex: GitHub Actions secrets, Azure Key Vault, AWS Parameter Store/Secrets Manager, Heroku Config Vars).
   - Para containers, prefira Docker Secrets ou Kubernetes Secrets.

3. Gerar `JWT_SECRET` seguro

Linux / macOS / WSL / Git Bash:
```
openssl rand -hex 32
```

PowerShell:
```
[System.BitConverter]::ToString((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32)).Replace('-','').ToLower()
```

4. Rotina de deploy
   - Nunca injetar `.env` do repositório em produção.
   - Use CI para injetar secrets ao build/deploy.
   - Teste rota de leitura de configuração localmente antes do deploy (ex.: `node server.js` com variáveis em ambiente).

Por que isso importa

- Arquivos `.env` podem vazar (forks, backups, prints, commits acidentais).
- Segredos no repositório quebram o princípio do menor privilégio e dificultam rotação.
- Serviços de gerenciamento de segredos oferecem controle de acesso, logs e rotação automática.

Próximo sugerido

- Posso adicionar `backend/.gitignore` contendo `.env` e, se o `.env` estiver versionado, removê-lo do histórico do Git (ou instruir como fazer). Deseja que eu aplique isso agora?

---

## Verificação de ambiente e CI (GitHub Actions) ✅

Adicionei um script de verificação em `backend/scripts/check_env.js` e um `npm` script `check-env` no `backend/package.json`.

- Para verificar localmente, defina as variáveis necessárias e rode:

```powershell
# PowerShell
$env:JWT_SECRET = 'seu_jwt_secret_aqui'
$env:DB_USER = 'postgres'
$env:DB_PASSWORD = 'sua_senha'
$env:DB_HOST = 'localhost'
$env:DB_NAME = 'agillize_palm'
npm --prefix backend run check-env
```

- Workflow de exemplo: `.github/workflows/backend-check-env.yml` (usa `secrets` do GitHub para prover as variáveis em CI).

## Localização dos arquivos importantes

- `backend/.env.example` — arquivo de exemplo com chaves que devem existir (sem valores).
- `backend/.gitignore` — já configura para ignorar `.env`.
- `backend/scripts/check_env.js` — script que valida variáveis necessárias.
- `.github/workflows/backend-check-env.yml` — workflow de exemplo que usa `JWT_SECRET` e variáveis do DB via `secrets`.

Recomendo adicionar os secrets no GitHub (Settings → Secrets → Actions): `JWT_SECRET`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME`, `DB_PORT`.

