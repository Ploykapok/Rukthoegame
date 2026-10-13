/* plus.js — วางต่อจาก <script> หลักใน index.html: <script src="plus.js"></script> */
(function () {
const css = `
#userbar{display:none!important}
body{padding-top:calc(56px + env(safe-area-inset-top,0px))!important;align-items:flex-start!important}
#name-modal,#auth-modal{justify-content:flex-start!important;padding-top:calc(64px + env(safe-area-inset-top,0px))!important}
#name-modal>:first-child,#auth-modal>:first-child{margin-top:auto}
#name-modal>:last-child,#auth-modal>:last-child{margin-bottom:auto}
#log-modal,#admin-modal,#edit-modal{padding-top:calc(64px + env(safe-area-inset-top,0px))!important}
#tb{position:fixed;top:0;left:0;right:0;z-index:200;display:none;align-items:center;gap:10px;padding:calc(6px + env(safe-area-inset-top,0px)) 10px 6px;background:rgba(255,227,240,.97);border-bottom:1px solid #ffc3df;color:#8a335d;font-weight:bold;font-size:14px}
#tb button{width:auto;padding:6px 12px;font-size:20px;line-height:1}
#dov{position:fixed;inset:0;z-index:290;background:#0005;display:none}
#drawer{position:fixed;top:0;bottom:0;left:0;width:78%;max-width:300px;z-index:300;background:#fff0f7;transform:translateX(-105%);transition:transform .25s;padding:calc(70px + env(safe-area-inset-top,0px)) 14px 14px;box-shadow:4px 0 20px #d94b9560;overflow-y:auto}
#drawer.open{transform:none}
#drawer button{text-align:left;margin-bottom:8px}
#drawer button.act{background:linear-gradient(90deg,#ff70ac,#ff9cc8);color:#fff;border-color:transparent}
.adm-sum{cursor:pointer;font-weight:bold;font-size:15px;color:#e34d91;background:#ffe3f0;border:1px solid #ffc3df;border-radius:12px;padding:10px 12px;margin-top:10px;list-style:none}
details[open]>.adm-sum{background:linear-gradient(90deg,#ff70ac,#ff9cc8);color:#fff;border-color:transparent}
.adm-sum::-webkit-details-marker{display:none}
.adm-sum::before{content:"▸ "}
details[open]>.adm-sum::before{content:"▾ "}
.pm{position:fixed;inset:0;z-index:250;background:rgba(255,240,245,.99);display:none;justify-content:center;overflow-y:auto;padding:calc(64px + env(safe-area-inset-top,0px)) 16px 24px}
.pm.open{display:flex}
.pm .log-panel{width:100%;max-width:430px}
`;
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
const el = (h) => { const d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstChild; };
const rm = (id) => $(id).classList.remove("open");
let loginTs = 0, hbT = 0, admT = 0;
let saveMode = "global"; try { saveMode = localStorage.getItem("rt_save") || "global"; } catch (e) {}

/* ---------- 1) ตั้งค่า AI ให้ง่าย: แนะนำแบบปกติ, AI พับเก็บ ---------- */
const pg = $("prov").closest(".input-group");
const det = el('<details id="ai-det" style="width:100%;max-width:320px;margin-bottom:12px;text-align:left"><summary style="color:#d74b8b;font-weight:bold;font-size:13px;cursor:pointer">🤖 ตั้งค่า AI (ไม่บังคับ)</summary></details>');
$("chips-mode").closest(".input-group").after(det);
det.appendChild(pg);
$("chips-mode").before(el('<div class="mode-hint" style="color:#2e9e5b;font-weight:bold">✅ แนะนำ: เล่นแบบปกติ ไม่ต้องตั้งค่า AI ใด ๆ</div>'));
$("chips-mode").children[0].textContent = "✅ เลือกช้อยส์ (แนะนำ · พร้อมเล่นเลย)";
$("prov").after(el('<div class="mode-hint" id="prov-help" style="text-align:left"></div>'));
const HELP = {
  claude: "ไม่ต้องใส่อะไร (ใช้ได้เมื่อเปิดผ่าน claude.ai)",
  openai: "ขอคีย์ที่ platform.openai.com / openrouter.ai / groq.com แล้ววางในช่องคีย์ ช่องอื่นใช้ค่าเดิมได้",
  gemini: "ขอคีย์ฟรีที่ aistudio.google.com แล้ววางในช่องคีย์",
  anthropic: "ขอคีย์ที่ console.anthropic.com แล้ววางในช่องคีย์"
};
const _onProv = onProv; onProv = function () { _onProv(); $("prov-help").textContent = HELP[$("prov").value] || ""; };
const _pickMode = pickMode; pickMode = function (m) { _pickMode(m); if (m !== "choice") det.open = true; };
onProv();

/* ---------- 5) เลือกเซฟ Local / Global ---------- */
const SV = '<div class="chips stack sv"><button type="button" class="chip" data-m="global">🌍 Global — ทุกคนเห็นฉากจบของคุณ</button><button type="button" class="chip" data-m="local">🔒 Local — เก็บส่วนตัว</button></div><div class="mode-hint">⚠️ แอดมินตรวจสอบได้ทั้งสองแบบ เพื่อกันการใส่ชื่อบุคคลที่ไม่เหมาะสม เช่น คนที่มีแฟนแล้ว</div>';
$("start-btn").before(el('<div class="input-group"><label>บันทึกฉากจบแบบไหน:</label>' + SV + '</div>'));
function setSave(m) {
  saveMode = m; try { localStorage.setItem("rt_save", m); } catch (e) {}
  document.querySelectorAll(".sv .chip").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
}
document.addEventListener("click", (e) => { const c = e.target.closest(".sv .chip"); if (c) setSave(c.dataset.m); });
const _rec = recordShared;
recordShared = async function (entry) {
  entry.by = me ? me.id : "";
  await sharedReady;
  if (!shared.db) return "offline";
  try {
    await shared.db.collection(saveMode === "global" ? "endings_v2" : "private_v1").add(entry);
    if (saveMode !== "global") setTimeout(() => { $("text").textContent = $("text").textContent.replace("✅ บันทึกลงบันทึกรวมของทุกคนแล้ว", "🔒 บันทึกแบบส่วนตัวแล้ว (แอดมินตรวจสอบได้)"); }, 50);
    return "ok";
  } catch (e) { return "fail"; }
};

/* ---------- 4) ย้อนอ่านแชท ---------- */
const hist = [];
const _show = show;
show = function (i) { _show(i); if (!started) return; const t = $("text").textContent, s = $("speaker").textContent, l = hist[hist.length - 1]; if (!l || l.t !== t) hist.push({ s: s, t: t }); };
const _hc = handleChoice; handleChoice = function (c) { if (!busy) hist.push({ s: "💬 " + playerName + " (คุณ)", t: c.text }); return _hc(c); };
const _st = sendTyped; sendTyped = function () { const v = $("type-input").value.trim(); if (v && !busy) hist.push({ s: "💬 " + playerName + " (คุณ)", t: v }); return _st(); };
document.body.append(
  el('<div class="pm" id="hist-modal"><div class="log-panel"><h2>💬 ย้อนอ่านแชท</h2><div id="hist-list"></div><button class="close" onclick="rm2(\'hist-modal\')">ปิด</button></div></div>'),
  el('<div class="pm" id="set-modal"><div class="log-panel"><h2>💾 ที่บันทึกฉากจบ</h2>' + SV + '<button class="close" onclick="rm2(\'set-modal\')">ปิด</button></div></div>')
);
window.rm2 = (id) => rm(id);
function openHist() {
  const b = $("hist-list"); b.innerHTML = "";
  if (!hist.length) b.innerHTML = '<div class="log-empty">ยังไม่มีข้อความ</div>';
  hist.forEach((h) => { const r = document.createElement("div"); r.className = "log-row"; r.textContent = h.t; const s = document.createElement("span"); s.className = "sub"; s.textContent = h.s; r.prepend(s); b.appendChild(r); });
  $("hist-modal").classList.add("open"); $("hist-modal").scrollTop = 1e6;
}
$("log-open").before(el('<button id="hist-open" class="secondary" style="margin-top:10px">⬅️ ย้อนอ่านข้อความก่อนหน้า</button>'));
$("hist-open").onclick = openHist;
setSave(saveMode);

/* ---------- เมนู ☰ ---------- */
document.body.append(
  el('<div id="tb"><button id="tb-menu">☰</button><span id="tb-name"></span></div>'),
  el('<div id="dov"></div>'), el('<div id="drawer"></div>')
);
const closeMenu = () => { $("drawer").classList.remove("open"); $("dov").style.display = "none"; };
$("tb-menu").onclick = () => { $("drawer").classList.add("open"); $("dov").style.display = "block"; };
$("dov").onclick = closeMenu;
function setAct(b) { document.querySelectorAll("#drawer button").forEach((x) => x.classList.toggle("act", x === b)); }
const MODS = ["log-modal", "admin-modal", "edit-modal", "hist-modal", "set-modal"];
const mo = new MutationObserver(() => { if (!MODS.some((id) => $(id).classList.contains("open"))) { const f = document.querySelector("#drawer button"); if (f) setAct(f); } });
MODS.forEach((id) => mo.observe($(id), { attributes: true, attributeFilter: ["class"] }));
function buildMenu() {
  const d = $("drawer"); d.innerHTML = "";
  const items = [
    ["🏠 หลัก", () => { ["log-modal", "admin-modal", "edit-modal", "hist-modal", "set-modal"].forEach(rm); }],
    me.role === "admin" ? ["👑 Admin Panel", () => openAdmin()] : null,
    ["📜 บันทึก (ส่วนตัว + Global)", () => openLog()],
    ["💬 ย้อนอ่านแชท", openHist],
    ["💾 ที่บันทึกฉากจบ", () => $("set-modal").classList.add("open")],
    ["🚪 ออกจากระบบ", () => logout()]
  ].filter(Boolean);
  items.forEach(([t, f], i) => { const b = document.createElement("button"); b.className = "secondary" + (i ? "" : " act"); b.textContent = t; b.onclick = () => { closeMenu(); f(); if (i < items.length - 1) setAct(b); }; d.appendChild(b); });
}

/* ---------- Presence + ตรวจแบน/เตะ/เตือน ---------- */
function statusText() {
  if (!started) return "ตั้งค่าเกม";
  if (ending && currentEnding) return "จบเกม: " + endings[currentEnding].title;
  return currentScene + " (" + $("progress").textContent + ")";
}
function force(msg) { try { localStorage.removeItem(LS_SESSION); } catch (e) {} alert(msg); location.reload(); }
async function beat() {
  if (!me || !shared.db) return;
  try {
    await shared.db.doc("presence/" + me.id).set({ user: me.username, status: statusText(), ts: Date.now() });
    const a = (await shared.db.doc("accounts/" + me.id).get()).data() || {};
    if (a.banned === "1") return force("บัญชีของคุณถูกแบน 🚫");
    if (a.kickTs > loginTs) return force("คุณถูกเตะออกจากระบบโดยแอดมิน 🥾");
    const k = "rt_warn_" + me.id;
    if (a.warnTs > (+localStorage.getItem(k) || 0)) { localStorage.setItem(k, a.warnTs); alert("⚠️ คำเตือนจากแอดมิน:\n\n" + a.warnMsg); }
  } catch (e) {}
}
const _enter = enterApp;
enterApp = async function (u) {
  try {
    const a = (await shared.db.doc("accounts/" + u.id).get()).data() || {};
    if (a.banned === "1") { $("auth-err").style.color = "#d6336c"; $("auth-err").textContent = "บัญชีนี้ถูกแบน 🚫"; try { localStorage.removeItem(LS_SESSION); } catch (e) {} return; }
  } catch (e) {}
  loginTs = Date.now(); _enter(u);
  $("tb").style.display = "flex"; $("tb-name").textContent = (u.role === "admin" ? "👑 " : "👤 ") + u.username;
  buildMenu(); beat(); if (!hbT) hbT = setInterval(beat, 15000);
};

/* ---------- 2) Admin Panel ---------- */
async function patchAcc(id, o) { const r = shared.db.doc("accounts/" + id), d = (await r.get()).data() || {}; await r.set(Object.assign(d, o)); }
async function act(type, id, o) { await patchAcc(id, o); await logEvent("admin_" + type, id + " (โดย " + me.username + ")"); renderAdm(); }
const warnU = (id, pre) => { const m = prompt("ข้อความเตือนถึง " + id + ":", pre || ""); if (m) act("warn", id, { warnMsg: m, warnTs: Date.now() }); };
const abtn = (t, f) => { const b = document.createElement("button"); b.className = "secondary"; b.style.cssText = "width:auto;padding:4px 8px;font-size:11px;margin:4px 4px 0 0"; b.textContent = t; b.onclick = f; return b; };
const row = (txt, sub) => { const r = document.createElement("div"); r.className = "log-row"; r.textContent = txt; const s = document.createElement("span"); s.className = "sub"; s.textContent = sub; r.appendChild(s); return r; };
async function delDoc(col, id) {
  const r = await fetch("https://firestore.googleapis.com/v1/projects/" + FB.projectId + "/databases/(default)/documents/" + col + "/" + id + "?key=" + FB.apiKey, { method: "DELETE" });
  if (!r.ok && r.status !== 404) throw new Error("del");
}
async function delOne(col, id) {
  if (!confirm("ลบรายการนี้?")) return;
  try { await delDoc(col, id); } catch (e) { alert("ลบไม่สำเร็จ (ตรวจ Firestore rules)"); }
  renderAdm();
}
async function delAllCol(col) {
  if (!confirm("ลบทั้งหมดใน " + col + " ? กู้คืนไม่ได้")) return;
  try {
    let s, n = 0;
    do { s = await shared.db.collection(col).get(); for (const d of s.docs) await delDoc(col, d.id); } while (!s.empty && ++n < 20);
    if (col !== "activity") await logEvent("admin_delall", col + " (โดย " + me.username + ")");
  } catch (e) { alert("ลบไม่สำเร็จ (ตรวจ Firestore rules)"); }
  renderAdm();
}
function wrapAdm() {
  if ($("adm-all")) return;
  $("adm-log").insertAdjacentHTML("beforebegin", '<h3>บันทึกทั้งหมด 🌍 Global + 🔒 Local</h3><div id="adm-all"></div>');
  [["adm-members", null], ["adm-all", "endings_v2"], ["adm-log", "activity"]].forEach(([id, col]) => {
    const box = $(id), h = box.previousElementSibling, d = document.createElement("details"), sm = document.createElement("summary");
    d.open = id === "adm-members"; sm.className = "adm-sum"; sm.append(...h.childNodes); h.remove();
    box.before(d); d.append(sm);
    if (col) { const t = document.createElement("div"); t.appendChild(abtn(col === "activity" ? "🗑 ลบ log ทั้งหมด" : "🗑 ลบ Global ทั้งหมด", () => delAllCol(col))); d.append(t); }
    d.append(box);
  });
}
async function renderAdm() {
  if (!$("admin-modal").classList.contains("open")) { clearInterval(admT); admT = 0; return; }
  try {
    const [ac, pr, en, pv, lg] = await Promise.all(["accounts", "presence", "endings_v2", "private_v1", "activity"].map((c) => shared.db.collection(c).get()));
    const P = {}; pr.docs.forEach((d) => (P[d.id] = d.data()));
    const now = Date.now(); let n = 0;
    const mem = $("adm-members"); mem.innerHTML = "";
    ac.docs.map((d) => ({ id: d.id, a: d.data() })).sort((x, y) => ((P[y.id] || {}).ts || 0) - ((P[x.id] || {}).ts || 0)).forEach(({ id, a }) => {
      const p = P[id], live = p && now - p.ts < 40000; if (live) n++;
      const r = row((live ? "🟢 " : "⚪ ") + (a.role === "admin" ? "👑 " : "👤 ") + a.username, (live ? "กำลัง: " + p.status : "ออฟไลน์") + (a.banned === "1" ? " · 🚫 ถูกแบน" : ""));
      if (a.role !== "admin" && id !== "admin9585") {
        r.appendChild(abtn("⚠️ เตือน", () => warnU(id)));
        r.appendChild(abtn("🥾 เตะ", () => act("kick", id, { kickTs: Date.now() })));
        r.appendChild(abtn(a.banned === "1" ? "♻️ ปลดแบน" : "🚫 แบน", () => act(a.banned === "1" ? "unban" : "ban", id, { banned: a.banned === "1" ? "0" : "1" })));
      }
      mem.appendChild(r);
    });
    $("adm-count").textContent = "(ออนไลน์ " + n + "/" + ac.size + ")";
    const all = [].concat(en.docs.map((d) => Object.assign({ t: "🌍", id: d.id }, d.data())), pv.docs.map((d) => Object.assign({ t: "🔒", id: d.id }, d.data()))).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 60);
    const box = $("adm-all"); box.innerHTML = "";
    if (!all.length) box.innerHTML = '<div class="log-empty">ยังไม่มีบันทึก</div>';
    all.forEach((x) => {
      const r = row(x.t + " " + (G_EMOJI[x.pg] || "") + x.name + " & " + (G_EMOJI[x.gg] || "") + x.girl + " — " + ((endings[x.key] || {}).title || x.key), "โดย " + (x.by || "?") + " · " + fmtTime(x.ts));
      if (x.by) r.appendChild(abtn("⚠️ เตือนเรื่องชื่อ", () => warnU(x.by, "กรุณาอย่าใช้ชื่อบุคคลที่มีแฟนแล้วหรือไม่เหมาะสมในเกม")));
      r.appendChild(abtn("🗑 ลบ", () => delOne(x.t === "🌍" ? "endings_v2" : "private_v1", x.id)));
      box.appendChild(r);
    });
    const L = { register: "✨ สมัครบัญชี", login: "🔑 ล็อกอิน", login_fail: "⚠️ ล็อกอินไม่สำเร็จ", admin_warn: "⚠️ เตือน", admin_kick: "🥾 เตะ", admin_ban: "🚫 แบน", admin_unban: "♻️ ปลดแบน", admin_delall: "🗑 ลบทั้งหมด" };
    const lb = $("adm-log"); lb.innerHTML = "";
    lg.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 60).forEach((a) => { const r = row((L[a.type] || a.type) + " — " + a.user, fmtTime(a.ts)); r.appendChild(abtn("🗑 ลบ", () => delOne("activity", a.id))); lb.appendChild(r); });
  } catch (e) {}
}
openAdmin = function () {
  if (!me || me.role !== "admin" || !shared.db) return;
  wrapAdm();
  $("admin-modal").classList.add("open"); renderAdm();
  clearInterval(admT); admT = setInterval(renderAdm, 5000);
};
})();
/* auth.js — วางต่อจาก plus.js: <script src="auth.js"></script>  (ใช้ Firebase Authentication จริง) */
(function () {
const KEY = FB.apiKey, LSK = "rt_auth_v1";
let tok = null; try { tok = JSON.parse(localStorage.getItem(LSK) || "null"); } catch (e) {}
const save = () => { try { tok ? localStorage.setItem(LSK, JSON.stringify(tok)) : localStorage.removeItem(LSK); } catch (e) {} };
const setTok = (j) => { tok = { id: j.idToken || j.id_token, refresh: j.refreshToken || j.refresh_token, uid: j.localId || j.user_id, exp: Date.now() + (+(j.expiresIn || j.expires_in) || 3600) * 1000 }; save(); };
const _f = window.fetch.bind(window);
async function idp(path, body) {
  const r = await _f("https://identitytoolkit.googleapis.com/v1/accounts:" + path + "?key=" + KEY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || "auth"); return j;
}
async function refresh() {
  if (!tok || tok.exp - Date.now() > 60000) return;
  const r = await _f("https://securetoken.googleapis.com/v1/token?key=" + KEY, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(tok.refresh) });
  if (!r.ok) { tok = null; save(); return; }
  setTok(await r.json());
}
window.fetch = async (u, o) => {
  if (tok && String(u).startsWith("https://firestore.googleapis.com/")) {
    try { await refresh(); } catch (e) {}
    if (tok) o = Object.assign({}, o, { headers: Object.assign({}, o && o.headers, { Authorization: "Bearer " + tok.id }) });
  }
  return _f(u, o);
};
const ERR = {
  EMAIL_EXISTS: "ชื่อนี้มีคนใช้แล้ว ลองล็อกอินแทนได้เลย",
  INVALID_LOGIN_CREDENTIALS: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", EMAIL_NOT_FOUND: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", INVALID_PASSWORD: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  OPERATION_NOT_ALLOWED: "ยังไม่ได้เปิด Email/Password ใน Firebase Authentication",
  TOO_MANY_ATTEMPTS_TRY_LATER: "ลองผิดหลายครั้ง รอสักครู่แล้วลองใหม่"
};
doAuth = async function () {
  const err = $("auth-err"); err.style.color = "#d6336c"; err.textContent = "";
  const u = $("auth-user").value.trim(), pw = $("auth-pass").value, id = u.toLowerCase();
  if (!/^[a-z0-9_.-]{3,20}$/.test(id)) { err.textContent = "ชื่อผู้ใช้ 3-20 ตัว ใช้ a-z 0-9 _ . - เท่านั้น"; return; }
  if (pw.length < 6) { err.textContent = "รหัสผ่านต้องมีอย่างน้อย 6 ตัว"; return; }
  if (authMode === "register" && pw !== $("auth-pass2").value) { err.textContent = "รหัสผ่านสองช่องไม่ตรงกัน"; return; }
  await sharedReady;
  if (!shared.db) { err.textContent = "เชื่อมต่อฐานข้อมูลไม่ได้"; return; }
  const btn = $("auth-go"); btn.disabled = true;
  const email = id + "@ruk.local";
  try {
    if (authMode === "register") {
      const j = await idp("signUp", { email: email, password: pw, returnSecureToken: true });
      setTok(j);
      await shared.db.doc("accounts/" + id).set({ username: u, uid: j.localId, role: "user", createdAt: Date.now() });
      await logEvent("register", u);
      tok = null; save();
      setAuthMode("login", "สมัครสำเร็จ! ล็อกอินได้เลย 💗");
    } else {
      setTok(await idp("signInWithPassword", { email: email, password: pw, returnSecureToken: true }));
      const ref = shared.db.doc("accounts/" + id), s = await ref.get(), name = s.exists ? s.data().username : u;
      if (!s.exists) await ref.set({ username: u, uid: tok.uid, role: "user", createdAt: Date.now() });
      await logEvent("login", name);
      enterApp({ id: id, username: name, role: "user" });
    }
  } catch (e) { const m = (e && (e.message || e.code)) || JSON.stringify(e); err.textContent = ERR[String(m).split(" ")[0]] || "[v2] เกิดข้อผิดพลาด: " + m; }
  finally { btn.disabled = false; }
};
const _enter = enterApp;
enterApp = async function (u) {
  u.role = u.id === "admin9585" ? "admin" : "user";
  return _enter(u);
};
const _lo = logout; logout = function () { tok = null; save(); _lo(); };
})();
  
