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

/* ------------------------------------------------------------------
   EXERCISE HELP VIDEOS — "Need help? 🎥" links under each lift exercise.
   Real Instagram reels/posts demonstrating good form, verified Oct 2026.
   To update a link, just replace the URL string. To remove a video,
   delete its line and the help link won't render for that exercise.
   NOTE: "Elevated push-ups" intentionally has no link — no verified
   Instagram demo of that exact variation was found (a missing link is
   better than a wrong one).
------------------------------------------------------------------ */
var EXERCISE_VIDEOS = {
  "Landmine rows": "https://www.instagram.com/reel/DcZzJZEKA5H/",
  "Seated rows or lat pulldowns": "https://www.instagram.com/reel/Dc9J-EnJlEa/",
  "Seated incline bicep curls": "https://www.instagram.com/reel/DSWTKzLASVU/",
  "21s Z-bar": "https://www.instagram.com/reel/DZYzjJxxKQY/",
  "Cable tricep pushdowns": "https://www.instagram.com/reel/DcvmkH5OSYr/",
  "Leg press": "https://www.instagram.com/reel/DVzbgb_Esr0/",
  "B-stance RDL": "https://www.instagram.com/reel/DdPw6llpZWA/",
  "Weighted lunges": "https://www.instagram.com/reel/DcRfKAngzuI/",
  "Hamstring curl": "https://www.instagram.com/reel/DWUiBKQD-Yo/",
  "Leg extension": "https://www.instagram.com/reel/DUV_oBWkZvp/",
  "Barbell OHP": "https://www.instagram.com/reel/DdF_8t1ylSh/",
  "Around the worlds": "https://www.instagram.com/reel/Dc_1kHjIeFT/",
  "Cable rear delt flies": "https://www.instagram.com/reel/DcgnMi-II1W/",
  "Ski erg / rows": "https://www.instagram.com/reel/DaPUFm9zKB7/"
};

/* Prescribed set schemes per lift exercise (his gym-tracker style: "3 × 10"). */
var SCHEMES = {  "Landmine rows": { sets: 3, reps: 10 },
  "Seated rows or lat pulldowns": { sets: 3, reps: 12 },
  "Seated incline bicep curls": { sets: 3, reps: 12 },
  "21s Z-bar": { sets: 3, reps: 21 },
  "Cable tricep pushdowns": { sets: 3, reps: 12 },
  "Leg press": { sets: 3, reps: 12 },
  "B-stance RDL": { sets: 3, reps: 10 },
  "Weighted lunges": { sets: 3, reps: 12 },
  "Hamstring curl": { sets: 3, reps: 12 },
  "Leg extension": { sets: 3, reps: 12 },
  "Barbell OHP": { sets: 3, reps: 10 },
  "Around the worlds": { sets: 3, reps: 12 },
  "Elevated push-ups": { sets: 3, reps: 12 },
  "Cable rear delt flies": { sets: 3, reps: 15 },
  "Ski erg / rows": { sets: 3, reps: 12 }
};

/* ------------------------------------------------------------------
   EXERCISE DEMO PICTURES — free-exercise-db, two frames per exercise.
   Shown in the "Need help?" bottom sheet. Verified 200 (Oct 2026).
------------------------------------------------------------------ */
var IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
function imgPair(path) {
  return [IMG_BASE + path + "/0.jpg", IMG_BASE + path + "/1.jpg"];
}
var EXERCISE_IMAGES = {
  "Landmine rows": imgPair("T-Bar_Row_with_Handle"),
  "Seated rows or lat pulldowns": imgPair("Seated_Cable_Rows"),
  "Seated incline bicep curls": imgPair("Alternate_Incline_Dumbbell_Curl"),
  "21s Z-bar": imgPair("EZ-Bar_Curl"),
  "Cable tricep pushdowns": imgPair("Triceps_Pushdown"),
  "Leg press": imgPair("Leg_Press"),
  "B-stance RDL": imgPair("Romanian_Deadlift"),
  "Weighted lunges": imgPair("Dumbbell_Lunges"),
  "Hamstring curl": imgPair("Lying_Leg_Curls"),
  "Leg extension": imgPair("Leg_Extensions"),
  "Barbell OHP": imgPair("Standing_Military_Press"),
  "Around the worlds": imgPair("Around_The_Worlds"),
  "Elevated push-ups": imgPair("Decline_Push-Up"),
  "Cable rear delt flies": imgPair("Cable_Rear_Delt_Fly"),
  "Ski erg / rows": imgPair("Rowing_Stationary")
};

