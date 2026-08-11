"use strict";

/* ============================================================
   Gate
   ============================================================ */
const GATE_HASH = "3debfbef8c98fd9a8e9371ccfd02c08de4d9ff420ff7ed68d93bc068c5e114a7";

async function sha256Hex(str) {
  const bytes = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function initGate() {
  const gate = document.getElementById("gate");
  const form = document.getElementById("gateForm");
  const input = document.getElementById("gatePassword");
  const error = document.getElementById("gateError");
  if (gate.classList.contains("is-unlocked")) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const hash = await sha256Hex(input.value.trim());
    if (hash === GATE_HASH) {
      localStorage.setItem("bridgekit_access", "granted");
      gate.classList.add("is-unlocked");
      error.classList.remove("is-visible");
    } else {
      error.classList.add("is-visible");
      input.value = "";
      input.focus();
    }
  });
}

/* ============================================================
   Theme
   ============================================================ */
function initTheme() {
  const toggle = document.getElementById("themeToggle");
  const root = document.documentElement;
  function effectiveTheme() {
    const attr = root.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") return attr;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  toggle.addEventListener("click", () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("bridgekit_theme", next);
  });
}

/* ============================================================
   Tabs
   ============================================================ */
function initTabs() {
  const btns = document.querySelectorAll(".tab-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("is-active"));
      document.getElementById("panel-" + btn.dataset.tab).classList.add("is-active");
    });
  });
}

/* ============================================================
   Toast
   ============================================================ */
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 1800);
}

/* ============================================================
   Utility
   ============================================================ */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function copyElementText(el, label) {
  const text = el.innerText.trim();
  if (!text) return;
  navigator.clipboard
    .writeText(text)
    .then(() => showToast((label || "Output") + " copied"))
    .catch(() => showToast("Couldn't copy — select and copy manually"));
}

/* ============================================================
   TOOL 1 — BridgeBlueprint
   ============================================================ */
const BP_AUTORESPONDERS = [
  { value: "aweber", label: "AWeber" },
  { value: "activecampaign", label: "ActiveCampaign" },
  { value: "getresponse", label: "GetResponse" },
  { value: "mailchimp", label: "Mailchimp" },
  { value: "convertkit", label: "ConvertKit / Kit" },
  { value: "gohighlevel", label: "GoHighLevel" },
  { value: "other-autoresponder", label: "Other autoresponder" },
];
const BP_SOURCES = [
  { value: "fb-leads", label: "Facebook / Instagram Lead Ads" },
  { value: "forms", label: "Forms (Contact Form 7, WPForms, Gravity Forms, etc.)" },
  { value: "webinar", label: "Zoom / webinar registrations" },
  { value: "calendly", label: "Calendly bookings" },
];
const BP_COMMERCE = [
  { value: "woocommerce", label: "WooCommerce" },
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "thrivecart", label: "ThriveCart" },
  { value: "jvzoo", label: "JVZoo" },
  { value: "warriorplus", label: "WarriorPlus" },
  { value: "clickbank", label: "ClickBank" },
];
const BP_TEAM = [
  { value: "slack", label: "Slack" },
  { value: "discord", label: "Discord" },
  { value: "telegram", label: "Telegram" },
];
const BP_AFFILIATE_COMMERCE = new Set(["jvzoo", "warriorplus", "clickbank"]);

const BP_WEIGHTS = {
  "list-builder": { lead: 1, commerce: 2, webinar: 1, refund: 3, team: 4 },
  affiliate: { lead: 2, commerce: 1, webinar: 3, refund: 2, team: 4 },
  course: { lead: 2, commerce: 1, webinar: 1, refund: 2, team: 4 },
  ecommerce: { lead: 3, commerce: 1, webinar: 4, refund: 1, team: 3 },
  agency: { lead: 2, commerce: 2, webinar: 3, refund: 3, team: 1 },
};

