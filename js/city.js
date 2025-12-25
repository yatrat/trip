  
    
    /* ============================

   GLOBAL STATE

============================ */

let tripCities = [];

let tripData = {};

let cachedRows = [];

let visibleCount = 6;

const LOAD_STEP = 6;

/* ============================

   FIELD CONFIG

============================ */

const tripFields = {

  avg_hotel_cost: { label: "Hotel Cost", unit: "₹", better: "lower" },

  avg_food_cost: { label: "Food Cost", unit: "₹", better: "lower" },

  local_transport_cost: { label: "Local Transport", unit: "₹", better: "lower" },

  total_daily_cost: { label: "Total Daily Cost", unit: "₹", better: "lower" },

  budget_friendly: { label: "Budget Friendly", scale: "/10", better: "higher" },

  weather_comfort: { label: "Weather Comfort", scale: "/10", better: "higher" },

  scenic_beauty: { label: "Scenic Beauty", scale: "/10", better: "higher" },

  things_to_do_score: { label: "Things To Do", scale: "/10", better: "higher" },

  cleanliness_score: { label: "Cleanliness", scale: "/10", better: "higher" },

  family_friendly: { label: "Family Friendly", scale: "/10", better: "higher" },

  crowd_level: { label: "Crowd Level", scale: "/10", better: "lower" },

  safety_score: { label: "Safety", scale: "/10", better: "higher" },

  tourist_trap_risk: { label: "Tourist Trap Risk", scale: "/10", better: "lower" },

  connectivity_score: { label: "Connectivity", scale: "/10", better: "higher" },

  travel_time_from_major_city: { label: "Travel Time", unit: " hrs", better: "lower" },

  road_quality_score: { label: "Road Quality", scale: "/10", better: "higher" },

  public_transport_score: { label: "Public Transport", scale: "/10", better: "higher" },

  nightlife_score: { label: "Nightlife", scale: "/10", better: "higher" },

  shopping_experience_score: { label: "Shopping", scale: "/10", better: "higher" }

};

const tripMetaFields = [

  "travel_type",

  "ideal_duration",

  "famous_for",

  "best_for",

  "peak_season",

  "off_season",

  "monsoon_rainfall",

  "unesco_heritage",

  "adventure_activities",

  "local_cuisine",

  "special_attraction",

  "climate",

  "avg_temperature",

  "best_viewpoints",

  "best_months",

  "more_info_link"

];

/* ============================

   LOAD DATA

============================ */

async function loadTripData() {

  const [cityRes, dataRes] = await Promise.all([

    fetch("https://cdn.jsdelivr.net/gh/yatrat/trip@v2.6/cities/citylists.json"),

    fetch("https://cdn.jsdelivr.net/gh/yatrat/trip@v2.6/cities/city-data.json")

  ]);

  tripCities = (await cityRes.json()).cities || [];

  tripData = (await dataRes.json()).cities || {};

}

/* ============================

   AUTOCOMPLETE

============================ */

function setupAutocomplete(inputId, listId) {

  const input = document.getElementById(inputId);

  const list = document.getElementById(listId);

  if (!input || !list) return;

  input.addEventListener("input", () => {

    const value = input.value.trim().toLowerCase();

    list.innerHTML = "";

    list.style.display = "none";

    input.dataset.id = "";

    if (!value) return;

    const matches = tripCities

      .filter(c => c.name.toLowerCase().includes(value))

      .slice(0, 7);

    if (!matches.length) return;

    matches.forEach(city => {

      const item = document.createElement("div");

      item.className = "yt-suggestion";

      item.textContent = city.name;

      item.onclick = () => {

        input.value = city.name;

        input.dataset.id = city.id;

        list.innerHTML = "";

        list.style.display = "none";

      };

      list.appendChild(item);

    });

    list.style.display = "block";

  });

  document.addEventListener("click", e => {

    if (!list.contains(e.target) && e.target !== input) {

      list.style.display = "none";

    }

  });

}

/* ============================

   COMPARE

============================ */