/* ---------- state ---------- */
var DB = { checkins: [], weights: [], months: [] };
var logDate = todayStr();
var logKey = null;
var logStartTime = null; // ISO timestamp set when she picks a workout

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
  var timeout = new Promise(function (_, reject) {
    setTimeout(function () { reject(new Error("Request timed out")); }, 20000);
  });
  var req = fetch(API_URL + "?" + qs).then(function (res) {
    if (!res.ok) throw new Error("Network error (" + res.status + ")");
    return res.json();
  }).then(function (data) {
    if (data && data.ok === false) throw new Error(data.error || "Server error");
    return data;
  });
  return Promise.race([req, timeout]);
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
  if (view === "calendar") {
    renderCalMonth();
    renderCalendar();
    renderMonth();
    renderExSelect();
    renderWeights();
  }
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
    var r = DB.weights[i];
    if (String(r[1]) !== ex) continue;
    // New layout is [Date, Exercise, Set, Weight, Reps]; old was [Date, Exercise, Weight, Reps].
    if (r.length >= 5) return { weight: r[3], reps: r[4] };
    return { weight: r[2], reps: r[3] };
  }
  return { weight: "", reps: "" };
}
/* One set row inside an exercise block: set badge + weight + reps (table style). */
function setRowHTML(i, s, w, r) {
  return '<div class="set-row" data-ex="' + i + '" data-set="' + s + '">' +
    '<span class="set-badge">' + s + '</span>' +
    '<label class="set-input"><input type="number" inputmode="decimal" min="0" step="0.5" data-w value="' + esc(w) + '" placeholder="–"><span class="unit">lb</span></label>' +
    '<label class="set-input"><input type="number" inputmode="numeric" min="0" step="1" data-r value="' + esc(r) + '" placeholder="–"><span class="unit">reps</span></label>' +
    '</div>';
}
/* Live "X/Y sets" counter in the workout header: X = set rows with weight or
   reps entered, Y = total set rows. Updates as she types. */
function updateSetCount() {
  var rows = document.querySelectorAll('#detail-body .set-row');
  var done = 0;
  rows.forEach(function (sr) {
    var wt = sr.querySelector('input[data-w]').value;
    var rp = sr.querySelector('input[data-r]').value;
    if (wt !== "" || rp !== "") done++;
  });
  var doneEl = document.getElementById("sets-done");
  var totalEl = document.getElementById("sets-total");
  if (doneEl) doneEl.textContent = done;
  if (totalEl) totalEl.textContent = "/" + rows.length + " sets";
}
/* Normalize a Weights row to {date, exercise, set, weight, reps}.
   New layout is [Date, Exercise, Set, Weight, Reps]; old was [Date, Exercise, Weight, Reps]. */