const BP_WHY = {
  lead: {
    "list-builder": "Your highest-volume lead source — capture these before anything else.",
    affiliate: "Cold traffic needs to land on a list you own, not just a click you paid for.",
    course: "Every interested lead should hit your nurture sequence automatically.",
    ecommerce: "Worth capturing, but converting existing traffic into buyers matters more first.",
    agency: "Useful, but client-facing automations usually come first for an agency.",
  },
  commerce: {
    "list-builder": "Buyers are your best leads — capture them the moment they convert.",
    affiliate: "Every buyer needs to land on a list you own, tagged by product, before the next promo.",
    course: "Every student should be tagged and dropped into onboarding automatically.",
    ecommerce: "Every customer should be tagged and get thank-you/onboarding without you touching it.",
    agency: "Client purchases should trigger onboarding without manual work on your end.",
  },
  webinar: {
    "list-builder": "Webinar registrants convert best with fast, automatic follow-up.",
    affiliate: "Good for warming an audience, but lower priority than direct buyer capture.",
    course: "Webinars are usually your top-of-funnel for course sales — follow up fast.",
    ecommerce: "Lower priority unless webinars are a core part of your funnel.",
    agency: "Useful for lead-gen webinars, but rank client work higher.",
  },
  refund: {
    "list-builder": "Route refunds to a win-back sequence instead of losing the relationship.",
    affiliate: "Route refunds/cancellations to their own list — don't keep mailing them like a happy buyer.",
    course: "Catch refunds early and route to a win-back or feedback sequence.",
    ecommerce: "Refunds and chargebacks should never sit in your regular buyer flow.",
    agency: "Route client cancellations to your own internal review process.",
  },
  team: {
    "list-builder": "Nice to have once the higher-priority bridges are live.",
    affiliate: "Nice to have — a live sale ping keeps momentum during a promo.",
    course: "Nice to have for team coordination during a launch.",
    ecommerce: "Nice to have for order visibility, not essential to build first.",
    agency: "High priority — your team needs to know the moment a client takes action.",
  },
};

function bpRenderChecklist() {
  const container = document.getElementById("bpAppChecks");
  const groups = [
    ["Autoresponders", BP_AUTORESPONDERS, "ar"],
    ["Lead sources", BP_SOURCES, "src"],
    ["Commerce & payments", BP_COMMERCE, "com"],
    ["Team alerts", BP_TEAM, "team"],
  ];
  container.innerHTML = groups
    .map(([title, items, prefix]) => {
      const rows = items
        .map(
          (i) => `<label class="check-item"><input type="checkbox" data-group="${prefix}" value="${i.value}" /> ${escapeHtml(i.label)}</label>`
        )
        .join("");
      return `<div class="check-group-title">${escapeHtml(title)}</div>${rows}`;
    })
    .join("");
}

function bpGetChecked(group) {
  return Array.from(document.querySelectorAll(`#bpAppChecks input[data-group="${group}"]:checked`)).map((el) => el.value);
}

function bpLabelFor(list, value) {
  const found = list.find((i) => i.value === value);
  return found ? found.label : value;
}

function bpDestination(autoresponders) {
  return autoresponders.length ? bpLabelFor(BP_AUTORESPONDERS, autoresponders[0]) : "your autoresponder";
}

