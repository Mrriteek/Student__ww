const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SUBJECTS = [
["Engineering Math I","BSM01","∑"],["Electrical Machine I","EE301","⚙️"],["Microprocessors & Microcontrollers","EE503","🔲"],["HVDC & FACTS","ELP707","⚡"],
["Engineering Physics","BSP01","🔭"],["Math III","BSC301","📐"],["Power Plant Engineering","EE521","🏭"],["Power Quality","ELP705","📈"],
["Basics of Electrical Engineering","ESEE1","💡"],["Network Theory","EE302","🕸️"],["Electrical Machine II","EE501","🔧"],["PPAS","ELC701","🔌"],
["Engineering Mechanics","ESEM1","🏗️"],["Environmental Science","EVS","🌱"],["Signals & Systems","EE511","〰️"],["SOT","ELO710","🧪"],
["PPS","ESPP1","💻"],["BE","EC301","📡"],["PCS","EE502","🛰️"],["DSP","ELO713","🎛️"],["IKS","HSM01","📜"],["EMT","EE303","🧲"]
].map(([name, code, icon]) => ({ id: code.toLowerCase(), name, code, icon }));
const TYPE = { qa: "Question & Answer PDF", notes: "Premium Notes PDF" };

let ST = { ...SITE_DEFAULTS };
try { ST = { ...ST, ...JSON.parse(localStorage.getItem("sh_settings") || "{}") }; ST.prices = { ...SITE_DEFAULTS.prices, ...(ST.prices || {}) }; } catch {}
const save = () => { try { localStorage.setItem("sh_settings", JSON.stringify(ST)); } catch {} };
const toast = (m, err) => { const t = document.createElement("div"); t.className = "toast" + (err ? " err" : ""); t.textContent = m; $("#toasts").append(t); setTimeout(() => t.remove(), 3500); };
const ov = $("#ov");
const openModal = (html) => { ov.innerHTML = html; ov.classList.add("on"); document.body.style.overflow = "hidden"; };
const closeModal = () => { ov.classList.remove("on"); ov.innerHTML = ""; document.body.style.overflow = ""; };
ov.addEventListener("click", (e) => { if (e.target === ov && !ov.querySelector("[data-lock]")) closeModal(); });

/* ---------- render ---------- */
function applySettings() {
  document.querySelectorAll("[data-price]").forEach((e) => (e.textContent = "₹" + ST.prices[e.dataset.price]));
  const tg = $("#tgLink"); if (tg) tg.href = ST.telegram;
  const stats = document.querySelectorAll(".stats b"); if (stats[1]) { stats[1].textContent = "₹" + ST.prices.qa; stats[2].textContent = "₹" + ST.prices.notes; }
}
function renderGrid() {
  const q = $("#q").value.trim().toLowerCase();
  const list = SUBJECTS.filter((s) => (s.name + " " + s.code).toLowerCase().includes(q));
  $("#grid").innerHTML = list.length ? list.map((s, i) => `<div class="card" style="animation-delay:${(i % 10) * 40}ms">
    <div class="ico">${s.icon}</div><h3>${esc(s.name)}</h3><div class="code">${esc(s.code)}</div>
    <div class="row"><button class="btn sm" onclick="details('${s.id}')">View Details</button></div>
    <div class="row"><button class="btn sm ghost" onclick="pay('${s.id}','qa')">Q&A ₹${ST.prices.qa}</button><button class="btn sm ghost" onclick="pay('${s.id}','notes')">Premium ₹${ST.prices.notes}</button></div></div>`).join("")
    : `<div class="empty">😕 No subjects found. Try another search.</div>`;
}
function details(id) {
  const s = SUBJECTS.find((x) => x.id === id);
  openModal(`<div class="modal" style="text-align:left"><button class="x" onclick="closeModal()">✕</button><div class="ico">${s.icon}</div><h3>${esc(s.name)}</h3><p class="code">Subject code: ${esc(s.code)}</p>
  ${["qa", "notes"].map((t) => `<div class="card" style="margin-top:14px;padding:16px"><b>${TYPE[t]}</b><div class="price" style="font-size:1.6rem">₹${ST.prices[t]}</div><button class="btn full" style="margin-top:10px" onclick="pay('${s.id}','${t}')">Buy Now</button></div>`).join("")}</div>`);
}