function normWRow(r) {
  if (r.length >= 5) return { date: String(r[0]), exercise: String(r[1]), set: r[2], weight: r[3], reps: r[4] };
  return { date: String(r[0]), exercise: String(r[1]), set: 1, weight: r[2], reps: r[3] };
}
function num(x) {
  var n = parseFloat(x);
  return isNaN(n) ? null : n;
}
/* Most recent date strictly before `date` with sets logged for the exercise. */
function lastSession(ex, date) {
  var byDate = {}, best = null;
  DB.weights.forEach(function (r) {
    var w = normWRow(r);
    if (w.exercise !== ex) return;
    if (!w.date || w.date >= date) return;
    if (!byDate[w.date]) byDate[w.date] = [];
    byDate[w.date].push(w);
  });
  Object.keys(byDate).forEach(function (d) { if (best === null || d > best) best = d; });
  if (best === null) return null;
  return { date: best, sets: byDate[best] };
}
/* All-time max weight for the exercise on dates strictly before `date`. */
function prevMaxWeight(ex, date) {
  var mx = null;
  DB.weights.forEach(function (r) {
    var w = normWRow(r);
    if (w.exercise !== ex) return;
    if (!w.date || w.date >= date) return;
    var wt = num(w.weight);
    if (wt === null) return;
    if (mx === null || wt > mx) mx = wt;
  });
  return mx;
}
/* Progressive-overload coach (E): suggestion + Set-1 prefill from her last session. */
var LEG_EXERCISES = ["Leg press", "B-stance RDL", "Weighted lunges", "Hamstring curl", "Leg extension"];
function coachFor(ex, date) {
  var sess = lastSession(ex, date);
  if (!sess) {
    var lw = lastWeight(ex);
    return { line: "", weight: lw.weight, reps: lw.reps };
  }
  var topW = null, topReps = "", wCount = 0, repSum = 0, repCount = 0;
  sess.sets.forEach(function (s) {
    var wt = num(s.weight), rp = num(s.reps);
    if (wt !== null) {
      wCount++;
      if (topW === null || wt > topW) { topW = wt; topReps = s.reps == null ? "" : String(s.reps); }
    }
    if (rp !== null) { repSum += rp; repCount++; }
  });
  if (topW === null) {
    var lw2 = lastWeight(ex);
    return { line: "", weight: lw2.weight, reps: lw2.reps };
  }
  var avg = repCount ? repSum / repCount : null;
  var setsTxt = "Last time: " + topW + " lbs \u00D7 " +
    sess.sets.map(function (s) { return s.reps == null || s.reps === "" ? "\u2013" : String(s.reps); }).join(", ");
  var bump = LEG_EXERCISES.indexOf(ex) >= 0 ? 10 : 5;
  if (wCount >= 2 && avg !== null && avg >= 8) {
    var target = Math.round((topW + bump) * 10) / 10;
    return {
      line: setsTxt + " \u2014 you crushed it! Try " + target + " lbs today \uD83D\uDCAA",
      weight: String(target), reps: topReps
    };
  }
  return { line: setsTxt + " \uD83D\uDC96", weight: String(topW), reps: topReps };
}
/* Workout name -> WORKOUTS key, for emoji + type lookups. */
var NAME2KEY = {};
Object.keys(WORKOUTS).forEach(function (k) { NAME2KEY[WORKOUTS[k].name] = k; });
function checkinByDate(ds) {
  for (var i = 0; i < DB.checkins.length; i++) {
    if (String(DB.checkins[i][0]) === ds) return DB.checkins[i];
  }
  return null;
}
/* "+ Add set" taps (delegated on #detail-body, attached once in init). */
function addSetTap(e) {
  var btn = e.target && e.target.closest ? e.target.closest("[data-add]") : null;
  if (!btn) return;
  var i = btn.getAttribute("data-add");
  var setsDiv = document.querySelector('.sets[data-sets="' + i + '"]');
  if (!setsDiv) return;
  var existing = setsDiv.querySelectorAll(".set-row");
  var last = existing[existing.length - 1];
  var lw = last ? last.querySelector("input[data-w]").value : "";
  var lr = last ? last.querySelector("input[data-r]").value : "";
  var tmp = document.createElement("div");
  tmp.innerHTML = setRowHTML(i, existing.length + 1, lw, lr);
  setsDiv.appendChild(tmp.firstChild);
  updateSetCount();
}
/* ---------- "Need help?" bottom sheet ---------- */
/* Opens the exercise help sheet: name, demo pictures, coach tip, video link. */
function openHelpModal(exIdx) {
  var w = WORKOUTS[logKey];
  if (!w) return;
  var ex = w.exercises[+exIdx];
  if (!ex) return;
  var block = document.querySelector('.ex-block[data-ex="' + exIdx + '"]');
  var coachEl = block ? block.querySelector(".coach-line") : null;
  document.getElementById("help-title").textContent = ex;
  var imgs = document.getElementById("help-imgs");
  imgs.innerHTML = "";
  var urls = EXERCISE_IMAGES[ex] || [];
  if (!urls.length) {
    imgs.innerHTML = '<div class="empty">No demo pictures for this one yet \uD83C\uDF37</div>';
  } else {
    var failed = 0;
    urls.forEach(function (u) {
      var img = document.createElement("img");
      img.src = u;
      img.alt = ex + " demo";
      img.loading = "lazy";
      img.onerror = function () {
        failed++;
        img.remove();
        if (failed >= urls.length) {
          imgs.innerHTML = '<div class="empty">Pictures wouldn\'t load \u2014 try the video below! \uD83C\uDF37</div>';
        }
      };
      imgs.appendChild(img);
    });
  }
  var hc = document.getElementById("help-coach");
  if (coachEl && coachEl.textContent.trim()) {
    hc.textContent = coachEl.textContent;
    hc.style.display = "";
  } else {
    hc.style.display = "none";
  }
  var vid = document.getElementById("help-video");
  if (EXERCISE_VIDEOS[ex]) {
    vid.href = EXERCISE_VIDEOS[ex];
    vid.style.display = "";
  } else {
    vid.style.display = "none";
  }
  document.getElementById("help-modal").classList.remove("hidden");
}
function closeHelpModal() {
  document.getElementById("help-modal").classList.add("hidden");
}
/* Delegated taps on "Need help?" buttons (attached once in init). */
function helpTap(e) {
  var btn = e.target && e.target.closest ? e.target.closest("[data-help]") : null;
  if (!btn) return;
  openHelpModal(btn.getAttribute("data-help"));
}
function openDetail(key) {
  logKey = key;
  // Track when she starts logging: times the workout + enables the 2h nudge if she never submits.
  logStartTime = new Date().toISOString();
  api("start", { startedAt: logStartTime, date: document.getElementById("log-date").value || todayStr() })
    .catch(function () { /* best-effort; never block the UI */ });
  var w = WORKOUTS[key];
  document.getElementById("detail-title").textContent = w.emoji + " " + w.name;
  document.getElementById("detail-tag").textContent = w.tag;
  document.getElementById("log-note").value = "";
  setStatus("log-status", "");
  var body = document.getElementById("detail-body");
  body.innerHTML = "";
  if (w.type === "lift") {
    document.getElementById("log-count").style.display = "";
    w.exercises.forEach(function (ex, i) {
      var coach = coachFor(ex, logDate);
      var scheme = SCHEMES[ex] || { sets: 3, reps: 10 };
      var block = document.createElement("div");
      block.className = "ex-block";
      block.setAttribute("data-ex", i);
      var setsHTML = "";
      for (var s = 1; s <= scheme.sets; s++) {
        setsHTML += setRowHTML(i, s, s === 1 ? coach.weight : "", s === 1 ? coach.reps : "");
      }
      block.innerHTML =
        '<div class="ex-head-row">' +
          '<span class="ex-num">' + ("0" + (i + 1)).slice(-2) + '</span>' +
          '<div class="ex-title-wrap">' +
            '<div class="ex-name">' + esc(ex) + '</div>' +
            '<div class="ex-scheme">' + scheme.sets + " \u00D7 " + scheme.reps + '</div>' +
            (EXERCISE_VIDEOS[ex] ? '<button type="button" class="help-link" data-help="' + i + '">Need help? \uD83C\uDFa5</button>' : "") +
            (coach.line ? '<div class="coach-line">\uD83D\uDCA1 ' + esc(coach.line) + '</div>' : "") +
          '</div>' +
        '</div>' +
        '<div class="sets-head"><span>SET</span><span>WEIGHT</span><span>REPS</span></div>' +
        '<div class="sets" data-sets="' + i + '">' + setsHTML + '</div>' +
        '<button type="button" class="btn secondary small add-set" data-add="' + i + '">+ Add set</button>';
      body.appendChild(block);
    });
    updateSetCount();
  } else if (w.type === "cardio") {
    document.getElementById("log-count").style.display = "none";
    body.innerHTML =
      '<div class="duration-row"><span>How long? ⏱️</span>' +
      '<input type="number" id="cardio-mins" inputmode="numeric" min="1" value="45">' +
      '<span>minutes</span></div>';
  } else {
    document.getElementById("log-count").style.display = "none";
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
    // No checkbox: a set counts as done when weight OR reps is filled in.
    var blocks = document.querySelectorAll('#detail-body .ex-block');
    blocks.forEach(function (blk) {
      var ex = w.exercises[+blk.getAttribute("data-ex")];
      blk.querySelectorAll(".set-row").forEach(function (sr, sIdx) {
        var wt = sr.querySelector("input[data-w]").value;
        var rp = sr.querySelector("input[data-r]").value;
        if (wt === "" && rp === "") return; // skip untouched sets
        items.push({ exercise: ex, set: sIdx + 1, weight: wt || "", reps: rp || "" });
      });
    });
    if (!items.length) { toast("Fill in at least one set first! \uD83D\uDE09", "error"); return; }
    detail = items.length + " set" + (items.length > 1 ? "s" : "");
  } else if (w.type === "cardio") {
    var mins = document.getElementById("cardio-mins").value || "";
    detail = mins ? mins + " min" : "";
  }
  btn.disabled = true;
  setStatus("log-status", "Saving your sunshine… ☁️");
  // Personal records: any set beating her all-time max for that exercise (before this date).
  var prs = [];
  if (w.type === "lift") {
    items.forEach(function (it) {
      var wt = num(it.weight);
      if (wt === null) return;
      var prevMax = prevMaxWeight(it.exercise, date);
      if (prevMax !== null && wt > prevMax) {
        prs.push({ exercise: it.exercise, weight: it.weight, reps: it.reps || "" });
      }
    });
  }
  api("log", { date: date, day: dayName(date), workout: w.name, detail: detail, note: note,
    startedAt: logStartTime || "", items: JSON.stringify(items), prs: JSON.stringify(prs) })
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
      if (prs.length) {
        showPRModal(prs);
      } else {
      setStatus("log-status", "Saved! You're amazing! \uD83C\uDF89", "ok");
      toast("Workout logged! \uD83C\uDF89", "ok");
      setTimeout(function () { renderPicker(); show("home"); }, 1200);
      }
    })
    .catch(function (err) {
      setStatus("log-status", "Couldn't save \u2014 check your connection and try again.", "error");
      toast("Save failed: " + err.message, "error");
    })
    .then(function () { btn.disabled = false; });
}

