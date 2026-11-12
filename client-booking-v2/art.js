/* Kifaru 4x4 · placeholder artwork
   One drawn scene per photo slot, so the picture visibly changes as you step
   through a car's 10 photos. These scenes show until the real photos load
   (see photos.js and images/download.sh). Plain JavaScript, named functions. */
(function kifaruArt(){
"use strict";

const LABELS = ["Front three-quarter","Side profile","Rear","Dashboard","Rear seats","Load area","Roof rack","Engine bay","Camping kit","Tyres and underbody"];

/* the three vehicle outlines, drawn in a 240 x 110 box */
const BODY = {
  pickup:'<path d="M18 82V58l40-6 18-26h50l12 26h86v30"/><path d="M80 30l-14 22h56l-8-22z"/><path d="M138 52v30M18 70h12M214 70h10"/><circle cx="58" cy="86" r="15"/><circle cx="190" cy="86" r="15"/><path d="M73 86h102M18 82h25M205 82h19"/>',
  wagon:'<path d="M14 82V52l20-6 16-24h168l6 24v36"/><path d="M58 26l-12 20h70V26zM124 26v20h46V26zM178 26v20h40l-4-20z"/><circle cx="58" cy="86" r="15"/><circle cx="190" cy="86" r="15"/><path d="M73 86h102M14 82h29M205 82h19"/>',
  compact:'<path d="M34 82V46l18-6 12-22h112l10 24v40"/><path d="M68 22l-10 18h52V22zM118 22v18h52l-8-18z"/><rect x="186" y="44" width="14" height="30" rx="6"/><circle cx="68" cy="86" r="15"/><circle cx="166" cy="86" r="15"/><path d="M83 86h68M34 82h19M181 82h5"/>'
};

/* times of day. These are picture colours, so they stay the same in light and dark mode. */
const SKIES = {
  dawn:{a:"#EEB97C", b:"#F8E3C6", hill:"#9A7A61", far:"#7A5E4A", ground:"#D4B48B", road:"#BE9C74", sun:"#FFF3DC"},
  day:{a:"#9BC2DE", b:"#E0EEF7", hill:"#7C8E6E", far:"#5D7052", ground:"#CABD92", road:"#B4A880", sun:"#FFFBEA"},
  dusk:{a:"#6A4E72", b:"#E79A63", hill:"#443749", far:"#2D2434", ground:"#6B574F", road:"#5A4943", sun:"#FFD9A8"},
  night:{a:"#141E38", b:"#36446240", hill:"#111929", far:"#0A1020", ground:"#1F2839", road:"#2A3450", sun:"#E8EEFF"}
};
const STAR_POINTS = [[58,52],[132,92],[212,40],[298,74],[384,36],[462,92],[540,54],[604,100],[96,134],[252,124],[430,136],[566,150]];

const PLAN = [
  {kind:"ext", sky:"dawn", zoom:1.55},
  {kind:"ext", sky:"day", zoom:1.78, lift:34},
  {kind:"ext", sky:"day", zoom:1.55, flip:true},
  {kind:"dash"},
  {kind:"seats"},
  {kind:"load"},
  {kind:"ext", sky:"dusk", zoom:1.5, rack:true},
  {kind:"engine"},
  {kind:"camp"},
  {kind:"ext", sky:"night", zoom:2.5, lift:6}
];

let uid = 0;
function nextId(){ uid += 1; return "kart" + uid; }
function num(v){ return Math.round(v * 100) / 100; }
function rect(x, y, w, h, fill, rx){
  return '<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '"' + (rx ? ' rx="' + rx + '"' : "") + ' fill="' + fill + '"/>';
}
function circle(cx, cy, r, fill){
  return '<circle cx="' + num(cx) + '" cy="' + num(cy) + '" r="' + num(r) + '" fill="' + fill + '"/>';
}
function ring(cx, cy, r, stroke, width){
  return '<circle cx="' + num(cx) + '" cy="' + num(cy) + '" r="' + num(r) + '" fill="none" stroke="' + stroke + '" stroke-width="' + width + '"/>';
}
function ellipse(cx, cy, rx, ry, fill){
  return '<ellipse cx="' + num(cx) + '" cy="' + num(cy) + '" rx="' + num(rx) + '" ry="' + num(ry) + '" fill="' + fill + '"/>';
}
function line(x1, y1, x2, y2, stroke, width){
  return '<path d="M' + num(x1) + " " + num(y1) + "L" + num(x2) + " " + num(y2) + '" fill="none" stroke="' + stroke + '" stroke-width="' + width + '" stroke-linecap="round"/>';
}
function shape(d, fill){ return '<path d="' + d + '" fill="' + fill + '"/>'; }
function outline(d, stroke, width){ return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + width + '" stroke-linecap="round" stroke-linejoin="round"/>'; }

/* ---------- pieces of the outdoor scenes ---------- */
function skyFill(id, sky){
  return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="' + sky.a + '"/><stop offset="1" stop-color="' + sky.b + '"/></linearGradient></defs>' +
    rect(0, 0, 640, 400, "url(#" + id + ")");
}
function starField(){
  let out = "";
  for (let i = 0; i < STAR_POINTS.length; i++) out += circle(STAR_POINTS[i][0], STAR_POINTS[i][1], i % 3 ? 1.7 : 2.6, "#FFFFFF");
  return out;
}
function acacia(x, groundY, scale, fill){
  const h = 46 * scale, w = 33 * scale;
  return rect(x - 2.4 * scale, groundY - h, 4.8 * scale, h, fill) +
    ellipse(x, groundY - h, w, 8.5 * scale, fill) +
    ellipse(x - 9 * scale, groundY - h - 9 * scale, w * 0.6, 6.5 * scale, fill);
}
function carGroup(shapeName, tx, ty, scale, flip, stroke, rack){
  const paths = BODY[shapeName] || BODY.wagon;
  const extra = rack ? '<path d="M64 15h112M70 15v9M170 15v9M92 15v9M148 15v9" fill="none"/>' : "";
  const t = flip ? "translate(" + num(tx + 240 * scale) + "," + num(ty) + ") scale(" + num(-scale) + "," + num(scale) + ")"
                 : "translate(" + num(tx) + "," + num(ty) + ") scale(" + num(scale) + ")";
  return '<g transform="' + t + '" fill="none" stroke="' + stroke + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">' + paths + extra + "</g>";
}
function exteriorScene(shapeName, cfg){
  const sky = SKIES[cfg.sky], ink = cfg.sky === "night" ? "#DCE6FF" : "#241F1C";
  let out = skyFill(nextId(), sky);
  if (cfg.sky === "night") out += starField();
  out += circle(cfg.sky === "dusk" ? 150 : 506, 96, 36, sky.sun);
  out += shape("M0 266 Q150 212 300 252 T640 238 L640 400 L0 400 Z", sky.far);
  out += shape("M0 298 Q180 262 360 292 T640 286 L640 400 L0 400 Z", sky.hill);
  out += rect(0, 306, 640, 94, sky.ground);
  out += rect(0, 330, 640, 48, sky.road);
  out += acacia(74, 312, 1.2, sky.far) + acacia(572, 308, 0.9, sky.far);
  const z = cfg.zoom, w = 240 * z, tx = (640 - w) / 2, ty = 400 - 110 * z - (cfg.lift === undefined ? 24 : cfg.lift);
  out += ellipse(tx + w / 2, ty + 110 * z - 5, w * 0.4, 11 * z, "rgba(0,0,0,0.2)");
  out += carGroup(shapeName, tx, ty, z, cfg.flip, ink, cfg.rack);
  return out;
}

/* ---------- inside the car ---------- */
function windowStrip(id, x, y, w, h, rx){
  const sky = SKIES.day;
  return '<defs><clipPath id="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '"/></clipPath></defs>' +
    '<g clip-path="url(#' + id + ')">' + rect(x, y, w, h, sky.b) + rect(x, y, w, h * 0.55, sky.a) +
    shape("M" + x + " " + (y + h * 0.62) + " Q" + (x + w * 0.3) + " " + (y + h * 0.34) + " " + (x + w * 0.62) + " " + (y + h * 0.6) + " T" + (x + w) + " " + (y + h * 0.56) + " L" + (x + w) + " " + (y + h) + " L" + x + " " + (y + h) + " Z", sky.hill) +
    rect(x, y + h * 0.78, w, h * 0.22, sky.ground) + "</g>";
}
function dashScene(){
  let out = rect(0, 0, 640, 400, "#1B1816");
  out += windowStrip(nextId(), 36, 24, 568, 132, 20);
  out += shape("M0 168 Q320 128 640 168 L640 400 L0 400 Z", "#2A2421");
  out += outline("M0 176 Q320 136 640 176", "#3E3631", 3);
  out += rect(0, 318, 640, 82, "#171311");
  out += rect(306, 182, 64, 18, "#15110F", 9) + rect(528, 182, 64, 18, "#15110F", 9);
  out += line(314, 191, 362, 191, "#3E3631", 3) + line(536, 191, 584, 191, "#3E3631", 3);
  out += rect(336, 206, 176, 84, "#0C1417", 8) + rect(348, 220, 100, 8, "#2E4A52", 4) + rect(348, 240, 152, 8, "#24383E", 4) + rect(348, 260, 70, 8, "#24383E", 4);
  out += ring(150, 224, 27, "#4A423D", 5) + ring(232, 224, 27, "#4A423D", 5);
  out += line(150, 206, 150, 224, "#C8A24A", 4) + line(232, 212, 244, 230, "#C8A24A", 4);
  out += ring(192, 264, 62, "#3A332E", 16) + circle(192, 264, 22, "#231E1B");
  out += line(140, 258, 244, 258, "#3A332E", 14) + line(192, 286, 192, 326, "#3A332E", 14);
  out += circle(430, 330, 16, "#3A332E") + line(430, 330, 430, 300, "#3A332E", 10);
  return out;
}
function seatScene(x){
  let out = rect(x, 152, 196, 184, "#3B342F", 24);
  out += rect(x + 22, 174, 152, 142, "#322C27", 16);
  out += line(x + 48, 192, x + 148, 192, "#453D37", 3) + line(x + 48, 222, x + 148, 222, "#453D37", 3) + line(x + 48, 252, x + 148, 252, "#453D37", 3);
  out += rect(x + 54, 108, 88, 48, "#3B342F", 18);
  out += line(x + 78, 156, x + 78, 166, "#2A2420", 6) + line(x + 118, 156, x + 118, 166, "#2A2420", 6);
  return out;
}
function seatsScene(){
  let out = rect(0, 0, 640, 400, "#1A1715");
  out += windowStrip(nextId(), 0, 16, 640, 116, 0);
  out += rect(300, 16, 30, 116, "#1A1715");
  out += rect(0, 128, 640, 16, "#241F1C");
  out += seatScene(56) + seatScene(386);
  out += rect(286, 250, 62, 86, "#332C28", 12);
  out += line(252, 150, 186, 330, "#8A8076", 11);
  out += rect(0, 336, 640, 64, "#15120F");
  return out;
}
function loadScene(){
  let out = rect(0, 0, 640, 400, "#1C1916");
  out += rect(34, 30, 572, 332, "#241F1C", 18);
  out += '<rect x="34" y="30" width="572" height="332" rx="18" fill="none" stroke="#3B332E" stroke-width="13"/>';
  out += rect(60, 262, 520, 86, "#2F2924");
  out += rect(106, 162, 128, 112, "#6E6054", 8) + line(106, 206, 234, 206, "#54483F", 5);
  out += rect(250, 196, 104, 78, "#4E5A49", 6) + line(302, 196, 302, 274, "#3C4639", 4);
  out += rect(370, 146, 126, 128, "#7B6A57", 8) + rect(394, 146, 18, 128, "#5E5044");
  out += rect(512, 182, 56, 92, "#44543F", 7) + rect(530, 170, 20, 14, "#2E3A2B", 4);
  out += line(60, 228, 580, 228, "#B9A07C", 6) + rect(300, 218, 26, 20, "#E0D3B8", 4);
  return out;
}
function engineScene(){
  let out = rect(0, 0, 640, 400, "#14110E");
  out += rect(0, 0, 640, 54, "#2B2622") + outline("M0 56 Q320 76 640 56", "#4A423C", 4);
  out += rect(176, 150, 288, 160, "#3C3D41", 12) + line(200, 178, 440, 178, "#515358", 5) + line(200, 206, 440, 206, "#515358", 5);
  out += rect(216, 112, 112, 46, "#272A30", 8) + line(230, 135, 312, 135, "#3A3E46", 4);
  out += rect(88, 134, 96, 86, "#23262B", 10) + line(104, 160, 168, 160, "#343941", 4);
  out += ring(512, 190, 42, "#4B4D53", 13) + ring(530, 288, 24, "#4B4D53", 10) + circle(512, 190, 10, "#2A2C31");
  out += outline("M470 190 Q560 150 554 288", "#1E2024", 7);
  out += outline("M176 160 Q120 110 90 130", "#5B4A44", 12) + outline("M464 220 Q540 230 560 200", "#5B4A44", 10);
  out += rect(60, 254, 122, 82, "#2B3A4A", 7) + rect(78, 244, 18, 12, "#9AA4AC", 3) + rect(146, 244, 18, 12, "#9AA4AC", 3);
  out += circle(300, 128, 17, "#C8A24A") + ring(300, 128, 17, "#8E7232", 3);
  out += rect(360, 308, 180, 14, "#23262B", 6);
  return out;
}
function campScene(shapeName){
  const sky = SKIES.dusk;
  let out = skyFill(nextId(), sky);
  out += circle(520, 112, 30, sky.sun);
  out += shape("M0 258 Q160 210 320 250 T640 240 L640 400 L0 400 Z", sky.far);
  out += rect(0, 288, 640, 112, sky.ground);
  out += carGroup(shapeName, 352, 196, 1.1, false, "#1F1A18", false);
  out += shape("M52 330 L152 196 L252 330 Z", "#B5653F") + shape("M132 330 L152 222 L172 330 Z", "#7E4027");
  out += line(52, 330, 252, 330, "#8A4B2E", 5);
  out += rect(268, 282, 90, 14, "#6B5E52", 4) + line(280, 296, 274, 330, "#6B5E52", 6) + line(346, 296, 352, 330, "#6B5E52", 6);
  out += rect(286, 258, 56, 26, "#4E6B7A", 5) + rect(286, 256, 56, 7, "#90A9B5", 3);
  out += line(196, 284, 208, 322, "#3F4A3C", 7) + line(236, 284, 224, 322, "#3F4A3C", 7) + rect(190, 268, 52, 20, "#56684F", 6) + line(242, 268, 242, 288, "#3F4A3C", 6);
  out += line(430, 326, 470, 316, "#5A4A3E", 8) + line(434, 316, 472, 326, "#5A4A3E", 8);
  out += shape("M444 316 Q452 288 460 316 Q470 300 466 318 Z", "#F0A33C") + shape("M448 318 Q452 302 458 318 Z", "#FFE08A");
  out += ellipse(452, 330, 40, 9, "rgba(0,0,0,0.18)");
  return out;
}

/* ---------- the one function the page calls ---------- */
function sceneBody(shapeName, index){
  const cfg = PLAN[index] || PLAN[0];
  if (cfg.kind === "dash") return dashScene();
  if (cfg.kind === "seats") return seatsScene();
  if (cfg.kind === "load") return loadScene();
  if (cfg.kind === "engine") return engineScene();
  if (cfg.kind === "camp") return campScene(shapeName);
  return exteriorScene(shapeName, cfg);
}
function scene(shapeName, index, label, cls){
  return '<svg class="' + (cls || "") + '" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' +
    String(label || LABELS[index] || "Car photo").replace(/"/g, "&quot;") + '">' + sceneBody(shapeName, index) + "</svg>";
}

window.KIFARU_ART = {labels:LABELS, scene:scene, count:PLAN.length};
})();
