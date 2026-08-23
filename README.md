# Barbearia NT — site independente

## Rodar no PC
1. Instale Node.js.
2. Abra o terminal nesta pasta.
3. Execute `npm install`.
4. Execute `npm start`.
5. Abra `http://localhost:3000`.

## Área administrativa
Atalho no site: pressione **Ctrl + A** para abrir o login.
Por padrão, o login local é:
- E-mail: `admin@barbeariant.com`
- Senha: `123456`

Para produção, defina `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `JWT_SECRET` como variáveis de ambiente.

## O que já funciona
- Visual responsivo inspirado nas telas enviadas.
- Serviços e preços.
- Agendamento de data, horário, nome e WhatsApp.
- Bloqueio de horário já reservado.
- Login administrativo.
- Painel com agendamentos agrupados por dia.
- Status, cancelamento e exclusão.
- Dados persistidos em `data/appointments.json`.

As fotos usadas no protótipo são imagens de demonstração. Para ficar igual à prévia, substitua as URLs no CSS pelas fotos originais da sua barbearia.
