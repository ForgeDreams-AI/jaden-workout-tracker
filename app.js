"use strict";
/* Jaden's Workout Tracker — static front end, Google Sheet brain via Apps Script API */
var API_URL = "https://script.google.com/macros/s/AKfycbxyNvyHRXD5atjmbqkIxa_TFNB2XhfN_-xPlu7GJx9Ko3GNXoTeK-D6J5Mvz20bTxy6ig/exec";

/* 16-message daily bank: self-love, confidence, consistency, discipline */
var MESSAGES = [
  // self-love 💗
  "Loving yourself looks like showing up \u2014 and here you are. \uD83D\uDC97",
  "Your body does so much for you. Moving it is a thank-you note. \uD83C\uDF38",
  "You don't have to earn rest or joy. You deserve both, every day. \u2728",
  "Be as kind to yourself as you are to everyone else. \uD83D\uDC95",
  // confidence 👑
  "Walk in like you own the gym \u2014 because you do. \uD83D\uDC51",
  "Strong is your look. Wear it proudly. \uD83D\uDCAA",
  "You are capable of hard things. You've proved it before. \uD83D\uDD25",
  "Confidence is a muscle too. Every rep builds it. \uD83D\uDCAB",
  // consistency 🌱
  "Small steps every day beat perfect once in a while. \uD83C\uDF31",
  "You don't have to be perfect, just consistent. Keep going. \uD83C\uDF37",
  "Showing up again? That's the whole secret, babe. \u2B50",
  "Future you is cheering for today's you. Don't let her down. \uD83E\uDD8B",
  // discipline 🎯
  "Motivation starts it. Discipline finishes it. You've got both. \uD83C\uDFAF",
  "Do it tired, do it busy \u2014 just do it. That's discipline. \uD83D\uDCA5",
  "The hardest rep is the one you almost skipped. Crush it. \uD83C\uDFCB\uFE0F\u200D\u2640\uFE0F",
  "Discipline is choosing what you want most over what you want now. \uD83C\uDF3A"
];

var WORKOUTS = {
  upper:   { name: "Heavy Upper Body", emoji: "\uD83D\uDCAA", type: "lift",   tag: "Back & arms \u2014 lift heavy, pretty!",
             exercises: ["Landmine rows","Seated rows or lat pulldowns","Seated incline bicep curls","21s Z-bar","Cable tricep pushdowns"] },
  legs:    { name: "Heavy Legs",       emoji: "\uD83E\uDDB5", type: "lift",   tag: "Glutes, quads & hammies!",
             exercises: ["Leg press","B-stance RDL","Weighted lunges","Hamstring curl","Leg extension"] },
  circuit: { name: "Circuit Endurance",emoji: "\uD83D\uDD25", type: "lift",   tag: "Full-body fire \u2014 keep that heart happy!",
             exercises: ["Barbell OHP","Around the worlds","Elevated push-ups","Cable rear delt flies","Ski erg / rows"] },
  pilates: { name: "Pilates",          emoji: "\uD83E\uDDD8\u200D\u2640\uFE0F", type: "cardio", tag: "Core, control & grace" },
  run:     { name: "45-Minute Run",    emoji: "\uD83C\uDFC3\u200D\u2640\uFE0F", type: "cardio", tag: "Lace up, buttercup!" },
  hike:    { name: "Hike",             emoji: "\uD83E\uDD7E", type: "cardio", tag: "Fresh air + strong legs = happy girl" },
  rest:    { name: "Rest / Recovery",  emoji: "\uD83D\uDECC", type: "rest",   tag: "Rest is part of the plan too \uD83D\uDCA4" }
};
var REST_NAME = WORKOUTS.rest.name;
var ALL_EXERCISES = WORKOUTS.upper.exercises.concat(WORKOUTS.legs.exercises, WORKOUTS.circuit.exercises);

/* ---------- state ---------- */
var DB = { checkins: [], weights: [], months: [] };
var logDate = todayStr();
var logKey = null;