function compareTrips() {

  const inputA = document.getElementById("tripA");

  const inputB = document.getElementById("tripB");

  const results = document.getElementById("tripResults");

  const header = document.getElementById("tripHeader");

  const idA = inputA.dataset.id;

  const idB = inputB.dataset.id;

  if (!idA || !idB || idA === idB) {

    header.style.display = "none";

    results.innerHTML = `<div class="message error">Select two different destinations.</div>`;

    return;

  }

  const cityA = tripData[idA];

  const cityB = tripData[idB];

  renderTripMeta(cityA, cityB);

  header.style.display = "grid";

  document.getElementById("tripAName").textContent = inputA.value;

  document.getElementById("tripBName").textContent = inputB.value;

  cachedRows = [];

  visibleCount = 6;

  results.innerHTML = "";

  let scoreA = 0, scoreB = 0, total = 0;

  Object.keys(tripFields).forEach(key => {

    if (!(key in cityA) || !(key in cityB)) return;

    const field = tripFields[key];

    const valA = cityA[key];

    const valB = cityB[key];

    const [nA, nB] = normalizeScore(valA, valB, field.better);

    scoreA += nA;

    scoreB += nB;

    total++;

    const winner = nA > nB ? "A" : nB > nA ? "B" : "";

    const row = document.createElement("div");

    row.className = "trip-row";

    row.innerHTML = `

      <div>${field.label}<div class="variance">${varianceLabel(valA, valB)}</div></div>

      <div class="${winner === "A" ? "winner" : ""}">${formatRange(valA, field)}</div>

      <div class="${winner === "B" ? "winner" : ""}">${formatRange(valB, field)}</div>

    `;

    cachedRows.push(row);

  });

  const outA = Math.round((scoreA / total) * 10);

  const outB = Math.round((scoreB / total) * 10);

  results.innerHTML = `

    <div class="trip-summary">

      🏆 ${outA > outB ? inputA.value : inputB.value} is better for travel

      (${inputA.value}: ${outA}/10, ${inputB.value}: ${outB}/10)

    </div>

  `;

  renderRows(results);

}

/* ============================

   META RENDER

============================ */

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatMonths(arr) {

  if (!Array.isArray(arr)) return "—";

  return arr.map(m => MONTH_NAMES[m - 1]).filter(Boolean).join(", ");

}

function renderTripMeta(cityA, cityB) {

  const wrap = document.getElementById("tripMeta");

  if (!wrap) return;

  wrap.innerHTML = "";

  const meta = document.createElement("div");

  meta.className = "trip-meta-content";

  tripMetaFields.forEach(key => {

    if (!(key in cityA) && !(key in cityB)) return;

    let valA = cityA[key] ?? "—";

    let valB = cityB[key] ?? "—";

    if (key === "best_months") {

      valA = formatMonths(valA);

      valB = formatMonths(valB);

    }

    if (typeof valA === "boolean") valA = valA ? "Yes" : "No";

    if (typeof valB === "boolean") valB = valB ? "Yes" : "No";

    if (Array.isArray(valA)) valA = valA.join(", ");

    if (Array.isArray(valB)) valB = valB.join(", ");

    if (key === "more_info_link") {

      valA = valA !== "—" ? `<a href="${valA}" target="_blank">Know more</a>` : "—";

      valB = valB !== "—" ? `<a href="${valB}" target="_blank">Know more</a>` : "—";

    }

    meta.innerHTML += `<p><strong>${key.replace(/_/g, " ")}:</strong> ${valA} | ${valB}</p>`;

  });

  wrap.appendChild(meta);

}

/* ============================

   HELPERS

============================ */

function normalizeScore(a, b, better) {

  if (a == null || b == null || a === 0 || b === 0) return [1, 1];

  if (a === b) return [1, 1];

  if (better === "higher") return [a / Math.max(a, b), b / Math.max(a, b)];

  return [Math.min(a, b) / a, Math.min(a, b) / b];

}

function varianceLabel(a, b) {

  const pct = Math.abs(a - b) / ((a + b) / 2) * 100;

  if (pct < 10) return "Minor difference";

  if (pct < 25) return "Moderate difference";

  return "Major difference";

}

function formatRange(value, field) {

  if (field.scale === "/10") return `${Math.floor(value - 0.5)}–${Math.ceil(value + 0.5)}/10`;

  if (field.unit === "₹") return `₹${Math.round(value * 0.9)}–${Math.round(value * 1.1)}`;

  if (!field.unit && value < 10) return `${(value - 0.1).toFixed(1)}–${(value + 0.1).toFixed(1)}`;

  return value;

}

/* ============================
   URL SHARE SUPPORT
============================ */

function applyCompareFromURL() {
  const params = new URLSearchParams(window.location.search);
  const a = params.get("a");
  const b = params.get("b");

  if (!a || !b) return;

  const cityA = tripCities.find(c => c.id === a);
  const cityB = tripCities.find(c => c.id === b);
  if (!cityA || !cityB) return;

  const inputA = document.getElementById("tripA");
  const inputB = document.getElementById("tripB");

  inputA.value = cityA.name;
  inputA.dataset.id = cityA.id;
  inputB.value = cityB.name;
  inputB.dataset.id = cityB.id;

  compareTrips();
}

/* ============================
   INIT
============================ */

document.addEventListener("DOMContentLoaded", async () => {
  await loadTripData();
  setupAutocomplete("tripA", "tripAList");
  setupAutocomplete("tripB", "tripBList");
  document.getElementById("compareTripBtn")?.addEventListener("click", compareTrips);
  applyCompareFromURL();
});
