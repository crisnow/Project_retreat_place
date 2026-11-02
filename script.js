const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  primaryNav.classList.toggle("is-open", !isOpen);
});

primaryNav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    menuToggle.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("is-open");
  }
});

const calendarMonth = document.querySelector("#calendar-month");
const calendarDays = document.querySelector("#calendar-days");
const previousMonthButton = document.querySelector("#calendar-prev");
const nextMonthButton = document.querySelector("#calendar-next");
const checkinDisplay = document.querySelector("#checkin-display");
const checkoutDisplay = document.querySelector("#checkout-display");
const nightSummary = document.querySelector("#night-summary");
const bookingForm = document.querySelector("#booking-form");
const bookingSubmit = document.querySelector("#booking-submit");
const bookingFeedback = document.querySelector("#booking-feedback");
const today = new Date();
today.setHours(0, 0, 0, 0);
let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let checkinDate = null;
let checkoutDate = null;

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDemoAvailable(date) {
  return ![6, 7, 16, 17, 26, 27].includes(date.getDate());
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function nightsBetween(start, end) {
  return Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000);
}

function renderCalendar() {
  calendarMonth.textContent = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  previousMonthButton.disabled =
    visibleMonth.getFullYear() === today.getFullYear() &&
    visibleMonth.getMonth() === today.getMonth();
  calendarDays.replaceChildren();

  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  for (let index = 0; index < offset; index += 1) {
    const blank = document.createElement("span");
    blank.className = "calendar-blank";
    blank.setAttribute("aria-hidden", "true");
    calendarDays.append(blank);
  }

  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    const key = dateKey(date);
    const isPast = date < today;
    const available = isDemoAvailable(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.textContent = String(day);
    button.dataset.date = key;
    button.disabled = isPast || !available;
    button.setAttribute(
      "aria-label",
      `${formatDate(date)}, ${isPast ? "past date" : available ? "sample availability" : "unavailable in sample calendar"}`,
    );

    if (isPast || !available) button.classList.add("is-unavailable");
    if (key === dateKey(today)) button.classList.add("is-today");
    if (checkinDate && key === dateKey(checkinDate)) button.classList.add("is-checkin");
    if (checkoutDate && key === dateKey(checkoutDate)) button.classList.add("is-checkout");
    if (checkinDate && checkoutDate && date > checkinDate && date < checkoutDate) {
      button.classList.add("is-in-range");
    }
    if (
      (checkinDate && key === dateKey(checkinDate)) ||
      (checkoutDate && key === dateKey(checkoutDate))
    ) {
      button.setAttribute("aria-pressed", "true");
    } else {
      button.setAttribute("aria-pressed", "false");
    }

    calendarDays.append(button);
  }

  updateBookingSummary();
}

function updateBookingSummary() {
  checkinDisplay.textContent = checkinDate ? formatDate(checkinDate) : "Choose a date";
  checkoutDisplay.textContent = checkoutDate ? formatDate(checkoutDate) : "Choose a date";
  if (checkinDate && checkoutDate) {
    const nights = nightsBetween(checkinDate, checkoutDate);
    nightSummary.textContent = `${nights} ${nights === 1 ? "night" : "nights"} selected · sample availability`;
    bookingSubmit.disabled = false;
  } else if (checkinDate) {
    nightSummary.textContent = "Now choose a departure date.";
    bookingSubmit.disabled = true;
  } else {
    nightSummary.textContent = "Select two dates on the calendar to continue.";
    bookingSubmit.disabled = true;
  }
}

