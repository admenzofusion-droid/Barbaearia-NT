// ==============================
// FUNÇÃO $
// ==============================

const $ = s => document.querySelector(s);


// ==============================
// MENU
// ==============================

const menuBtn = $("#menuBtn");
const menu = $("#menu");

menuBtn.onclick = () => {
  menu.classList.toggle("open");
};

document.querySelectorAll("nav a").forEach(a => {
  a.onclick = () => {
    menu.classList.remove("open");
  };
});


// ==============================
// SERVIÇOS
// ==============================

const services = [
  [
    "corte",
    "CORTE",
    "Corte clássico ou moderno, tesoura e máquina, finalização completa.",
    "R$ 40,00",
    "30 MIN"
  ],

  [
    "barba",
    "BARBA",
    "Modelagem, toalha quente e navalha para um acabamento impecável.",
    "R$ 30,00",
    "30 MIN"
  ],

  [
    "corte-barba",
    "CORTE + BARBA",
    "O combo completo. Corte alinhado e barba desenhada.",
    "R$ 60,00",
    "60 MIN"
  ],

  [
    "nevou",
    "NEVOU",
    "Descoloração global (platinado). Visual ousado e marcante.",
    "R$ 120,00",
    "90 MIN"
  ],

  [
    "luzes",
    "LUZES",
    "Mechas e reflexos para dar dimensão e estilo ao cabelo.",
    "R$ 150,00",
    "120 MIN"
  ]
];


$("#serviceList").innerHTML = services.map(s => `

  <article class="service-card">

    <div class="service-info">

      <p class="eyebrow">
        ${s[4]}
      </p>

      <h3 class="service-title">
        ${s[1]}
      </h3>

      <p class="service-desc">
        ${s[2]}
      </p>

      <div class="price">
        ${s[3]}
      </div>

    </div>

  </article>

`).join("");


// ==============================
// AGENDAMENTO
// ==============================

const booking = $("#bookingApp");

let selected = null;


function renderBooking() {

  booking.innerHTML = `

    <div class="booking-grid">

      <h3>
        ESCOLHA O SERVIÇO
      </h3>

      ${services.map(s => `

        <button
          class="choice ${selected === s[0] ? "selected" : ""}"
          data-service="${s[0]}"
        >

          <strong>
            ${s[1]}
          </strong>

          <small>
            ${s[4]} · ${s[3]}
          </small>

        </button>

      `).join("")}

      <div
        id="dateStep"
        style="grid-column:1/-1"
      ></div>

    </div>

  `;


  document
    .querySelectorAll("[data-service]")
    .forEach(b => {

      b.onclick = () => {

        selected = b.dataset.service;

        renderBooking();

      };

    });


  if (selected) {
    renderDateStep();
  }

}


function renderDateStep() {

  $("#dateStep").innerHTML = `

    <div
      style="
        margin-top:30px;
        border-top:1px solid #292929;
        padding-top:30px
      "
    >

      <h3>
        ESCOLHA A DATA E HORÁRIO
      </h3>

      <div class="booking-form">

        <input
          id="date"
          type="date"
          required
        >

        <input
          id="time"
          type="time"
          required
        >

        <input
          id="name"
          placeholder="Seu nome"
          required
        >

        <input
          id="phone"
          placeholder="WhatsApp"
          required
        >

        <input
          id="bookingEmail"
          type="email"
          placeholder="E-mail (opcional)"
        >

        <button
          class="button light"
          id="finish"
        >
          CONFIRMAR AGENDAMENTO
        </button>

        <p
          id="bookError"
          class="error"
        ></p>

      </div>

    </div>

  `;


  $("#finish").onclick = async () => {

    const payload = {

      serviceId: selected,

      date: $("#date").value,

      time: $("#time").value,

      name: $("#name").value.trim(),

      phone: $("#phone").value.trim(),

      email: $("#bookingEmail").value.trim()

    };


    if (
      !payload.date ||
      !payload.time ||
      !payload.name ||
      !payload.phone
    ) {

      $("#bookError").textContent =
        "Preencha data, horário, nome e WhatsApp.";

      return;

    }


    const token =
      localStorage.getItem("clientToken");


    if (!token) {

      $("#bookError").textContent =
        "Faça login ou crie uma conta antes de agendar.";

      return;

    }


    try {

      const r = await fetch(
        "/api/appointments/authenticated",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },

          body: JSON.stringify({
            serviceId: selected,
            date: payload.date,
            time: payload.time
          })
        }
      );


      const data = await r.json();


      if (!r.ok) {

        $("#bookError").textContent =
          data.error ||
          "Não foi possível realizar o agendamento.";

        return;

      }


      const svc =
        services.find(
          s => s[0] === selected
        );


      booking.innerHTML = `

        <div class="success">

          <b>
            HORÁRIO RESERVADO.
          </b>

          <br><br>

          ${svc[1]} —
          ${payload.date
            .split("-")
            .reverse()
            .join("/")}
          às ${payload.time}.

          <br>

          Cliente:
          ${payload.name}.

          <br>

          WhatsApp:
          ${payload.phone}.

          <br><br>

          O agendamento foi salvo
          na sua conta.

        </div>

      `;


    } catch (err) {

      console.error(err);

      $("#bookError").textContent =
        "Erro de conexão com o servidor.";

    }

  };

}