function bpGenerate() {
  const businessType = document.getElementById("bpBusinessType").value;
  const weights = BP_WEIGHTS[businessType];
  const autoresponders = bpGetChecked("ar");
  const sources = bpGetChecked("src");
  const commerce = bpGetChecked("com");
  const team = bpGetChecked("team");
  const dest = bpDestination(autoresponders);

  const bridges = [];

  sources.forEach((s) => {
    if (s === "webinar") return; // handled separately with its own weight
    const label = bpLabelFor(BP_SOURCES, s);
    const tag = s === "fb-leads" ? "fb-lead" : s === "forms" ? "form-lead" : "booked-call";
    const timing = s === "calendly" ? "instant" : "instant";
    bridges.push({
      priority: weights.lead,
      title: `${label} → ${dest}`,
      meta: `Tag: ${tag} · Timing: ${timing}`,
      why: BP_WHY.lead[businessType],
    });
  });

  if (sources.includes("webinar")) {
    bridges.push({
      priority: weights.webinar,
      title: `Zoom Webinar Registration → ${dest}`,
      meta: "Tag: webinar-reg · Timing: instant (delay follow-up 1–2 days post-webinar)",
      why: BP_WHY.webinar[businessType],
    });
  }

  commerce.forEach((c) => {
    const label = bpLabelFor(BP_COMMERCE, c);
    const tag = BP_AFFILIATE_COMMERCE.has(c) ? "buyer-{product}" : "customer-{product}";
    bridges.push({
      priority: weights.commerce,
      title: `${label} Sale → ${dest}`,
      meta: `Tag: ${tag}, mapped per product · Timing: instant`,
      why: BP_WHY.commerce[businessType],
    });
  });

  if (commerce.length) {
    bridges.push({
      priority: weights.refund,
      title: `Refund / Cancellation (${commerce.map((c) => bpLabelFor(BP_COMMERCE, c)).join(", ")}) → Win-back list`,
      meta: "Tag: refunded · Timing: instant",
      why: BP_WHY.refund[businessType],
    });
  }

  team.forEach((t) => {
    const label = bpLabelFor(BP_TEAM, t);
    const trigger = commerce.length ? "New Sale" : sources.length ? "New Lead" : "Activity";
    bridges.push({
      priority: weights.team,
      title: `${trigger} → ${label} notification`,
      meta: "Timing: instant",
      why: BP_WHY.team[businessType],
    });
  });

  bridges.sort((a, b) => a.priority - b.priority);

  const out = document.getElementById("bpOutput");
  if (!bridges.length) {
    out.innerHTML = `<p class="output-empty">Check at least one app above, then generate.</p>`;
    return;
  }
  let html = "";
  if (!autoresponders.length) {
    html += `<p class="output-empty" style="margin-bottom:12px;">Tip: check an autoresponder too so bridges name the exact destination app.</p>`;
  }
  html += bridges
    .map(
      (b, i) => `<div class="bridge-item">
        <div class="bridge-title"><span class="priority-chip">${i + 1}</span>${escapeHtml(b.title)}</div>
        <div class="bridge-meta">${escapeHtml(b.meta)}</div>
        <div class="bridge-meta">${escapeHtml(b.why)}</div>
      </div>`
    )
    .join("");
  out.innerHTML = html;

  localStorage.setItem(
    "bridgekit_bp_state",
    JSON.stringify({ businessType, autoresponders, sources, commerce, team })
  );
}

function bpRestore() {
  const raw = localStorage.getItem("bridgekit_bp_state");
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    document.getElementById("bpBusinessType").value = state.businessType || "list-builder";
    ["ar", "src", "com", "team"].forEach((prefix, idx) => {
      const arr = [state.autoresponders, state.sources, state.commerce, state.team][idx] || [];
      arr.forEach((v) => {
        const el = document.querySelector(`#bpAppChecks input[data-group="${prefix}"][value="${v}"]`);
        if (el) el.checked = true;
      });
    });
  } catch (e) {
    /* ignore malformed saved state */
  }
}

function initBridgeBlueprint() {
  bpRenderChecklist();
  bpRestore();
  document.getElementById("bpGenerate").addEventListener("click", bpGenerate);
  document.getElementById("bpCopy").addEventListener("click", () => copyElementText(document.getElementById("bpOutput"), "Build order"));
}

/* ============================================================
   TOOL 2 — FollowUp Forge
   ============================================================ */