/* ---------- calendar ---------- */
var calY = null, calM = null, calDetailDate = null;
function renderCalMonth() {
  var now = new Date();
  if (calY === null) { calY = now.getFullYear(); calM = now.getMonth(); }
}
function renderCalendar() {
  renderCalMonth();
  document.getElementById("cal-title").textContent =
    new Date(calY, calM, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  var grid = document.getElementById("cal-grid");
  grid.innerHTML = "";
  ["S", "M", "T", "W", "T", "F", "S"].forEach(function (d) {
    var h = document.createElement("div");
    h.className = "cal-dow";
    h.textContent = d;
    grid.appendChild(h);
  });
  var first = new Date(calY, calM, 1).getDay();
  var daysIn = new Date(calY, calM + 1, 0).getDate();
  var todayS = todayStr();
  for (var b = 0; b < first; b++) {
    var blank = document.createElement("div");
    blank.className = "cal-day blank";
    grid.appendChild(blank);
  }
  for (var d = 1; d <= daysIn; d++) {
    (function (day) {
      var ds = calY + "-" + String(calM + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
      var ci = checkinByDate(ds);
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cal-day" + (ci ? " has-log" : "") + (ds === todayS ? " today" : "");
      var inner = '<span class="cal-num">' + day + "</span>";
      if (ci) {
        var key = NAME2KEY[String(ci[2] || "")];
        var w = key ? WORKOUTS[key] : null;
        inner += '<span class="cal-emoji">' + (w ? w.emoji : "🌸") + "</span>" +
          '<span class="dot ' + (w ? "t-" + w.type : "t-rest") + '"></span>';
      }
      cell.innerHTML = inner;
      cell.addEventListener("click", function () { renderDayDetail(ds); });
      grid.appendChild(cell);
    })(d);
  }
  if (calDetailDate) renderDayDetail(calDetailDate);
}
function renderDayDetail(ds) {
  calDetailDate = ds;
  var wrap = document.getElementById("day-detail");
  var ci = checkinByDate(ds);
  if (!ci) {
    wrap.innerHTML = '<div class="card day-detail"><p class="tagline">Nothing logged this day — tap the ➕ to add a workout! 🌷</p></div>';
    return;
  }
  var key = NAME2KEY[String(ci[2] || "")];
  var w = key ? WORKOUTS[key] : null;
  var html = '<div class="card day-detail">' +
    '<div class="dd-head">' + (w ? w.emoji : "🌸") + " <strong>" + esc(ci[2] || "Workout") + "</strong></div>" +
    '<div class="dd-date">' + esc(prettyDate(ds)) + (ci[1] ? " · " + esc(ci[1]) : "") + "</div>";
  var byEx = {}, order = [];
  DB.weights.forEach(function (r) {
    var wr = normWRow(r);
    if (wr.date !== ds) return;
    if (!byEx[wr.exercise]) { byEx[wr.exercise] = []; order.push(wr.exercise); }
    byEx[wr.exercise].push(wr);
  });
  order.forEach(function (ex) {
    var sets = byEx[ex]
      .sort(function (a, b) { return (Number(a.set) || 0) - (Number(b.set) || 0); })
      .map(function (s) { return fmtSet(s.weight, s.reps); }).join(" · ");
    html += '<div class="dd-ex"><strong>' + esc(ex) + "</strong><br>" + esc(sets) + "</div>";
  });
  if (ci[3] && !order.length) html += '<div class="dd-ex">' + esc(ci[3]) + "</div>";
  if (ci[4]) html += '<div class="dd-note">💭 ' + esc(ci[4]) + "</div>";
  html += '<button type="button" class="btn secondary small" id="dd-undo">Undo this day</button>' +
    '<div class="status" id="dd-status"></div></div>';
  wrap.innerHTML = html;
  document.getElementById("dd-undo").addEventListener("click", function () {
    if (!confirm("Remove the check-in for " + prettyDate(ds) + "?")) return;
    var btn = document.getElementById("dd-undo");
    btn.disabled = true;
    setStatus("dd-status", "Undoing…");
    api("unlog", { date: ds }).then(refresh).then(function () {
      calDetailDate = null;
      renderCalendar();
      renderHome();
      toast("Undone — no worries! 💖", "ok");
    }).catch(function (err) {
      setStatus("dd-status", "Couldn't undo — try again.", "error");
      btn.disabled = false;
    });
  });
}
function calShift(delta) {
  renderCalMonth();
  calM += delta;
  if (calM < 0) { calM = 11; calY--; }
  if (calM > 11) { calM = 0; calY++; }
  calDetailDate = null;
  document.getElementById("day-detail").innerHTML = "";
  renderCalendar();
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
function fmtSet(wt, rp) {
  var w = (wt === "" || wt == null) ? "\u2013" : String(wt);
  var r = (rp === "" || rp == null) ? "" : "\u00D7" + rp;
  return w + r;
}
function renderWeights() {
  var ex = document.getElementById("ex-select").value || ALL_EXERCISES[0];
  var list = document.getElementById("weights-list");
  list.innerHTML = "";
  var byDate = {}, order = [];
  DB.weights.forEach(function (r) {
    if (String(r[1]) !== ex) return;
    // New layout is [Date, Exercise, Set, Weight, Reps]; old was [Date, Exercise, Weight, Reps].
    var setNo = 1, wt, rp;
    if (r.length >= 5) { setNo = r[2]; wt = r[3]; rp = r[4]; }
    else { wt = r[2]; rp = r[3]; }
    var d = String(r[0]);
    if (!byDate[d]) { byDate[d] = []; order.push(d); }
    byDate[d].push({ set: Number(setNo) || 0, weight: wt, reps: rp });
  });
  if (!order.length) {
    list.innerHTML = '<div class="empty">No weights logged for this one yet \uD83D\uDCAA</div>';
    return;
  }
  order.reverse().forEach(function (d) {
    var sets = byDate[d].sort(function (a, b) { return a.set - b.set; })
      .map(function (s) { return fmtSet(s.weight, s.reps); }).join(" \u00B7 ");
    var div = document.createElement("div");
    div.className = "w-row";
    div.innerHTML = '<span class="d">' + esc(prettyDate(d)) + '</span>' +
      '<span class="sets-line">' + esc(sets) + '</span>';
    list.appendChild(div);
  });
}

/* ---------- PR celebration ---------- */
function showPRModal(prs) {
  var list = document.getElementById("pr-list");
  list.innerHTML = "";
  prs.forEach(function (p) {
    var d = document.createElement("div");
    d.textContent = p.exercise + " — " + p.weight + " lbs" + (p.reps ? " × " + p.reps : "") + " 🎉";
    list.appendChild(d);
  });
  document.getElementById("pr-modal").classList.remove("hidden");
}
function closePRModal() {
  document.getElementById("pr-modal").classList.add("hidden");
  setStatus("log-status", "Saved! You're amazing! 🎉", "ok");
  toast("Workout logged! 🎉", "ok");
  renderPicker();
  show("home");
}

/* ---------- weekly share card ---------- */
function ymdLocal(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function shareWeek() {
  var now = new Date();
  var mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  var days = [];
  for (var k = 0; k < 7; k++) {
    var t = new Date(mon);
    t.setDate(mon.getDate() + k);
    days.push(t);
  }
  var monStr = ymdLocal(days[0]), sunStr = ymdLocal(days[6]);
  var names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var lines = ["🌸 Jaden's week! 💪"];
  var seen = {}, consistent = 0;
  days.forEach(function (dt, idx) {
    var ds = ymdLocal(dt);
    var ci = checkinByDate(ds);
    if (!ci) { lines.push(names[idx] + ": —"); return; }
    var wname = String(ci[2] || "");
    if (wname === REST_NAME) { lines.push(names[idx] + ": Rest day 😴"); return; }
    if (!seen[ds]) { seen[ds] = 1; consistent++; }
    var nSets = 0;
    DB.weights.forEach(function (r) { if (String(r[0]) === ds) nSets++; });
    var detailTxt = nSets ? " — " + nSets + " set" + (nSets > 1 ? "s" : "")
      : (ci[3] ? " — " + ci[3] : "");
    lines.push(names[idx] + ": " + wname + detailTxt);
  });
  // PRs this week: per exercise, this week's max vs all-time max before this week.
  var exWeekMax = {}, exPreMax = {};
  DB.weights.forEach(function (r) {
    var wr = normWRow(r);
    var wt = num(wr.weight);
    if (wt === null) return;
    if (wr.date >= monStr && wr.date <= sunStr) {
      exWeekMax[wr.exercise] = Math.max(exWeekMax[wr.exercise] || 0, wt);
    } else if (wr.date < monStr) {
      exPreMax[wr.exercise] = Math.max(exPreMax[wr.exercise] || 0, wt);
    }
  });
  var prCount = 0;
  Object.keys(exWeekMax).forEach(function (ex) {
    // A PR needs a real baseline to beat — no pre-week max, no PR (same rule as the save-time check).
    if (exPreMax[ex] && exWeekMax[ex] > exPreMax[ex]) prCount++;
  });
  lines.push("🔥 " + consistent + " day" + (consistent === 1 ? "" : "s") +
    " consistent · 🏆 " + prCount + " new PR" + (prCount === 1 ? "" : "s") + "!");
  var text = lines.join("\n");
  if (navigator.share) {
    navigator.share({ text: text }).catch(function () { /* user dismissed */ });
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      toast("Copied! Paste it in a text 💕", "ok");
    }).catch(function () { toast("Couldn't copy — sorry!", "error"); });
  } else {
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast("Copied! Paste it in a text 💕", "ok");
    } catch (e) {
      toast("Couldn't copy — sorry!", "error");
    }
    ta.remove();
  }
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
  document.getElementById("detail-body").addEventListener("click", addSetTap);
  document.getElementById("detail-body").addEventListener("click", helpTap);
  document.getElementById("detail-body").addEventListener("input", updateSetCount);
  document.getElementById("help-close").addEventListener("click", closeHelpModal);
  document.getElementById("help-modal").addEventListener("click", function (e) {
    if (e.target === this) closeHelpModal(); // tap the backdrop to dismiss
  });
  document.getElementById("ex-select").addEventListener("change", renderWeights);
  document.getElementById("save-month").addEventListener("click", saveMonth);
  document.getElementById("cal-prev").addEventListener("click", function () { calShift(-1); });
  document.getElementById("cal-next").addEventListener("click", function () { calShift(1); });
  document.getElementById("share-week").addEventListener("click", shareWeek);
  document.getElementById("pr-close").addEventListener("click", closePRModal);
  // Show today's message right away — it never needs the network.
  document.getElementById("streak-num").textContent = "–";
  document.getElementById("daily-msg").textContent = MESSAGES[dayOfYear() % MESSAGES.length];
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
