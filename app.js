(() => {
  "use strict";

  const treatments = [
    { id: "consulta", category: "Salud Preventiva", icon: "✚", name: "Consulta odontológica", description: "Evaluación completa de tu salud bucal.", price: 50 },
    { id: "limpieza", category: "Salud Preventiva", icon: "✚", name: "Limpieza dental", description: "Profilaxis y eliminación de placa bacteriana.", price: 120 },
    { id: "fluor", category: "Salud Preventiva", icon: "✚", name: "Aplicación de flúor", description: "Protección adicional para fortalecer tus dientes.", price: 70 },
    { id: "brackets-metalicos", category: "Ortodoncia", icon: "⌁", name: "Brackets metálicos", description: "Tratamiento de ortodoncia convencional.", price: 1800 },
    { id: "brackets-esteticos", category: "Ortodoncia", icon: "⌁", name: "Brackets estéticos", description: "Ortodoncia con brackets de apariencia discreta.", price: 2800 },
    { id: "blanqueamiento", category: "Estética Dental", icon: "✧", name: "Blanqueamiento dental", description: "Aclara el tono de tus dientes de forma segura.", price: 450 },
    { id: "carilla", category: "Estética Dental", icon: "✧", name: "Carilla dental", description: "Mejora la forma y el color de tu sonrisa.", price: 600 },
    { id: "endodoncia", category: "Endodoncia", icon: "⌖", name: "Endodoncia", description: "Tratamiento de conducto para conservar tu pieza dental.", price: 500 },
    { id: "reconstruccion", category: "Endodoncia", icon: "⌖", name: "Reconstrucción dental", description: "Restauración funcional de una pieza dental.", price: 250 }
  ];
  const categories = ["Ortodoncia", "Estética Dental", "Salud Preventiva", "Endodoncia"];
  const currency = amount => `S/ ${Number(amount).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const readArray = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(`No se pudo leer ${key} desde el almacenamiento local.`, error);
      return [];
    }
  };
  let selected = new Set(readArray("odonto-selected"));
  let paymentType = sessionStorage.getItem("odonto-payment") || "";
  let installmentTerm = 6;
  let toastTimer;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const selectedTreatments = () => treatments.filter(item => selected.has(item.id));
  const subtotal = () => selectedTreatments().reduce((sum, item) => sum + item.price, 0);

  function saveSelection() {
    localStorage.setItem("odonto-selected", JSON.stringify([...selected]));
  }

  function buildCatalog() {
    const root = $("#treatment-groups");
    root.innerHTML = categories.map(category => {
      const list = treatments.filter(item => item.category === category);
      return `<section class="treatment-category" aria-labelledby="category-${list[0].id}"><div class="category-heading"><span class="category-icon" aria-hidden="true">${list[0].icon}</span><h3 id="category-${list[0].id}">${category}</h3><span>${list.length} servicios</span></div><div class="treatment-list">${list.map(item => `<label class="treatment-card${selected.has(item.id) ? " selected" : ""}" for="treatment-${item.id}"><input class="treatment-check" id="treatment-${item.id}" type="checkbox" value="${item.id}"${selected.has(item.id) ? " checked" : ""} aria-label="Seleccionar ${item.name}"><span class="treatment-copy"><strong>${item.name}</strong><small>${item.description}</small></span><span class="treatment-price">${currency(item.price)}<small> / desde</small></span></label>`).join("")}</div></section>`;
    }).join("");
    root.addEventListener("change", event => {
      const input = event.target.closest(".treatment-check");
      if (!input) return;
      if (input.checked) selected.add(input.value);
      else selected.delete(input.value);
      input.closest(".treatment-card").classList.toggle("selected", input.checked);
      saveSelection();
      renderQuote();
    });

    $('input[name="date"]').addEventListener("change", event => {
      const date = event.currentTarget;
      const selectedDate = date.value ? new Date(`${date.value}T12:00:00`) : null;
      const isSunday = selectedDate && selectedDate.getDay() === 0;
      date.setCustomValidity(isSunday ? "La clínica atiende de lunes a sábado." : "");
      date.closest(".field").classList.toggle("invalid", Boolean(isSunday));
    });
  }

  function renderQuote() {
    const items = selectedTreatments();
    const total = subtotal();
    $("#item-count").textContent = String(items.length);
    $("#quote-empty").hidden = items.length > 0;
    $("#quote-items").innerHTML = items.map(item => `<li><span>${item.name}</span><strong>${currency(item.price)}</strong></li>`).join("");
    $("#subtotal").textContent = currency(total);
    $("#quote-total").textContent = currency(total);
    $("#simulate-button").disabled = items.length === 0;
    renderPayment();
  }

  function renderPayment() {
    const items = selectedTreatments();
    const total = subtotal();
    $("#cash-original").textContent = currency(total);
    $("#cash-total").textContent = currency(total * 0.9);
    $("#cash-saving").textContent = currency(total * 0.1);
    $("#monthly-total").textContent = currency(total / installmentTerm);
    $("#installment-total").textContent = currency(total);
    $("#installment-description").textContent = `${installmentTerm} cuotas mensuales referenciales`;
    $("#sim-treatment-count").textContent = `${items.length} ${items.length === 1 ? "tratamiento seleccionado" : "tratamientos seleccionados"}`;
    $("#sim-treatment-list").textContent = items.map(item => item.name).join(" · ");
    $("#sim-subtotal").textContent = currency(total);
    $("#reserve-items").innerHTML = items.map(item => `<li><span>${item.name}</span><strong>${currency(item.price)}</strong></li>`).join("");
    const cash = paymentType === "contado";
    $("#reserve-payment-label").textContent = cash ? "Pago al contado · 10% de descuento" : paymentType === "cuotas" ? `Financiamiento · ${installmentTerm} cuotas` : "Selecciona tu forma de pago";
    $("#reserve-total").textContent = currency(cash ? total * 0.9 : total);
    $("#reserve-payment-detail").textContent = cash ? `Ahorras ${currency(total * 0.1)}` : paymentType === "cuotas" ? `${installmentTerm} cuotas de ${currency(total / installmentTerm)}` : "Total referencial";
  }

  const publicViews = new Set(["inicio", "catalogo", "como-funciona", "sedes"]);

  function showView(name, updateHistory = true) {
    if (name === "simulador" && !selected.size) {
      notify("Selecciona al menos un tratamiento para continuar.", true);
      return;
    }
    if (name === "reserva" && !selected.size) {
      notify("Selecciona al menos un tratamiento para continuar.", true);
      showView("catalogo");
      return;
    }
    if (name === "reserva" && !paymentType) {
      notify("Elige una forma de pago antes de reservar.", true);
      showView("simulador");
      return;
    }
    $$(".view").forEach(view => {
      const active = view.id === `view-${name}`;
      view.classList.toggle("active", active);
      view.hidden = !active;
    });
    if (publicViews.has(name)) {
      $$(".nav-link[data-public-link]").forEach(link => {
        link.classList.toggle("active", link.dataset.publicLink === name);
      });
      const route = `#${name}`;
      if (updateHistory && window.location.hash !== route) {
        window.history.pushState(null, "", route);
      }
    }
    const admin = name === "admin";
    $("#public-header").hidden = admin;
    $("#public-footer").hidden = admin;
    if (name === "reserva") {
      const date = $('input[name="date"]');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date.min = localDateString(tomorrow);
      renderPayment();
    }
    if (admin) renderAdmin();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function notify(message, isError = false) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function getAppointments() {
    return readArray("odonto-appointments");
  }

  function renderAdmin() {
    const appointments = getAppointments().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pending = appointments.filter(item => item.status === "Pendiente").length;
    const confirmed = appointments.filter(item => item.status === "Confirmado").length;
    $("#stat-total").textContent = String(appointments.length);
    $("#stat-pending").textContent = String(pending);
    $("#stat-confirmed").textContent = String(confirmed);
    $("#stat-amount").textContent = currency(appointments.reduce((sum, item) => sum + item.total, 0));
    $("#recent-appointments").innerHTML = appointments.slice(0, 5).map(item => `<tr><td>#${escapeHtml(item.id)}</td><td><span class="patient-name">${escapeHtml(item.name)}</span><span class="patient-sub">${escapeHtml(item.phone)}</span></td><td>${escapeHtml(item.items.map(entry => entry.name).join(", "))}</td><td>${escapeHtml(item.branch.replace("Sede ", ""))}</td><td>${currency(item.total)}</td><td><span class="status-badge status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td></tr>`).join("");
    $("#recent-empty").hidden = appointments.length > 0;
    const query = ($("#appointment-search")?.value || "").trim().toLowerCase();
    const filter = $("#status-filter")?.value || "";
    const filtered = appointments.filter(item => (!query || `${item.name} ${item.dni}`.toLowerCase().includes(query)) && (!filter || item.status === filter));
    $("#appointments-table").innerHTML = filtered.map(item => `<tr><td>#${escapeHtml(item.id)}</td><td><span class="patient-name">${escapeHtml(item.name)}</span><span class="patient-sub">${escapeHtml(item.date)} · ${escapeHtml(item.time)}</span></td><td>${escapeHtml(item.dni)}</td><td>${escapeHtml(item.phone)}</td><td>${escapeHtml(item.branch.replace("Sede ", ""))}</td><td>${currency(item.total)}</td><td><span class="status-badge status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td><td><select class="action-select" data-status-id="${escapeHtml(item.id)}" aria-label="Cambiar estado de la cita ${escapeHtml(item.id)}"><option${item.status === "Pendiente" ? " selected" : ""}>Pendiente</option><option${item.status === "Confirmado" ? " selected" : ""}>Confirmado</option><option${item.status === "Atendido" ? " selected" : ""}>Atendido</option><option${item.status === "Cancelado" ? " selected" : ""}>Cancelado</option></select></td></tr>`).join("");
    $("#appointments-empty").hidden = filtered.length > 0;
    $("#tariff-table").innerHTML = treatments.map(item => `<tr><td><span class="patient-name">${escapeHtml(item.name)}</span></td><td>${escapeHtml(item.category)}</td><td class="tariff-description">${escapeHtml(item.description)}</td><td><strong>${currency(item.price)}</strong></td></tr>`).join("");
    $("#history-table").innerHTML = appointments.map(item => `<tr><td>#${escapeHtml(item.id)}</td><td>${new Date(item.createdAt).toLocaleDateString("es-PE")}</td><td><span class="patient-name">${escapeHtml(item.name)}</span><span class="patient-sub">DNI ${escapeHtml(item.dni)}</span></td><td>${escapeHtml(item.items.map(entry => entry.name).join(", "))}</td><td class="history-payment">${escapeHtml(item.paymentLabel)}</td><td><strong>${currency(item.total)}</strong></td></tr>`).join("");
    $("#history-empty").hidden = appointments.length > 0;
  }

  function activateAdminTab(tab) {
    const validTabs = ["inicio", "citas", "tarifario", "historial"];
    if (!validTabs.includes(tab)) return;
    validTabs.forEach(name => {
      const section = $(`#admin-tab-${name}`);
      section.hidden = name !== tab;
      const nav = $(`[data-admin-tab="${name}"].admin-nav-item`);
      if (nav) nav.classList.toggle("active", name === tab);
    });
    const labels = { inicio: "Inicio", citas: "Gestión de citas", tarifario: "Tarifario de tratamientos", historial: "Historial de cotizaciones" };
    $("#admin-page-title").textContent = labels[tab];
    $("#admin-sidebar").classList.remove("menu-open");
    $("#mobile-menu-toggle").setAttribute("aria-expanded", "false");
    renderAdmin();
  }

  buildCatalog();
  renderQuote();
  $("#admin-date").textContent = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("#simulate-button").addEventListener("click", () => showView("simulador"));

  document.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      event.preventDefault();
      showView(viewButton.dataset.view);
      return;
    }
    const tabButton = event.target.closest("[data-admin-tab]");
    if (tabButton && $("#view-admin").classList.contains("active")) {
      event.preventDefault();
      activateAdminTab(tabButton.dataset.adminTab);
      return;
    }
    const scrollLink = event.target.closest("[data-scroll]");
    if (scrollLink) {
      event.preventDefault();
      document.getElementById(scrollLink.dataset.scroll).scrollIntoView({ behavior: "smooth" });
    }
    const choosePayment = event.target.closest(".choose-payment");
    if (choosePayment) {
      paymentType = choosePayment.dataset.payment;
      sessionStorage.setItem("odonto-payment", paymentType);
      showView("reserva");
    }
  });

  $$(".term-selector button").forEach(button => button.addEventListener("click", () => {
    installmentTerm = Number(button.dataset.term);
    $$(".term-selector button").forEach(termButton => termButton.setAttribute("aria-pressed", String(termButton === button)));
    renderPayment();
  }));

  $("#reservation-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const invalidField = [...form.querySelectorAll("input, select")].find(field => !field.checkValidity());
    $$(".field").forEach(field => field.classList.remove("invalid"));
    if (invalidField) {
      invalidField.closest(".field")?.classList.add("invalid");
      invalidField.reportValidity();
      invalidField.focus();
      return;
    }
    const data = new FormData(form);
    const items = selectedTreatments();
    const baseTotal = subtotal();
    const total = paymentType === "contado" ? baseTotal * 0.9 : baseTotal;
    const appointment = {
      id: String(Date.now()).slice(-7),
      name: String(data.get("name")).trim(),
      dni: String(data.get("dni")),
      phone: String(data.get("phone")).trim(),
      branch: String(data.get("branch")),
      date: String(data.get("date")),
      time: String(data.get("time")),
      items,
      paymentType,
      paymentLabel: paymentType === "contado" ? "Contado · 10% desc." : `${installmentTerm} cuotas`,
      total,
      status: "Pendiente",
      createdAt: new Date().toISOString()
    };
    const appointments = getAppointments();
    appointments.push(appointment);
    localStorage.setItem("odonto-appointments", JSON.stringify(appointments));
    $("#confirmation-id").textContent = `DC-${appointment.id}`;
    $("#confirmation-details").innerHTML = `<strong>${escapeHtml(appointment.name)}</strong> · ${escapeHtml(appointment.branch)}<br>${escapeHtml(appointment.date)} · ${escapeHtml(appointment.time)}<br>Total referencial: <strong>${currency(total)}</strong>`;
    form.reset();
    selected.clear();
    paymentType = "";
    sessionStorage.removeItem("odonto-payment");
    saveSelection();
    $$(".treatment-check").forEach(input => {
      input.checked = false;
      input.closest(".treatment-card").classList.remove("selected");
    });
    renderQuote();
    showView("confirmacion");
  });

  $("#login-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("username") === "admin" && data.get("password") === "dentalcare") {
      sessionStorage.setItem("odonto-admin", "true");
      $("#login-error").hidden = true;
      activateAdminTab("inicio");
      showView("admin");
      return;
    }
    $("#login-error").textContent = "Usuario o contraseña incorrectos. Inténtalo de nuevo.";
    $("#login-error").hidden = false;
  });

  $("#logout-button").addEventListener("click", () => {
    sessionStorage.removeItem("odonto-admin");
    $("#login-form").reset();
    showView("login");
  });
  $("#appointment-search").addEventListener("input", renderAdmin);
  $("#status-filter").addEventListener("change", renderAdmin);
  $("#appointments-table").addEventListener("change", event => {
    const select = event.target.closest("[data-status-id]");
    if (!select) return;
    const appointments = getAppointments();
    const appointment = appointments.find(item => item.id === select.dataset.statusId);
    if (!appointment) {
      notify("No se encontró la cita seleccionada.", true);
      renderAdmin();
      return;
    }
    appointment.status = select.value;
    localStorage.setItem("odonto-appointments", JSON.stringify(appointments));
    renderAdmin();
    notify(`La cita #${appointment.id} ahora está ${appointment.status.toLowerCase()}.`);
  });
  $("#mobile-menu-toggle").addEventListener("click", event => {
    const sidebar = $(".admin-sidebar");
    const open = sidebar.classList.toggle("menu-open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });
  $$("[data-public-link]").forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    showView(link.dataset.publicLink);
  }));

  function restorePublicRoute() {
    const route = window.location.hash.slice(1);
    if (publicViews.has(route)) showView(route, false);
  }

  window.addEventListener("popstate", restorePublicRoute);
  window.addEventListener("hashchange", restorePublicRoute);

  if (sessionStorage.getItem("odonto-admin") === "true") showView("admin");
  else restorePublicRoute();
})();