/* ---------- helpers ---------- */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function todayStr() {
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}
function prettyDate(ds) {
  var p = String(ds).split("-");
  if (p.length < 3) return ds;
  var d = new Date(+p[0], +p[1] - 1, +p[2]);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function dayName(ds) {
  var p = String(ds).split("-");
  var d = new Date(+p[0], +p[1] - 1, +p[2]);
  return d.toLocaleDateString(undefined, { weekday: "long" });
}
function prettyMonth(ym) {
  var p = String(ym).split("-");
  var d = new Date(+p[0], +p[1] - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function dayOfYear() {
  var n = new Date(), s = new Date(n.getFullYear(), 0, 0);
  return Math.floor((n - s) / 864e5);
}
function toast(msg, kind) {
  var wrap = document.getElementById("toast-wrap");
  var t = document.createElement("div");
  t.className = "toast" + (kind ? " " + kind : "");
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(function () { t.remove(); }, 3200);
}
function setStatus(id, msg, kind) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg || "";
  el.className = "status" + (kind ? " " + kind : "");
}

/* ---------- API ---------- */
function api(action, params) {
  params = params || {};
  params.action = action;
  var qs = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
  }).join("&");
  return fetch(API_URL + "?" + qs).then(function (res) {
    if (!res.ok) throw new Error("Network error (" + res.status + ")");
    return res.json();
  }).then(function (data) {
    if (data && data.ok === false) throw new Error(data.error || "Server error");
    return data;
  });
}
function refresh() {
  return api("read").then(function (data) {
    DB.checkins = (data.checkins || []).slice(1);
    DB.weights = (data.weights || []).slice(1);
    DB.months = (data.months || []).slice(1);
  });
}

/* ---------- nav ---------- */
function show(view) {
  document.querySelectorAll(".view").forEach(function (v) { v.classList.add("hidden"); });
  document.getElementById("view-" + view).classList.remove("hidden");
  document.querySelectorAll(".tab").forEach(function (t) {
    t.classList.toggle("active", t.getAttribute("data-view") === view);
  });
  if (view === "history") renderHistory();
  if (view === "month") renderMonth();
  window.scrollTo(0, 0);
}

/* ---------- home ---------- */
function consistentDays() {
  var s = {};
  DB.checkins.forEach(function (r) {
    if (String(r[2]) !== REST_NAME && r[0]) s[r[0]] = 1;
  });
  return Object.keys(s).length;
}
function renderHome() {
  var n = consistentDays();
  document.getElementById("streak-num").textContent = n;
  document.getElementById("streak-sub").textContent =
    n === 0 ? "Your journey starts today \uD83C\uDF38" :
    n === 1 ? "One day down \u2014 look at you go! \uD83C\uDF89" :
    "Keep that beautiful streak glowing \u2728";
  document.getElementById("daily-msg").textContent = MESSAGES[dayOfYear() % MESSAGES.length];
}

