/* Kifaru 4x4 · Client Booking (demo)
   Plain JavaScript, no framework. Named functions throughout.
   Bookings made here are saved in this browser (localStorage) so the
   Admin Management site on the same domain can pick them up. */
(function clientBookingApp(){
"use strict";

/* ============ helpers ============ */
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return document.querySelectorAll(sel); }
function esc(value){ return String(value == null ? "" : value).replace(/[&<>"']/g, escapeChar); }
function escapeChar(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }
function each(items, renderOne){ let out = ""; for (let i = 0; i < items.length; i++) out += renderOne(items[i], i); return out; }
function pad2(n){ return String(n).padStart(2, "0"); }
function iso(d){ return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function parse(s){ const p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function nice(s){ return parse(s).toLocaleDateString("en-GB", {weekday:"short", day:"numeric", month:"short"}); }
function money(n){ return "$" + Math.round(n).toLocaleString("en-US"); }
function fmtDT(d){ return d.toLocaleString("en-GB", {weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"}); }

/* Demo date, kept in step with the admin site */
const TODAY = new Date(2026, 10, 4);
const TODAY_ISO = iso(TODAY);

const TIERS = [[3,7],[8,15],[16,30],[31,45],[46,60],[61,Infinity]];
function tierLabel(t){ return t[1] === Infinity ? t[0] + "+ days" : t[0] + "–" + t[1] + " days"; }
function tierIdx(days){ for (let i = 0; i < TIERS.length; i++){ if (days >= TIERS[i][0] && days <= TIERS[i][1]) return i; } return 0; }
const GUIDE = 45, DELIVERY = 30, LATE = 25, EXCESS_KM = 0.35;
const WA_NUMBER = "254700000000";
const STORE_KEY = "kifaru-demo-client-bookings";

const SHAPES = {
  pickup:'<path d="M18 82V58l40-6 18-26h50l12 26h86v30"/><path d="M80 30l-14 22h56l-8-22z"/><path d="M138 52v30M18 70h12M214 70h10"/><circle cx="58" cy="86" r="15"/><circle cx="190" cy="86" r="15"/><path d="M73 86h102M18 82h25M205 82h19"/>',
  wagon:'<path d="M14 82V52l20-6 16-24h168l6 24v36"/><path d="M58 26l-12 20h70V26zM124 26v20h46V26zM178 26v20h40l-4-20z"/><circle cx="58" cy="86" r="15"/><circle cx="190" cy="86" r="15"/><path d="M73 86h102M14 82h29M205 82h19"/>',
  compact:'<path d="M34 82V46l18-6 12-22h112l10 24v40"/><path d="M68 22l-10 18h52V22zM118 22v18h52l-8-18z"/><rect x="186" y="44" width="14" height="30" rx="6"/><circle cx="68" cy="86" r="15"/><circle cx="166" cy="86" r="15"/><path d="M83 86h68M34 82h19M181 82h5"/>'
};
function carSvg(shape, cls){
  return '<svg class="' + (cls || "") + '" viewBox="0 0 240 110" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + SHAPES[shape] + "</svg>";
}
const PHOTO_LABELS = ["Front three-quarter","Side profile","Rear","Dashboard","Rear seats","Load area","Roof rack","Engine bay","Camping kit laid out","Underbody and tyres"];

/* ============ fleet (example data) ============ */
const cars = [
  {id:"hilux", name:"Toyota Hilux", variant:"Double-cab", type:"Pickup", shape:"pickup", seats:5, trans:"Manual", fuel:"Diesel",
    blurb:"A tough double-cab with a covered load bed. Room for five and all the camping kit for a long circuit through the parks.",
    rates:{u:[170,160,150,140,135,130], e:[200,190,180,170,165,160]}, deposit:500, commit:0.3, km:300, min:3, locations:["Nairobi office","JKIA airport"], delivery:true, photos:8, video:"0:52",
    specs:[["Year","2022"],["Transmission","Manual"],["Engine","2.8 L diesel"],["Fuel tank","80 L"],["Seats","5"],["Drive","4x4 with low range"]],
    acc:[["Water tank","Yes"],["Fridge","Yes"],["Roof tent","On request"],["Roof rack","Yes"],["Dual battery","Yes"]],
    tools:[["Tow rope","Yes"],["High-lift jack","Yes"],["Compressor","Yes"],["First aid kit","Yes"],["Sand ladders","On request"]],
    booked:[["2026-10-28","2026-11-03"],["2026-11-14","2026-11-20"],["2026-12-19","2026-12-30"]],
    reviews:[[5,"M. K.","Aug 2026","Handled the Maasai Mara roads well. Handover took 20 minutes."],[4,"J. O.","Jul 2026","Fridge was great. Collection at JKIA was easy."]]},
  {id:"lc76", name:"Land Cruiser", variant:"76 Series", type:"Station wagon", shape:"wagon", seats:5, trans:"Manual", fuel:"Diesel",
    blurb:"The classic safari wagon. Long-range tanks and a pop-top roof for game viewing, for trips far from fuel stops.",
    rates:{u:[170,160,150,140,135,130], e:[200,190,180,170,165,160]}, deposit:600, commit:0.5, km:300, min:3, locations:["Nairobi office","JKIA airport","Wilson Airport"], delivery:true, photos:10, video:"1:04",
    specs:[["Year","2021"],["Transmission","Manual"],["Engine","4.5 L V8 diesel"],["Fuel tank","180 L (two tanks)"],["Seats","5"],["Drive","4x4 with low range"]],
    acc:[["Water tank","Yes"],["Fridge","Yes"],["Pop-top roof","Yes"],["Roof rack","Yes"],["Snorkel","Yes"]],
    tools:[["Tow rope","Yes"],["High-lift jack","Yes"],["Compressor","Yes"],["First aid kit","Yes"],["Recovery kit","Yes"]],
    booked:[["2026-10-24","2026-11-08"],["2026-11-25","2026-12-02"]],
    reviews:[[5,"A. W.","Sep 2026","Ten days in Samburu and Laikipia without a single problem."]]},
  {id:"jimny3", name:"Suzuki Jimny", variant:"3-door", type:"Compact SUV", shape:"compact", seats:4, trans:"Manual", fuel:"Petrol",
    blurb:"Small, light and nimble. Best for two travellers on a budget who want real off-road ability.",
    rates:{u:[135,125,110,100,95,90], e:[160,150,135,125,120,115]}, deposit:350, commit:0.3, km:250, min:3, locations:["Nairobi office"], delivery:true, photos:6, video:"0:41",
    specs:[["Year","2023"],["Transmission","Manual"],["Engine","1.5 L petrol"],["Fuel tank","40 L"],["Seats","4 (2 recommended)"],["Drive","4x4 with low range"]],
    acc:[["Water tank","No"],["Fridge","On request"],["Roof tent","Yes"],["Roof rack","Yes"],["Dual battery","No"]],
    tools:[["Tow rope","Yes"],["Jack","Yes"],["Compressor","Yes"],["First aid kit","Yes"],["Sand ladders","No"]],
    booked:[["2026-11-05","2026-11-09"],["2026-12-22","2027-01-03"]],
    reviews:[[4,"T. N.","Aug 2026","Perfect for two. Packing is tight, so travel light."]]},
  {id:"jimny5", name:"Suzuki Jimny", variant:"5-door", type:"Compact SUV", shape:"compact", seats:4, trans:"Automatic", fuel:"Petrol",
    blurb:"The longer Jimny with an automatic gearbox and a usable boot. Easy in Nairobi traffic and good on park tracks.",
    rates:{u:[145,135,120,110,105,100], e:[170,160,145,135,130,125]}, deposit:400, commit:1, km:250, min:3, locations:["Nairobi office","Wilson Airport"], delivery:true, photos:7, video:null,
    specs:[["Year","2024"],["Transmission","Automatic"],["Engine","1.5 L petrol"],["Fuel tank","40 L"],["Seats","4"],["Drive","4x4 with low range"]],
    acc:[["Water tank","No"],["Fridge","On request"],["Roof tent","Yes"],["Roof rack","Yes"],["Dual battery","No"]],
    tools:[["Tow rope","Yes"],["Jack","Yes"],["Compressor","Yes"],["First aid kit","Yes"],["Sand ladders","No"]],
    booked:[["2026-10-30","2026-11-02"],["2026-11-18","2026-11-23"]],
    reviews:[]}
];
function byId(id){ for (const c of cars) if (c.id === id) return c; return null; }
function rateFor(car, days, hire){ return car.rates[hire][tierIdx(days)]; }
function overlaps(car, s, e){ for (const r of car.booked){ if (!(e < r[0] || s > r[1])) return true; } return false; }
function isBooked(car, d){ for (const r of car.booked){ if (d >= r[0] && d <= r[1]) return true; } return false; }
function avgRating(c){ if (!c.reviews.length) return null; let sum = 0; for (const r of c.reviews) sum += r[0]; return sum / c.reviews.length; }

function slots(ds){
  if (!ds) return [];
  const w = parse(ds).getDay();
  if (w === 0) return [];
  const last = w === 6 ? 11 : 16, out = [];
  for (let h = 8; h <= last; h++) out.push(pad2(h) + ":00");
  return out;
}
function quote(car, b){
  if (!b.start || !b.end || !b.pt || !b.rt) return null;
  const p = parse(b.start); p.setHours(Number(b.pt.slice(0, 2)));
  const r = parse(b.end); r.setHours(Number(b.rt.slice(0, 2)));
  const hours = (r - p) / 36e5;
  const days = Math.max(1, Math.ceil((hours - 1) / 24));
  const rate = rateFor(car, days, b.hire);
  const hireCost = rate * days, guide = b.guide ? GUIDE * days : 0, delivery = b.method === "delivery" ? DELIVERY * 2 : 0;
  const total = hireCost + guide + delivery;
  return {days:days, rate:rate, hireCost:hireCost, guide:guide, delivery:delivery, total:total, commit:Math.round(total * car.commit), deposit:car.deposit};
}
function waLink(text){ return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text); }

/* ============ state ============ */
const compare = new Set();
let current = null;
let book = null;
let calMonth = new Date(2026, 10, 1);
let photoIdx = 0;
let signedEmail = null;
let refSeq = 3000;
const bookings = [
  {ref:"BK-2041", car:"hilux", email:"you@example.com", name:"Example customer", start:"2026-11-14", end:"2026-11-20", pt:"09:00", rt:"09:00", hire:"e", method:"office", location:"JKIA airport", guide:false, status:"BOOKED", example:true},
  {ref:"BK-1977", car:"jimny3", email:"you@example.com", name:"Example customer", start:"2026-08-10", end:"2026-08-16", pt:"10:00", rt:"10:00", hire:"u", method:"office", location:"Nairobi office", guide:false, status:"COMPLETED", example:true}
];
for (const b of bookings) b.q = quote(byId(b.car), b);

/* ---- browser storage (shared with Admin Management on the same domain) ---- */
function loadStored(){
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e){ return []; }
}
function saveStored(){
  const list = [];
  for (const b of bookings){
    if (b.example) continue;
    list.push({ref:b.ref, carId:b.car, email:b.email, name:b.name, phone:b.phone, start:b.start, end:b.end, pt:b.pt, rt:b.rt, hire:b.hire,
      method:b.method, location:b.location, address:b.address, guide:b.guide, total:b.q.total, status:b.status, code:b.code || "", createdAt:b.createdAt});
  }
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e){ /* storage blocked: bookings stay in this tab only */ }
}
function restoreStored(){
  for (const s of loadStored()){
    const car = byId(s.carId);
    if (!car || !s.ref) continue;
    const num = Number(String(s.ref).replace(/\D/g, ""));
    if (num > refSeq) refSeq = num;
    const b = {ref:s.ref, car:s.carId, email:s.email, name:s.name || "", phone:s.phone || "", start:s.start, end:s.end, pt:s.pt, rt:s.rt, hire:s.hire,
      method:s.method, location:s.location, address:s.address || "", guide:!!s.guide, status:s.status || "COMMITTED", code:s.code || null,
      createdAt:s.createdAt, deadline:new Date(new Date(s.createdAt || Date.now()).getTime() + 48 * 36e5)};
    b.q = quote(car, b);
    bookings.unshift(b);
    if (b.status !== "CANCEL_REQUESTED") car.booked.push([b.start, b.end]);
  }
}

/* ============ views ============ */
function show(view){
  const tabs = $all(".tab");
  for (const t of tabs){
    if (t.dataset.view === view) t.setAttribute("aria-current", "page");
    else t.removeAttribute("aria-current");
  }
  $("#view-fleet").hidden = view !== "fleet";
  $("#view-bookings").hidden = view !== "bookings";
  $("#hero").hidden = view !== "fleet" || !!current;
  updateCmpBar();
  if (view === "bookings") renderBookings();
}
function handleTabClick(e){
  const view = e.currentTarget.dataset.view;
  if (view === "fleet") closeCar();
  show(view);
  try { history.replaceState(null, "", "#" + view); } catch (err){ /* ignore */ }
}

/* ============ fleet list ============ */
function filters(){
  return {type:$("#f-type").value, seats:Number($("#f-seats").value), trans:$("#f-trans").value, fuel:$("#f-fuel").value,
    max:Number($("#f-price").value), loc:$("#f-loc").value, from:$("#f-from").value, to:$("#f-to").value, hire:$("#f-hire").value};
}
function datesChosen(f){ return f.from && f.to && f.to > f.from; }
function carMatches(c, f){
  return (!f.type || c.type === f.type) && c.seats >= f.seats && (!f.trans || c.trans === f.trans) && (!f.fuel || c.fuel === f.fuel) &&
    c.rates[f.hire][0] <= f.max && (!f.loc || c.locations.indexOf(f.loc) >= 0);
}
function isFreeFor(c, f){ return !datesChosen(f) || !overlaps(c, f.from, f.to); }
function renderCard(c, f){
  const ok = isFreeFor(c, f), r = avgRating(c), dated = datesChosen(f);
  const badge = dated ? '<span class="badge ' + (ok ? "ok" : "bad") + '">' + (ok ? "Free for your dates" : "Booked during your dates") + "</span>" : "";
  return '<article class="card' + (ok ? "" : " unavail") + '">' +
    '<div class="cover">' + carSvg(c.shape) + badge + "</div>" +
    '<div class="card-body"><div class="eyebrow">' + c.type + "</div><h3>" + c.name + " " + c.variant + "</h3>" +
    '<div class="chips"><span class="chip">' + c.seats + ' seats</span><span class="chip">' + c.trans + '</span><span class="chip">' + c.fuel + "</span>" + (r ? '<span class="chip">★ ' + r.toFixed(1) + "</span>" : "") + "</div>" +
    '<div class="price-line num"><strong>' + money(c.rates[f.hire][0]) + '</strong><span class="muted">/ day for 3–7 days</span></div>' +
    '<p class="muted num" style="font-size:13px">From ' + money(c.rates[f.hire][5]) + "/day on 61+ day hires · " + money(c.deposit) + " refundable deposit</p></div>" +
    '<div class="card-foot"><label class="cmp"><input type="checkbox" data-cmp="' + c.id + '"' + (compare.has(c.id) ? " checked" : "") + "> Compare</label>" +
    '<button class="btn small" data-open="' + c.id + '" type="button">' + (ok ? "View &amp; book" : "See other dates") + "</button></div></article>";
}
function renderFleet(){
  const f = filters();
  $("#f-price-out").textContent = money(f.max);
  const list = [];
  for (const c of cars) if (carMatches(c, f)) list.push(c);
  function freeFirst(a, b){ return Number(isFreeFor(b, f)) - Number(isFreeFor(a, f)); }
  list.sort(freeFirst);
  let nFree = 0;
  for (const c of list) if (isFreeFor(c, f)) nFree++;
  $("#count").textContent = datesChosen(f) ? nFree + " of " + list.length + " free for " + nice(f.from) + " – " + nice(f.to) : list.length + " vehicle" + (list.length === 1 ? "" : "s");
  if (!list.length){
    $("#grid").innerHTML = '<div class="empty" style="grid-column:1/-1"><strong>No cars match these filters.</strong><span class="muted">Try a higher daily rate or a different pick-up location.</span><button class="btn ghost small" type="button" id="empty-reset">Clear filters</button></div>';
    $("#empty-reset").addEventListener("click", resetFilters);
    return;
  }
  let html = "";
  for (const c of list) html += renderCard(c, f);
  $("#grid").innerHTML = html;
}
function resetFilters(){
  $("#f-type").value = ""; $("#f-trans").value = ""; $("#f-fuel").value = "";
  $("#f-seats").value = "0"; $("#f-price").value = "200"; $("#f-loc").value = "";
  renderFleet();
}
function handleSearchSubmit(e){
  e.preventDefault();
  const f = filters();
  if (f.from && f.to && f.to <= f.from){ toast("Return date must be after pick-up date"); return; }
  renderFleet();
  $("#fleet-list").scrollIntoView({behavior:"smooth"});
}
function handleFromChange(){
  const f = $("#f-from").value;
  if (f){ const n = parse(f); n.setDate(n.getDate() + 1); $("#f-to").min = iso(n); }
}
function handleGridClick(e){
  const b = e.target.closest("[data-open]");
  if (b) openCar(b.dataset.open);
}
function handleGridChange(e){
  const c = e.target.closest("[data-cmp]");
  if (!c) return;
  if (c.checked){
    if (compare.size >= 3){ c.checked = false; toast("Compare up to 3 cars at a time"); return; }
    compare.add(c.dataset.cmp);
  } else compare.delete(c.dataset.cmp);
  updateCmpBar();
}

/* ============ compare ============ */
function carLabel(id){ const c = byId(id); return c.name + " " + c.variant; }
function updateCmpBar(){
  const on = compare.size > 0 && !$("#view-fleet").hidden;
  $("#cmpbar").hidden = !on;
  const names = [];
  for (const id of compare) names.push(carLabel(id));
  $("#cmp-names").textContent = names.join(" · ");
  $("#cmp-open").disabled = compare.size < 2;
  $("#cmp-open").textContent = compare.size < 2 ? "Pick one more" : "Compare " + compare.size;
}
function clearCompare(){ compare.clear(); renderFleet(); updateCmpBar(); }
function openCompare(){
  const list = [];
  for (const id of compare) list.push(byId(id));
  const hire = $("#f-hire").value;
  function rating(c){ const r = avgRating(c); return r ? "★ " + r.toFixed(1) : "No reviews yet"; }
  const rows = [
    ["Type", function v(c){ return c.type; }], ["Seats", function v(c){ return c.seats; }], ["Transmission", function v(c){ return c.trans; }],
    ["Fuel", function v(c){ return c.fuel; }], ["Engine", function v(c){ return c.specs[2][1]; }],
    ["3–7 days", function v(c){ return money(c.rates[hire][0]) + "/day"; }], ["16–30 days", function v(c){ return money(c.rates[hire][2]) + "/day"; }],
    ["61+ days", function v(c){ return money(c.rates[hire][5]) + "/day"; }], ["Deposit", function v(c){ return money(c.deposit); }],
    ["Mileage limit", function v(c){ return c.km + " km/day"; }], ["Minimum hire", function v(c){ return c.min + " days"; }],
    ["Pick-up points", function v(c){ return c.locations.join(", "); }], ["Delivery", function v(c){ return c.delivery ? "Yes" : "No"; }],
    ["Fridge", function v(c){ return c.acc[1][1]; }], ["Rating", rating]
  ];
  let head = "<tr><th></th>";
  for (const c of list) head += "<th>" + c.name + "<br>" + c.variant + "</th>";
  head += "</tr>";
  let body = "";
  for (const row of rows){
    body += '<tr><th scope="row">' + row[0] + "</th>";
    for (const c of list) body += "<td>" + esc(row[1](c)) + "</td>";
    body += "</tr>";
  }
  body += "<tr><th></th>";
  for (const c of list) body += '<td><button class="btn small" data-close data-go="' + c.id + '">Book</button></td>';
  body += "</tr>";
  openModal('<div class="modal-head"><div><div class="eyebrow">' + (hire === "e" ? "Equipped" : "Unequipped") + ' hire</div><h2 id="modal-title">Compare cars</h2></div><button class="x" data-close aria-label="Close">×</button></div>' +
    '<div class="table-wrap"><table><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div>");
}

/* ============ car detail ============ */
function openCar(id){
  current = id; photoIdx = 0;
  const c = byId(id), f = filters();
  book = {start:null, end:null, pt:null, rt:null, hire:f.hire, method:"office", location:(f.loc && c.locations.indexOf(f.loc) >= 0) ? f.loc : c.locations[0], address:"", guide:false};
  if (datesChosen(f) && !overlaps(c, f.from, f.to) && slots(f.from).length && slots(f.to).length){
    book.start = f.from; book.end = f.to;
    const ps = slots(f.from), rs = slots(f.to);
    book.pt = ps[1] || ps[0];
    book.rt = rs.indexOf(book.pt) >= 0 ? book.pt : rs[0];
    calMonth = new Date(parse(f.from).getFullYear(), parse(f.from).getMonth(), 1);
  } else calMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  $("#fleet-list").hidden = true; $("#car-view").hidden = false; $("#hero").hidden = true;
  renderDetail();
  window.scrollTo({top:0});
}
function closeCar(){ current = null; $("#car-view").hidden = true; $("#fleet-list").hidden = false; renderFleet(); }
function kvList(list){
  let out = '<ul class="kv">';
  for (const pair of list) out += "<li><b>" + pair[0] + "</b><span>" + pair[1] + "</span></li>";
  return out + "</ul>";
}
function renderThumb(label, i){
  const c = byId(current);
  return '<button class="thumb" role="listitem" data-ph="' + i + '" aria-label="' + label + '">' + (i === 0 ? '<span class="star">COVER</span>' : "") + carSvg(c.shape) + "</button>";
}
function renderReview(r){
  return '<div class="review"><div><span class="stars" aria-label="' + r[0] + ' of 5">' + "★".repeat(r[0]) + "☆".repeat(5 - r[0]) + "</span> <b>" + esc(r[1]) + '</b> <span class="muted">· ' + esc(r[2]) + "</span></div><p>" + esc(r[3]) + "</p></div>";
}
function renderLocationOption(l){ return "<option" + (l === book.location ? " selected" : "") + ">" + l + "</option>"; }
function renderDetail(){
  const c = byId(current), r = avgRating(c);
  const photos = PHOTO_LABELS.slice(0, c.photos);
  const askText = "Hi Kifaru 4x4, I have a question about the " + c.name + " " + c.variant + ".";
  const delivery = c.delivery ?
    '<label class="opt"><input type="radio" name="method" value="delivery"' + (book.method === "delivery" ? " checked" : "") + "><span>Deliver and collect within Nairobi (+" + money(DELIVERY) + " each way)</span></label>" +
    '<input type="text" id="b-addr" placeholder="Delivery address or hotel"' + (book.method === "delivery" ? "" : " hidden") + ' value="' + esc(book.address) + '">' : "";
  $("#car-view").innerHTML =
    '<button class="link back" id="back" type="button">← Back to fleet</button>' +
    '<div class="detail-head"><div><div class="eyebrow">' + c.type + " · " + c.locations.join(" · ") + "</div><h1>" + c.name + "<span>" + c.variant + "</span></h1></div>" +
    '<div class="chips"><span class="chip">' + c.seats + ' seats</span><span class="chip">' + c.trans + '</span><span class="chip">' + c.fuel + "</span>" + (r ? '<span class="chip">★ ' + r.toFixed(1) + " (" + c.reviews.length + ")</span>" : "") + "</div></div>" +
    '<div class="gallery"><div class="stage" id="stage"></div><div class="thumbs" role="list">' + each(photos, renderThumb) +
      (c.video ? '<button class="thumb video" role="listitem" data-ph="video" aria-label="Walkaround video">▶ 360° video</button>' : "") + "</div></div>" +
    '<p class="media-note muted num">' + c.photos + " of 10 photos" + (c.video ? " · 1 walkaround video (" + c.video + ")" : " · walkaround video coming soon") + " · the first photo is the cover shown in the fleet list</p>" +
    '<div class="detail"><div>' +
      '<div class="section"><h2>About this car</h2><p style="max-width:65ch">' + c.blurb + "</p>" +
        '<div class="specs"><div><h3>Specifications</h3>' + kvList(c.specs) + "</div><div><h3>Accessories</h3>" + kvList(c.acc) + "</div><div><h3>Tools</h3>" + kvList(c.tools) + "</div></div></div>" +
      '<div class="section"><h2>Rental terms</h2><dl class="terms">' +
        "<div><dt>Minimum hire</dt><dd>" + c.min + " days</dd></div>" +
        "<div><dt>Mileage</dt><dd>" + c.km + " km/day, then $" + EXCESS_KM.toFixed(2) + "/km</dd></div>" +
        "<div><dt>Fuel policy</dt><dd>Full to full</dd></div>" +
        '<div><dt>Refundable deposit</dt><dd class="num">' + money(c.deposit) + ", paid at pick-up</dd></div>" +
        "<div><dt>Driver age</dt><dd>23 or older</dd></div>" +
        "<div><dt>Licence</dt><dd>Held 2+ years; international permit if not from Kenya</dd></div>" +
        "<div><dt>Late return</dt><dd>1 hour grace, then $" + LATE + "/hour</dd></div>" +
        "<div><dt>Cancellation</dt><dd>Commitment fee refunded up to 14 days before pick-up</dd></div></dl></div>" +
      '<div class="section"><h2>Daily rates</h2><p class="muted">The longer you hire, the lower the daily rate. Your tier is highlighted once you pick dates.</p>' +
        '<div class="table-wrap"><table id="rate-table"><thead><tr><th>Hire length</th><th>Unequipped</th><th>Equipped</th></tr></thead><tbody></tbody></table></div></div>' +
      '<div class="section" style="border:0"><h2>Reviews</h2><p class="muted" style="font-size:13px">Only customers with a completed rental can leave a review. (Sample content.)</p>' +
        (c.reviews.length ? each(c.reviews, renderReview) : '<p class="muted">No reviews yet.</p>') + "</div>" +
    "</div>" +
    '<aside class="panel" aria-label="Book this car"><h2>Book this car</h2>' +
      '<div class="seg" role="group" aria-label="Hire type"><button type="button" data-hire="u">Unequipped</button><button type="button" data-hire="e">Equipped</button></div>' +
      '<div><div class="cal-head"><button class="cal-nav" id="cal-prev" type="button" aria-label="Previous month">‹</button><strong id="cal-title"></strong><button class="cal-nav" id="cal-next" type="button" aria-label="Next month">›</button></div>' +
        '<div class="cal" id="cal" style="margin-top:8px"></div>' +
        '<div class="legend" style="margin-top:8px"><span><i class="lg-free"></i>Free</span><span><i class="lg-booked"></i>Booked</span><span><i class="lg-sel"></i>Your dates</span><span>Sun: no handovers</span></div></div>' +
      '<p class="muted" id="cal-hint" style="font-size:13px"></p><div class="msg" id="cal-msg" hidden></div>' +
      '<div class="row2"><label class="field"><span>Pick-up time</span><select id="b-pt"></select></label><label class="field"><span>Return time</span><select id="b-rt"></select></label></div>' +
      '<fieldset class="field" style="border:0;padding:0;margin:0;gap:8px"><span>Pick-up and drop-off</span>' +
        '<label class="opt"><input type="radio" name="method" value="office"' + (book.method === "office" ? " checked" : "") + '><span>Collect from <select id="b-loc" style="width:auto;padding:4px 8px">' + each(c.locations, renderLocationOption) + "</select></span></label>" + delivery + "</fieldset>" +
      '<label class="opt"><input type="checkbox" id="b-guide"' + (book.guide ? " checked" : "") + "><span>Add a driver-guide (+" + money(GUIDE) + "/day)</span></label>" +
      '<div class="quote num" id="quote"></div>' +
      '<div class="field"><span>Your details</span><input type="email" id="b-email" placeholder="Email (required)" required><input type="text" id="b-name" placeholder="Full name"><input type="tel" id="b-phone" placeholder="Phone, for pick-up coordination"></div>' +
      '<div class="msg err" id="b-err" hidden></div>' +
      '<button class="btn" id="b-submit" type="button">Request booking</button>' +
      '<p style="font-size:13px">Questions about this car? <a class="wa-inline" href="' + esc(waLink(askText)) + '" target="_blank" rel="noopener">Ask us on WhatsApp</a></p>' +
      '<p class="muted" style="font-size:12px">Nothing is charged now. We hold the car and email you the commitment fee details. The car is confirmed once we receive the fee.</p>' +
    "</aside></div>";
  wireDetail();
  renderStage(); renderPanel();
}
function wireDetail(){
  $("#back").addEventListener("click", handleBack);
  for (const b of $all("[data-ph]")) b.addEventListener("click", handleThumbClick);
  for (const b of $all("[data-hire]")) b.addEventListener("click", handleHireClick);
  $("#cal-prev").addEventListener("click", handleCalPrev);
  $("#cal-next").addEventListener("click", handleCalNext);
  $("#cal").addEventListener("click", handleCalClick);
  $("#b-pt").addEventListener("change", handlePickupTime);
  $("#b-rt").addEventListener("change", handleReturnTime);
  $("#b-loc").addEventListener("change", handleLocation);
  for (const r of $all("input[name=method]")) r.addEventListener("change", handleMethod);
  const addr = $("#b-addr");
  if (addr) addr.addEventListener("input", handleAddress);
  $("#b-guide").addEventListener("change", handleGuide);
  $("#b-submit").addEventListener("click", submitBooking);
}
function handleBack(){ closeCar(); $("#hero").hidden = false; }
function handleThumbClick(e){ const v = e.currentTarget.dataset.ph; photoIdx = v === "video" ? "video" : Number(v); renderStage(); }
function handleHireClick(e){ book.hire = e.currentTarget.dataset.hire; renderPanel(); }
function handleCalPrev(){ calMonth.setMonth(calMonth.getMonth() - 1); renderCal(); }
function handleCalNext(){ calMonth.setMonth(calMonth.getMonth() + 1); renderCal(); }
function handleCalClick(e){ const d = e.target.closest("[data-d]"); if (d) pickDay(d.dataset.d); }
function handlePickupTime(e){ book.pt = e.target.value; renderQuote(); }
function handleReturnTime(e){ book.rt = e.target.value; renderQuote(); }
function handleLocation(e){ book.location = e.target.value; }
function handleMethod(e){ book.method = e.target.value; const a = $("#b-addr"); if (a) a.hidden = e.target.value !== "delivery"; renderQuote(); }
function handleAddress(e){ book.address = e.target.value; }
function handleGuide(e){ book.guide = e.target.checked; renderQuote(); }

function renderStage(){
  const c = byId(current), st = $("#stage");
  for (const b of $all("[data-ph]")) b.setAttribute("aria-current", String(b.dataset.ph === String(photoIdx)));
  if (photoIdx === "video"){
    st.innerHTML = carSvg(c.shape, "car") + '<span class="play" aria-hidden="true">▶</span><span class="tag">360° walkaround · ' + c.video + '</span><span class="count">Video placeholder</span>';
  } else {
    st.innerHTML = carSvg(c.shape, "car") + '<span class="tag">' + PHOTO_LABELS[photoIdx] + (photoIdx === 0 ? " (cover)" : "") + '</span><span class="count num">' + (photoIdx + 1) + " / " + c.photos + "</span>";
  }
}
function renderPanel(){
  for (const b of $all("[data-hire]")) b.setAttribute("aria-pressed", String(b.dataset.hire === book.hire));
  renderCal(); renderTimes(); renderQuote();
}
function renderCal(){
  const c = byId(current), y = calMonth.getFullYear(), m = calMonth.getMonth();
  $("#cal-title").textContent = calMonth.toLocaleDateString("en-GB", {month:"long", year:"numeric"});
  $("#cal-prev").disabled = y === TODAY.getFullYear() && m <= TODAY.getMonth();
  const first = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
  let h = "";
  for (const d of ["Mo","Tu","We","Th","Fr","Sa","Su"]) h += '<span class="dow">' + d + "</span>";
  for (let i = 0; i < first; i++) h += '<span class="day blank"></span>';
  for (let d = 1; d <= n; d++){
    const ds = iso(new Date(y, m, d)), cls = ["day"];
    const past = ds < TODAY_ISO, bk = isBooked(c, ds), sun = new Date(y, m, d).getDay() === 0;
    if (past) cls.push("past"); else if (bk) cls.push("booked");
    if (sun) cls.push("sun");
    if (ds === TODAY_ISO) cls.push("today");
    if (book.start && (ds === book.start || ds === book.end)) cls.push("sel");
    else if (book.start && book.end && ds > book.start && ds < book.end) cls.push("range");
    const label = nice(ds) + (bk ? ", booked" : "") + (sun ? ", no handovers" : "");
    h += '<button type="button" class="' + cls.join(" ") + '" data-d="' + ds + '"' + (past || bk ? " disabled" : "") + ' aria-label="' + label + '">' + d + "</button>";
  }
  $("#cal").innerHTML = h;
  $("#cal-hint").textContent = !book.start ? "Tap your pick-up day, then your return day." :
    !book.end ? "Pick-up " + nice(book.start) + ". Now tap your return day." : nice(book.start) + " → " + nice(book.end) + ". Tap a new day to start over.";
}
function calMsg(t){ const m = $("#cal-msg"); m.textContent = t || ""; m.hidden = !t; }
function pickDay(ds){
  const c = byId(current);
  calMsg("");
  if (parse(ds).getDay() === 0){ calMsg("We do not hand over or collect cars on Sundays. Choose Saturday or Monday."); return; }
  if (!book.start || book.end || ds <= book.start){ book.start = ds; book.end = null; }
  else if (overlaps(c, book.start, ds)){ calMsg("Those dates cross an existing booking. Pick a return day before the hatched days, or try another car."); return; }
  else book.end = ds;
  renderCal(); renderTimes(); renderQuote();
}
function fillTimes(sel, list, cur){
  let html = "";
  if (list.length){ for (const t of list) html += "<option" + (t === cur ? " selected" : "") + ">" + t + "</option>"; }
  else html = '<option value="">Pick a date first</option>';
  sel.innerHTML = html;
  sel.disabled = !list.length;
}
function renderTimes(){
  const ps = slots(book.start), rs = slots(book.end);
  if (ps.indexOf(book.pt) < 0) book.pt = ps[1] || ps[0] || null;
  if (rs.indexOf(book.rt) < 0) book.rt = rs.indexOf(book.pt) >= 0 ? book.pt : (rs[0] || null);
  fillTimes($("#b-pt"), ps, book.pt);
  fillTimes($("#b-rt"), rs, book.rt);
}
function renderRateRow(t, i, c, hit){
  return '<tr class="' + (i === hit ? "hit" : "") + '"><td>' + tierLabel(t) + "</td><td>" + money(c.rates.u[i]) + "/day</td><td>" + money(c.rates.e[i]) + "/day</td></tr>";
}
function renderQuote(){
  const c = byId(current), q = quote(c, book);
  const hit = q ? tierIdx(q.days) : -1;
  let rows = "";
  for (let i = 0; i < TIERS.length; i++) rows += renderRateRow(TIERS[i], i, c, hit);
  $("#rate-table tbody").innerHTML = rows;
  if (!q){
    $("#quote").innerHTML = '<div class="ln"><span>Daily rate (3–7 days)</span><b>' + money(c.rates[book.hire][0]) + '</b></div><p class="muted" style="font-size:13px">Pick dates to see your total.</p>';
    return;
  }
  const short = q.days < c.min;
  $("#quote").innerHTML =
    '<div class="ln"><span>' + q.days + " day" + (q.days === 1 ? "" : "s") + " × " + money(q.rate) + " (" + (book.hire === "e" ? "equipped" : "unequipped") + ")</span><span>" + money(q.hireCost) + "</span></div>" +
    (q.guide ? '<div class="ln"><span>Driver-guide, ' + q.days + " days</span><span>" + money(q.guide) + "</span></div>" : "") +
    (q.delivery ? '<div class="ln"><span>Delivery and collection</span><span>' + money(q.delivery) + "</span></div>" : "") +
    '<div class="ln total"><span>Rental total</span><span>' + money(q.total) + "</span></div>" +
    '<div class="ln commit"><span>Commitment fee due now (' + (c.commit === 1 ? "full amount" : Math.round(c.commit * 100) + "%") + ")</span><span>" + money(q.commit) + "</span></div>" +
    '<div class="ln muted"><span>Balance at pick-up</span><span>' + money(q.total - q.commit) + "</span></div>" +
    '<div class="ln muted"><span>Refundable deposit at pick-up</span><span>' + money(q.deposit) + "</span></div>" +
    (short ? '<p class="msg err">Minimum hire is ' + c.min + " days.</p>" : "");
}
function submitBooking(){
  const c = byId(current), err = $("#b-err"), q = quote(c, book);
  const email = $("#b-email").value.trim(), name = $("#b-name").value.trim(), phone = $("#b-phone").value.trim();
  function fail(t){ err.textContent = t; err.hidden = false; }
  err.hidden = true;
  if (!book.start || !book.end) return fail("Pick your pick-up and return days on the calendar.");
  if (!q || q.days < c.min) return fail("Minimum hire is " + c.min + " days. Choose a later return day.");
  if (overlaps(c, book.start, book.end)) return fail("Someone booked these dates a moment ago. Pick other dates.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email. We send your booking and payment details there.");
  if (book.method === "delivery" && !book.address.trim()) return fail("Enter a delivery address or hotel name.");
  const now = new Date(), deadline = new Date(now.getTime() + 48 * 36e5);
  const b = Object.assign({ref:"BK-" + (++refSeq), car:c.id, email:email, name:name, phone:phone}, book, {q:q, status:"COMMITTED", createdAt:now.toISOString(), deadline:deadline, code:null});
  bookings.unshift(b);
  c.booked.push([book.start, book.end]);
  saveStored();
  openModal('<div class="modal-head"><div><div class="eyebrow">Booking ' + b.ref + '</div><h2 id="modal-title">Your ' + c.name + ' is on hold</h2></div><button class="x" data-close aria-label="Close">×</button></div>' +
    '<div class="steps">' + stepsHtml("COMMITTED") + "</div>" +
    "<p>We sent the details to <b>" + esc(email) + "</b>. Pay the commitment fee by <b>" + fmtDT(deadline) + "</b>, or the dates are released.</p>" +
    payBox(b) +
    '<p class="muted" style="font-size:13px">Staff can now see this booking in Admin Management.</p>' +
    '<div class="actions"><button class="btn" data-close data-mybookings="' + esc(email) + '">Go to My bookings</button><button class="btn ghost" data-close>Keep browsing</button></div>');
  book.start = null; book.end = null;
  renderPanel();
}

/* ============ my bookings ============ */
const STATUS = {COMMITTED:["Committed · awaiting fee","warn"], BOOKED:["Booked","ok"], ACTIVE:["On rental","info"], COMPLETED:["Completed","info"], CANCEL_REQUESTED:["Cancellation requested","bad"]};
function stepsHtml(st){
  const order = ["COMMITTED","BOOKED","ACTIVE","COMPLETED"], names = ["Committed","Booked","On rental","Returned"];
  const at = order.indexOf(st);
  let out = "";
  for (let i = 0; i < order.length; i++) out += '<div class="' + (at < 0 ? "" : i < at ? "done" : i === at ? "now" : "") + '">' + names[i] + "</div>";
  return out;
}
function payBox(b){
  return '<div class="pay"><b>Commitment fee: <span class="num">' + money(b.q.commit) + "</span></b>" +
    "<div>M-Pesa Paybill <code>000000</code> · Account <code>" + b.ref + "</code></div>" +
    "<div>Bank transfer: account details are in your email</div>" +
    '<div class="muted" style="font-size:12px">Sample payment details for this demo.</div></div>';
}
function handleMagicLink(e){
  e.preventDefault();
  const em = $("#ml-email").value.trim();
  $("#ml-sent-text").textContent = "We sent a sign-in link to " + em + ". It works once and expires in 30 minutes.";
  $("#ml-sent").hidden = false;
  $("#ml-sent").dataset.email = em;
  signedEmail = null;
  renderBookings();
}
function handleOpenMagicLink(){ signedEmail = $("#ml-sent").dataset.email; $("#ml-sent").hidden = true; renderBookings(); }
function handleSignOut(){ signedEmail = null; renderBookings(); }
function renderBookings(){
  const el = $("#bk-list");
  if (!signedEmail){ el.innerHTML = ""; return; }
  const up = [], past = [];
  for (const b of bookings){
    if (b.email.toLowerCase() !== signedEmail.toLowerCase()) continue;
    if (b.status === "COMPLETED") past.push(b); else up.push(b);
  }
  if (!up.length && !past.length){
    el.innerHTML = '<div class="empty"><strong>No bookings for ' + esc(signedEmail) + '.</strong><span class="muted">Check the spelling, or book a car from the fleet.</span></div>';
    return;
  }
  el.innerHTML = '<p class="muted">Signed in as <b>' + esc(signedEmail) + '</b> · <button class="link" id="signout" type="button">Sign out</button></p>' +
    (up.length ? '<div class="bk-group">Upcoming</div>' + each(up, bookingCard) : "") +
    (past.length ? '<div class="bk-group">History</div>' + each(past, bookingCard) : "");
  $("#signout").addEventListener("click", handleSignOut);
}
function starButton(b, n){
  return '<button type="button" data-act="star" data-ref="' + b.ref + '" data-n="' + n + '" class="' + ((b.draft || 0) >= n ? "on" : "") + '" aria-label="' + n + " star" + (n > 1 ? "s" : "") + '">★</button>';
}
function bookingCard(b){
  const c = byId(b.car), st = STATUS[b.status];
  let body = "";
  if (b.status === "COMMITTED"){
    body = "<p>Pay by <b>" + fmtDT(b.deadline) + "</b> to confirm. Unpaid holds are released automatically.</p>" + payBox(b) +
      (b.code ? '<p class="msg" style="background:var(--infobg);color:var(--info)">Payment code <b>' + esc(b.code) + "</b> received. We confirm payments within office hours (Mon–Fri 08:00–17:00, Sat 08:00–12:00).</p>" :
        '<div class="actions"><input type="text" id="code-' + b.ref + '" placeholder="M-Pesa or bank reference, e.g. QJK4XY8Z1P" style="flex:1 1 220px"><button class="btn small" data-act="code" data-ref="' + b.ref + '">I have paid</button></div>') +
      '<div class="actions"><button class="link" data-act="cancel" data-ref="' + b.ref + '">Cancel this booking</button></div>';
  } else if (b.status === "BOOKED"){
    const cutoff = iso(new Date(parse(b.start).getTime() - 14 * 864e5));
    body = '<div class="actions">' + (b.change ? '<span class="pill info">Date change requested</span>' : '<button class="btn ghost small" data-act="change" data-ref="' + b.ref + '">Request date change</button>') +
      '<button class="link" data-act="cancel" data-ref="' + b.ref + '">Cancel booking</button></div>' +
      '<p class="muted" style="font-size:13px">Free cancellation with a full refund of the commitment fee until ' + nice(cutoff) + ".</p>";
  } else if (b.status === "CANCEL_REQUESTED"){
    body = '<p class="muted">We received your request and will reply by email with any refund due.</p>';
  } else if (b.status === "COMPLETED"){
    if (b.review) body = '<p><span class="stars">' + "★".repeat(b.review) + "☆".repeat(5 - b.review) + "</span> Thanks for your review.</p>";
    else {
      let stars = "";
      for (let n = 1; n <= 5; n++) stars += starButton(b, n);
      body = '<div class="actions"><span>Rate this rental</span><span class="rate">' + stars + "</span></div>" +
        '<textarea id="rv-' + b.ref + '" rows="2" placeholder="What went well? What could be better?"></textarea>' +
        '<div class="actions"><button class="btn small" data-act="review" data-ref="' + b.ref + '"' + (b.draft ? "" : " disabled") + ">Post review</button></div>";
    }
  }
  return '<article class="bk"><div class="bk-top"><div><div class="eyebrow">' + b.ref + "</div><h3>" + c.name + " " + c.variant + '</h3></div><span class="pill ' + st[1] + '">' + st[0] + "</span></div>" +
    (b.status !== "CANCEL_REQUESTED" ? '<div class="steps">' + stepsHtml(b.status) + "</div>" : "") +
    '<div class="bk-facts num"><div><span>Pick-up</span>' + nice(b.start) + ", " + b.pt + "</div><div><span>Return</span>" + nice(b.end) + ", " + b.rt + "</div>" +
    "<div><span>Where</span>" + (b.method === "delivery" ? "Delivered: " + esc(b.address) : esc(b.location)) + "</div>" +
    "<div><span>Total · " + b.q.days + " days</span>" + money(b.q.total) + " (" + (b.hire === "e" ? "equipped" : "unequipped") + ")</div></div>" + body + "</article>";
}
function findBooking(ref){ for (const b of bookings) if (b.ref === ref) return b; return null; }
function handleBookingsClick(e){
  const t = e.target.closest("[data-act]");
  if (!t) return;
  const b = findBooking(t.dataset.ref);
  const act = t.dataset.act;
  if (act === "code"){
    const v = $("#code-" + b.ref).value.trim();
    if (v.length < 6){ toast("Enter the full payment reference"); return; }
    b.code = v.toUpperCase(); saveStored(); toast("Payment reference sent");
  } else if (act === "cancel"){
    openModal('<div class="modal-head"><h2 id="modal-title">Cancel ' + b.ref + '?</h2><button class="x" data-close aria-label="Close">×</button></div>' +
      "<p>" + (b.status === "COMMITTED" ? "No fee has been confirmed for this booking, so nothing is charged. The dates are released straight away." : "We will email you the refund due under the cancellation policy.") + "</p>" +
      '<div class="actions"><button class="btn" data-confirm-cancel="' + b.ref + '" data-close>Yes, cancel</button><button class="btn ghost" data-close>Keep booking</button></div>');
    return;
  } else if (act === "change"){ b.change = true; toast("Date change request sent"); }
  else if (act === "star"){ b.draft = Number(t.dataset.n); }
  else if (act === "review"){
    const txt = $("#rv-" + b.ref).value.trim();
    b.review = b.draft;
    byId(b.car).reviews.unshift([b.review, "You", "just now", txt || "No comment."]);
    toast("Review posted");
  }
  renderBookings();
}
function confirmCancel(ref){
  const b = findBooking(ref), c = byId(b.car);
  if (b.status === "COMMITTED"){
    const kept = [];
    for (const r of c.booked) if (!(r[0] === b.start && r[1] === b.end)) kept.push(r);
    c.booked = kept;
    toast("Booking cancelled. Dates released");
  } else toast("Cancellation request sent");
  b.status = "CANCEL_REQUESTED";
  saveStored();
  renderBookings();
}

/* ============ modal + toast ============ */
let lastFocus = null;
function openModal(html){
  lastFocus = document.activeElement;
  $("#modal").innerHTML = html;
  $("#overlay").hidden = false;
  const f = $("#modal").querySelector("button,input");
  if (f) f.focus();
}
function closeModal(){ $("#overlay").hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
function handleOverlayClick(e){
  if (e.target === $("#overlay")){ closeModal(); return; }
  const cc = e.target.closest("[data-confirm-cancel]");
  if (cc) confirmCancel(cc.dataset.confirmCancel);
  const go = e.target.closest("[data-go]");
  if (go){ closeModal(); openCar(go.dataset.go); return; }
  const mb = e.target.closest("[data-mybookings]");
  if (mb){
    closeModal(); closeCar();
    $("#ml-email").value = mb.dataset.mybookings;
    signedEmail = mb.dataset.mybookings;
    $("#ml-sent").hidden = true;
    show("bookings");
    return;
  }
  if (e.target.closest("[data-close]")) closeModal();
}
function handleKey(e){ if (e.key === "Escape" && !$("#overlay").hidden) closeModal(); }
let toastTimer = null;
function hideToast(){ $("#toast").hidden = true; }
function toast(t){ const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 2600); }

/* ============ boot ============ */
function boot(){
  restoreStored();
  for (const t of $all(".tab")) t.addEventListener("click", handleTabClick);
  const filterIds = ["#f-type","#f-seats","#f-trans","#f-fuel","#f-price","#f-loc","#f-hire","#f-from","#f-to"];
  for (const id of filterIds) $(id).addEventListener("input", renderFleet);
  $("#f-reset").addEventListener("click", resetFilters);
  $("#search").addEventListener("submit", handleSearchSubmit);
  $("#f-from").addEventListener("change", handleFromChange);
  $("#grid").addEventListener("click", handleGridClick);
  $("#grid").addEventListener("change", handleGridChange);
  $("#cmp-clear").addEventListener("click", clearCompare);
  $("#cmp-open").addEventListener("click", openCompare);
  $("#ml-form").addEventListener("submit", handleMagicLink);
  $("#ml-open").addEventListener("click", handleOpenMagicLink);
  $("#bk-list").addEventListener("click", handleBookingsClick);
  $("#overlay").addEventListener("click", handleOverlayClick);
  document.addEventListener("keydown", handleKey);
  renderFleet();
  show(location.hash === "#bookings" ? "bookings" : "fleet");
}
boot();
})();