calendarDays.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLButtonElement) || event.target.disabled) return;
  const [year, month, day] = event.target.dataset.date.split("-").map(Number);
  const selectedDate = new Date(year, month - 1, day);
  bookingFeedback.textContent = "";

  if (!checkinDate || checkoutDate || selectedDate <= checkinDate) {
    checkinDate = selectedDate;
    checkoutDate = null;
  } else {
    let hasUnavailableNight = false;
    for (
      const night = new Date(checkinDate);
      night < selectedDate;
      night.setDate(night.getDate() + 1)
    ) {
      if (!isDemoAvailable(night)) {
        hasUnavailableNight = true;
        break;
      }
    }

    if (hasUnavailableNight) {
      checkinDate = selectedDate;
      checkoutDate = null;
      bookingFeedback.textContent = "Those dates include a sample unavailable night. Please choose a different arrival and departure.";
    } else {
      checkoutDate = selectedDate;
    }
  }

  renderCalendar();
});

previousMonthButton.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  renderCalendar();
});

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!bookingForm.reportValidity() || !checkinDate || !checkoutDate) return;

  const name = new FormData(bookingForm).get("name").toString().trim();
  bookingFeedback.textContent = `Demo booking complete${name ? `, ${name}` : ""}. No real reservation was created or saved.`;
});

renderCalendar();

const enquiryForm = document.querySelector("#enquiry-form");
const formFeedback = document.querySelector("#form-feedback");

enquiryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!enquiryForm.reportValidity()) return;

  const name = new FormData(enquiryForm).get("name").toString().trim();
  formFeedback.textContent = `Thank you${name ? `, ${name}` : ""}. This prototype doesn’t send or store enquiries, but your form is ready to connect to a booking team.`;
  enquiryForm.reset();
});

const chatPanel = document.querySelector("#chat-panel");
const chatLauncher = document.querySelector("#chat-launcher");
const chatClose = document.querySelector(".chat-close");
const chatMessages = document.querySelector("#chat-messages");
const chatSuggestions = document.querySelector("#chat-suggestions");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");

function setChatOpen(isOpen) {
  chatPanel.hidden = !isOpen;
  chatLauncher.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) chatInput.focus();
}

function addMessage(text, className) {
  const message = document.createElement("div");
  message.className = `message ${className}`;
  message.textContent = text;
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getDemoAnswer(question) {
  const normalized = question.toLowerCase();
  if (/residen|longer|long.stay/.test(normalized)) {
    return "Furstanwald welcomes enquiries about longer stays and residencies. Share a little about the length of stay and what you’re looking for in the enquiry form, and the team can follow up. Availability and terms need to be confirmed.";
  }
  if (/book|room|stay|accommod|guest/.test(normalized)) {
    return "The prototype features guest stays and longer residencies. Room types, dates, prices, and availability haven’t been set yet. Please use the enquiry form to ask about a stay.";
  }
  if (/contact|enquir|email|team|reach|get in touch/.test(normalized)) {
    return "You can send a guest stay, residency, or general enquiry using the form on this page. This demo doesn’t send your details anywhere, but it shows how that conversation could begin.";
  }
  if (/garden|facilit|amenit|house|grounds/.test(normalized)) {
    return "The sample website describes comfortable guest rooms, welcoming shared spaces, and gardens and grounds. Specific facilities and access information are placeholders and should be confirmed by the house.";
  }
  if (/where|location|address|travel|directions|parking/.test(normalized)) {
    return "The location, directions, transport, and parking details haven’t been provided yet, so I don’t want to guess. Please use the enquiry form for confirmed visitor information.";
  }
  return "I don’t have verified information about that in this demo, so I don’t want to guess. Please send an enquiry and the house team can help with a confirmed answer.";
}

chatLauncher.addEventListener("click", () => setChatOpen(chatPanel.hidden));
chatClose.addEventListener("click", () => setChatOpen(false));
document.querySelectorAll(".open-chat").forEach((button) => {
  button.addEventListener("click", () => setChatOpen(true));
});

function askQuestion(question) {
  const cleanedQuestion = question.trim();
  if (!cleanedQuestion) return;
  addMessage(cleanedQuestion, "user-message");
  addMessage(getDemoAnswer(cleanedQuestion), "bot-message");
}

chatSuggestions.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLButtonElement)) return;
  askQuestion(event.target.textContent);
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  askQuestion(chatInput.value);
  chatForm.reset();
  chatInput.focus();
});
