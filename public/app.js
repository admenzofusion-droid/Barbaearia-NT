const $ = s => document.querySelector(s);
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

$("#serviceList").innerHTML = services.map(s => `
  <article class="service-card">
    <div class="service-info">
      <p class="eyebrow">${s[4]}</p>
      <h3 class="service-title">${s[1]}</h3>
      <p class="service-desc">${s[2]}</p>
      <div class="price">${s[3]}</div>
    </div>
  </article>`).join("");

const booking = $("#bookingApp");
let selected = null;

function renderBooking() {
  booking.innerHTML = `
    <div class="booking-grid">
      <h3>ESCOLHA O SERVIÇO</h3>
      ${services.map(s => `<button class="choice ${selected===s[0]?"selected":""}" data-service="${s[0]}"><strong>${s[1]}</strong><small>${s[4]} · ${s[3]}</small></button>`).join("")}
      <div id="dateStep" style="grid-column:1/-1"></div>
    </div>`;
  document.querySelectorAll("[data-service]").forEach(b => b.onclick = () => {selected=b.dataset.service; renderBooking();});
  if(selected) renderDateStep();
}
function renderDateStep() {
  $("#dateStep").innerHTML = `
    <div style="margin-top:30px;border-top:1px solid #292929;padding-top:30px">
      <h3>ESCOLHA A DATA E HORÁRIO</h3>
      <div class="booking-form">
        <input id="date" type="date" required>
        <input id="time" type="time" required>
        <input id="name" placeholder="Seu nome" required>
        <input id="phone" placeholder="WhatsApp" required>
        <input id="clientEmail" type="email" placeholder="E-mail (opcional)">
        <button class="button light" id="finish">CONFIRMAR AGENDAMENTO</button>
        <p id="bookError" class="error"></p>
      </div>
    </div>`;
  $("#finish").onclick = async () => {
    const payload = {serviceId:selected,date:$("#date").value,time:$("#time").value,name:$("#name").value.trim(),phone:$("#phone").value.trim(),email:$("#clientEmail").value.trim()};
    if(!payload.date||!payload.time||!payload.name||!payload.phone){$("#bookError").textContent="Preencha data, horário, nome e WhatsApp.";return;}
    const token = localStorage.getItem("clientToken");

if (!token) {
  $("#bookError").textContent = "Faça login ou crie uma conta antes de agendar.";
  return;
}

const r = await fetch("/api/appointments/authenticated", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  },
  body: JSON.stringify({
    serviceId: selected,
    date: $("#date").value,
    time: $("#time").value
  })
});
    const data = await r.json();
    if(!r.ok){$("#bookError").textContent=data.error;return;}
    const svc = services.find(s=>s[0]===selected);
    booking.innerHTML=`<div class="success"><b>HORÁRIO RESERVADO.</b><br><br>${svc[1]} — ${payload.date.split("-").reverse().join("/")} às ${payload.time}.<br>Cliente: ${payload.name}.<br>WhatsApp: ${payload.phone}.<br><br>O agendamento já aparece na área administrativa.</div>`;
  };
}
renderBooking();

const adminModal=$("#adminModal");
document.addEventListener("keydown",e=>{if(e.key==="a"&&e.ctrlKey){e.preventDefault();adminModal.classList.add("open")}});
$("#closeAdmin").onclick=()=>adminModal.classList.remove("open");

$("#loginForm").onsubmit=async e=>{
  e.preventDefault();
  const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("#email").value,password:$("#password").value})});
  const d=await r.json();
  if(!r.ok){$("#loginError").textContent=d.error;return;}
  sessionStorage.setItem("adminToken",d.token);
  location.href="/admin.html";
  // ==============================
// LOGIN E CADASTRO DO CLIENTE
// ==============================

const clientModal = $("#clientModal");
const clientLoginBtn = $("#clientLoginBtn");
const closeClient = $("#closeClient");

const clientLoginForm = $("#clientLoginForm");
const clientRegisterForm = $("#clientRegisterForm");

const clientSwitch = $("#clientSwitch");
const clientSwitchText = $("#clientSwitchText");
const clientTitle = $("#clientTitle");

clientLoginBtn.onclick = e => {
  e.preventDefault();
  clientModal.classList.add("open");
};

closeClient.onclick = () => {
  clientModal.classList.remove("open");
};

clientModal.onclick = e => {
  if (e.target === clientModal) {
    clientModal.classList.remove("open");
  }
};

// Alternar entre LOGIN e CADASTRO
clientSwitch.onclick = () => {
  const registering = clientRegisterForm.style.display !== "none";

  if (registering) {
    clientRegisterForm.style.display = "none";
    clientLoginForm.style.display = "block";

    clientTitle.textContent = "ENTRAR";
    clientSwitchText.textContent = "Ainda não tem conta?";
    clientSwitch.textContent = "CRIAR CONTA";
  } else {
    clientLoginForm.style.display = "none";
    clientRegisterForm.style.display = "block";

    clientTitle.textContent = "CRIAR CONTA";
    clientSwitchText.textContent = "Já tem uma conta?";
    clientSwitch.textContent = "ENTRAR";
  }
};

// LOGIN DO CLIENTE
clientLoginForm.onsubmit = async e => {
  e.preventDefault();

  $("#clientError").textContent = "";

  const email = $("#clientEmail").value.trim();
  const password = $("#clientPassword").value;

  try {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await r.json();

    if (!r.ok) {
      $("#clientError").textContent = data.error || "Erro ao fazer login.";
      return;
    }

    localStorage.setItem("clientToken", data.token);

    clientModal.classList.remove("open");

    alert("Login realizado com sucesso!");

  } catch (err) {
    console.error(err);
    $("#clientError").textContent = "Erro de conexão com o servidor.";
  }
};

// CRIAR CONTA
clientRegisterForm.onsubmit = async e => {
  e.preventDefault();

  $("#registerError").textContent = "";

  const name = $("#registerName").value.trim();
  const email = $("#registerEmail").value.trim();
  const phone = $("#registerPhone").value.trim();
  const password = $("#registerPassword").value;

  try {
    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        password
      })
    });

    const data = await r.json();

    if (!r.ok) {
      $("#registerError").textContent = data.error || "Erro ao criar conta.";
      return;
    }

    localStorage.setItem("clientToken", data.token);

    clientModal.classList.remove("open");

    alert("Conta criada com sucesso!");

  } catch (err) {
    console.error(err);
    $("#registerError").textContent = "Erro de conexão com o servidor.";
  }
};