/* ---------- log flow ---------- */
function renderPicker() {
  var grid = document.getElementById("workout-grid");
  grid.innerHTML = "";
  Object.keys(WORKOUTS).forEach(function (key) {
    var w = WORKOUTS[key];
    var b = document.createElement("button");
    b.className = "workout-card" + (w.type === "rest" ? " rest" : "");
    b.innerHTML = '<div class="w-emoji">' + w.emoji + '</div>' +
      '<div class="w-name">' + esc(w.name) + '</div>' +
      '<div class="w-tag">' + esc(w.tag) + '</div>';
    b.addEventListener("click", function () { openDetail(key); });
    grid.appendChild(b);
  });
  document.getElementById("log-date").value = logDate;
  document.getElementById("log-step-pick").classList.remove("hidden");
  document.getElementById("log-step-detail").classList.add("hidden");
}
function lastWeight(ex) {
  for (var i = DB.weights.length - 1; i >= 0; i--) {
    if (String(DB.weights[i][1]) === ex) return { weight: DB.weights[i][2], reps: DB.weights[i][3] };
  }
  return { weight: "", reps: "" };
}
function openDetail(key) {
  logKey = key;
  var w = WORKOUTS[key];
  document.getElementById("detail-title").textContent = w.emoji + " " + w.name;
  document.getElementById("detail-tag").textContent = w.tag;
  document.getElementById("log-note").value = "";
  setStatus("log-status", "");
  var body = document.getElementById("detail-body");
  body.innerHTML = "";
  if (w.type === "lift") {
    w.exercises.forEach(function (ex, i) {
      var lw = lastWeight(ex);
      var row = document.createElement("div");
      row.className = "ex-row";
      row.innerHTML =
        '<label class="ex-head"><input type="checkbox" data-i="' + i + '"> <span>' + esc(ex) + '</span></label>' +
        '<div class="ex-fields">' +
        '<label>Weight (lbs)<input type="number" inputmode="decimal" min="0" step="0.5" data-w="' + i + '" value="' + esc(lw.weight) + '" placeholder="lbs"></label>' +
        '<label>Reps<input type="number" inputmode="numeric" min="0" step="1" data-r="' + i + '" value="' + esc(lw.reps) + '" placeholder="reps"></label>' +
        '</div>';
      body.appendChild(row);
    });
  } else if (w.type === "cardio") {
    body.innerHTML =
      '<div class="duration-row"><span>How long? ⏱️</span>' +
      '<input type="number" id="cardio-mins" inputmode="numeric" min="1" value="45">' +
      '<span>minutes</span></div>';
  } else {
    body.innerHTML = '<div class="empty">Log some cozy recovery \uD83D\uDE0C<br>Stretch, hydrate, sleep like a queen.</div>';
  }
  document.getElementById("log-step-pick").classList.add("hidden");
  document.getElementById("log-step-detail").classList.remove("hidden");
  window.scrollTo(0, 0);
}
function saveWorkout() {
  var btn = document.getElementById("save-workout");
  var w = WORKOUTS[logKey];
  var date = document.getElementById("log-date").value || todayStr();
  var note = document.getElementById("log-note").value.trim();
  var detail = "", items = [];
  if (w.type === "lift") {
    var boxes = document.querySelectorAll('#detail-body input[type="checkbox"]');
    boxes.forEach(function (cb) {
      if (!cb.checked) return;
      var i = cb.getAttribute("data-i");
      var ex = w.exercises[+i];
      var wt = document.querySelector('input[data-w="' + i + '"]').value;
      var rp = document.querySelector('input[data-r="' + i + '"]').value;
      items.push({ exercise: ex, weight: wt || "", reps: rp || "" });
    });
    if (!items.length) { toast("Check off at least one exercise first! \uD83D\uDE09", "error"); return; }
    detail = items.length + " exercise" + (items.length > 1 ? "s" : "");
  } else if (w.type === "cardio") {
    var mins = document.getElementById("cardio-mins").value || "";
    detail = mins ? mins + " min" : "";
  }
  btn.disabled = true;
  setStatus("log-status", "Saving your sunshine… ☁️");
  api("log", { date: date, day: dayName(date), workout: w.name, detail: detail, note: note })
    .then(function () {
      if (w.type === "lift") {
        return api("weights", { date: date, items: JSON.stringify(items) }).then(function () { return "both"; });
      }
      return "checkin";
    })
    .then(function () {
      return refresh();
    })
    .then(function () {
      renderHome();
      setStatus("log-status", "Saved! You're amazing! \uD83C\uDF89", "ok");
      toast("Workout logged! \uD83C\uDF89", "ok");
      setTimeout(function () { renderPicker(); show("home"); }, 1200);
    })
    .catch(function (err) {
      setStatus("log-status", "Couldn't save \u2014 check your connection and try again.", "error");
      toast("Save failed: " + err.message, "error");
    })
    .then(function () { btn.disabled = false; });
}

/* ---------- history ---------- */
function renderHistory() {
  var list = document.getElementById("checkin-list");
  setStatus("hist-status", DB.checkins.length ? "" : "");
  list.innerHTML = "";
  if (!DB.checkins.length) {
    list.innerHTML = '<div class="empty">No workouts yet \u2014 time to make some magic! \u2728</div>';
  }
  var rows = DB.checkins.slice().reverse();
  rows.forEach(function (r) {
    var date = r[0], workout = String(r[2] || ""), detail = r[3], note = r[4];
    var key = Object.keys(WORKOUTS).filter(function (k) { return WORKOUTS[k].name === workout; })[0];
    var emoji = key ? WORKOUTS[key].emoji : "\uD83C\uDF38";
    var div = document.createElement("div");
    div.className = "hist-item";
    div.innerHTML =
      '<div class="hist-emoji">' + emoji + '</div>' +
      '<div class="hist-main"><div class="hist-name">' + esc(workout) + '</div>' +
      '<div class="hist-meta">' + esc(prettyDate(date)) + (detail ? " \u00B7 " + esc(detail) : "") + '</div>' +
      (note ? '<div class="hist-note">\uD83D\uDCAD ' + esc(note) + '</div>' : '') + '</div>';
    var u = document.createElement("button");
    u.className = "btn secondary small";
    u.textContent = "Undo";
    u.addEventListener("click", function () {
      if (!confirm("Remove this check-in from " + prettyDate(date) + "?")) return;
      u.disabled = true;
      setStatus("hist-status", "Undoing…");
      api("unlog", { date: date }).then(refresh).then(function () {
        renderHome(); renderHistory();
        toast("Undone \u2014 no worries! \uD83D\uDC96", "ok");
        setStatus("hist-status", "");
      }).catch(function (err) {
        setStatus("hist-status", "Couldn't undo \u2014 try again.", "error");
        toast("Undo failed: " + err.message, "error");
        u.disabled = false;
      });
    });
    div.appendChild(u);
    list.appendChild(div);
  });
  renderExSelect();
  renderWeights();
}
function renderExSelect() {
  var sel = document.getElementById("ex-select");
  var cur = sel.value;
  sel.innerHTML = "";
  ALL_EXERCISES.forEach(function (ex) {
    var o = document.createElement("option");
    o.value = ex; o.textContent = ex;
    sel.appendChild(o);
  });
  if (cur && ALL_EXERCISES.indexOf(cur) >= 0) sel.value = cur;
}
function renderWeights() {
  var ex = document.getElementById("ex-select").value || ALL_EXERCISES[0];
  var list = document.getElementById("weights-list");
  list.innerHTML = "";
  var rows = DB.weights.filter(function (r) { return String(r[1]) === ex; }).slice().reverse();
  if (!rows.length) {
    list.innerHTML = '<div class="empty">No weights logged for this one yet \uD83D\uDCAA</div>';
    return;
  }
  rows.forEach(function (r) {
    var d = document.createElement("div");
    d.className = "w-row";
    d.innerHTML = '<span class="d">' + esc(prettyDate(r[0])) + '</span>' +
      '<span class="v">' + esc(r[2] === "" || r[2] == null ? "–" : r[2] + " lbs") + '</span>' +
      '<span>' + esc(r[3] === "" || r[3] == null ? "–" : r[3] + " reps") + '</span>';
    list.appendChild(d);
  });
}

