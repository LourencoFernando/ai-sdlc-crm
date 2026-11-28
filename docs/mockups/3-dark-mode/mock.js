// Sample data and small helpers for the dark mode mockups (a copy of ../shared/mock.js that takes every color from the tokens). "Today" is Nov 20, 2026.

const TODAY = "2026-11-20";

const STAGES = [
  { key: "new", name: "New", prob: 10, chart: "var(--color-ocean)" },
  { key: "qualified", name: "Qualified", prob: 25, chart: "var(--color-violet)" },
  { key: "proposal", name: "Proposal", prob: 50, chart: "var(--color-ultra-violet)" },
  { key: "negotiation", name: "Negotiation", prob: 75, chart: "var(--color-ember)" },
  { key: "won", name: "Won", prob: 100, chart: "var(--color-forest)" },
  { key: "lost", name: "Lost", prob: 0, chart: "var(--color-text-muted)" },
];

const MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const WON_REVENUE = [48500, 36200, 52800, 61400, 44900, 72300, 68100, 55600, 81200, 76400, 89700, 94300];
const WON_COUNT = [2, 1, 2, 2, 1, 3, 2, 2, 3, 2, 3, 3];
const LOST_COUNT = [1, 1, 0, 1, 2, 1, 1, 0, 1, 2, 1, 1];

// [name, organization, contact initials, value, probability, close date]
const DEALS = {
  new: [
    ["Site safety app", "Quarry Lane Builders", "SW", 20500, 10, "2026-12-30"],
    ["Guest Wi-Fi upgrade", "Pinecrest Hotels", "EK", 12000, 10, "2026-12-18"],
    ["Fleet tracking pilot", "Brightwater Logistics", "DR", 24000, 10, "2027-01-15"],
    ["Store POS refresh", "Fernleaf Retail", "AB", 16000, 10, "2027-01-09"],
    ["Clinic scheduling rollout", "Kestrel Health", "PN", 32000, 10, "2027-02-03"],
    ["Warehouse sensors", "Corvo Manufacturing", "TO", 18500, 10, "2027-01-28"],
    ["Course platform licences", "Fernhill Academy", "GL", 21500, 10, "2027-02-20"],
    ["Grid analytics trial", "Tidewell Energy", "JP", 27000, 10, "2027-03-06"],
    ["Ad operations dashboard", "Halcyon Media", "RM", 14500, 10, "2027-02-12"],
  ],
  qualified: [
    ["Booking engine", "Pinecrest Hotels", "EK", 22000, 25, "2026-11-14"],
    ["Payroll integration", "Saltmarsh Capital", "MW", 38000, 25, "2027-01-22"],
    ["Telehealth add-on", "Kestrel Health", "PN", 29500, 25, "2026-12-12"],
    ["ERP connector", "Corvo Manufacturing", "TO", 41000, 30, "2027-02-26"],
    ["Route optimization", "Brightwater Logistics", "DR", 33500, 25, "2027-01-30"],
    ["Content archive migration", "Halcyon Media", "RM", 26000, 25, "2026-12-22"],
    ["Analytics seats", "Orbitra Software", "NL", 24500, 25, "2027-02-05"],
  ],
  proposal: [
    ["Data warehouse build", "Saltmarsh Capital", "MW", 62000, 50, "2026-12-19"],
    ["Fleet telematics", "Brightwater Logistics", "DR", 45000, 50, "2026-11-06"],
    ["Smart meter dashboards", "Tidewell Energy", "JP", 41500, 50, "2026-12-09"],
    ["Patient portal", "Kestrel Health", "PN", 38500, 50, "2027-01-14"],
    ["Loyalty program", "Fernleaf Retail", "AB", 33000, 50, "2026-12-04"],
    ["Campus licences", "Fernhill Academy", "GL", 28000, 50, "2027-01-21"],
  ],
  negotiation: [
    ["Plant maintenance suite", "Corvo Manufacturing", "TO", 64000, 75, "2026-11-12"],
    ["Enterprise support plan", "Orbitra Software", "NL", 58000, 80, "2026-12-02"],
    ["Multi-site rollout", "Pinecrest Hotels", "EK", 38000, 75, "2026-12-10"],
    ["Project costing module", "Quarry Lane Builders", "SW", 36000, 75, "2026-12-16"],
  ],
  won: [
    ["Treasury reporting", "Saltmarsh Capital", "MW", 41000, 100, "2026-11-18"],
    ["Shift planning", "Pinecrest Hotels", "EK", 28300, 100, "2026-11-10"],
    ["Asset tracking", "Corvo Manufacturing", "TO", 25000, 100, "2026-11-04"],
    ["Ad inventory tool", "Halcyon Media", "RM", 32500, 100, "2026-10-28"],
    ["Fleet fuel reports", "Brightwater Logistics", "DR", 29200, 100, "2026-10-15"],
  ],
  lost: [
    ["Learning analytics", "Fernhill Academy", "GL", 22000, 0, "2026-11-07"],
    ["Depot cameras", "Brightwater Logistics", "DR", 18500, 0, "2026-10-21"],
    ["Solar forecasting", "Tidewell Energy", "JP", 30000, 0, "2026-10-02"],
  ],
};
// Totals for Won and Lost cover every deal in those columns, not just the cards shown.
const CLOSED_TOTALS = { won: { count: 26, value: 781400 }, lost: { count: 12, value: 268000 } };

