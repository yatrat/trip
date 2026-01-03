  
    
    /* ============================

   GLOBAL STATE

============================ */

let tripCities = [];

let tripData = {};

let cachedRows = [];

let visibleCount = 6;

const LOAD_STEP = 6;


/* ============================
   CANONICAL LINK & SEO SAFETY
============================ */

function canonicalPair(a, b) {
  if (!a || !b || a === b) return null;
  return [a.toLowerCase(), b.toLowerCase()].sort();
}

(function injectNoIndexIfParam() {
  if (window.location.search.length > 0 && !document.querySelector('meta[name="robots"]')) {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, follow";
    document.head.appendChild(meta);
  }
})();

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
  const res = await fetch("https://cdn.jsdelivr.net/gh/yatrat/trip@v1.1.0/cities/city-data.json");
  const dataJson = await res.json();

  tripData = dataJson.cities || {};

  tripCities = Object.keys(tripData).map(id => ({
    id: id,
    name: id
      .replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase())
  }));
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
    document.getElementById("copyCompareLink").style.display = "none";
    return;
  }

  const cityA = tripData[idA];
  const cityB = tripData[idB];

  if (!cityA || !cityB) {
    results.innerHTML = `<div class="message error">Invalid destination data.</div>`;
    document.getElementById("copyCompareLink").style.display = "none";
    return;
  }

  const pair = canonicalPair(idA, idB);
  if (pair) {
    const params = new URLSearchParams({ a: pair[0], b: pair[1] });
    history.replaceState(null, "", "?" + params.toString());
  }

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
    <div class="legal-disclaimer">
      <p><strong>Note:</strong> Data is for comparison only. Verify details before travel.</p>
    </div>
  `;

  renderRows(results);
  document.getElementById("copyCompareLink").style.display = "inline-block";
}

/* ============================
   COPY LINK BUTTON
============================ */

function setupCopyLinkButton() {
  const btn = document.getElementById("copyCompareLink");
  const status = document.getElementById("copyStatus");
  if (!btn) return;

  btn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      status.textContent = "Link copied!";
      setTimeout(() => status.textContent = "", 2000);
    } catch {
      status.textContent = "Copy failed";
    }
  };
}

function renderRows(results) {
  results.querySelectorAll(".trip-row, .load-more-btn").forEach(e => e.remove());

  cachedRows.slice(0, visibleCount).forEach(row => results.appendChild(row));

  if (visibleCount < cachedRows.length) {
    const btn = document.createElement("button");
    btn.className = "load-more-btn";
    btn.textContent = "Load more";
    btn.onclick = () => {
      visibleCount += LOAD_STEP;
      renderRows(results);
    };
    results.appendChild(btn);
  }
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
  
  const cityAName = document.getElementById("tripA").value || "City A";
  const cityBName = document.getElementById("tripB").value || "City B";
  
  
  const container = document.createElement("div");
  container.className = "city-cards-container";
  
  
  const cardA = document.createElement("div");
  cardA.className = "city-card city-card-a";
  
  let htmlA = '';
  tripMetaFields.forEach(key => {
    if (!(key in cityA)) return;
    
    let valA = cityA[key] ?? "—";
    
    if (key === "best_months") {
      valA = formatMonths(valA);
    }
    
    if (typeof valA === "boolean") valA = valA ? "Yes" : "No";
    if (Array.isArray(valA)) valA = valA.join(", ");
    
    if (key === "more_info_link" && valA !== "—") {
      valA = `<a href="${valA}" target="_blank">Know more</a>`;
    }
    
    htmlA += `<p><strong>${key.replace(/_/g, " ")}:</strong> ${valA}</p>`;
  });
  
  cardA.innerHTML = `
    <div class="city-card-header">
      <h3>${cityAName}</h3>
      <div class="city-tag">City A</div>
    </div>
    <div class="city-card-body">
      ${htmlA}
    </div>
  `;
  
  
  const cardB = document.createElement("div");
  cardB.className = "city-card city-card-b";
  
  let htmlB = '';
  tripMetaFields.forEach(key => {
    if (!(key in cityB)) return;
    
    let valB = cityB[key] ?? "—";
    
    if (key === "best_months") {
      valB = formatMonths(valB);
    }
    
    if (typeof valB === "boolean") valB = valB ? "Yes" : "No";
    if (Array.isArray(valB)) valB = valB.join(", ");
    
    if (key === "more_info_link" && valB !== "—") {
      valB = `<a href="${valB}" target="_blank">Know more</a>`;
    }
    
    htmlB += `<p><strong>${key.replace(/_/g, " ")}:</strong> ${valB}</p>`;
  });
  
  cardB.innerHTML = `
    <div class="city-card-header">
      <h3>${cityBName}</h3>
      <div class="city-tag">City B</div>
    </div>
    <div class="city-card-body">
      ${htmlB}
    </div>
  `;
  

  container.appendChild(cardA);
  container.appendChild(cardB);
  
  
  wrap.appendChild(container);
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
  const pair = canonicalPair(params.get("a"), params.get("b"));
  if (!pair) return;

  const cityA = tripCities.find(c => c.id === pair[0]);
  const cityB = tripCities.find(c => c.id === pair[1]);
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
   setupCopyLinkButton();
  applyCompareFromURL();
});
