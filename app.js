const $ = s => document.querySelector(s);
const tokenKey = "barbearia_customer_token";
const getToken = () => localStorage.getItem(tokenKey);
const menuBtn = $("#menuBtn"), menu = $("#menu");
menuBtn.onclick = () => menu.classList.toggle("open");
document.querySelectorAll("nav a").forEach(a => a.onclick = () => menu.classList.remove("open"));

const services = [
  ["corte","CORTE","Corte clássico ou moderno, tesoura e máquina, finalização completa.","R$ 40,00","30 MIN"],
  ["barba","BARBA","Modelagem, toalha quente e navalha para um acabamento impecável.","R$ 30,00","30 MIN"],
  ["corte-barba","CORTE + BARBA","O combo completo. Corte alinhado e barba desenhada.","R$ 60,00","60 MIN"],
  ["nevou","NEVOU","Descoloração global (platinado). Visual ousado e marcante.","R$ 120,00","90 MIN"],
  ["luzes","LUZES","Mechas e reflexos para dar dimensão e estilo ao cabelo.","R$ 150,00","120 MIN"]
];

$("#serviceList").innerHTML = services.map(s => `<article class="service-card"><div class="service-info"><p class="eyebrow">${s[4]}</p><h3 class="service-title">${s[1]}</h3><p class="service-desc">${s[2]}</p><div class="price">${s[3]}</div></div></article>`).join("");

const booking = $("#bookingApp");
let selected = null;
function renderBooking() {
  booking.innerHTML = `<div class="booking-grid"><h3>ESCOLHA O SERVIÇO</h3>${services.map(s => `<button class="choice ${selected===s[0]?"selected":""}" data-service="${s[0]}"><strong>${s[1]}</strong><small>${s[4]} · ${s[3]}</small></button>`).join("")}<div id="dateStep" style="grid-column:1/-1"></div></div>`;
  document.querySelectorAll("[data-service]").forEach(b => b.onclick = () => {selected=b.dataset.service; renderBooking();});
  if(selected) renderDateStep();
}
function renderDateStep() {
  const logged = !!getToken();
  $("#dateStep").innerHTML = `<div style="margin-top:30px;border-top:1px solid #292929;padding-top:30px"><h3>ESCOLHA A DATA E HORÁRIO</h3>${logged?"":"<p class=\"lead\" style=\"font-size:16px\">Você pode agendar sem conta, mas criar uma conta faz seus agendamentos ficarem salvos na sua área de cliente.</p>"}<div class="booking-form"><input id="date" type="date" required><input id="time" type="time" required>${logged?"":"<input id=\"name\" placeholder=\"Seu nome\" required><input id=\"phone\" placeholder=\"WhatsApp\" required><input id=\"clientEmail\" type=\"email\" placeholder=\"E-mail (opcional)\">"}<button class="button light" id="finish">CONFIRMAR AGENDAMENTO</button><p id="bookError" class="error"></p></div></div>`;
  $("#finish").onclick = async () => {
    const payload = {serviceId:selected,date:$("#date").value,time:$("#time").value};
    if(!payload.date||!payload.time){$("#bookError").textContent="Escolha data e horário.";return;}
    let endpoint="/api/appointments/authenticated", body=payload;
    if(!logged){body={...payload,name:$("#name").value.trim(),phone:$("#phone").value.trim(),email:$("#clientEmail").value.trim()};endpoint="/api/appointments";if(!body.name||!body.phone){$("#bookError").textContent="Preencha nome e WhatsApp.";return;}}
    const headers={"Content-Type":"application/json"}; if(logged) headers.Authorization="Bearer "+getToken();
    const r=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify(body)}); const data=await r.json();
    if(!r.ok){$("#bookError").textContent=data.error||"Não foi possível agendar.";return;}
    const svc=services.find(s=>s[0]===selected);
    booking.innerHTML=`<div class="success"><b>HORÁRIO RESERVADO.</b><br><br>${svc[1]} — ${payload.date.split("-").reverse().join("/")} às ${payload.time}.<br>${logged?"O agendamento foi salvo na sua conta e no painel administrativo.":"O agendamento foi salvo no sistema. Crie uma conta se quiser consultar seus próximos horários depois."}</div>`;
    if(logged) loadAccount();
  };
}
renderBooking();