const FOLLOW_UPS = {
  overdue: [
    ["call", "Call Marcus Webb about the data warehouse budget", "Data warehouse build", "Nov 14", "6 days overdue"],
    ["email", "Send revised proposal to Dana Reyes", "Fleet telematics", "Nov 17", "3 days overdue"],
    ["note", "Chase the signed order form", "Plant maintenance suite", "Nov 18", "2 days overdue"],
    ["email", "Email pricing tiers to Elena Kovacs", "Booking engine", "Nov 19", "1 day overdue"],
    ["call", "Answer the security questionnaire", "Patient portal", "Nov 19", "1 day overdue"],
  ],
  soon: [
    ["call", "Confirm demo time with Nora Lindqvist", "Enterprise support plan", "Nov 20", "Today"],
    ["email", "Share the logistics case study with Priya Nair", "Kestrel Health", "Nov 21", "Tomorrow"],
    ["call", "Call Tom Okafor about ERP scope", "ERP connector", "Nov 23", "In 3 days"],
    ["email", "Send contract draft to Sam Whitfield", "Project costing module", "Nov 24", "In 4 days"],
    ["note", "Prepare rollout plan for Pinecrest", "Multi-site rollout", "Nov 25", "In 5 days"],
    ["call", "Check budget timing with Jonah Pierce", "Smart meter dashboards", "Nov 26", "In 6 days"],
    ["email", "Send onboarding notes to Aisha Bello", "Loyalty program", "Nov 27", "In 7 days"],
    ["call", "Intro call with Ravi Menon", "Ad operations dashboard", "Nov 27", "In 7 days"],
  ],
};

const RECENT = [
  ["call", "Agreed phase one scope with Marcus Webb", "Data warehouse build", "Nov 19"],
  ["stage", "Moved from Qualified to Proposal", "Campus licences", "Nov 19"],
  ["stage", "Moved from Negotiation to Won", "Treasury reporting", "Nov 18"],
  ["email", "Sent updated telematics pricing", "Fleet telematics", "Nov 18"],
  ["note", "Procurement wants a three-year term", "Enterprise support plan", "Nov 18"],
  ["stage", "Moved from New to Qualified", "Analytics seats", "Nov 17"],
  ["call", "Discovery call with Priya Nair", "Kestrel Health", "Nov 17"],
  ["email", "Sent proposal and timeline", "Loyalty program", "Nov 16"],
  ["stage", "Moved from Proposal to Lost", "Learning analytics", "Nov 7"],
  ["note", "Board meeting moved to December", "Plant maintenance suite", "Nov 6"],
];