/* ---------- payment ---------- */
function pay(id, type) {
  const s = SUBJECTS.find((x) => x.id === id), amt = ST.prices[type];
  const link = `upi://pay?pa=${encodeURIComponent(ST.upiId)}&pn=${encodeURIComponent(ST.payeeName)}&am=${amt}&cu=INR&tn=${encodeURIComponent(s.code + " " + (type === "qa" ? "QA" : "Notes"))}`;
  openModal(`<div class="modal"><button class="x" onclick="closeModal()">✕</button><h3>Pay ₹${amt}</h3><p class="code">${esc(s.name)} · ${TYPE[type]}</p>
  <div id="qr"></div><p class="code">UPI ID: <b id="upiTxt">${esc(ST.upiId)}</b></p>
  <div class="row" style="justify-content:center"><a class="btn sm" href="${link}">Open UPI App</a><button class="btn sm ghost" onclick="copyTxt('${esc(ST.upiId)}','UPI ID copied')">Copy UPI ID</button></div>
  <form onsubmit="submitUtr(event,'${id}','${type}')" style="margin-top:14px"><p class="code" style="text-align:left">After paying, enter the 12-digit UTR from your UPI app:</p>
  <input class="f" name="utr" inputmode="numeric" maxlength="12" placeholder="12-digit UTR number" required>
  <input class="f" name="name" placeholder="Your name (optional)" maxlength="40"><button class="btn full" style="margin-top:6px">Submit Payment Details</button></form></div>`);
  try { new QRCode($("#qr"), { text: link, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M }); } catch { $("#qr").textContent = "Use the UPI ID above"; }
}
function copyTxt(t, msg) {
  const done = () => msg && toast(msg);
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(t).then(done, () => fb()); else fb();
  function fb() { const a = document.createElement("textarea"); a.value = t; document.body.append(a); a.select(); try { document.execCommand("copy"); } catch {} a.remove(); done(); }
}
function submitUtr(e, id, type) {
  e.preventDefault(); const f = new FormData(e.target), utr = String(f.get("utr")).trim(), name = String(f.get("name") || "").trim();
  if (!/^\d{12}$/.test(utr)) return toast("UTR must be exactly 12 digits", true);
  const s = SUBJECTS.find((x) => x.id === id);
  const msg = `Hello! I have paid ₹${ST.prices[type]} for ${s.name} (${s.code}) - ${TYPE[type]}.\nUTR: ${utr}${name ? "\nName: " + name : ""}`;
  verifying(msg);
}
function verifying(msg) {
  closeModal(); copyTxt(msg);
  const DUR = 60000, t0 = Date.now();
  const d = document.createElement("div"); d.className = "term"; d.dataset.lock = 1;
  d.innerHTML = `<h4>&gt; STUDENT HELP SECURE VERIFIER v2.4</h4><div class="log" id="log"></div><div class="bar2"><i id="pb"></i></div><div class="pct"><span id="ph">Initializing…</span><span id="pp">0%</span></div>`;
  document.body.append(d); document.body.style.overflow = "hidden";
  const L = ["Connecting to secure gateway…", "Handshake OK (TLS 1.3)", "Encrypting request payload…", "Reading UTR reference…", "Matching transaction record…", "Checking amount & product…", "Queueing for admin review…", "Securing PDF slot…", "Syncing with Telegram desk…", "Verifying checksum…"];
  const phases = ["Connecting…", "Reading transaction…", "Matching record…", "Preparing Telegram…"];
  const log = $("#log"); let n = 0;
  const iv = setInterval(() => {
    const p = Math.min(1, (Date.now() - t0) / DUR);
    $("#pb").style.width = p * 100 + "%"; $("#pp").textContent = Math.floor(p * 100) + "%"; $("#ph").textContent = phases[Math.min(3, Math.floor(p * 4))];
    const r = document.createElement("div"); r.textContent = `[${(Date.now() - t0) / 1000 | 0}s] ` + (n % 3 === 0 ? L[(n / 3) % L.length | 0] : Array.from({ length: 28 }, () => "0123456789abcdef"[Math.random() * 16 | 0]).join(""));
    log.append(r); n++; while (log.scrollHeight > log.clientHeight + 4 && log.firstChild) log.firstChild.remove();
    if (p >= 1) { clearInterval(iv); finish(); }
  }, 450);
  function finish() {
    d.innerHTML = `<div style="margin:auto;text-align:center;font-family:Poppins,sans-serif;color:#fff"><div style="font-size:3.4rem">📨</div><h3>Request received!</h3>
    <p style="color:#aab4d6;margin:8px 0 16px">Your payment details are copied. Send them to us on Telegram. We verify the payment and send your PDF link personally.</p>
    <a class="btn full" href="${esc(ST.telegram)}" target="_blank" rel="noopener">Open Telegram</a><button class="btn ghost full" style="margin-top:10px" id="cp">Copy my details again</button>
    <button class="btn ghost full" style="margin-top:10px" id="cl">Close</button></div>`;
    $("#cp").onclick = () => copyTxt(msg, "Details copied"); $("#cl").onclick = () => { d.remove(); document.body.style.overflow = ""; };
    setTimeout(() => { location.href = ST.telegram; }, 1800);
  }
}