/* ---------- month ---------- */
function renderMonth() {
  var ym = todayStr().slice(0, 7);
  document.getElementById("month-label").textContent = prettyMonth(ym);
  var found = null;
  DB.months.forEach(function (r) { if (String(r[0]).slice(0, 7) === ym) found = r; });
  document.getElementById("month-goal").value = found ? (found[1] || "") : "";
  document.getElementById("month-win").value = found ? (found[2] || "") : "";
  var list = document.getElementById("month-list");
  list.innerHTML = "";
  var past = DB.months.filter(function (r) { return String(r[0]).slice(0, 7) !== ym; }).slice().reverse();
  if (!past.length) {
    list.innerHTML = '<div class="empty">Past months will sparkle here \u2728</div>';
    return;
  }
  past.forEach(function (r) {
    var d = document.createElement("div");
    d.className = "month-item";
    d.innerHTML = '<div class="m">' + esc(prettyMonth(r[0])) + '</div>' +
      (r[1] ? '<div class="g">🎯 ' + esc(r[1]) + '</div>' : '') +
      (r[2] ? '<div class="w">🏆 ' + esc(r[2]) + '</div>' : '');
    list.appendChild(d);
  });
}
function saveMonth() {
  var btn = document.getElementById("save-month");
  var ym = todayStr().slice(0, 7);
  btn.disabled = true;
  setStatus("month-status", "Saving… ☁️");
  api("month", {
    month: ym,
    goal: document.getElementById("month-goal").value.trim(),
    bestwin: document.getElementById("month-win").value.trim()
  }).then(refresh).then(function () {
    renderMonth();
    setStatus("month-status", "Saved! Dream big, babe! \uD83C\uDF1F", "ok");
    toast("Month saved! \uD83C\uDF1F", "ok");
  }).catch(function (err) {
    setStatus("month-status", "Couldn't save \u2014 check your connection and try again.", "error");
    toast("Save failed: " + err.message, "error");
  }).then(function () { btn.disabled = false; });
}

/* ---------- init ---------- */
function init() {
  renderPicker();
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () { show(t.getAttribute("data-view")); });
  });
  document.getElementById("go-log").addEventListener("click", function () { show("log"); });
  document.getElementById("back-to-pick").addEventListener("click", renderPicker);
  document.getElementById("log-date").addEventListener("change", function (e) { logDate = e.target.value || todayStr(); });
  document.getElementById("save-workout").addEventListener("click", saveWorkout);
  document.getElementById("ex-select").addEventListener("change", renderWeights);
  document.getElementById("save-month").addEventListener("click", saveMonth);
  setStatus("home-status", "Loading your sunshine… ☁️");
  refresh().then(function () {
    renderHome();
    setStatus("home-status", "");
  }).catch(function (err) {
    setStatus("home-status", "", "");
    document.getElementById("streak-num").textContent = "–";
    document.getElementById("daily-msg").textContent = MESSAGES[dayOfYear() % MESSAGES.length];
    var retry = document.createElement("button");
    retry.className = "btn secondary";
    retry.textContent = "Couldn't connect \u2014 tap to retry 🔄";
    retry.addEventListener("click", function () { retry.remove(); init(); });
    document.getElementById("home-status").appendChild(retry);
    toast("Connection failed: " + err.message, "error");
  });
}
document.addEventListener("DOMContentLoaded", init);