// ---------- Derived figures ----------
const sum = (a) => a.reduce((x, y) => x + y, 0);
const OPEN_KEYS = ["new", "qualified", "proposal", "negotiation"];
const stageTotals = (key) => {
  const ds = DEALS[key];
  if (CLOSED_TOTALS[key]) return { count: CLOSED_TOTALS[key].count, value: CLOSED_TOTALS[key].value, expected: key === "won" ? CLOSED_TOTALS[key].value : 0 };
  return { count: ds.length, value: sum(ds.map((d) => d[3])), expected: sum(ds.map((d) => (d[3] * d[4]) / 100)) };
};
const OPEN = OPEN_KEYS.reduce((t, k) => { const s = stageTotals(k); return { count: t.count + s.count, value: t.value + s.value, expected: t.expected + s.expected }; }, { count: 0, value: 0, expected: 0 });
const isLate = (d) => d[5] < TODAY;
const LATE_COUNT = OPEN_KEYS.reduce((n, k) => n + DEALS[k].filter(isLate).length, 0);

// ---------- Formatting ----------
const usd = (n) => "USD " + Math.round(n).toLocaleString("en-US");
// A large figure with a smaller currency code, so it fits on one line.
const usdFig = (n) => `<span class="cur">USD</span>${Math.round(n).toLocaleString("en-US")}`;
const usdShort = (n) => n >= 1e6 ? "USD " + (n / 1e6).toFixed(n >= 1e7 ? 0 : 2).replace(/\.?0+$/, "") + "M" : n >= 1e3 ? "USD " + Math.round(n / 1e3) + "K" : "USD " + n;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${MONTH_NAMES[m - 1]} ${d}` + (y !== 2026 ? `, ${y}` : ""); };

// ---------- Icons (Lucide-style line icons) ----------
const ICON = {
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
  call: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  stage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5h18M6 12h12M10 19h4"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  organizations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4M18 9h2a2 2 0 0 1 2 2v11h-4M10 6h4M10 10h4M10 14h4M10 18h4"/></svg>',
  contacts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
  deals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  pipeline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7v7M12 7v4M16 7v9"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  collapse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M16 15l-3-3 3-3"/></svg>',
};
const badge = (kind) => `<span class="badge badge-${kind}">${ICON[kind]}</span>`;

// ---------- Mode ----------
// Dark by default in these mockups; ?theme=light or ?theme=dark forces it (used for screenshots), otherwise the last choice.
(function () {
  let theme = "dark";
  try { theme = localStorage.getItem("mock-theme") || theme; } catch (e) {}
  const q = new URLSearchParams(location.search).get("theme");
  if (q === "light" || q === "dark") theme = q;
  document.documentElement.dataset.theme = theme;
})();
window.toggleMode = () => {
  const dark = document.documentElement.dataset.theme !== "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector(".side-mode").setAttribute("aria-checked", String(dark));
  try { localStorage.setItem("mock-theme", dark ? "dark" : "light"); } catch (e) {}
};

// ---------- Sidebar navigation (collapsible) ----------
// Collapsed state is remembered per browser; ?collapsed=1 or ?collapsed=0 forces it (used for screenshots).
function sidebar(current) {
  const items = ["Dashboard", "Organizations", "Contacts", "Deals", "Pipeline"];
  let collapsed = false;
  try { collapsed = localStorage.getItem("sidebar-collapsed") === "1"; } catch (e) {}
  const q = new URLSearchParams(location.search).get("collapsed");
  if (q !== null) collapsed = q === "1";
  document.body.classList.add("with-sidebar");
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  window.toggleSidebar = () => {
    const c = document.body.classList.toggle("sidebar-collapsed");
    document.querySelector(".side-toggle").setAttribute("aria-expanded", String(!c));
    try { localStorage.setItem("sidebar-collapsed", c ? "1" : "0"); } catch (e) {}
  };
  return `<aside class="side" aria-label="Main navigation">
    <div class="side-top">
      <div class="logo"><span class="logo-mark" aria-hidden="true"></span><span class="side-text">Accountable</span></div>
    </div>
    <button class="btn btn-primary side-new" title="New deal">${ICON.plus}<span class="side-text">New deal</span></button>
    <nav class="side-links">${items.map((i) => `<a href="#" title="${i}" class="${i === current ? "current" : ""}" ${i === current ? 'aria-current="page"' : ""}>${ICON[i.toLowerCase()]}<span class="side-text">${i}</span></a>`).join("")}</nav>
    <button class="side-mode" role="switch" aria-checked="${document.documentElement.dataset.theme === "dark"}" onclick="toggleMode()" title="Dark mode">${ICON.moon}<span class="side-text">Dark mode</span><span class="switch" aria-hidden="true"></span></button>
    <button class="side-toggle" onclick="toggleSidebar()" aria-expanded="${!collapsed}" title="Collapse menu">${ICON.collapse}<span class="side-text">Collapse menu</span></button>
  </aside>`;
}

// ---------- Charts (inline SVG) ----------
function niceMax(v, steps = 4) {
  const raw = v / steps, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  return { max: step * steps, step };
}
function roundTopBar(x, y, w, h, r = 6) {
  if (h <= 0) return "";
  r = Math.min(r, w / 2, h);
  return `<path d="M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z"/>`;
}

// Line chart of money per month.
function lineChart({ values, labels = MONTHS, color = "var(--color-violet)", W = 720, H = 260, area = true, money = true, highlightLast = true }) {
  const L = 72, R = 16, T = 16, B = 32, iw = W - L - R, ih = H - T - B;
  const { max, step } = niceMax(Math.max(...values));
  const x = (i) => L + (iw * i) / (values.length - 1), y = (v) => T + ih - (ih * v) / max;
  let g = "";
  for (let v = 0; v <= max; v += step) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--color-divider)"/><text x="${L - 12}" y="${y(v) + 4}" text-anchor="end">${money ? usdShort(v) : v}</text>`;
  labels.forEach((m, i) => (g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${m}</text>`));
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const areaPath = area ? `<path d="M${x(0)},${y(0)} L${pts.replace(/ /g, " L")} L${x(values.length - 1)},${y(0)} Z" style="fill:${color}" opacity="0.08"/>` : "";
  const dots = values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${i === values.length - 1 && highlightLast ? 5 : 3}" style="fill:${i === values.length - 1 && highlightLast ? color : "var(--color-surface)"};stroke:${color}" stroke-width="2"/>`).join("");
  const last = values.length - 1;
  const tag = highlightLast ? `<text x="${x(last) - 10}" y="${y(values[last]) - 14}" text-anchor="end" style="fill:var(--color-text);font-weight:500">${usd(values[last])}</text>` : "";
  return `<svg viewBox="0 0 ${W} ${H}" role="img">${g}${areaPath}<polyline points="${pts}" fill="none" style="stroke:${color}" stroke-width="2.5" stroke-linejoin="round"/>${dots}${tag}</svg>`;
}

