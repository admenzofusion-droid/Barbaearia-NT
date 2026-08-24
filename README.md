# Barbearia NT — versão Render + PostgreSQL

Esta versão usa PostgreSQL para guardar permanentemente contas, clientes e agendamentos.

## Render
1. Crie um PostgreSQL no Render.
2. Use a mesma região do Web Service.
3. No Web Service, abra Environment.
4. Crie:
   DATABASE_URL = Internal Database URL do seu Postgres
   JWT_SECRET = uma chave longa e secreta
   ADMIN_EMAIL = seu e-mail
   ADMIN_PASSWORD = sua senha
5. Build Command: npm install
6. Start Command: npm start
7. Faça o deploy.

Na primeira inicialização o servidor cria as tabelas e a conta de administrador.

## Teste
Abra:
https://SEU-SITE.onrender.com/api/health

Deve retornar:
{"ok":true,"database":"connected"}

## Cliente
Cria uma conta, faz login e agenda. O token da conta fica no navegador e os dados ficam no PostgreSQL. Fechar o site ou reiniciar o Web Service não apaga os dados.

## Admin
Ctrl+A na página inicial abre o login administrativo. O painel lê os dados diretamente do PostgreSQL.

IMPORTANTE: nunca publique DATABASE_URL, JWT_SECRET ou senhas no GitHub.