renderBooking();


// ==============================
// LOGIN ADMINISTRADOR
// ==============================

const adminModal =
  $("#adminModal");


document.addEventListener(
  "keydown",
  e => {

    if (
      e.key === "a" &&
      e.ctrlKey
    ) {

      e.preventDefault();

      adminModal.classList.add("open");

    }

  }
);


$("#closeAdmin").onclick = () => {

  adminModal.classList.remove("open");

};


$("#loginForm").onsubmit =
  async e => {

    e.preventDefault();


    const r = await fetch(
      "/api/admin/login",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          email:
            $("#email").value,

          password:
            $("#password").value

        })

      }
    );


    const d =
      await r.json();


    if (!r.ok) {

      $("#loginError").textContent =
        d.error;

      return;

    }


    sessionStorage.setItem(
      "adminToken",
      d.token
    );


    location.href =
      "/admin.html";

  };


// ==============================
// CLIENTE
// ==============================

const clientModal =
  $("#clientModal");

const clientLoginBtn =
  $("#clientLoginBtn");

const closeClient =
  $("#closeClient");

const clientLoginForm =
  $("#clientLoginForm");

const clientRegisterForm =
  $("#clientRegisterForm");

const clientSwitch =
  $("#clientSwitch");

const clientSwitchText =
  $("#clientSwitchText");

const clientTitle =
  $("#clientTitle");

const clientAccount =
  $("#clientAccount");

const clientWelcome =
  $("#clientWelcome");

const myAppointments =
  $("#myAppointments");

const logoutClient =
  $("#logoutClient");

const clientSwitchArea =
  $("#clientSwitchArea");


// ==============================
// ABRIR CONTA
// ==============================

clientLoginBtn.onclick = () => {

  clientModal.classList.add("open");

  checkClientSession();

};


// ==============================
// FECHAR CONTA
// ==============================

closeClient.onclick = () => {

  clientModal.classList.remove("open");

};


clientModal.onclick = e => {

  if (e.target === clientModal) {

    clientModal.classList.remove("open");

  }

};


// ==============================
// TROCAR LOGIN / CADASTRO
// ==============================

clientSwitch.onclick = () => {

  const registering =
    clientRegisterForm.style.display !== "none";


  if (registering) {

    clientRegisterForm.style.display =
      "none";

    clientLoginForm.style.display =
      "block";

    clientTitle.textContent =
      "ENTRAR";

    clientSwitchText.textContent =
      "Ainda não tem conta?";

    clientSwitch.textContent =
      "CRIAR CONTA";

  } else {

    clientLoginForm.style.display =
      "none";

    clientRegisterForm.style.display =
      "block";

    clientTitle.textContent =
      "CRIAR CONTA";

    clientSwitchText.textContent =
      "Já tem uma conta?";

    clientSwitch.textContent =
      "ENTRAR";

  }

};


// ==============================
// LOGIN CLIENTE
// ==============================

clientLoginForm.onsubmit =
  async e => {

    e.preventDefault();


    $("#clientError").textContent =
      "";


    const email =
      $("#clientEmail").value.trim();

    const password =
      $("#clientPassword").value;


    try {

      const r = await fetch(
        "/api/auth/login",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })

        }
      );


      const data =
        await r.json();


      if (!r.ok) {

        $("#clientError").textContent =
          data.error ||
          "Erro ao fazer login.";

        return;

      }


      localStorage.setItem(
        "clientToken",
        data.token
      );


      showClientAccount(
        data.user
      );


    } catch (err) {

      console.error(err);

      $("#clientError").textContent =
        "Erro de conexão com o servidor.";

    }

  };


// ==============================
// CRIAR CONTA
// ==============================

clientRegisterForm.onsubmit =
  async e => {

    e.preventDefault();


    $("#registerError").textContent =
      "";


    const name =
      $("#registerName").value.trim();

    const email =
      $("#registerEmail").value.trim();

    const phone =
      $("#registerPhone").value.trim();

    const password =
      $("#registerPassword").value;


    try {

      const r = await fetch(
        "/api/auth/signup",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            name,
            email,
            phone,
            password

          })

        }
      );


      const data =
        await r.json();


      if (!r.ok) {

        $("#registerError").textContent =
          data.error ||
          "Erro ao criar conta.";

        return;

      }


      localStorage.setItem(
        "clientToken",
        data.token
      );


      showClientAccount(
        data.user
      );


    } catch (err) {

      console.error(err);

      $("#registerError").textContent =
        "Erro de conexão com o servidor.";

    }

  };