// Grouped bar chart of counts per month.
function groupedBars({ series, labels = MONTHS, W = 720, H = 240, barW = 12, gap = 4 }) {
  const L = 36, R = 8, T = 16, B = 32, iw = W - L - R, ih = H - T - B;
  const { max, step } = niceMax(Math.max(...series.flatMap((s) => s.values)), 4);
  const y = (v) => T + ih - (ih * v) / max, slot = iw / labels.length;
  let g = "";
  for (let v = 0; v <= max; v += step) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--color-divider)"/><text x="${L - 10}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  labels.forEach((m, i) => {
    const groupW = series.length * barW + (series.length - 1) * gap, x0 = L + slot * i + (slot - groupW) / 2;
    series.forEach((s, j) => { const v = s.values[i]; g += `<g style="fill:${s.color}">${roundTopBar(x0 + j * (barW + gap), y(v), barW, y(0) - y(v), 4)}</g>`; });
    g += `<text x="${L + slot * i + slot / 2}" y="${H - 8}" text-anchor="middle">${m}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
}

// Funnel figures: value at each stage or beyond, Won included, Lost left out.
function funnelSteps() {
  const keys = ["new", "qualified", "proposal", "negotiation", "won"];
  return keys.map((k, i) => {
    const rest = keys.slice(i);
    return { key: k, name: STAGES.find((s) => s.key === k).name, value: sum(rest.map((r) => stageTotals(r).value)), count: sum(rest.map((r) => stageTotals(r).count)) };
  });
}
