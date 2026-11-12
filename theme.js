/* Kifaru 4x4 · theme switcher (shared by Client Booking and Admin Management)
   Adds a small "Theme" button at the bottom left. The choice is saved in the
   browser (key kifaru-theme) so both sites and every page use the same one.
   "Auto" follows the device's light or dark setting. Plain JavaScript, named functions. */
(function kifaruTheme(){
"use strict";

const KEY = "kifaru-theme";

const STATUS_LIGHT = "--ok:#2B6B3F;--okbg:#E2EFE5;--warn:#875700;--warnbg:#FBEED3;--bad:#A3322C;--badbg:#F7E1DF;--info:#2B5672;--infobg:#E1EAF0;";
const STATUS_DARK = "--ok:#8FD0A3;--okbg:#1E3225;--warn:#EBBC5E;--warnbg:#382C12;--bad:#F2958E;--badbg:#3D1F1C;--info:#96BED9;--infobg:#1C2A35;";

/* id, label, dark?, page colours, and the swatch shown on the button */
const THEMES = [
  {id:"auto", label:"Auto", swatch:["#FFFFFF","#181615"]},
  {id:"light", label:"Light", swatch:["#FFFFFF","#ED5829"]},
  {id:"dark", label:"Dark", swatch:["#181615","#F27650"]},
  {id:"savanna", label:"Savanna", dark:false, swatch:["#FBF4E8","#C8481C"],
    c:{bg:"#FBF4E8",surface:"#F2E6D2",line:"#DCC9A8",ink:"#2E2418",muted:"#6F5E48",brown:"#9A5B2C",sand:"#EBD7B5",accent:"#C8481C",band:"#3A2A1A",bandfg:"#FBF1E0",bandmuted:"#CDB79A",bandline:"#5B4630",hatch:"#D5C09C",maint:"#C9A06F"}},
  {id:"forest", label:"Forest", dark:false, swatch:["#F6F8F3","#4C6B3C"],
    c:{bg:"#F6F8F3",surface:"#E8EEE1",line:"#CBD6BF",ink:"#1F2B1E",muted:"#566452",brown:"#4C6B3C",sand:"#DCE7CF",accent:"#D9531E",band:"#1F3324",bandfg:"#EEF4E6",bandmuted:"#AEC0A4",bandline:"#38523C",hatch:"#C4D0B8",maint:"#A9BE96"}},
  {id:"ocean", label:"Ocean", dark:false, swatch:["#F4F8FB","#2F6A8F"],
    c:{bg:"#F4F8FB",surface:"#E5EEF5",line:"#C5D5E2",ink:"#16283A",muted:"#55687A",brown:"#2F6A8F",sand:"#D6E6F2",accent:"#E2572B",band:"#12304A",bandfg:"#EAF3FA",bandmuted:"#A5BED3",bandline:"#2C4C68",hatch:"#BCCFDE",maint:"#9DB9CF"}},
  {id:"dusk", label:"Dusk", dark:true, swatch:["#1B1624","#C9A6F0"],
    c:{bg:"#1B1624",surface:"#261F33",line:"#3E3452",ink:"#EFE9F7",muted:"#AA9FC0",brown:"#C9A6F0",sand:"#3A2F4F",accent:"#FF8A5B",band:"#120E1A",bandfg:"#F1ECF8",bandmuted:"#A89DBE",bandline:"#3E3452",hatch:"#4A3F60",maint:"#5E4D7A"}},
  {id:"midnight", label:"Midnight", dark:true, swatch:["#0E1726","#F5A524"],
    c:{bg:"#0E1726",surface:"#16233A",line:"#2A3B58",ink:"#E8EEF8",muted:"#9DB0CC",brown:"#8DB8F0",sand:"#1F3050",accent:"#F5A524",band:"#08101C",bandfg:"#EAF0FA",bandmuted:"#93A8C6",bandline:"#2A3B58",hatch:"#34476A",maint:"#44608F"}}
];

function safeGet(){
  try { return window.localStorage.getItem(KEY) || "auto"; } catch (err) { return "auto"; }
}
function safeSet(id){
  try { window.localStorage.setItem(KEY, id); } catch (err) { /* private window: the choice just lasts for this visit */ }
}
function findTheme(id){
  for (let i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
  return THEMES[0];
}

/* the palette themes are written once as CSS, so they work in pop-ups and anywhere else */
function paletteCss(){
  let css = "";
  for (let i = 0; i < THEMES.length; i++){
    const t = THEMES[i];
    if (!t.c) continue;
    let body = "";
    for (const name in t.c) body += "--" + name + ":" + t.c[name] + ";";
    body += (t.dark ? STATUS_DARK : STATUS_LIGHT) + "color-scheme:" + (t.dark ? "dark" : "light") + ";";
    css += ':root[data-theme="' + t.id + '"]{' + body + "}\n";
  }
  return css;
}
const UI_CSS = `
.kt-btn{position:fixed;left:12px;bottom:12px;z-index:90;display:inline-flex;align-items:center;gap:8px;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);border-radius:999px;padding:7px 14px 7px 8px;font:700 13px/1 var(--body,Helvetica,Arial,sans-serif);cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.22)}
.kt-btn:hover{border-color:var(--ink)}
.kt-dot{width:20px;height:20px;border-radius:50%;border:1px solid rgba(0,0,0,.25);flex:none}
.kt-panel{position:fixed;left:12px;bottom:58px;z-index:91;width:min(272px,calc(100vw - 24px));background:var(--bg);color:var(--ink);border:1.5px solid var(--line);border-radius:14px;padding:12px;box-shadow:0 8px 28px rgba(0,0,0,.3);display:grid;gap:8px}
.kt-panel[hidden]{display:none}
.kt-title{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--brown);font-weight:700}
.kt-list{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.kt-opt{display:flex;align-items:center;gap:8px;border:1.5px solid var(--line);background:var(--surface);color:var(--ink);border-radius:10px;padding:7px 9px;font:13px/1.2 var(--body,Helvetica,Arial,sans-serif);cursor:pointer;text-align:left}
.kt-opt:hover{border-color:var(--ink)}
.kt-opt[aria-pressed="true"]{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent);font-weight:700}
.kt-sw{width:26px;height:26px;border-radius:50%;border:1px solid rgba(0,0,0,.25);flex:none}
@media print{.kt-btn,.kt-panel{display:none}}
`;

function swatchStyle(t){
  return "background:linear-gradient(135deg," + t.swatch[0] + " 50%," + t.swatch[1] + " 50%)";
}
function applyTheme(id){
  const root = document.documentElement;
  if (id === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", id);
  const t = findTheme(id);
  const dot = document.getElementById("kt-dot");
  if (dot) dot.setAttribute("style", swatchStyle(t));
  const buttons = document.querySelectorAll(".kt-opt");
  for (let i = 0; i < buttons.length; i++) buttons[i].setAttribute("aria-pressed", buttons[i].dataset.theme === id ? "true" : "false");
  const metaColor = document.querySelector('meta[name="theme-color"]');
  if (metaColor) metaColor.setAttribute("content", getComputedStyle(root).getPropertyValue("--band").trim() || "#282626");
}
function choose(id){
  safeSet(id);
  applyTheme(id);
}

function handlePanelClick(e){
  const opt = e.target.closest ? e.target.closest(".kt-opt") : null;
  if (opt){ choose(opt.dataset.theme); return; }
}
function togglePanel(open){
  const panel = document.getElementById("kt-panel");
  const btn = document.getElementById("kt-btn");
  if (!panel || !btn) return;
  const show = open === undefined ? panel.hidden : open;
  panel.hidden = !show;
  btn.setAttribute("aria-expanded", show ? "true" : "false");
}
function handleDocClick(e){
  const panel = document.getElementById("kt-panel");
  if (!panel || panel.hidden) return;
  if (e.target.closest && (e.target.closest("#kt-panel") || e.target.closest("#kt-btn"))) return;
  togglePanel(false);
}
function handleDocKey(e){
  if (e.key === "Escape") togglePanel(false);
}

function build(){
  const style = document.createElement("style");
  style.id = "kt-style";
  style.textContent = paletteCss() + UI_CSS;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.type = "button"; btn.id = "kt-btn"; btn.className = "kt-btn";
  btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "kt-panel");
  btn.innerHTML = '<span class="kt-dot" id="kt-dot"></span>Theme';
  btn.addEventListener("click", function handleThemeButton(){ togglePanel(); });

  const panel = document.createElement("div");
  panel.id = "kt-panel"; panel.className = "kt-panel"; panel.hidden = true;
  panel.setAttribute("role", "group"); panel.setAttribute("aria-label", "Colour theme");
  let html = '<div class="kt-title">Background and colours</div><div class="kt-list">';
  for (let i = 0; i < THEMES.length; i++){
    html += '<button type="button" class="kt-opt" data-theme="' + THEMES[i].id + '" aria-pressed="false"><span class="kt-sw" style="' + swatchStyle(THEMES[i]) + '"></span>' + THEMES[i].label + "</button>";
  }
  html += "</div>";
  panel.innerHTML = html;
  panel.addEventListener("click", handlePanelClick);

  document.body.appendChild(panel);
  document.body.appendChild(btn);
  document.addEventListener("click", handleDocClick);
  document.addEventListener("keydown", handleDocKey);
  applyTheme(safeGet());
}

/* set the saved theme straight away so the page never flashes the wrong colours */
(function early(){
  const id = safeGet();
  if (id !== "auto") document.documentElement.setAttribute("data-theme", id);
})();

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
else build();

window.KIFARU_THEME = {themes:THEMES, set:choose, get:safeGet};
})();