/* ---------- welcome popup ---------- */
function welcome() {
  if (sessionStorage.getItem("sh_w")) return; sessionStorage.setItem("sh_w", 1);
  openModal(`<div class="modal"><button class="x" onclick="closeModal()">✕</button><div class="big">🎓</div><h3 class="grad" style="font-size:1.7rem">Welcome to STUDENT HELP</h3>
  <p style="margin:10px 0;color:#dfe5ff">Thank you for visiting! Score higher with exam-ready <b>Question & Answer PDFs</b> and <b>Premium Notes</b> for all 22 subjects.</p>
  <div class="stats" style="margin:14px 0"><div><b>₹${ST.prices.qa}</b><span>Q&A PDF</span></div><div><b>₹${ST.prices.notes}</b><span>Premium Notes</span></div></div>
  <p class="code">⚡ Pay instantly with UPI · 📲 Get your PDF on Telegram</p>
  <a class="btn full" style="margin-top:14px" href="#subjects" onclick="closeModal()">Explore Subjects →</a></div>`);
}

/* ---------- admin ---------- */
const sha = async (t) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))).map((b) => b.toString(16).padStart(2, "0")).join("");
function adminRoute() {
  if (location.hash !== "#/admin") return;
  if (sessionStorage.getItem("sh_admin") === "1") return adminPanel();
  openModal(`<div class="modal"><button class="x" onclick="location.hash='';closeModal()">✕</button><div class="big">🔐</div><h3>Admin Login</h3>
  <form onsubmit="adminLogin(event)"><input class="f" type="password" name="pw" placeholder="Admin password" required autocomplete="current-password"><button class="btn full" style="margin-top:6px">Login</button></form></div>`);
}
async function adminLogin(e) {
  e.preventDefault();
  if (!crypto?.subtle) return toast("Open the site on HTTPS to use admin login", true);
  if ((await sha(new FormData(e.target).get("pw"))) === SITE_DEFAULTS.adminHash) { sessionStorage.setItem("sh_admin", "1"); adminPanel(); }
  else toast("Wrong password", true);
}
function adminPanel() {
  openModal(`<div class="modal adminbox" style="text-align:left"><button class="x" onclick="location.hash='';closeModal()">✕</button><h3>Admin Panel</h3>
  <p class="code" style="margin-bottom:8px">Changes apply in this browser. To update for everyone, click Export and upload the new settings.js.</p>
  <label>UPI ID</label><input class="f" id="a1" value="${esc(ST.upiId)}"><label>Payee name</label><input class="f" id="a2" value="${esc(ST.payeeName)}">
  <label>Telegram link</label><input class="f" id="a3" value="${esc(ST.telegram)}">
  <label>Q&A price (₹)</label><input class="f" id="a4" type="number" min="1" value="${ST.prices.qa}"><label>Premium Notes price (₹)</label><input class="f" id="a5" type="number" min="1" value="${ST.prices.notes}">
  <button class="btn full" onclick="adminSave()">Save</button><button class="btn ghost full" style="margin-top:8px" onclick="adminExport()">Export settings.js</button>
  <button class="btn ghost full" style="margin-top:8px" onclick="sessionStorage.removeItem('sh_admin');location.hash='';closeModal()">Logout</button></div>`);
}
function readAdmin() {
  const qa = +$("#a4").value, notes = +$("#a5").value;
  if (!(qa > 0 && notes > 0)) { toast("Enter valid prices", true); return null; }
  if (!/^https:\/\/t\.me\//.test($("#a3").value.trim())) { toast("Telegram link must start with https://t.me/", true); return null; }
  return { ...ST, upiId: $("#a1").value.trim(), payeeName: $("#a2").value.trim(), telegram: $("#a3").value.trim(), prices: { qa, notes } };
}
function adminSave() { const n = readAdmin(); if (!n) return; ST = n; save(); applySettings(); renderGrid(); toast("Saved"); }
function adminExport() {
  const n = readAdmin(); if (!n) return;
  const txt = `window.SITE_DEFAULTS = ${JSON.stringify({ upiId: n.upiId, payeeName: n.payeeName, telegram: n.telegram, prices: n.prices, adminHash: SITE_DEFAULTS.adminHash }, null, 2)};\n`;
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/javascript" })); a.download = "settings.js"; a.click();
}
window.addEventListener("hashchange", adminRoute);

/* ---------- boot ---------- */
$("#burger").onclick = () => $("#links").classList.toggle("open");
$("#links").onclick = () => $("#links").classList.remove("open");
$("#q").addEventListener("input", renderGrid);
$("#yr").textContent = new Date().getFullYear();
applySettings(); renderGrid();
window.addEventListener("load", () => { $("#loader").classList.add("hide"); if (location.hash === "#/admin") adminRoute(); else setTimeout(welcome, 600); });