// ==============================
// MOSTRAR MINHA CONTA
// ==============================

async function showClientAccount(user) {

  clientTitle.textContent =
    "MINHA CONTA";


  clientLoginForm.style.display =
    "none";

  clientRegisterForm.style.display =
    "none";

  clientSwitchArea.style.display =
    "none";

  clientAccount.style.display =
    "block";


  clientWelcome.textContent =
    `Olá, ${user.name}!`;


  await loadMyAppointments();

}


// ==============================
// CARREGAR AGENDAMENTOS
// ==============================

async function loadMyAppointments() {

  const token =
    localStorage.getItem("clientToken");


  if (!token) {

    myAppointments.innerHTML =
      "<p>Faça login para ver seus agendamentos.</p>";

    return;

  }


  myAppointments.innerHTML =
    "<p>Carregando seus agendamentos...</p>";


  try {

    const r = await fetch(
      "/api/my/appointments",
      {

        headers: {
          "Authorization":
            "Bearer " + token
        }

      }
    );


    const data =
      await r.json();


    if (!r.ok) {

      myAppointments.innerHTML =
        `<p class="error">
          ${data.error || "Erro ao carregar agendamentos."}
        </p>`;

      return;

    }


    if (!data.length) {

      myAppointments.innerHTML =
        "<p>Você ainda não possui agendamentos.</p>";

      return;

    }


    myAppointments.innerHTML =
      data.map(a => `

        <div class="appointment-card">

          <h3>
            ${a.service}
          </h3>

          <p>
            📅 ${formatDate(a.date)}
          </p>

          <p>
            🕐 ${a.time}
          </p>

          <p>
            💰 R$ ${Number(a.price)
              .toFixed(2)
              .replace(".", ",")}
          </p>

          <p>
            Status:
            <strong>
              ${a.status}
            </strong>
          </p>

          ${
            a.status !== "cancelado"
              ? `
                <button
                  class="button ghost cancelAppointment"
                  data-id="${a.id}"
                >
                  CANCELAR AGENDAMENTO
                </button>
              `
              : ""
          }

        </div>

      `).join("");


    document
      .querySelectorAll(".cancelAppointment")
      .forEach(button => {

        button.onclick = () => {

          cancelAppointment(
            button.dataset.id
          );

        };

      });


  } catch (err) {

    console.error(err);

    myAppointments.innerHTML =
      "<p class='error'>Erro de conexão com o servidor.</p>";

  }

}


// ==============================
// FORMATAR DATA
// ==============================

function formatDate(date) {

  if (!date) return "";

  const parts =
    date.split("-");

  if (parts.length !== 3)
    return date;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


// ==============================
// CANCELAR AGENDAMENTO
// ==============================

async function cancelAppointment(id) {

  const confirmar =
    confirm(
      "Deseja realmente cancelar este agendamento?"
    );


  if (!confirmar)
    return;


  const token =
    localStorage.getItem("clientToken");


  try {

    const r = await fetch(
      `/api/my/appointments/${id}`,
      {

        method: "DELETE",

        headers: {
          "Authorization":
            "Bearer " + token
        }

      }
    );


    if (!r.ok) {

      const data =
        await r.json();

      alert(
        data.error ||
        "Não foi possível cancelar."
      );

      return;

    }


    await loadMyAppointments();


  } catch (err) {

    console.error(err);

    alert(
      "Erro de conexão com o servidor."
    );

  }

}


// ==============================
// VERIFICAR LOGIN AO ABRIR
// ==============================

async function checkClientSession() {

  const token =
    localStorage.getItem("clientToken");


  if (!token) {

    clientAccount.style.display =
      "none";

    clientLoginForm.style.display =
      "block";

    clientRegisterForm.style.display =
      "none";

    clientSwitchArea.style.display =
      "block";

    clientTitle.textContent =
      "ENTRAR";

    return;

  }


  try {

    const r = await fetch(
      "/api/auth/me",
      {

        headers: {
          "Authorization":
            "Bearer " + token
        }

      }
    );


    if (!r.ok) {

      localStorage.removeItem(
        "clientToken"
      );

      clientAccount.style.display =
        "none";

      clientLoginForm.style.display =
        "block";

      clientSwitchArea.style.display =
        "block";

      clientTitle.textContent =
        "ENTRAR";

      return;

    }


    const data =
      await r.json();


    showClientAccount(
      data.user
    );


  } catch (err) {

    console.error(err);

  }

}


// ==============================
// SAIR
// ==============================

logoutClient.onclick = () => {

  localStorage.removeItem(
    "clientToken"
  );


  clientAccount.style.display =
    "none";

  clientLoginForm.style.display =
    "block";

  clientRegisterForm.style.display =
    "none";

  clientSwitchArea.style.display =
    "block";

  clientTitle.textContent =
    "ENTRAR";

  $("#clientEmail").value = "";
  $("#clientPassword").value = "";

};