const accountModal=$("#accountModal"), accountArea=$("#accountArea");
let signupMode=false;
function openAccount(){accountModal.classList.add("open");}
$("#openAccount").onclick=openAccount;
$("#accountBtn").onclick=e=>{e.preventDefault();openAccount();};
$("#closeAccount").onclick=()=>accountModal.classList.remove("open");
$("#toggleSignup").onclick=()=>{signupMode=!signupMode;$("#accountTitle").textContent=signupMode?"CRIAR CONTA":"ENTRAR";$("#signupFields").style.display=signupMode?"block":"none";$("#accountSubmit").textContent=signupMode?"CRIAR CONTA":"ENTRAR";$("#toggleSignup").textContent=signupMode?"JÁ TENHO CONTA":"CRIAR CONTA";$("#accountError").textContent="";};
$("#accountForm").onsubmit=async e=>{e.preventDefault();const body={email:$("#accountEmail").value.trim(),password:$("#accountPassword").value};if(signupMode){body.name=$("#signupName").value.trim();body.phone=$("#signupPhone").value.trim();}const endpoint=signupMode?"/api/auth/signup":"/api/auth/login";const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok){$("#accountError").textContent=d.error;return;}localStorage.setItem(tokenKey,d.token);accountModal.classList.remove("open");signupMode=false;$("#accountForm").reset();$("#signupFields").style.display="none";$("#accountTitle").textContent="ENTRAR";$("#accountSubmit").textContent="ENTRAR";$("#toggleSignup").textContent="CRIAR CONTA";loadAccount();renderBooking();};

async function loadAccount(){
  const token=getToken();
  if(!token){accountArea.innerHTML='<p class="lead">Entre ou crie sua conta para guardar seus agendamentos e vê-los sempre que voltar ao site.</p><button class="button light" id="openAccount">ENTRAR / CRIAR CONTA</button>';$("#openAccount").onclick=openAccount;return;}
  const me=await fetch("/api/auth/me",{headers:{Authorization:"Bearer "+token}});
  if(me.status===401){localStorage.removeItem(tokenKey);return loadAccount();}
  const {user}=await me.json(); const r=await fetch("/api/my/appointments",{headers:{Authorization:"Bearer "+token}}); const appts=await r.json();
  accountArea.innerHTML=`<div class="account-box"><div class="account-head"><div><p class="eyebrow">CLIENTE</p><h3>${user.name}</h3><p>${user.email} · ${user.phone}</p></div><button class="logout-btn" id="customerLogout">SAIR</button></div><h3>MEUS AGENDAMENTOS</h3>${appts.length?appts.map(a=>`<div class="my-appt"><b>${a.date.split("-").reverse().join("/")} às ${a.time}</b><span>${a.service} · R$ ${Number(a.price).toFixed(2).replace(".",",")} · ${a.status}</span></div>`).join(""):"<p class=\"lead\" style=\"font-size:17px\">Você ainda não possui agendamentos.</p>"}</div>`;
  $("#customerLogout").onclick=()=>{localStorage.removeItem(tokenKey);loadAccount();renderBooking();};
}
loadAccount();

const adminModal=$("#adminModal");
document.addEventListener("keydown",e=>{if(e.key==="a"&&e.ctrlKey){e.preventDefault();adminModal.classList.add("open")}});
$("#closeAdmin").onclick=()=>adminModal.classList.remove("open");
$("#loginForm").onsubmit=async e=>{e.preventDefault();const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("#email").value,password:$("#password").value})});const d=await r.json();if(!r.ok){$("#loginError").textContent=d.error;return;}localStorage.setItem("barbearia_admin_token",d.token);location.href="/admin.html";};
