const performances = [
  {
    id: 1,
    title: "Линия света",
    genre: "Драма",
    description: "Демонстрационная постановка для интерфейса курсового проекта. Основной акцент — на человеческих отношениях и выборе.",
    duration: "2 ч 10 мин",
    ageLimit: "16+",
    sessions: [
      { id: 101, date: "20.09.2026", time: "19:00", hall: 1, status: "Доступен", prices: { "Партер": 1500, "Амфитеатр": 1200, "Балкон": 900 } },
      { id: 102, date: "23.09.2026", time: "18:30", hall: 1, status: "Доступен", prices: { "Партер": 1500, "Амфитеатр": 1200, "Балкон": 900 } }
    ]
  },
  {
    id: 2,
    title: "После занавеса",
    genre: "Комедия",
    description: "Демонстрационный спектакль о театре, репетициях и неожиданных встречах за кулисами.",
    duration: "1 ч 50 мин",
    ageLimit: "12+",
    sessions: [
      { id: 201, date: "21.09.2026", time: "19:00", hall: 2, status: "Доступен", prices: { "Партер": 1300, "Амфитеатр": 1000, "Балкон": 750 } },
      { id: 202, date: "24.09.2026", time: "19:30", hall: 2, status: "Доступен", prices: { "Партер": 1300, "Амфитеатр": 1000, "Балкон": 750 } }
    ]
  },
  {
    id: 3,
    title: "Ночная сцена",
    genre: "Мелодрама",
    description: "Демонстрационная постановка о встречах, которые меняют привычный ход жизни.",
    duration: "2 ч 25 мин",
    ageLimit: "16+",
    sessions: [
      { id: 301, date: "22.09.2026", time: "20:00", hall: 1, status: "Доступен", prices: { "Партер": 1700, "Амфитеатр": 1400, "Балкон": 1000 } }
    ]
  }
];

const seatTemplates = {
  1: [
    { row: 1, category: "Партер", seats: 10 },
    { row: 2, category: "Партер", seats: 10 },
    { row: 3, category: "Партер", seats: 10 },
    { row: 4, category: "Амфитеатр", seats: 10 },
    { row: 5, category: "Амфитеатр", seats: 10 },
    { row: 6, category: "Балкон", seats: 10 },
    { row: 7, category: "Балкон", seats: 10 }
  ],
  2: [
    { row: 1, category: "Партер", seats: 12 },
    { row: 2, category: "Партер", seats: 12 },
    { row: 3, category: "Партер", seats: 12 },
    { row: 4, category: "Амфитеатр", seats: 12 },
    { row: 5, category: "Амфитеатр", seats: 12 },
    { row: 6, category: "Балкон", seats: 12 }
  ]
};

const state = {
  activePerformanceId: performances[0].id,
  activeSessionId: performances[0].sessions[0].id,
  selectedSeats: []
};

const bookedBySession = JSON.parse(localStorage.getItem("theatreBookedSeats") || "{}");

const performanceGrid = document.getElementById("performanceGrid");
const scheduleList = document.getElementById("scheduleList");
const scheduleTitle = document.getElementById("scheduleTitle");
const searchInput = document.getElementById("searchInput");
const genreFilter = document.getElementById("genreFilter");
const emptyState = document.getElementById("emptyState");
const bookingTitle = document.getElementById("bookingTitle");
const hallMeta = document.getElementById("hallMeta");
const seatMap = document.getElementById("seatMap");
const selectedSeatsText = document.getElementById("selectedSeatsText");
const priceBreakdown = document.getElementById("priceBreakdown");
const totalPrice = document.getElementById("totalPrice");
const ticketForm = document.getElementById("ticketForm");
const purchaseButton = document.getElementById("purchaseButton");
const purchaseResult = document.getElementById("purchaseResult");
const toast = document.getElementById("toast");