const FF_TEMPLATES = {
  direct: [
    {
      day: "Day 2",
      subject: "Quick follow-up on {offer}",
      body:
        "Hey {first_name},\n\n" +
        "Wanted to make sure this didn't slip past you: {offer} is live, and it's a fit if you're dealing with what most people on this list deal with — {angle}.\n\n" +
        "It's {price}, and here's the link if you haven't looked yet:\n{link}\n\n" +
        "Talk soon,\n[YOUR NAME]",
    },
    {
      day: "Day 5",
      subject: "In case you missed it — {offer}",
      body:
        "Hey {first_name},\n\n" +
        "A few people asked what makes {offer} worth a look, so here's the short version: {angle}.\n\n" +
        "Still {price}, still available here:\n{link}\n\n" +
        "If you've already grabbed it, ignore this — just didn't want you to miss it if not.\n\n" +
        "[YOUR NAME]",
    },
    {
      day: "Day 14",
      subject: "Last call: {offer}",
      body:
        "Hey {first_name},\n\n" +
        "Closing the loop on {offer}. If {angle} is something you still need solved, this is your reminder before it's off my radar for new mentions.\n\n" +
        "{price}, here:\n{link}\n\n" +
        "[YOUR NAME]",
    },
  ],
  story: [
    {
      day: "Day 2",
      subject: "Why I almost skipped {offer}",
      body:
        "Hey {first_name},\n\n" +
        "Honestly, when I first saw {offer} I almost scrolled past it. Then I actually looked at what it does — {angle} — and that changed things.\n\n" +
        "It's {price}. Worth two minutes of your time here:\n{link}\n\n" +
        "[YOUR NAME]",
    },
    {
      day: "Day 5",
      subject: "What changed my mind about {offer}",
      body:
        "Hey {first_name},\n\n" +
        "Following up on {offer} — the thing that actually got me was how directly it deals with {angle}. Not a nice-to-have, an actual fix.\n\n" +
        "Still {price} if you want to see for yourself:\n{link}\n\n" +
        "[YOUR NAME]",
    },
    {
      day: "Day 14",
      subject: "One more thing about {offer}",
      body:
        "Hey {first_name},\n\n" +
        "Last time I'll bring up {offer}. If {angle} is still on your plate unsolved, this is the easiest way I know to fix it — {price}, one link:\n{link}\n\n" +
        "[YOUR NAME]",
    },
  ],
};

function ffFill(str, vars) {
  return str.replace(/\{(\w+)\}/g, (m, key) => (key === "first_name" ? "{first_name}" : vars[key] || m));
}

function ffGenerate() {
  const offer = document.getElementById("ffOffer").value.trim();
  const price = document.getElementById("ffPrice").value.trim();
  const angle = document.getElementById("ffAngle").value.trim();
  const link = document.getElementById("ffLink").value.trim() || "[YOUR AFFILIATE LINK]";
  const tone = document.querySelector("#ffTone .seg-btn.is-active").dataset.tone;

  const out = document.getElementById("ffOutput");
  if (!offer || !price || !angle) {
    out.innerHTML = `<p class="output-empty">Fill in offer name, price, and angle, then generate.</p>`;
    return;
  }

  const vars = { offer, price, angle, link };
  const emails = FF_TEMPLATES[tone];
  out.innerHTML = emails
    .map(
      (e) => `<div class="email-block">
        <div class="email-day">${escapeHtml(e.day)}</div>
        <div class="email-subject">Subject: ${escapeHtml(ffFill(e.subject, vars))}</div>
        <div class="email-body">${escapeHtml(ffFill(e.body, vars))}</div>
      </div>`
    )
    .join("");

  localStorage.setItem("bridgekit_ff_state", JSON.stringify({ offer, price, angle, link, tone }));
}

function ffRestore() {
  const raw = localStorage.getItem("bridgekit_ff_state");
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    document.getElementById("ffOffer").value = s.offer || "";
    document.getElementById("ffPrice").value = s.price || "";
    document.getElementById("ffAngle").value = s.angle || "";
    document.getElementById("ffLink").value = s.link || "";
    if (s.tone) {
      document.querySelectorAll("#ffTone .seg-btn").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.tone === s.tone);
      });
    }
  } catch (e) {
    /* ignore malformed saved state */
  }
}

function initFollowUpForge() {
  ffRestore();
  document.querySelectorAll("#ffTone .seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#ffTone .seg-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
  });
  document.getElementById("ffGenerate").addEventListener("click", ffGenerate);
  document.getElementById("ffCopy").addEventListener("click", () => copyElementText(document.getElementById("ffOutput"), "Sequence"));
}

/* ============================================================
   TOOL 3 — LeakCalc
   ============================================================ */
function lcNum(id) {
  const raw = document.getElementById(id).value.trim();
  const n = parseFloat(raw);
  return isNaN(n) || n < 0 ? 0 : n;
}