function formatPrice(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function getActivePerformance() {
  return performances.find(item => item.id === state.activePerformanceId);
}

function getActiveSession() {
  return getActivePerformance()?.sessions.find(item => item.id === state.activeSessionId);
}

function populateGenres() {
  const genres = [...new Set(performances.map(item => item.genre))].sort();
  genreFilter.innerHTML = `<option value="all">Все жанры</option>` + genres.map(genre => `<option value="${genre}">${genre}</option>`).join("");
}

function renderPerformances() {
  const query = searchInput.value.trim().toLowerCase();
  const genre = genreFilter.value;

  const visible = performances.filter(item => {
    const matchesText = [item.title, item.genre, item.description].join(" ").toLowerCase().includes(query);
    const matchesGenre = genre === "all" || item.genre === genre;
    return matchesText && matchesGenre;
  });

  performanceGrid.innerHTML = visible.map(item => `
    <article class="performance-card">
      <div class="performance-head">
        <span class="badge">${item.genre}</span>
        <span class="badge">${item.ageLimit}</span>
      </div>
      <h3 class="performance-title">${item.title}</h3>
      <p class="performance-description">${item.description}</p>
      <div class="meta-list">
        <span>${item.duration}</span>
        <span>${item.sessions.length} сеанс${item.sessions.length === 1 ? "" : item.sessions.length < 5 ? "а" : "ов"}</span>
      </div>
      <button class="primary-button card-button" data-performance="${item.id}">Посмотреть расписание</button>
    </article>
  `).join("");

  emptyState.classList.toggle("hidden", visible.length !== 0);
  performanceGrid.querySelectorAll("[data-performance]").forEach(button => {
    button.addEventListener("click", () => {
      state.activePerformanceId = Number(button.dataset.performance);
      const performance = getActivePerformance();
      state.activeSessionId = performance.sessions[0].id;
      state.selectedSeats = [];
      renderSchedule();
      renderBooking();
      document.getElementById("scheduleTitle").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderSchedule() {
  const performance = getActivePerformance();
  scheduleTitle.textContent = performance.title;
  scheduleList.innerHTML = performance.sessions.map(session => `
    <div class="schedule-row">
      <div class="schedule-main">
        <strong>${performance.title}</strong>
        <span>${performance.genre} · ${performance.duration} · ${performance.ageLimit}</span>
      </div>
      <span>${session.date}</span>
      <span>${session.time}</span>
      <span>Зал №${session.hall}</span>
      <span class="schedule-action"><button class="primary-button" data-session="${session.id}">Выбрать места</button></span>
    </div>
  `).join("");

  scheduleList.querySelectorAll("[data-session]").forEach(button => {
    button.addEventListener("click", () => {
      state.activeSessionId = Number(button.dataset.session);
      state.selectedSeats = [];
      renderBooking();
      document.getElementById("booking").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function generateBookedSeats(sessionId, hall) {
  if (!bookedBySession[sessionId]) {
    // Небольшой набор демо-занятых мест, чтобы статус мест был виден сразу.
    const rows = seatTemplates[hall] || seatTemplates[1];
    bookedBySession[sessionId] = rows.flatMap(row => {
      if (row.row % 3 === 0) return [2, 5].map(number => `${row.row}-${number}`);
      if (row.row === 2) return [4, 8].map(number => `${row.row}-${number}`);
      return [];
    });
    localStorage.setItem("theatreBookedSeats", JSON.stringify(bookedBySession));
  }
  return bookedBySession[sessionId];
}

function getSeatList() {
  const session = getActiveSession();
  const rows = seatTemplates[session.hall] || seatTemplates[1];
  const booked = new Set(generateBookedSeats(session.id, session.hall));
  return rows.flatMap(row => Array.from({ length: row.seats }, (_, index) => {
    const number = index + 1;
    const id = `${row.row}-${number}`;
    return { id, row: row.row, number, category: row.category, booked: booked.has(id) };
  }));
}

function renderSeatMap() {
  const session = getActiveSession();
  const seats = getSeatList();
  const rows = [...new Set(seats.map(seat => seat.row))];

  seatMap.innerHTML = rows.map(row => {
    const rowSeats = seats.filter(seat => seat.row === row);
    return `
      <div class="seat-row">
        <span class="row-label">${row}</span>
        ${rowSeats.map((seat, index) => {
          const selected = state.selectedSeats.includes(seat.id);
          const classes = ["seat", seat.booked ? "sold" : "", selected ? "selected" : ""].filter(Boolean).join(" ");
          const disabled = seat.booked ? "disabled" : "";
          return `<button class="${classes}" ${disabled} aria-label="Ряд ${seat.row}, место ${seat.number}, ${seat.category}" data-seat="${seat.id}">${seat.number}</button>${index === 4 ? '<span class="seat-gap"></span>' : ''}`;
        }).join("")}
      </div>
    `;
  }).join("");

  seatMap.querySelectorAll("[data-seat]").forEach(button => {
    button.addEventListener("click", () => toggleSeat(button.dataset.seat));
  });
}

function toggleSeat(seatId) {
  if (state.selectedSeats.includes(seatId)) {
    state.selectedSeats = state.selectedSeats.filter(item => item !== seatId);
  } else {
    state.selectedSeats.push(seatId);
  }
  purchaseResult.classList.add("hidden");
  renderBooking();
}

function renderBooking() {
  const performance = getActivePerformance();
  const session = getActiveSession();
  bookingTitle.textContent = session
    ? `${performance.title} · ${session.date} · ${session.time}`
    : "Сначала выберите сеанс";
  hallMeta.textContent = session
    ? `${performance.title} · ${session.date} · ${session.time} · Зал №${session.hall}`
    : "Сеанс не выбран";

  renderSeatMap();

  const seats = getSeatList().filter(seat => state.selectedSeats.includes(seat.id));
  if (seats.length === 0) {
    selectedSeatsText.textContent = "Пока ничего не выбрано";
  } else {
    selectedSeatsText.innerHTML = seats.map(seat => `Ряд ${seat.row}, место ${seat.number} · ${seat.category}`).join("<br>");
  }

  const grouped = {};
  seats.forEach(seat => {
    grouped[seat.category] = (grouped[seat.category] || 0) + 1;
  });

  let total = 0;
  priceBreakdown.innerHTML = Object.entries(grouped).map(([category, count]) => {
    const unitPrice = session.prices[category];
    const lineTotal = unitPrice * count;
    total += lineTotal;
    return `<div class="price-line"><span>${category} × ${count}</span><span>${formatPrice(lineTotal)}</span></div>`;
  }).join("");

  totalPrice.textContent = formatPrice(total);
  purchaseButton.disabled = seats.length === 0;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

ticketForm.addEventListener("submit", event => {
  event.preventDefault();
  const session = getActiveSession();
  const performance = getActivePerformance();
  const seats = getSeatList().filter(seat => state.selectedSeats.includes(seat.id));

  if (!session || seats.length === 0) {
    showToast("Сначала выберите хотя бы одно свободное место.");
    return;
  }

  const booked = new Set(generateBookedSeats(session.id, session.hall));
  const conflict = seats.some(seat => booked.has(seat.id));
  if (conflict) {
    showToast("Одно из выбранных мест уже занято. Обновите выбор.");
    state.selectedSeats = [];
    renderBooking();
    return;
  }

  const total = seats.reduce((sum, seat) => sum + session.prices[seat.category], 0);
  state.selectedSeats.forEach(id => booked.add(id));
  bookedBySession[session.id] = [...booked];
  localStorage.setItem("theatreBookedSeats", JSON.stringify(bookedBySession));

  const ticketNumber = `T-${Date.now().toString().slice(-8)}`;
  purchaseResult.innerHTML = `
    <strong>Заказ оформлен в демонстрационном режиме</strong>
    ${performance.title}, ${session.date} ${session.time}, зал №${session.hall}.<br>
    Места: ${seats.map(seat => `ряд ${seat.row}, место ${seat.number}`).join(", ")}.<br>
    Сумма: ${formatPrice(total)}. Номер заказа: ${ticketNumber}.
  `;
  purchaseResult.classList.remove("hidden");

  state.selectedSeats = [];
  renderBooking();
  ticketForm.reset();
  showToast("Демо-заказ успешно оформлен.");
});

searchInput.addEventListener("input", renderPerformances);
genreFilter.addEventListener("change", renderPerformances);

populateGenres();
renderPerformances();
renderSchedule();
renderBooking();