function lcMoney(n) {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function lcCalculate() {
  const leads = lcNum("lcLeads");
  const dropoff = lcNum("lcDropoff");
  const value = lcNum("lcValue");
  const zapierCost = lcNum("lcZapierCost");

  const out = document.getElementById("lcOutput");
  if (!leads || !dropoff || !value) {
    out.innerHTML = `<p class="output-empty">Enter your monthly leads, drop-off %, and subscriber value, then calculate.</p>`;
    return;
  }

  const lostPerMonth = leads * (dropoff / 100);
  const lostPerYear = lostPerMonth * 12;
  const annualValueLost = lostPerYear * value * 12;
  const zapier5yr = zapierCost * 12 * 5;
  const wpSyncLow = 47;
  const wpSyncHigh = 147;
  const savingsLow = Math.max(0, zapier5yr - wpSyncHigh);
  const savingsHigh = Math.max(0, zapier5yr - wpSyncLow);

  let html = `<div class="stat-row">
      <div class="stat-tile"><div class="stat-value">${Math.round(lostPerMonth)}</div><div class="stat-label">Leads lost / month</div></div>
      <div class="stat-tile"><div class="stat-value">${Math.round(lostPerYear)}</div><div class="stat-label">Leads lost / year</div></div>
      <div class="stat-tile"><div class="stat-value">${lcMoney(annualValueLost)}</div><div class="stat-label">Est. value at risk / year</div></div>
    </div>
    <p>At ${dropoff}% drop-off on ${leads} monthly leads, you're losing roughly <strong>${Math.round(lostPerMonth)} leads a month</strong> — about <strong>${Math.round(lostPerYear)}</strong> over a year. At ${lcMoney(value)}/month in subscriber value each, that's an estimated <strong>${lcMoney(annualValueLost)}</strong> in value never captured.</p>`;

  if (zapierCost > 0) {
    html += `<div class="stat-row" style="margin-top:6px;">
      <div class="stat-tile"><div class="stat-value">${lcMoney(zapier5yr)}</div><div class="stat-label">Zapier/Make/Pabbly, 5 years</div></div>
      <div class="stat-tile"><div class="stat-value">${lcMoney(wpSyncLow)}–${lcMoney(wpSyncHigh)}</div><div class="stat-label">WP Sync, once</div></div>
      <div class="stat-tile"><div class="stat-value">${lcMoney(savingsLow)}–${lcMoney(savingsHigh)}</div><div class="stat-label">Est. 5-year savings</div></div>
    </div>
    <p>At ${lcMoney(zapierCost)}/month, your current automation tool costs about <strong>${lcMoney(zapier5yr)}</strong> over 5 years. WP Sync is a one-time ${lcMoney(wpSyncLow)}–${lcMoney(wpSyncHigh)}, so switching saves an estimated <strong>${lcMoney(savingsLow)}–${lcMoney(savingsHigh)}</strong> over the same period.</p>`;
  } else {
    html += `<p>You're not currently paying for Zapier, Make, or Pabbly — but the leads above are still slipping through without automation. WP Sync is a one-time ${lcMoney(wpSyncLow)}–${lcMoney(wpSyncHigh)}.</p>`;
  }

  html += `<p style="color:var(--ink-soft); font-size:12px;">These are illustrations based on the numbers you entered, not a guarantee of results.</p>`;

  out.innerHTML = html;
  localStorage.setItem("bridgekit_lc_state", JSON.stringify({ leads, dropoff, value, zapierCost }));
}

function lcRestore() {
  const raw = localStorage.getItem("bridgekit_lc_state");
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    if (s.leads) document.getElementById("lcLeads").value = s.leads;
    if (s.dropoff) document.getElementById("lcDropoff").value = s.dropoff;
    if (s.value) document.getElementById("lcValue").value = s.value;
    if (s.zapierCost) document.getElementById("lcZapierCost").value = s.zapierCost;
  } catch (e) {
    /* ignore malformed saved state */
  }
}

function initLeakCalc() {
  lcRestore();
  document.getElementById("lcCalculate").addEventListener("click", lcCalculate);
  document.getElementById("lcCopy").addEventListener("click", () => copyElementText(document.getElementById("lcOutput"), "Numbers"));
}

/* ============================================================
   Boot
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initGate();
  initTheme();
  initTabs();
  initBridgeBlueprint();
  initFollowUpForge();
  initLeakCalc();
});
