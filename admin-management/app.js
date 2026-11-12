(function adminApp(){
"use strict";

/* ============ helpers ============ */
function $(sel){ return document.querySelector(sel); }
function esc(value){
  return String(value == null ? "" : value).replace(/[&<>"']/g, escapeChar);
}
function escapeChar(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }
function each(items, renderOne){ let out = ""; for (let i = 0; i < items.length; i++) out += renderOne(items[i], i); return out; }
function pad2(n){ return String(n).padStart(2, "0"); }
function iso(d){ return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function parse(s){ const p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function addDays(s, n){ const d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
function diffDays(a, b){ return Math.round((parse(b) - parse(a)) / 864e5); }
function niceDate(s){ return parse(s).toLocaleDateString("en-GB", {weekday:"short", day:"numeric", month:"short"}); }
function shortDate(s){ return parse(s).toLocaleDateString("en-GB", {day:"numeric", month:"short"}); }
function money(n){ return "$" + Math.round(n).toLocaleString("en-US"); }
function mb(bytes){ return (bytes / 1048576).toFixed(1) + " MB"; }
function overlaps(s1, e1, s2, e2){ return !(e1 < s2 || s1 > e2); }
function stamp(){ const d = new Date(); return niceDate(TODAY) + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }

const TODAY = "2026-11-04";
const TIERS = [[3,7],[8,15],[16,30],[31,45],[46,60],[61,Infinity]];
function tierLabel(t){ return t[1] === Infinity ? t[0] + "+ days" : t[0] + "–" + t[1] + " days"; }
function tierIndex(days){ for (let i = 0; i < TIERS.length; i++){ if (days >= TIERS[i][0] && days <= TIERS[i][1]) return i; } return 0; }
const CAPTIONS = ["Front","Side","Rear","Dashboard","Rear seats","Load area","Roof rack","Engine bay","Camping kit","Tyres"];

const SHAPES = {
  pickup:'<path d="M18 82V58l40-6 18-26h50l12 26h86v30"/><path d="M80 30l-14 22h56l-8-22z"/><path d="M138 52v30"/><circle cx="58" cy="86" r="15"/><circle cx="190" cy="86" r="15"/><path d="M73 86h102M18 82h25M205 82h19"/>',
  wagon:'<path d="M14 82V52l20-6 16-24h168l6 24v36"/><path d="M58 26l-12 20h70V26zM124 26v20h46V26zM178 26v20h40l-4-20z"/><circle cx="58" cy="86" r="15"/><circle cx="190" cy="86" r="15"/><path d="M73 86h102M14 82h29M205 82h19"/>',
  compact:'<path d="M34 82V46l18-6 12-22h112l10 24v40"/><path d="M68 22l-10 18h52V22zM118 22v18h52l-8-18z"/><rect x="186" y="44" width="14" height="30" rx="6"/><circle cx="68" cy="86" r="15"/><circle cx="166" cy="86" r="15"/><path d="M83 86h68M34 82h19M181 82h5"/>'
};
function carSvg(shape){
  return '<svg viewBox="0 0 240 110" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + (SHAPES[shape] || SHAPES.wagon) + "</svg>";
}

/* ============ seed data (examples) ============ */
let picSeq = 1;
function seedPictures(count){
  const pics = [];
  for (let i = 0; i < count; i++){
    pics.push({id:"p" + (picSeq++), caption:CAPTIONS[i], name:"photo-" + (i + 1) + ".jpg", type:"image/jpeg", w:1920, h:1280, size:2400000 + i * 310000, url:null});
  }
  return pics;
}
function makeType(o){
  const pictures = seedPictures(o.pictures);
  return {
    id:o.id, name:o.name, variant:o.variant, category:o.category, shape:o.shape, seats:o.seats, trans:o.trans, fuel:o.fuel, engine:o.engine,
    description:o.description, rates:o.rates, deposit:o.deposit, km:o.km, minDays:3, commit:o.commit, listed:o.listed,
    media:{pictures:pictures, coverId:pictures.length ? pictures[0].id : null, video:o.video || null, posterId:pictures.length ? pictures[0].id : null}
  };
}
const RATES_BIG = {u:[170,160,150,140,135,130], e:[200,190,180,170,165,160]};
const types = [
  makeType({id:"hilux", name:"Toyota Hilux", variant:"Double-cab", category:"Pickup", shape:"pickup", seats:5, trans:"Manual", fuel:"Diesel", engine:"2.8 L diesel",
    description:"A tough double-cab with a covered load bed. Room for five and all the camping kit.", rates:RATES_BIG, deposit:500, km:300, commit:{mode:"percent", pct:30}, listed:true, pictures:8,
    video:{name:"hilux-walkaround.mp4", duration:52, w:1920, h:1080, size:88000000, url:null}}),
  makeType({id:"lc76", name:"Land Cruiser", variant:"76 Series", category:"Station wagon", shape:"wagon", seats:5, trans:"Manual", fuel:"Diesel", engine:"4.5 L V8 diesel",
    description:"The classic safari wagon with long-range tanks and a pop-top roof.", rates:RATES_BIG, deposit:600, km:300, commit:{mode:"percent", pct:50}, listed:true, pictures:10,
    video:{name:"lc76-walkaround.mp4", duration:58, w:1920, h:1080, size:102000000, url:null}}),
  makeType({id:"jimny3", name:"Suzuki Jimny", variant:"3-door", category:"Compact SUV", shape:"compact", seats:4, trans:"Manual", fuel:"Petrol", engine:"1.5 L petrol",
    description:"Small, light and nimble. Best for two travellers who want real off-road ability.", rates:{u:[135,125,110,100,95,90], e:[160,150,135,125,120,115]}, deposit:350, km:250, commit:{mode:"percent", pct:30}, listed:true, pictures:6,
    video:{name:"jimny3-walkaround.mp4", duration:41, w:1920, h:1080, size:61000000, url:null}}),
  makeType({id:"jimny5", name:"Suzuki Jimny", variant:"5-door", category:"Compact SUV", shape:"compact", seats:4, trans:"Automatic", fuel:"Petrol", engine:"1.5 L petrol",
    description:"The longer Jimny with an automatic gearbox and a usable boot.", rates:{u:[145,135,120,110,105,100], e:[170,160,145,135,130,125]}, deposit:400, km:250, commit:{mode:"full", pct:100}, listed:true, pictures:7, video:null}),
  makeType({id:"navara", name:"Nissan Navara", variant:"Double-cab", category:"Pickup", shape:"pickup", seats:5, trans:"Manual", fuel:"Diesel", engine:"2.3 L diesel",
    description:"", rates:RATES_BIG, deposit:500, km:300, commit:{mode:"percent", pct:30}, listed:false, pictures:0, video:null})
];
function typeById(id){ for (const t of types) if (t.id === id) return t; return null; }
function typeName(t){ return t.name + " " + t.variant; }

function makeUnit(code, typeId, plate, status, mileage, maintUntil){
  return {code:code, typeId:typeId, plate:plate, status:status, mileage:mileage, maintUntil:maintUntil || null, notes:"", history:[]};
}
const units = [
  makeUnit("HLX-A","hilux","KDP 412A","hire",48210),
  makeUnit("HLX-B","hilux","KDP 418A","maint",51077,"2026-11-06"),
  makeUnit("HLX-C","hilux","KDQ 107C","listed",22940),
  makeUnit("LC76-A","lc76","KDN 908B","listed",73420),
  makeUnit("LC76-B","lc76","KDR 233K","hire",65815),
  makeUnit("JIM3-A","jimny3","KDS 101A","listed",18230),
  makeUnit("JIM3-B","jimny3","KDS 102A","listed",20412),
  makeUnit("JIM3-C","jimny3","KDS 103A","maint",19980,"2026-11-04"),
  makeUnit("JIM3-D","jimny3","KDS 104A","listed",17555),
  makeUnit("JIM3-E","jimny3","KDS 105A","listed",16020),
  makeUnit("JIM3-F","jimny3","KDS 106A","listed",15711),
  makeUnit("JIM5-A","jimny5","KDT 330D","listed",9120),
  makeUnit("JIM5-B","jimny5","KDT 331D","listed",8804),
  makeUnit("JIM5-C","jimny5","KDT 332D","hire",10250),
  makeUnit("NAV-A","navara","KDU 550F","listed",3020)
];
function unitByCode(code){ for (const u of units) if (u.code === code) return u; return null; }
function unitsOfType(typeId){ const out = []; for (const u of units) if (u.typeId === typeId) out.push(u); return out; }

const blocks = [
  {id:"b1", unit:"HLX-B", start:"2026-11-02", end:"2026-11-06", kind:"maint", note:"Service after BK-2090"},
  {id:"b2", unit:"JIM3-C", start:"2026-11-02", end:"2026-11-04", kind:"maint", note:"Clean and tyre check after BK-2071"},
  {id:"b3", unit:"JIM3-D", start:"2026-11-12", end:"2026-11-14", kind:"blackout", note:"Tyre replacement booked at garage"}
];
let blockSeq = 4;

function quote(type, start, end, hire){
  const days = Math.max(1, diffDays(start, end));
  const rate = type.rates[hire][tierIndex(days)];
  const total = rate * days;
  const commit = type.commit.mode === "full" ? total : Math.round(total * type.commit.pct / 100);
  return {days:days, rate:rate, total:total, commit:commit};
}
function makeBooking(o){
  const t = typeById(o.typeId);
  const q = quote(t, o.start, o.end, o.hire || "u");
  return {
    ref:o.ref, typeId:o.typeId, unit:o.unit, start:o.start, end:o.end, pt:o.pt || "09:00", rt:o.rt || "09:00", hire:o.hire || "u",
    name:o.name || "", email:o.email, phone:o.phone || "", status:o.status, payRef:o.payRef || "", feeEmailSent:o.feeEmailSent !== false,
    deadline:o.deadline || null, createdBy:o.createdBy || "Customer website", days:q.days, rate:q.rate, total:q.total, commitFee:q.commit,
    payment:o.payment || null, log:o.log || []
  };
}
const bookings = [
  makeBooking({ref:"BK-2140", typeId:"lc76", unit:"LC76-A", start:"2026-11-10", end:"2026-11-17", status:"COMMITTED", name:"Example client A", email:"client.a@example.com", phone:"+254 700 000 001", payRef:"QK45TY7ZP1", deadline:"2026-11-05", hire:"e",
    log:[{at:"Mon 2 Nov 14:12", text:"Booking requested on the website"},{at:"Mon 2 Nov 14:12", text:"Commitment fee email sent automatically"},{at:"Tue 3 Nov 09:40", text:"Client entered payment reference QK45TY7ZP1"}]}),
  makeBooking({ref:"BK-2150", typeId:"jimny5", unit:"JIM5-A", start:"2026-11-12", end:"2026-11-16", status:"COMMITTED", name:"Example client B", email:"client.b@example.com", phone:"+254 700 000 002", feeEmailSent:false, createdBy:"Admin (phone booking)",
    log:[{at:"Wed 4 Nov 08:55", text:"Booking created by admin for a phone enquiry"}]}),
  makeBooking({ref:"BK-2145", typeId:"jimny3", unit:"JIM3-A", start:"2026-11-20", end:"2026-11-25", status:"COMMITTED", name:"", email:"client.c@example.com", deadline:"2026-11-05",
    log:[{at:"Tue 3 Nov 18:03", text:"Booking requested on the website"},{at:"Tue 3 Nov 18:03", text:"Commitment fee email sent automatically"}]}),
  makeBooking({ref:"BK-2126", typeId:"jimny3", unit:"JIM3-B", start:"2026-11-04", end:"2026-11-09", status:"BOOKED", name:"Example client D", email:"client.d@example.com", phone:"+254 700 000 004",
    payment:{amount:203, method:"M-Pesa", ref:"QJ88LM2XK4", approvedBy:"admin@example.com", at:"Fri 30 Oct 11:20"}, log:[{at:"Thu 29 Oct 16:44", text:"Booking requested on the website"},{at:"Fri 30 Oct 11:20", text:"Payment QJ88LM2XK4 approved. Status changed to Booked"}]}),
  makeBooking({ref:"BK-2131", typeId:"hilux", unit:"HLX-C", start:"2026-11-14", end:"2026-11-20", status:"BOOKED", name:"Example client E", email:"client.e@example.com", hire:"e",
    payment:{amount:342, method:"Bank transfer", ref:"FT26303XK11", approvedBy:"admin@example.com", at:"Sat 31 Oct 10:05"}, log:[{at:"Sat 31 Oct 10:05", text:"Payment FT26303XK11 approved. Status changed to Booked"}]}),
  makeBooking({ref:"BK-2108", typeId:"hilux", unit:"HLX-A", start:"2026-10-31", end:"2026-11-06", status:"ACTIVE", name:"Example client F", email:"client.f@example.com", hire:"e",
    log:[{at:"Sat 31 Oct 09:15", text:"Picked up from JKIA airport"}]}),
  makeBooking({ref:"BK-2112", typeId:"lc76", unit:"LC76-B", start:"2026-10-28", end:"2026-11-04", status:"ACTIVE", name:"Example client G", email:"client.g@example.com",
    log:[{at:"Wed 28 Oct 09:00", text:"Picked up from Nairobi office"}]}),
  makeBooking({ref:"BK-2119", typeId:"jimny5", unit:"JIM5-C", start:"2026-10-29", end:"2026-11-03", status:"ACTIVE", name:"Example client H", email:"client.h@example.com", phone:"+254 700 000 008",
    log:[{at:"Thu 29 Oct 10:00", text:"Picked up from Nairobi office"}]}),
  makeBooking({ref:"BK-2090", typeId:"hilux", unit:"HLX-B", start:"2026-10-25", end:"2026-11-02", status:"COMPLETED", name:"Example client I", email:"client.i@example.com",
    log:[{at:"Mon 2 Nov 10:30", text:"Returned. Maintenance set until Fri 6 Nov"}]}),
  makeBooking({ref:"BK-2071", typeId:"jimny3", unit:"JIM3-C", start:"2026-10-26", end:"2026-11-01", status:"COMPLETED", name:"Example client J", email:"client.j@example.com",
    log:[{at:"Sun 1 Nov 09:10", text:"Returned. Maintenance set until Wed 4 Nov"}]}),
  makeBooking({ref:"BK-2099", typeId:"jimny3", unit:"JIM3-E", start:"2026-11-07", end:"2026-11-11", status:"CANCELLED", name:"Example client K", email:"client.k@example.com",
    log:[{at:"Sun 1 Nov 12:00", text:"Cancelled by client"}]})
];
let refSeq = 2150;
function bookingByRef(ref){ for (const b of bookings) if (b.ref === ref) return b; return null; }
units[1].history.push({at:"2026-11-02", text:"Returned from BK-2090. Maintenance until Fri 6 Nov"});
units[7].history.push({at:"2026-11-01", text:"Returned from BK-2071. Maintenance until Wed 4 Nov"});

const settings = {
  paybill:"000000", bank:"Example Bank, Account 0000000000, Branch: Westlands", autoEmail:true, deadlineHours:48,
  template:"Hello {name},\n\nThank you for booking the {car} from {start} to {end} (ref {ref}).\n\nTo confirm it, please pay the commitment fee of {amount} by {deadline}.\n  M-Pesa Paybill: {paybill}, Account: {ref}\n  Bank: {bank}\n\nAfter paying, enter your transaction code on the My bookings page. The balance of {balance} is due at pick-up.\n\nKifaru 4x4 Hire",
  workshopEmail:"workshop@example.com",
  waNumber:"+254 700 000 000",
  waTemplates:[
    {id:"received", label:"Booking received", text:"Hi {name}, thanks for booking the {car} from {start} to {end} (ref {ref}). To confirm it, pay the commitment fee of {amount} via M-Pesa Paybill {paybill}, account {ref}."},
    {id:"reminder", label:"Fee reminder", text:"Hi {name}, a quick reminder that the commitment fee of {amount} for booking {ref} is due by {deadline}. Paybill {paybill}, account {ref}. Reply here if you need help."},
    {id:"pickup", label:"Pick-up reminder", text:"Hi {name}, your {car} is ready for pick-up on {start} at {pt}. Please bring your driving licence and ID. Ref {ref}."},
    {id:"available", label:"Availability reply", text:"Hi {name}, yes, the {car} is available from {start} to {end}. Reply YES and we'll hold it for you."}
  ]
};

const CHECK_ITEMS = [
  ["body","Body and paint"],["glass","Windscreen and glass"],["tyres","Tyres and spare"],["brakes","Brakes"],["lights","Lights and indicators"],
  ["engine","Engine and fluids"],["suspension","Suspension and underbody"],["interior","Interior and seats"],["kit","Camping kit"],["tools","Tools and recovery kit"]
];
const FUEL_LEVELS = ["Empty","1/4","1/2","3/4","Full"];
function makeChecklist(attention){
  const items = [];
  for (const c of CHECK_ITEMS){
    const hit = attention && attention[c[0]];
    items.push({key:c[0], label:c[1], status:hit ? "attention" : "ok", note:hit || ""});
  }
  return items;
}
const inspections = [
  {id:"INS-0041", unit:"HLX-B", bookingRef:"BK-2090", date:"2026-11-02", inspector:"admin@example.com", mileage:51077, fuel:"1/4",
    items:makeChecklist({tyres:"Rear left tyre worn near the limit", brakes:"Squeal from front brakes when stopping", body:"Scratch on rear bumper, about 10 cm"}),
    tasks:[{text:"Replace rear left tyre", priority:"High"},{text:"Inspect front brake pads and discs", priority:"High"},{text:"Touch up rear bumper scratch", priority:"Low"},{text:"Full service (oil, filters)", priority:"Medium"}],
    maintDays:4, notes:"Client reported the brake noise on the last day of the trip.", status:"sent", sentTo:"workshop@example.com", sentAt:"Mon 2 Nov 11:05"},
  {id:"INS-0042", unit:"JIM3-C", bookingRef:"BK-2071", date:"2026-11-01", inspector:"admin@example.com", mileage:19980, fuel:"1/2",
    items:makeChecklist({interior:"Sand in footwells and boot", kit:"One camping chair missing"}),
    tasks:[{text:"Deep clean interior", priority:"Medium"},{text:"Replace missing camping chair", priority:"Low"}],
    maintDays:3, notes:"", status:"draft", sentTo:"", sentAt:""}
];
let inspSeq = 43;
function inspectionById(id){ for (const r of inspections) if (r.id === id) return r; return null; }
function attentionCount(r){ let n = 0; for (const it of r.items) if (it.status === "attention") n++; return n; }

/* ============ state ============ */
const state = {
  signedIn:false, email:"", page:"bookings", detail:null, filter:"action", search:"",
  cal:{typeId:"jimny3", year:2026, month:10},
  editor:{typeId:null, tab:"details"}, mediaErrors:[], dragFrom:null,
  reportTab:"inspections", upcoming:{from:TODAY, to:addDays(TODAY, 14), committed:true, typeId:""}
};
let modalState = null;

/* ============ availability ============ */
const LIVE = {COMMITTED:true, BOOKED:true, ACTIVE:true};
function unitBusy(code, start, end, ignoreRef){
  for (const b of bookings){
    if (b.unit === code && LIVE[b.status] && b.ref !== ignoreRef && overlaps(start, end, b.start, b.end)) return true;
  }
  for (const k of blocks){
    if (k.unit === code && overlaps(start, end, k.start, k.end)) return true;
  }
  return false;
}
function freeUnits(typeId, start, end, ignoreRef){
  const out = [];
  for (const u of unitsOfType(typeId)){
    if (u.status === "listed" && !unitBusy(u.code, start, end, ignoreRef)) out.push(u);
  }
  return out;
}
function cellFor(code, day){
  for (const b of bookings){
    if (b.unit === code && b.status !== "CANCELLED" && b.status !== "EXPIRED" && day >= b.start && day <= b.end) return {kind:"booking", status:b.status, ref:b.ref, start:b.start};
  }
  for (const k of blocks){
    if (k.unit === code && day >= k.start && day <= k.end) return {kind:k.kind, id:k.id, start:k.start, note:k.note};
  }
  return null;
}

/* ============ needs action ============ */
function nextStep(b){
  if (b.status === "COMMITTED" && b.payRef) return {label:"Approve payment", action:"openApprove"};
  if (b.status === "COMMITTED" && !b.feeEmailSent) return {label:"Send fee email", action:"openFeeEmail"};
  if (b.fresh && b.status === "COMMITTED") return {label:"New from website", action:"openBooking"};
  if (b.status === "BOOKED" && b.start <= TODAY) return {label:b.start < TODAY ? "Pickup overdue" : "Pickup today", action:"markPickedUp"};
  if (b.status === "ACTIVE" && b.end <= TODAY) return {label:b.end < TODAY ? "Return overdue" : "Return today", action:"openReturn"};
  return null;
}
function unitsWaitingRelist(){ const out = []; for (const u of units) if (u.status === "maint") out.push(u); return out; }
function actionCount(){
  let n = unitsWaitingRelist().length;
  for (const b of bookings) if (nextStep(b)) n++;
  return n;
}

/* ============ status labels ============ */
const BOOKING_STATUS = {
  COMMITTED:["Committed","warn"], BOOKED:["Booked","ok"], ACTIVE:["On hire","info"], COMPLETED:["Completed","neutral"], CANCELLED:["Cancelled","bad"], EXPIRED:["Expired","bad"]
};
const UNIT_STATUS = {listed:["Listed","ok"], hire:["On hire","info"], maint:["In maintenance","maint"], retired:["Retired","neutral"]};
function bookingPill(status){ const s = BOOKING_STATUS[status]; return '<span class="pill ' + s[1] + '">' + s[0] + "</span>"; }
function unitPill(status){ const s = UNIT_STATUS[status]; return '<span class="pill ' + s[1] + '">' + s[0] + "</span>"; }

/* ============ shell ============ */
const MENU = [["bookings","Bookings"],["calendar","Calendar"],["fleet","Fleet"],["reports","Reports"],["setup","Settings"]];
function renderMenuItem(item){
  const current = state.page === item[0] ? ' aria-current="page"' : "";
  const badge = item[0] === "bookings" && actionCount() ? '<span class="count num">' + actionCount() + "</span>" : "";
  return '<button type="button" data-action="go" data-page="' + item[0] + '"' + current + ">" + item[1] + badge + "</button>";
}
function render(){
  $("#signin-view").hidden = state.signedIn;
  $("#app-view").hidden = !state.signedIn;
  if (!state.signedIn) return;
  $("#who-email").textContent = state.email;
  $("#menu").innerHTML = each(MENU, renderMenuItem);
  let html = "";
  if (state.detail && state.detail.kind === "booking") html = renderBookingDetail(bookingByRef(state.detail.id));
  else if (state.detail && state.detail.kind === "type") html = renderTypeEditor(typeById(state.detail.id));
  else if (state.detail && state.detail.kind === "unit") html = renderUnitPage(unitByCode(state.detail.id));
  else if (state.detail && state.detail.kind === "inspection") html = renderInspectionPage(inspectionById(state.detail.id));
  else if (state.page === "bookings") html = renderBookings();
  else if (state.page === "calendar") html = renderCalendar();
  else if (state.page === "fleet") html = renderFleet();
  else if (state.page === "reports") html = renderReports();
  else html = renderSettings();
  $("#page").innerHTML = html + '<p class="demo-note">Demo admin. The demo date is fixed at Wed 4 Nov 2026. Records are examples and reset when you reload, except bookings made on the Client Booking site in this browser, which appear here as Committed. No emails or WhatsApp messages are sent automatically. Unit codes, plates and phone numbers are made up.</p>';
  if (state.detail && state.detail.kind === "type" && state.editor.tab === "media") wireMediaDrop();
}

/* ============ bookings page ============ */
function filterMatches(b){
  if (state.filter === "action") return !!nextStep(b);
  if (state.filter === "all") return true;
  return b.status === state.filter;
}
function searchMatches(b){
  const q = state.search.trim().toLowerCase();
  if (!q) return true;
  const hay = (b.ref + " " + b.email + " " + b.name + " " + b.unit + " " + typeName(typeById(b.typeId))).toLowerCase();
  return hay.indexOf(q) >= 0;
}
function compareBookings(a, b){ return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; }
function countFor(key){
  let n = 0;
  for (const b of bookings){
    if (key === "action" ? nextStep(b) : key === "all" ? true : b.status === key) n++;
  }
  return n;
}
const FILTERS = [["action","Needs action"],["all","All"],["COMMITTED","Committed"],["BOOKED","Booked"],["ACTIVE","On hire"],["COMPLETED","Completed"],["CANCELLED","Cancelled"]];
function renderFilterChip(f){
  return '<button type="button" class="chip" data-action="setFilter" data-filter="' + f[0] + '" aria-pressed="' + (state.filter === f[0]) + '">' + f[1] + ' <span class="n">' + countFor(f[0]) + "</span></button>";
}
function renderRelistChip(u){
  const t = typeById(u.typeId);
  const due = u.maintUntil && u.maintUntil <= TODAY ? "maintenance done " + shortDate(u.maintUntil) : "in maintenance until " + shortDate(u.maintUntil);
  return '<span><button class="link" type="button" data-action="openUnit" data-code="' + u.code + '">' + u.code + "</button> " + esc(typeName(t)) + ', <span class="muted">' + due + '</span> <button class="btn small ghost" type="button" data-action="relist" data-code="' + u.code + '">Relist</button></span>';
}
function renderBookingRow(b){
  const t = typeById(b.typeId);
  const step = nextStep(b);
  const client = b.name ? esc(b.name) + '<span class="cell-sub">' + esc(b.email) + "</span>" : esc(b.email) + '<span class="cell-sub">No name given</span>';
  const stepCell = step ? '<button class="btn small" type="button" data-action="' + step.action + '" data-ref="' + b.ref + '">' + step.label + "</button>" : '<span class="muted">—</span>';
  return '<tr class="clickable" data-action="openBooking" data-ref="' + b.ref + '">' +
    '<td class="mono">' + b.ref + "</td>" +
    "<td>" + esc(typeName(t)) + '<span class="cell-sub">' + (b.hire === "e" ? "Equipped" : "Unequipped") + "</span></td>" +
    '<td class="mono">' + b.unit + "</td>" +
    "<td>" + shortDate(b.start) + " → " + shortDate(b.end) + '<span class="cell-sub">' + b.days + " days</span></td>" +
    "<td>" + client + "</td>" +
    "<td>" + bookingPill(b.status) + "</td>" +
    '<td class="num">' + money(b.total) + '<span class="cell-sub">Fee ' + money(b.commitFee) + "</span></td>" +
    "<td>" + stepCell + "</td></tr>";
}
function renderBookings(){
  const list = [];
  for (const b of bookings) if (filterMatches(b) && searchMatches(b)) list.push(b);
  list.sort(compareBookings);
  const relist = unitsWaitingRelist();
  const strip = state.filter === "action" && relist.length ? '<div class="strip"><strong>Waiting to be relisted:</strong>' + each(relist, renderRelistChip) + "</div>" : "";
  const table = list.length ?
    '<div class="table-wrap"><table class="data"><thead><tr><th>Ref</th><th>Car type</th><th>Unit</th><th>Dates</th><th>Client</th><th>Status</th><th>Total</th><th>Next step</th></tr></thead><tbody>' + each(list, renderBookingRow) + "</tbody></table></div>" :
    '<div class="empty"><strong>' + (state.filter === "action" ? "Nothing needs action right now." : "No bookings match.") + '</strong><span class="muted">Try another filter or clear the search.</span></div>';
  return '<div class="page-head"><div><div class="eyebrow">' + niceDate(TODAY) + '</div><h1>Bookings</h1></div><button class="btn" type="button" data-action="openNewBooking">+ New booking</button></div>' +
    '<div class="toolbar"><div class="chips">' + each(FILTERS, renderFilterChip) + '</div><input type="text" class="search" id="bk-search" placeholder="Search ref, email, unit" value="' + esc(state.search) + '" aria-label="Search bookings"></div>' +
    strip + table;
}

/* ============ booking detail ============ */
function stepsHtml(status){
  const order = ["COMMITTED","BOOKED","ACTIVE","COMPLETED"], names = ["Committed","Booked","On hire","Returned"];
  const at = order.indexOf(status);
  let out = "";
  for (let i = 0; i < order.length; i++){
    const cls = at < 0 ? "" : i < at ? "done" : i === at ? (status === "COMPLETED" ? "done" : "now") : "";
    out += '<div class="' + cls + '">' + names[i] + "</div>";
  }
  return out;
}
function renderLogItem(item){ return "<li><time>" + esc(item.at) + "</time><span>" + esc(item.text) + "</span></li>"; }
function bookingActions(b){
  let out = "";
  if (b.status === "COMMITTED"){
    if (b.payRef) out += '<button class="btn" type="button" data-action="openApprove" data-ref="' + b.ref + '">Approve payment</button>';
    out += '<button class="btn ' + (b.payRef ? "ghost" : "") + '" type="button" data-action="openFeeEmail" data-ref="' + b.ref + '">' + (b.feeEmailSent ? "Resend fee email" : "Send fee email") + "</button>";
    if (!b.payRef) out += '<button class="btn ghost" type="button" data-action="openApprove" data-ref="' + b.ref + '">Record payment</button>';
  }
  if (b.status === "BOOKED") out += '<button class="btn" type="button" data-action="markPickedUp" data-ref="' + b.ref + '">Mark picked up</button>';
  if (b.status === "ACTIVE") out += '<button class="btn" type="button" data-action="openReturn" data-ref="' + b.ref + '">Mark returned</button>';
  if (b.status === "COMMITTED" || b.status === "BOOKED") out += '<button class="btn ghost" type="button" data-action="openReassign" data-ref="' + b.ref + '">Reassign unit</button><button class="btn danger" type="button" data-action="confirmCancel" data-ref="' + b.ref + '">Cancel booking</button>';
  return out || '<span class="muted">No actions. This booking is ' + BOOKING_STATUS[b.status][0].toLowerCase() + ".</span>";
}
function renderBookingDetail(b){
  const t = typeById(b.typeId), u = unitByCode(b.unit), step = nextStep(b);
  const payment = b.payment ?
    '<dl class="kv"><dt>Amount</dt><dd class="num">' + money(b.payment.amount) + "</dd><dt>Method</dt><dd>" + esc(b.payment.method) + '</dd><dt>Reference</dt><dd class="mono">' + esc(b.payment.ref) + "</dd><dt>Approved by</dt><dd>" + esc(b.payment.approvedBy) + "</dd><dt>When</dt><dd>" + esc(b.payment.at) + "</dd></dl>" :
    (b.payRef ? '<div class="note warn">Client entered reference <b class="mono">' + esc(b.payRef) + "</b>. Check it against your M-Pesa or bank statement, then approve.</div>" :
      '<p class="muted">No payment yet.' + (b.feeEmailSent ? (b.deadline ? " Fee due by " + niceDate(b.deadline) + "." : "") : " The fee email has not been sent.") + "</p>");
  return '<div class="crumb"><button class="link" type="button" data-action="back">← Bookings</button></div>' +
    '<div class="page-head"><div><div class="eyebrow mono">' + b.ref + " · " + esc(b.createdBy) + "</div><h1>" + esc(typeName(t)) + " · " + b.unit + "</h1></div>" + bookingPill(b.status) + "</div>" +
    (step ? '<div class="note warn" style="margin-bottom:16px">Next step: <b>' + step.label + "</b></div>" : "") +
    '<div class="split"><div class="stack" style="gap:18px">' +
      '<div class="box"><h2>Booking</h2><div class="steps">' + stepsHtml(b.status) + "</div>" +
        '<dl class="kv"><dt>Car type</dt><dd>' + esc(typeName(t)) + " (" + (b.hire === "e" ? "equipped" : "unequipped") + ')</dd><dt>Assigned unit</dt><dd><button class="link" type="button" data-action="openUnit" data-code="' + b.unit + '">' + b.unit + "</button> · " + esc(u.plate) + " " + unitPill(u.status) + "</dd>" +
        "<dt>Pick-up</dt><dd>" + niceDate(b.start) + ", " + b.pt + "</dd><dt>Return</dt><dd>" + niceDate(b.end) + ", " + b.rt + "</dd><dt>Length</dt><dd>" + b.days + " days</dd></dl></div>" +
      '<div class="box"><h2>Client</h2><dl class="kv"><dt>Name</dt><dd>' + (b.name ? esc(b.name) : '<span class="muted">Not given</span>') + "</dd><dt>Email</dt><dd>" + esc(b.email) + "</dd><dt>Phone</dt><dd>" + (b.phone ? esc(b.phone) : '<span class="muted">Not given</span>') + "</dd></dl>" +
        (b.phone ? '<div class="actions"><button class="btn small wa-btn" type="button" data-action="openWhatsApp" data-ref="' + b.ref + '">Message on WhatsApp</button></div>' : '<p class="hint">Add a phone number to message this client on WhatsApp.</p>') + "</div>" +
      '<div class="box"><h2>Activity</h2><ul class="log">' + each(b.log, renderLogItem) + "</ul></div>" +
    "</div>" +
    '<div class="stack" style="gap:18px">' +
      '<div class="box"><h2>Price</h2><div class="lines"><div class="ln"><span>' + b.days + " days × " + money(b.rate) + "</span><span>" + money(b.total) + '</span></div><div class="ln total"><span>Rental total</span><span>' + money(b.total) + '</span></div><div class="ln"><span>Commitment fee (' + (t.commit.mode === "full" ? "full amount" : t.commit.pct + "%") + ")</span><b>" + money(b.commitFee) + '</b></div><div class="ln muted"><span>Balance at pick-up</span><span>' + money(b.total - b.commitFee) + '</span></div><div class="ln muted"><span>Refundable deposit</span><span>' + money(t.deposit) + "</span></div></div></div>" +
      '<div class="box"><h2>Payment</h2>' + payment + "</div>" +
      '<div class="box"><h2>Actions</h2><div class="actions">' + bookingActions(b) + "</div></div>" +
    "</div></div>";
}

/* ============ calendar ============ */
function monthDays(year, month){
  const out = [], n = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= n; d++) out.push(iso(new Date(year, month, d)));
  return out;
}
function renderDayHead(day){
  const dt = parse(day), wd = dt.getDay();
  const cls = day === TODAY ? "today" : (wd === 0 || wd === 6) ? "we" : "";
  return '<th class="' + cls + '">' + "SMTWTFS"[wd] + "<br>" + dt.getDate() + "</th>";
}
function renderUnitRow(u, days){
  let cells = "", prevKey = "";
  for (const day of days){
    const c = cellFor(u.code, day);
    const key = c ? (c.ref || c.id) : "";
    let cls = "d", label = "", action = "openBlockNew", data = ' data-code="' + u.code + '" data-day="' + day + '"';
    if (day < TODAY && !c) cls += " past";
    if (c && c.kind === "booking"){ cls += " c-" + c.status.toLowerCase(); action = "openBooking"; data = ' data-ref="' + c.ref + '"'; }
    if (c && c.kind !== "booking"){ cls += " c-" + c.kind; action = "openBlockEdit"; data = ' data-id="' + c.id + '"'; }
    if (c && key !== prevKey) label = '<span class="lab">' + (c.kind === "booking" ? c.ref : c.kind === "maint" ? "Maint." : "Blocked") + "</span>";
    if (day === TODAY) cls += " todaycol";
    const title = c ? (c.kind === "booking" ? c.ref + " · " + BOOKING_STATUS[c.status][0] : (c.kind === "maint" ? "Maintenance" : "Blocked") + (c.note ? ": " + c.note : "")) : (u.status === "retired" ? "Retired" : "Free · click to block this day");
    cells += '<td class="' + cls + '" data-action="' + action + '"' + data + ' title="' + esc(niceDate(day) + " · " + title) + '">' + label + "</td>";
    prevKey = key;
  }
  return '<tr><th class="rowh" scope="row"><button class="link code" type="button" data-action="openUnit" data-code="' + u.code + '">' + u.code + '</button><span class="sub">' + esc(u.plate) + " " + unitPill(u.status) + "</span></th>" + cells + "</tr>";
}
function renderSummaryRow(typeId, days){
  let cells = "";
  const all = unitsOfType(typeId);
  for (const day of days){
    let free = 0;
    for (const u of all) if (u.status === "listed" && !unitBusy(u.code, day, day)) free++;
    const cls = free === 0 ? "none" : free === 1 ? "few" : "many";
    cells += '<td class="d ' + cls + (day === TODAY ? " todaycol" : "") + '" title="' + niceDate(day) + ": " + free + ' free">' + free + "</td>";
  }
  return '<tr class="sum"><th class="rowh" scope="row">Free units</th>' + cells + "</tr>";
}
function renderTypeOption(t){ return '<option value="' + t.id + '"' + (t.id === state.cal.typeId ? " selected" : "") + ">" + esc(typeName(t)) + "</option>"; }
function renderGantt(unitList, typeId, withSummary){
  const days = monthDays(state.cal.year, state.cal.month);
  let rows = withSummary ? renderSummaryRow(typeId, days) : "";
  for (const u of unitList) rows += renderUnitRow(u, days);
  return '<div class="gantt-wrap"><table class="gantt"><thead><tr><th class="rowh">Unit</th>' + each(days, renderDayHead) + "</tr></thead><tbody>" + rows + "</tbody></table></div>";
}
function monthControls(){
  const label = new Date(state.cal.year, state.cal.month, 1).toLocaleDateString("en-GB", {month:"long", year:"numeric"});
  return '<div class="month"><button class="round" type="button" data-action="calPrev" aria-label="Previous month">‹</button><strong>' + label + '</strong><button class="round" type="button" data-action="calNext" aria-label="Next month">›</button></div>';
}
function legendHtml(){
  return '<div class="legend"><span><i style="background:var(--warnbg)"></i>Committed</span><span><i style="background:var(--okbg)"></i>Booked</span><span><i style="background:var(--infobg)"></i>On hire</span><span><i style="background:repeating-linear-gradient(90deg,var(--surface) 0 3px,var(--line) 3px 4px)"></i>Completed</span><span><i style="background:repeating-linear-gradient(135deg,var(--sand) 0 3px,var(--maint) 3px 5px)"></i>Maintenance</span><span><i style="background:repeating-linear-gradient(135deg,var(--surface) 0 3px,var(--hatch) 3px 5px)"></i>Blocked</span><span>Click an empty day to block it. Click a booking or block to open it.</span></div>';
}
function renderCalendar(){
  const t = typeById(state.cal.typeId);
  return '<div class="page-head"><div><div class="eyebrow">Availability</div><h1>Calendar</h1></div><button class="btn" type="button" data-action="openBlockNew" data-code="" data-day="' + TODAY + '">+ Block dates</button></div>' +
    '<div class="cal-controls"><label class="field" style="grid-auto-flow:column;align-items:center"><span>Car type</span><select id="cal-type">' + each(types, renderTypeOption) + "</select></label>" + monthControls() + "</div>" +
    renderGantt(unitsOfType(t.id), t.id, true) + legendHtml() +
    '<p class="hint" style="margin-top:8px">"Free units" counts listed units with nothing on that day. Units on hire or in maintenance count as not free until they are relisted.</p>';
}

/* ============ fleet ============ */
function countStatus(typeId, status){ let n = 0; for (const u of unitsOfType(typeId)) if (u.status === status) n++; return n; }
function renderFleetRow(t){
  const all = unitsOfType(t.id).length;
  const pics = t.media.pictures.length;
  const ready = pics > 0 && t.media.coverId;
  const mediaCell = pics + "/10 photos · " + (t.media.video ? "video ✓" : "no video") + (ready ? "" : '<span class="cell-sub" style="color:var(--bad)">Needs a picture and cover</span>');
  return '<tr class="clickable" data-action="openType" data-id="' + t.id + '"><td><b>' + esc(typeName(t)) + '</b><span class="cell-sub">' + esc(t.category) + " · " + t.seats + " seats · " + esc(t.trans) + "</span></td>" +
    '<td class="num">' + all + '</td><td class="num">' + countStatus(t.id, "listed") + '</td><td class="num">' + countStatus(t.id, "hire") + '</td><td class="num">' + countStatus(t.id, "maint") + "</td>" +
    '<td class="num">' + money(t.rates.u[0]) + '/day<span class="cell-sub">Fee ' + (t.commit.mode === "full" ? "full amount" : t.commit.pct + "%") + "</span></td>" +
    "<td>" + mediaCell + "</td><td>" + (t.listed ? '<span class="pill ok">On the website</span>' : '<span class="pill neutral">Hidden</span>') + "</td></tr>";
}
function renderFleet(){
  return '<div class="page-head"><div><div class="eyebrow">' + types.length + " car types · " + units.length + ' units</div><h1>Fleet</h1></div><button class="btn" type="button" data-action="openNewType">+ New car type</button></div>' +
    '<div class="table-wrap"><table class="data"><thead><tr><th>Car type</th><th>Units</th><th>Listed</th><th>On hire</th><th>Maint.</th><th>From</th><th>Media</th><th>Customer page</th></tr></thead><tbody>' + each(types, renderFleetRow) + "</tbody></table></div>";
}

/* ============ car type editor ============ */
const EDITOR_TABS = [["details","Details"],["pricing","Pricing"],["media","Media"],["units","Units"]];
function renderEditorTab(tab){
  let label = tab[1];
  if (tab[0] === "media") label += " (" + typeById(state.editor.typeId).media.pictures.length + "/10)";
  if (tab[0] === "units") label += " (" + unitsOfType(state.editor.typeId).length + ")";
  return '<button type="button" role="tab" data-action="setTab" data-tab="' + tab[0] + '" aria-selected="' + (state.editor.tab === tab[0]) + '">' + label + "</button>";
}
function renderTypeEditor(t){
  state.editor.typeId = t.id;
  let body = "";
  if (state.editor.tab === "details") body = renderDetailsTab(t);
  else if (state.editor.tab === "pricing") body = renderPricingTab(t);
  else if (state.editor.tab === "media") body = renderMediaTab(t);
  else body = renderUnitsTab(t);
  return '<div class="crumb"><button class="link" type="button" data-action="back">← Fleet</button></div>' +
    '<div class="page-head"><div><div class="eyebrow">' + esc(t.category) + '</div><h1>' + esc(typeName(t)) + '</h1></div><label class="switch"><input type="checkbox" id="type-listed" ' + (t.listed ? "checked" : "") + "> Show on the customer website</label></div>" +
    '<div class="tabs" role="tablist">' + each(EDITOR_TABS, renderEditorTab) + "</div>" + body;
}
function selectOptions(values, current){
  let out = "";
  for (const v of values) out += "<option" + (v === current ? " selected" : "") + ">" + esc(v) + "</option>";
  return out;
}
function renderDetailsTab(t){
  return '<form id="form-details" class="form-grid">' +
    '<label class="field"><span>Make and model</span><input type="text" id="d-name" value="' + esc(t.name) + '" required></label>' +
    '<label class="field"><span>Variant</span><input type="text" id="d-variant" value="' + esc(t.variant) + '"></label>' +
    '<label class="field"><span>Category</span><select id="d-category">' + selectOptions(["Pickup","Station wagon","Compact SUV","SUV","Van"], t.category) + "</select></label>" +
    '<label class="field"><span>Seats</span><input type="number" id="d-seats" min="1" max="12" value="' + t.seats + '"></label>' +
    '<label class="field"><span>Transmission</span><select id="d-trans">' + selectOptions(["Manual","Automatic"], t.trans) + "</select></label>" +
    '<label class="field"><span>Fuel</span><select id="d-fuel">' + selectOptions(["Diesel","Petrol","Hybrid"], t.fuel) + "</select></label>" +
    '<label class="field"><span>Engine</span><input type="text" id="d-engine" value="' + esc(t.engine) + '"></label>' +
    '<label class="field wide"><span>Description for customers</span><textarea id="d-desc" rows="3">' + esc(t.description) + "</textarea></label>" +
    '<div class="save-row wide"><button class="btn" type="submit">Save details</button></div></form>';
}
function renderRateRow(tier, i){
  const t = typeById(state.editor.typeId);
  return "<tr><td>" + tierLabel(tier) + '</td><td><input type="number" min="1" id="r-u-' + i + '" value="' + t.rates.u[i] + '" aria-label="Unequipped ' + tierLabel(tier) + '"></td><td><input type="number" min="1" id="r-e-' + i + '" value="' + t.rates.e[i] + '" aria-label="Equipped ' + tierLabel(tier) + '"></td></tr>';
}
function commitExample(t){
  const q = quote(t, TODAY, addDays(TODAY, 7), "u");
  return "Example: a 7-day unequipped hire is " + money(q.total) + ", so the fee is " + money(q.commit) + ".";
}
function renderPricingTab(t){
  const isFull = t.commit.mode === "full";
  return '<form id="form-pricing" class="stack" style="gap:20px">' +
    '<div class="box"><h2>Daily rates (USD)</h2><div class="table-wrap" style="border:0"><table class="data rates"><thead><tr><th>Hire length</th><th>Unequipped</th><th>Equipped</th></tr></thead><tbody>' + each(TIERS, renderRateRow) + "</tbody></table></div></div>" +
    '<div class="box"><h2>Commitment fee</h2><p class="hint">Asked for in the fee email. The booking stays Committed until it is paid.</p>' +
      '<div class="actions"><label class="radio"><input type="radio" name="c-mode" value="percent" ' + (isFull ? "" : "checked") + '> Percentage of the rental total</label>' +
      '<label class="radio"><input type="radio" name="c-mode" value="full" ' + (isFull ? "checked" : "") + "> Full amount</label></div>" +
      '<label class="field" style="max-width:200px"' + (isFull ? " hidden" : "") + ' id="c-pct-wrap"><span>Percentage</span><input type="number" id="c-pct" min="1" max="100" value="' + t.commit.pct + '"></label>' +
      '<p class="hint" id="c-example">' + commitExample(t) + "</p></div>" +
    '<div class="box"><h2>Rental terms</h2><div class="form-grid">' +
      '<label class="field"><span>Refundable deposit (USD)</span><input type="number" id="p-deposit" min="0" value="' + t.deposit + '"></label>' +
      '<label class="field"><span>Mileage limit (km/day)</span><input type="number" id="p-km" min="0" value="' + t.km + '"></label>' +
      '<label class="field"><span>Minimum hire (days)</span><input type="number" id="p-min" min="1" value="' + t.minDays + '"></label></div></div>' +
    '<div class="save-row"><button class="btn" type="submit">Save pricing</button></div></form>';
}

/* ---- media tab ---- */
function renderPicTile(p, i){
  const t = typeById(state.editor.typeId);
  const total = t.media.pictures.length;
  const img = p.url ? '<img src="' + p.url + '" alt="' + esc(p.caption) + '">' : carSvg(t.shape);
  const isCover = t.media.coverId === p.id;
  return '<div class="pic" draggable="true" data-index="' + i + '">' +
    '<div class="thumb">' + img + '<span class="pos num">' + (i + 1) + "</span>" + (isCover ? '<span class="cov">Cover</span>' : "") + "</div>" +
    '<div class="body"><input type="text" list="caption-presets" maxlength="40" value="' + esc(p.caption) + '" data-caption="' + p.id + '" aria-label="Caption for picture ' + (i + 1) + '" placeholder="Caption">' +
    '<span class="meta num">' + esc(p.name) + " · " + p.w + "×" + p.h + " · " + mb(p.size) + "</span>" +
    '<div class="ctrl"><label class="radio"><input type="radio" name="cover" data-action="setCover" data-id="' + p.id + '" ' + (isCover ? "checked" : "") + "> Cover</label>" +
    '<span class="arrows"><button class="icon-btn" type="button" data-action="movePic" data-index="' + i + '" data-dir="-1" aria-label="Move earlier" ' + (i === 0 ? "disabled" : "") + ">←</button>" +
    '<button class="icon-btn" type="button" data-action="movePic" data-index="' + i + '" data-dir="1" aria-label="Move later" ' + (i === total - 1 ? "disabled" : "") + ">→</button>" +
    '<button class="icon-btn" type="button" data-action="removePic" data-id="' + p.id + '" aria-label="Remove picture">✕</button></span></div></div></div>';
}
function renderPosterOption(p, i){
  const t = typeById(state.editor.typeId);
  return '<option value="' + p.id + '"' + (t.media.posterId === p.id ? " selected" : "") + ">" + (i + 1) + ". " + esc(p.caption || "Untitled") + "</option>";
}
function renderErrorItem(e){ return "<li>" + esc(e) + "</li>"; }
function renderCaptionPreset(c){ return '<option value="' + esc(c) + '">'; }
function renderMediaTab(t){
  const m = t.media, n = m.pictures.length;
  const errors = state.mediaErrors.length ? '<ul class="errors" role="alert">' + each(state.mediaErrors, renderErrorItem) + "</ul>" : "";
  const grid = n ? '<div class="pics" id="pics">' + each(m.pictures, renderPicTile) + "</div>" :
    '<div class="empty"><strong>No pictures yet.</strong><span class="muted">Add at least one picture and choose a cover before this car type can go on the website.</span></div>';
  let video;
  if (m.video){
    const v = m.video;
    const player = v.url ? '<video src="' + v.url + '" controls preload="metadata"></video>' : '<span class="play" aria-hidden="true">▶</span>';
    video = '<div class="video-row"><div class="video-box">' + player + "</div><div class=\"stack\">" +
      "<b>" + esc(v.name) + '</b><span class="muted num">' + Math.floor(v.duration / 60) + " min " + Math.round(v.duration % 60) + " s · " + v.w + "×" + v.h + " · " + mb(v.size) + "</span>" +
      '<label class="field" style="max-width:320px"><span>Poster image (shown before play)</span><select id="poster">' + each(m.pictures, renderPosterOption) + "</select></label>" +
      '<div class="actions"><label class="btn ghost small">Replace video<input type="file" id="video-input" accept="video/mp4" hidden></label><button class="btn danger small" type="button" data-action="removeVideo">Remove video</button></div></div></div>';
  } else {
    video = '<div class="drop"><span><b>No walkaround video.</b> <span class="muted">One per car type.</span></span><label class="btn small">Upload video<input type="file" id="video-input" accept="video/mp4" hidden></label></div>';
  }
  return '<div class="stack" style="gap:20px">' + errors +
    '<div class="box"><div class="media-head"><h2>Pictures <span class="muted num" style="font-size:15px">' + n + '/10</span></h2><span class="hint">Drag pictures, or use the arrows, to set the gallery order.</span></div>' +
      '<div class="drop" id="drop-zone"><span>Drop pictures here, or</span><label class="btn small' + (n >= 10 ? '" aria-disabled="true' : "") + '">Choose pictures<input type="file" id="pic-input" accept="image/jpeg,image/png,image/webp" multiple hidden ' + (n >= 10 ? "disabled" : "") + "></label>" +
      '<span class="rules"><span>JPG, PNG or WebP</span><span>Landscape, at least 1600×1000 px</span><span>Max 10 MB each</span><span>Max 10 pictures</span></span></div>' +
      grid + '<datalist id="caption-presets">' + each(CAPTIONS, renderCaptionPreset) + "</datalist></div>" +
    '<div class="box"><h2>Walkaround video</h2><span class="rules"><span>MP4 (H.264) only</span><span>Max 1 minute</span><span>Max 1080p</span><span>Max 150 MB</span></span>' + video + "</div>" +
    '<p class="hint">Files are stored exactly as uploaded. Nothing is resized or compressed.</p></div>';
}

/* ---- units tab ---- */
function nextBookingFor(code){
  let best = null;
  for (const b of bookings){
    if (b.unit === code && LIVE[b.status] && b.end >= TODAY && (!best || b.start < best.start)) best = b;
  }
  return best;
}
function renderUnitRowTable(u){
  const nb = nextBookingFor(u.code);
  return '<tr class="clickable" data-action="openUnit" data-code="' + u.code + '"><td class="mono"><b>' + u.code + '</b></td><td class="mono">' + esc(u.plate) + "</td><td>" + unitPill(u.status) + (u.status === "maint" && u.maintUntil ? '<span class="cell-sub">until ' + shortDate(u.maintUntil) + "</span>" : "") + '</td><td class="num">' + u.mileage.toLocaleString("en-US") + " km</td><td>" + (nb ? '<span class="mono">' + nb.ref + "</span> " + shortDate(nb.start) + " → " + shortDate(nb.end) : '<span class="muted">None</span>') + "</td></tr>";
}
function suggestCode(t){
  const existing = unitsOfType(t.id);
  const prefix = existing.length ? existing[0].code.split("-")[0] : t.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
  return prefix + "-" + String.fromCharCode(65 + existing.length);
}
function renderUnitsTab(t){
  const list = unitsOfType(t.id);
  const table = list.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Code</th><th>Plate</th><th>Status</th><th>Mileage</th><th>Next booking</th></tr></thead><tbody>' + each(list, renderUnitRowTable) + "</tbody></table></div>" :
    '<div class="empty"><strong>No units yet.</strong><span class="muted">Add the first physical car below.</span></div>';
  return '<div class="stack" style="gap:20px">' + table +
    '<form class="box" id="form-unit"><h2>Add a unit</h2><p class="hint">Customers never see unit codes. They book "' + esc(typeName(t)) + '" and the system assigns a free unit.</p><div class="form-grid">' +
    '<label class="field"><span>Unit code</span><input type="text" id="u-code" value="' + suggestCode(t) + '" required></label>' +
    '<label class="field"><span>Number plate</span><input type="text" id="u-plate" placeholder="KDx 000X" required></label>' +
    '<label class="field"><span>Current mileage (km)</span><input type="number" id="u-km" min="0" value="0"></label></div>' +
    '<div class="actions"><button class="btn" type="submit">Add unit</button></div></form></div>';
}

/* ============ unit page ============ */
function renderUnitHistory(h){ return "<li><time>" + niceDate(h.at) + "</time><span>" + esc(h.text) + "</span></li>"; }
function renderUnitBookingRow(b){
  return '<tr class="clickable" data-action="openBooking" data-ref="' + b.ref + '"><td class="mono">' + b.ref + "</td><td>" + shortDate(b.start) + " → " + shortDate(b.end) + "</td><td>" + esc(b.name || b.email) + "</td><td>" + bookingPill(b.status) + "</td></tr>";
}
function compareBookingsDesc(a, b){ return a.start < b.start ? 1 : a.start > b.start ? -1 : 0; }
function renderUnitPage(u){
  const t = typeById(u.typeId);
  const list = [];
  for (const b of bookings) if (b.unit === u.code) list.push(b);
  list.sort(compareBookingsDesc);
  let actions = "";
  if (u.status === "maint") actions += '<button class="btn" type="button" data-action="relist" data-code="' + u.code + '">Relist on the website</button>';
  if (u.status === "listed") actions += '<button class="btn ghost" type="button" data-action="openMaint" data-code="' + u.code + '">Take out for maintenance</button>';
  if (u.status !== "retired") actions += '<button class="btn ghost" type="button" data-action="newInspection" data-code="' + u.code + '">New inspection report</button>';
  if (u.status === "retired") actions += '<button class="btn ghost" type="button" data-action="unretire" data-code="' + u.code + '">Bring back into service</button>';
  else actions += '<button class="btn danger" type="button" data-action="confirmRetire" data-code="' + u.code + '">Retire unit</button>';
  const statusNote = u.status === "maint" ? '<div class="note warn">In maintenance ' + (u.maintUntil ? (u.maintUntil <= TODAY ? "(planned end " + niceDate(u.maintUntil) + " has passed)" : "until " + niceDate(u.maintUntil)) : "") + ". Customers can't book it until you relist it.</div>" :
    u.status === "hire" ? '<div class="note">Out on hire. It goes into maintenance when you mark it returned.</div>' : "";
  return '<div class="crumb"><button class="link" type="button" data-action="back">← Back</button></div>' +
    '<div class="page-head"><div><div class="eyebrow">' + esc(typeName(t)) + '</div><h1 style="font-family:var(--mono)">' + u.code + "</h1></div>" + unitPill(u.status) + "</div>" +
    '<div class="split"><div class="stack" style="gap:18px">' + statusNote +
      '<div class="box"><div class="media-head"><h2>Calendar</h2>' + monthControls() + "</div>" + renderGantt([u], u.typeId, false) + "</div>" +
      '<div class="box"><h2>Bookings</h2>' + (list.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Ref</th><th>Dates</th><th>Client</th><th>Status</th></tr></thead><tbody>' + each(list, renderUnitBookingRow) + "</tbody></table></div>" : '<p class="muted">No bookings yet.</p>') + "</div>" +
    "</div>" +
    '<div class="stack" style="gap:18px">' +
      '<div class="box"><h2>Details</h2><dl class="kv"><dt>Number plate</dt><dd class="mono">' + esc(u.plate) + '</dd><dt>Mileage</dt><dd class="num">' + u.mileage.toLocaleString("en-US") + ' km</dd><dt>Car type</dt><dd><button class="link" type="button" data-action="openType" data-id="' + t.id + '">' + esc(typeName(t)) + "</button></dd></dl></div>" +
      '<div class="box"><h2>Actions</h2><div class="actions">' + actions + "</div></div>" +
      '<div class="box"><h2>Inspection reports</h2>' + renderUnitInspections(u.code) + "</div>" +
      '<div class="box"><h2>Maintenance history</h2>' + (u.history.length ? '<ul class="log">' + each(u.history, renderUnitHistory) + "</ul>" : '<p class="muted">Nothing recorded.</p>') + "</div>" +
      '<form class="box" id="form-notes"><h2>Notes</h2><textarea id="unit-notes" rows="3" placeholder="e.g. Small dent rear left door">' + esc(u.notes) + '</textarea><div class="actions"><button class="btn small" type="submit">Save notes</button></div></form>' +
    "</div></div>";
}

/* ============ settings ============ */
function fillTemplate(text, b){
  const t = typeById(b.typeId);
  const vals = {name:b.name || "there", car:typeName(t), start:niceDate(b.start), end:niceDate(b.end), ref:b.ref, amount:money(b.commitFee), pt:b.pt,
    deadline:niceDate(addDays(TODAY, Math.ceil(settings.deadlineHours / 24))), paybill:settings.paybill, bank:settings.bank, balance:money(b.total - b.commitFee)};
  return text.replace(/\{(\w+)\}/g, function fillOne(all, key){ return key in vals ? vals[key] : all; });
}
function renderSettings(){
  return '<div class="page-head"><div><div class="eyebrow">Emails and payment details</div><h1>Settings</h1></div></div>' +
    '<form id="form-settings" class="split"><div class="stack" style="gap:18px">' +
      '<div class="box"><h2>Payment details shown to clients</h2><div class="form-grid">' +
        '<label class="field"><span>M-Pesa Paybill number</span><input type="text" id="s-paybill" value="' + esc(settings.paybill) + '"></label>' +
        '<label class="field"><span>Payment deadline (hours)</span><input type="number" id="s-hours" min="1" value="' + settings.deadlineHours + '"></label>' +
        '<label class="field wide"><span>Bank details</span><input type="text" id="s-bank" value="' + esc(settings.bank) + '"></label></div>' +
        '<p class="hint">The booking reference is used as the M-Pesa account number.</p></div>' +
      '<div class="box"><h2>Commitment fee email</h2><label class="switch"><input type="checkbox" id="s-auto" ' + (settings.autoEmail ? "checked" : "") + '> Send automatically when a booking is created</label>' +
        '<p class="hint">When off, new bookings show "Send fee email" under Needs action and you send each one by hand.</p>' +
        '<label class="field"><span>Email wording</span><textarea id="s-template" rows="12">' + esc(settings.template) + "</textarea></label>" +
        '<p class="hint">Placeholders: {name} {car} {start} {end} {ref} {amount} {deadline} {paybill} {bank} {balance}</p></div>' +
      '<div class="box"><h2>Reports</h2><label class="field"><span>Workshop / maintenance department email</span><input type="email" id="s-workshop" value="' + esc(settings.workshopEmail) + '"></label>' +
        '<p class="hint">Inspection reports are addressed to this email.</p></div>' +
      renderWhatsAppSettings() +
      '<div class="actions"><button class="btn" type="submit">Save settings</button></div>' +
    "</div>" +
    '<div class="box"><h2>Preview</h2><p class="hint">Using booking ' + bookings[0].ref + ".</p><div class=\"email-preview\" id=\"s-preview\">" + esc(fillTemplate(settings.template, bookings[0])) + "</div></div>" +
    "</form>";
}

/* ============ reports ============ */
const REPORT_TABS = [["inspections","Inspection reports"],["upcoming","Upcoming hires"]];
function renderReportTab(tab){
  return '<button type="button" role="tab" data-action="setReportTab" data-tab="' + tab[0] + '" aria-selected="' + (state.reportTab === tab[0]) + '">' + tab[1] + "</button>";
}
function renderReports(){
  const body = state.reportTab === "upcoming" ? renderUpcomingTab() : renderInspectionsTab();
  return '<div class="page-head"><div><div class="eyebrow">PDFs to share</div><h1>Reports</h1></div></div>' +
    '<div class="tabs" role="tablist">' + each(REPORT_TABS, renderReportTab) + "</div>" + body;
}

/* ---- inspection reports list ---- */
function compareInspectionsDesc(a, b){ return a.id < b.id ? 1 : a.id > b.id ? -1 : 0; }
function inspectionPill(r){ return r.status === "sent" ? '<span class="pill ok">Sent to workshop</span>' : '<span class="pill warn">Draft</span>'; }
function renderInspectionRow(r){
  const u = unitByCode(r.unit), n = attentionCount(r);
  return '<tr class="clickable" data-action="openInspection" data-id="' + r.id + '"><td class="mono">' + r.id + '</td><td><span class="mono">' + r.unit + '</span><span class="cell-sub">' + esc(typeName(typeById(u.typeId))) + '</span></td><td class="mono">' + esc(r.bookingRef || "—") + "</td><td>" + niceDate(r.date) + "</td>" +
    '<td class="num">' + (n ? '<span class="pill warn">' + n + " need attention</span>" : '<span class="pill ok">All OK</span>') + '</td><td class="num">' + r.tasks.length + "</td><td>" + inspectionPill(r) + "</td>" +
    '<td><button class="btn small ghost" type="button" data-action="downloadInspection" data-id="' + r.id + '">Download PDF</button></td></tr>';
}
function renderInspectionsTab(){
  const list = inspections.slice().sort(compareInspectionsDesc);
  return '<div class="toolbar" style="justify-content:space-between"><p class="hint">Written when a car comes back. Lists what needs fixing, as a PDF for the workshop.</p><button class="btn" type="button" data-action="newInspection" data-code="">+ New inspection report</button></div>' +
    (list.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Report</th><th>Unit</th><th>Booking</th><th>Inspected</th><th>Checklist</th><th>Tasks</th><th>Status</th><th></th></tr></thead><tbody>' + each(list, renderInspectionRow) + "</tbody></table></div>" :
      '<div class="empty"><strong>No inspection reports yet.</strong><span class="muted">They are created when you mark a car returned.</span></div>');
}
function renderUnitInspectionItem(r){
  return '<li><time>' + niceDate(r.date) + '</time><span><button class="link" type="button" data-action="openInspection" data-id="' + r.id + '">' + r.id + "</button> · " + attentionCount(r) + " need attention · " + (r.status === "sent" ? "sent" : "draft") + "</span></li>";
}
function renderUnitInspections(code){
  const list = [];
  for (const r of inspections) if (r.unit === code) list.push(r);
  list.sort(compareInspectionsDesc);
  return list.length ? '<ul class="log">' + each(list, renderUnitInspectionItem) + "</ul>" : '<p class="muted">None yet.</p>';
}

/* ---- create / edit an inspection ---- */
function lastBookingFor(code){
  let best = null;
  for (const b of bookings){
    if (b.unit === code && (b.status === "COMPLETED" || b.status === "ACTIVE") && (!best || b.end > best.end)) best = b;
  }
  return best;
}
function createInspection(code, bookingRef, date, maintDays, note){
  const u = unitByCode(code);
  const r = {id:"INS-" + String(inspSeq++).padStart(4, "0"), unit:code, bookingRef:bookingRef || "", date:date || TODAY, inspector:state.email,
    mileage:u.mileage, fuel:"1/2", items:makeChecklist(null), tasks:[], maintDays:maintDays == null ? 2 : maintDays, notes:note || "", status:"draft", sentTo:"", sentAt:""};
  inspections.push(r);
  return r;
}
function openNewInspection(code){
  if (!code){ openPickUnitForInspection(); return; }
  const last = lastBookingFor(code);
  const r = createInspection(code, last ? last.ref : "", TODAY, 2, "");
  closeModal();
  state.detail = {kind:"inspection", id:r.id};
  render(); window.scrollTo(0, 0);
}
function renderPickUnitOption(u){ return '<option value="' + u.code + '">' + u.code + " · " + esc(typeName(typeById(u.typeId))) + " · " + UNIT_STATUS[u.status][0] + "</option>"; }
function openPickUnitForInspection(){
  const active = [];
  for (const u of units) if (u.status !== "retired") active.push(u);
  modalState = {kind:"pickUnit"};
  openModal(modalHead("Reports", "New inspection report") +
    '<form id="form-pickunit" class="stack" style="gap:14px"><label class="field"><span>Which unit are you inspecting?</span><select id="pu-unit">' + each(active, renderPickUnitOption) + "</select></label>" +
    '<p class="hint">Tip: marking a car returned offers to start this report for you.</p>' +
    '<div class="actions"><button class="btn" type="submit">Start report</button><button class="btn ghost" type="button" data-action="closeModal">Cancel</button></div></form>');
}
function renderFuelOption(level){
  const r = inspectionById(state.detail.id);
  return "<option" + (r.fuel === level ? " selected" : "") + ">" + level + "</option>";
}
function renderCheckRow(it, i){
  function radio(value, label){
    return '<label class="radio"><input type="radio" name="it-' + it.key + '" value="' + value + '"' + (it.status === value ? " checked" : "") + "> " + label + "</label>";
  }
  return '<tr class="' + (it.status === "attention" ? "attn" : "") + '"><td class="item">' + esc(it.label) + '</td><td class="res"><div class="actions">' + radio("ok", "OK") + radio("attention", "Needs attention") + radio("na", "Not checked") + "</div></td>" +
    '<td><input type="text" id="it-note-' + i + '" value="' + esc(it.note) + '" placeholder="What did you find?"></td></tr>';
}
function renderTaskRow(task, i){
  return '<div class="task-row"><input type="text" id="task-text-' + i + '" value="' + esc(task.text) + '" placeholder="e.g. Replace rear left tyre" aria-label="Task ' + (i + 1) + '">' +
    '<select id="task-pri-' + i + '" aria-label="Priority for task ' + (i + 1) + '">' + selectOptions(["High","Medium","Low"], task.priority) + "</select>" +
    '<button class="icon-btn" type="button" data-action="removeTask" data-index="' + i + '" aria-label="Remove task">✕</button></div>';
}
function inspectionEmail(r){
  const u = unitByCode(r.unit), t = typeById(u.typeId);
  const subject = "Maintenance request: " + r.unit + " (" + u.plate + ") · " + r.id;
  let body = "Hello,\n\nPlease find attached inspection report " + r.id + " for " + typeName(t) + " " + r.unit + " (" + u.plate + "), inspected on " + niceDate(r.date) + ".\n\nWork needed:\n";
  if (r.tasks.length){ for (const task of r.tasks) body += "  - [" + task.priority + "] " + task.text + "\n"; }
  else body += "  - No tasks listed\n";
  body += "\nPlanned maintenance: " + r.maintDays + " day" + (r.maintDays === 1 ? "" : "s") + ", until " + niceDate(addDays(r.date, r.maintDays)) + ".\nThe car stays off the booking website until it is relisted.\n\nThanks,\n" + state.email;
  return {to:settings.workshopEmail, subject:subject, body:body};
}
function mailtoLink(mail){ return "mailto:" + mail.to + "?subject=" + encodeURIComponent(mail.subject) + "&body=" + encodeURIComponent(mail.body); }
function renderInspectionPage(r){
  const u = unitByCode(r.unit), t = typeById(u.typeId);
  const mail = inspectionEmail(r);
  const sentNote = r.status === "sent" ? '<div class="note">Marked as sent to ' + esc(r.sentTo) + " on " + esc(r.sentAt) + ".</div>" : "";
  return '<div class="crumb"><button class="link" type="button" data-action="backToReports">← Reports</button> · <button class="link" type="button" data-action="openUnit" data-code="' + r.unit + '">' + r.unit + "</button></div>" +
    '<div class="page-head"><div><div class="eyebrow mono">' + r.id + '</div><h1>Inspection · <span style="font-family:var(--mono)">' + r.unit + "</span></h1></div>" + inspectionPill(r) + "</div>" +
    '<form id="form-inspection" class="split"><div class="stack" style="gap:18px">' + sentNote +
      '<div class="box"><h2>Vehicle</h2><div class="form-grid">' +
        '<div class="field"><span>Car</span><b>' + esc(typeName(t)) + " · " + esc(u.plate) + "</b></div>" +
        '<label class="field"><span>Booking</span><input type="text" id="in-booking" value="' + esc(r.bookingRef) + '" placeholder="e.g. BK-2090"></label>' +
        '<label class="field"><span>Inspection date</span><input type="date" id="in-date" value="' + r.date + '"></label>' +
        '<label class="field"><span>Inspected by</span><input type="text" id="in-inspector" value="' + esc(r.inspector) + '"></label>' +
        '<label class="field"><span>Mileage (km)</span><input type="number" id="in-mileage" min="0" value="' + r.mileage + '"></label>' +
        '<label class="field"><span>Fuel level</span><select id="in-fuel">' + each(FUEL_LEVELS, renderFuelOption) + "</select></label></div></div>" +
      '<div class="box"><h2>Checklist</h2><div class="table-wrap"><table class="data check-table"><thead><tr><th>Item</th><th>Result</th><th>Notes</th></tr></thead><tbody>' + each(r.items, renderCheckRow) + "</tbody></table></div></div>" +
      '<div class="box"><h2>Work needed</h2><p class="hint">What the workshop should do. Each line becomes a row in the PDF.</p><div class="stack">' + (r.tasks.length ? each(r.tasks, renderTaskRow) : '<p class="muted">No tasks yet.</p>') + "</div>" +
        '<div class="actions"><button class="btn small ghost" type="button" data-action="addTask">+ Add task</button></div>' +
        '<div class="form-grid"><label class="field"><span>Planned maintenance (days)</span><input type="number" id="in-days" min="0" value="' + r.maintDays + '"></label>' +
        '<label class="field wide"><span>Other notes</span><textarea id="in-notes" rows="2">' + esc(r.notes) + "</textarea></label></div></div>" +
    "</div>" +
    '<div class="stack" style="gap:18px">' +
      '<div class="box"><h2>PDF</h2><p class="hint">Saves your changes, then creates the report as a PDF file.</p><div class="actions"><button class="btn" type="button" data-action="downloadInspection" data-id="' + r.id + '">Download PDF</button><button class="btn ghost" type="submit">Save</button></div></div>' +
      '<div class="box"><h2>Email to the workshop</h2>' +
        '<div class="copy-box"><span class="lbl">To</span><div class="copy-line"><input type="text" readonly id="mail-to" value="' + esc(mail.to) + '"><button class="btn small ghost" type="button" data-action="copyField" data-target="mail-to">Copy</button></div></div>' +
        '<div class="copy-box"><span class="lbl">Subject</span><div class="copy-line"><input type="text" readonly id="mail-subject" value="' + esc(mail.subject) + '"><button class="btn small ghost" type="button" data-action="copyField" data-target="mail-subject">Copy</button></div></div>' +
        '<div class="copy-box"><span class="lbl">Message</span><textarea readonly id="mail-body" rows="9">' + esc(mail.body) + '</textarea><div class="actions"><button class="btn small ghost" type="button" data-action="copyField" data-target="mail-body">Copy message</button></div></div>' +
        '<div class="actions"><a class="btn small ghost" href="' + esc(mailtoLink(mail)) + '">Open in email app</a></div>' +
        '<p class="hint">Download the PDF first, then attach it to the email. In the full system the server emails the PDF to the workshop in one click.</p>' +
        '<div class="actions"><button class="btn ' + (r.status === "sent" ? "ghost" : "") + '" type="button" data-action="markInspectionSent" data-id="' + r.id + '">' + (r.status === "sent" ? "Mark as sent again" : "Mark as sent to workshop") + "</button></div></div>" +
    "</div></form>";
}
function collectInspection(r){
  if (!$("#form-inspection")) return;
  r.bookingRef = $("#in-booking").value.trim().toUpperCase();
  r.date = $("#in-date").value || r.date;
  r.inspector = $("#in-inspector").value.trim();
  r.mileage = Number($("#in-mileage").value) || r.mileage;
  r.fuel = $("#in-fuel").value;
  for (let i = 0; i < r.items.length; i++){
    const it = r.items[i];
    const picked = document.querySelector('input[name="it-' + it.key + '"]:checked');
    if (picked) it.status = picked.value;
    it.note = $("#it-note-" + i).value.trim();
  }
  for (let i = 0; i < r.tasks.length; i++){
    r.tasks[i].text = $("#task-text-" + i).value.trim();
    r.tasks[i].priority = $("#task-pri-" + i).value;
  }
  r.maintDays = Math.max(0, Number($("#in-days").value) || 0);
  r.notes = $("#in-notes").value.trim();
}
function keepRealTasks(r){
  const kept = [];
  for (const task of r.tasks) if (task.text) kept.push(task);
  r.tasks = kept;
}

/* ---- upcoming hires ---- */
function upcomingList(){
  const f = state.upcoming, out = [];
  for (const b of bookings){
    const statusOk = b.status === "BOOKED" || (f.committed && b.status === "COMMITTED");
    if (statusOk && b.start >= f.from && b.start <= f.to && (!f.typeId || b.typeId === f.typeId)) out.push(b);
  }
  out.sort(compareBookings);
  return out;
}
function paymentText(b){
  if (b.status === "COMMITTED") return b.payRef ? "Fee " + money(b.commitFee) + " awaiting approval" : "Fee " + money(b.commitFee) + " due";
  const balance = b.total - (b.payment ? b.payment.amount : b.commitFee);
  return balance > 0 ? "Fee paid · " + money(balance) + " at pick-up" : "Paid in full";
}
function renderUpcomingTypeOption(t){ return '<option value="' + t.id + '"' + (state.upcoming.typeId === t.id ? " selected" : "") + ">" + esc(typeName(t)) + "</option>"; }
function renderUpcomingRow(b){
  const t = typeById(b.typeId), u = unitByCode(b.unit);
  return '<tr class="clickable" data-action="openBooking" data-ref="' + b.ref + '"><td>' + niceDate(b.start) + '<span class="cell-sub">' + b.pt + "</span></td><td>" + niceDate(b.end) + '<span class="cell-sub">' + b.rt + '</span></td><td class="mono">' + b.ref + "</td>" +
    "<td>" + esc(typeName(t)) + '<span class="cell-sub">' + (b.hire === "e" ? "Equipped" : "Unequipped") + ' · ' + b.days + ' days</span></td><td><span class="mono">' + b.unit + '</span><span class="cell-sub">' + esc(u.plate) + "</span></td>" +
    "<td>" + esc(b.name || "Not given") + '<span class="cell-sub">' + esc(b.email) + "</span></td><td>" + esc(b.phone || "—") + "</td><td>" + bookingPill(b.status) + '</td><td class="num">' + esc(paymentText(b)) + "</td></tr>";
}
function rangeChip(days){
  const on = state.upcoming.from === TODAY && state.upcoming.to === addDays(TODAY, days);
  return '<button type="button" class="chip" data-action="setRange" data-days="' + days + '" aria-pressed="' + on + '">Next ' + days + " days</button>";
}
function renderUpcomingTab(){
  const f = state.upcoming, list = upcomingList();
  let value = 0, due = 0;
  for (const b of list){ value += b.total; due += b.status === "COMMITTED" ? b.commitFee : 0; }
  return '<div class="toolbar"><div class="chips">' + rangeChip(7) + rangeChip(14) + rangeChip(30) + "</div>" +
      '<label class="field" style="grid-auto-flow:column;align-items:center"><span>From</span><input type="date" id="up-from" value="' + f.from + '"></label>' +
      '<label class="field" style="grid-auto-flow:column;align-items:center"><span>To</span><input type="date" id="up-to" value="' + f.to + '"></label>' +
      '<select id="up-type" style="width:auto" aria-label="Car type"><option value="">All car types</option>' + each(types, renderUpcomingTypeOption) + "</select>" +
      '<label class="switch"><input type="checkbox" id="up-committed" ' + (f.committed ? "checked" : "") + "> Include unpaid (Committed)</label></div>" +
    '<div class="page-head" style="margin-bottom:10px"><div class="summary-line"><span><b>' + list.length + "</b> hire" + (list.length === 1 ? "" : "s") + " starting " + shortDate(f.from) + " – " + shortDate(f.to) + "</span><span>Rental value <b>" + money(value) + "</b></span>" + (f.committed ? "<span>Fees still due <b>" + money(due) + "</b></span>" : "") + "</div>" +
      '<button class="btn" type="button" data-action="downloadUpcoming" ' + (list.length ? "" : "disabled") + ">Download PDF</button></div>" +
    (list.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Pick-up</th><th>Return</th><th>Ref</th><th>Car type</th><th>Unit</th><th>Client</th><th>Phone</th><th>Status</th><th>Payment</th></tr></thead><tbody>' + each(list, renderUpcomingRow) + "</tbody></table></div>" :
      '<div class="empty"><strong>No hires start in this period.</strong><span class="muted">Try a longer range or include unpaid bookings.</span></div>') +
    '<p class="hint" style="margin-top:10px">Bookings already on hire are not included. The PDF is landscape A4, ready to send to the yard or front desk.</p>';
}

/* ---- PDF building (jsPDF + autoTable) ---- */
const PDF_BROWN = [139, 103, 85], PDF_INK = [40, 38, 38], PDF_MUTED = [106, 98, 94], PDF_WARN = [251, 238, 211];
function pdfLibraryReady(){ return !!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable); }
function pdfHeader(doc, title, subtitle){
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(PDF_INK[0], PDF_INK[1], PDF_INK[2]);
  doc.rect(0, 0, w, 26, "F");
  doc.setTextColor(244, 238, 233);
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("Kifaru 4x4 Hire", 14, 12);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text("Nairobi, Kenya", 14, 19);
  doc.setFontSize(9);
  doc.text("Generated " + niceDate(TODAY), w - 14, 12, {align:"right"});
  doc.setTextColor(PDF_INK[0], PDF_INK[1], PDF_INK[2]);
  doc.setFont("helvetica", "bold"); doc.setFontSize(17);
  doc.text(title, 14, 40);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.setTextColor(PDF_MUTED[0], PDF_MUTED[1], PDF_MUTED[2]);
  doc.text(subtitle, 14, 47);
  doc.setTextColor(PDF_INK[0], PDF_INK[1], PDF_INK[2]);
}
function pdfFooters(doc, leftText){
  const pages = doc.getNumberOfPages(), w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++){
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(PDF_MUTED[0], PDF_MUTED[1], PDF_MUTED[2]);
    doc.text(leftText, 14, h - 8);
    doc.text("Page " + i + " of " + pages, w - 14, h - 8, {align:"right"});
  }
}
function pdfSection(doc, text, y){
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.setTextColor(PDF_BROWN[0], PDF_BROWN[1], PDF_BROWN[2]);
  doc.text(text.toUpperCase(), 14, y);
  doc.setTextColor(PDF_INK[0], PDF_INK[1], PDF_INK[2]);
  doc.setFont("helvetica", "normal");
}
const TABLE_STYLE = {font:"helvetica", fontSize:9, cellPadding:1.9, lineColor:[221, 215, 210], lineWidth:0.2, textColor:PDF_INK};
const HEAD_STYLE = {fillColor:[243, 241, 239], textColor:PDF_MUTED, fontStyle:"bold"};
function colourAttentionRow(data){
  if (data.section === "body" && data.row.raw && data.row.raw[1] === "Needs attention") data.cell.styles.fillColor = PDF_WARN;
}
function colourPriority(data){
  if (data.section === "body" && data.column.index === 2 && data.cell.raw === "High"){ data.cell.styles.textColor = [163, 50, 44]; data.cell.styles.fontStyle = "bold"; }
}
function lastTableY(doc){ return doc.lastAutoTable.finalY; }
function buildInspectionPdf(r){
  const u = unitByCode(r.unit), t = typeById(u.typeId);
  const doc = new window.jspdf.jsPDF({unit:"mm", format:"a4"});
  pdfHeader(doc, "Vehicle inspection and maintenance report", r.id + " · " + typeName(t) + " · " + r.unit + " (" + u.plate + ")");
  doc.autoTable({startY:54, theme:"plain", styles:{font:"helvetica", fontSize:10, cellPadding:1.6}, columnStyles:{0:{textColor:PDF_MUTED, cellWidth:38}, 2:{textColor:PDF_MUTED, cellWidth:38}},
    body:[["Unit", r.unit + " (" + u.plate + ")", "Booking", r.bookingRef || "-"], ["Car type", typeName(t), "Inspected on", niceDate(r.date)], ["Mileage", r.mileage.toLocaleString("en-US") + " km", "Inspected by", r.inspector || "-"], ["Fuel level", r.fuel, "Status", r.status === "sent" ? "Sent to workshop" : "Draft"]]});
  let y = lastTableY(doc) + 10;
  pdfSection(doc, "Checklist", y);
  const rows = [];
  for (const it of r.items) rows.push([it.label, it.status === "ok" ? "OK" : it.status === "attention" ? "Needs attention" : "Not checked", it.note || ""]);
  doc.autoTable({startY:y + 3, head:[["Item","Result","Notes"]], body:rows, styles:TABLE_STYLE, headStyles:HEAD_STYLE, columnStyles:{0:{cellWidth:48}, 1:{cellWidth:34}}, didParseCell:colourAttentionRow});
  y = lastTableY(doc) + 10;
  pdfSection(doc, "Work needed", y);
  const tasks = [];
  for (let i = 0; i < r.tasks.length; i++) tasks.push([String(i + 1), r.tasks[i].text, r.tasks[i].priority]);
  if (!tasks.length) tasks.push(["-", "No tasks listed", "-"]);
  doc.autoTable({startY:y + 3, head:[["#","Task","Priority"]], body:tasks, styles:TABLE_STYLE, headStyles:HEAD_STYLE, columnStyles:{0:{cellWidth:10}, 2:{cellWidth:26}}, didParseCell:colourPriority});
  y = lastTableY(doc) + 10;
  if (y > 240){ doc.addPage(); y = 20; }
  pdfSection(doc, "Maintenance plan", y);
  doc.setFontSize(10);
  doc.text("Planned maintenance: " + r.maintDays + " day" + (r.maintDays === 1 ? "" : "s") + ", until " + niceDate(addDays(r.date, r.maintDays)) + ".", 14, y + 7);
  doc.text("The car stays off the booking website until an admin relists it.", 14, y + 13);
  y += 19;
  if (r.notes){
    const lines = doc.splitTextToSize("Notes: " + r.notes, 180);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 2;
  }
  if (y > 262){ doc.addPage(); y = 20; }
  y += 6;
  doc.setDrawColor(PDF_MUTED[0], PDF_MUTED[1], PDF_MUTED[2]);
  doc.line(14, y + 8, 90, y + 8); doc.line(115, y + 8, 196, y + 8);
  doc.setFontSize(8); doc.setTextColor(PDF_MUTED[0], PDF_MUTED[1], PDF_MUTED[2]);
  doc.text("Inspected by (name and signature)", 14, y + 13);
  doc.text("Received by workshop (name, signature, date)", 115, y + 13);
  pdfFooters(doc, r.id + " · For: " + settings.workshopEmail);
  return doc;
}
function buildUpcomingPdf(list){
  const f = state.upcoming;
  const doc = new window.jspdf.jsPDF({unit:"mm", format:"a4", orientation:"landscape"});
  const typeLabel = f.typeId ? typeName(typeById(f.typeId)) : "All car types";
  pdfHeader(doc, "Upcoming hires", niceDate(f.from) + " to " + niceDate(f.to) + " · " + typeLabel + " · " + (f.committed ? "Booked and unpaid (Committed)" : "Booked only"));
  const rows = [];
  let value = 0;
  for (const b of list){
    const t = typeById(b.typeId), u = unitByCode(b.unit);
    value += b.total;
    rows.push([niceDate(b.start) + "\n" + b.pt, niceDate(b.end) + "\n" + b.rt, b.ref, typeName(t) + "\n" + (b.hire === "e" ? "Equipped" : "Unequipped") + ", " + b.days + " days", b.unit + "\n" + u.plate,
      (b.name || "Name not given") + "\n" + b.email, b.phone || "-", BOOKING_STATUS[b.status][0], paymentText(b)]);
  }
  doc.autoTable({startY:54, head:[["Pick-up","Return","Ref","Car type","Unit","Client","Phone","Status","Payment"]], body:rows, styles:TABLE_STYLE, headStyles:HEAD_STYLE,
    columnStyles:{0:{cellWidth:26}, 1:{cellWidth:26}, 2:{cellWidth:20}, 4:{cellWidth:22}, 6:{cellWidth:30}, 7:{cellWidth:22}}, didParseCell:colourCommittedRow});
  const y = lastTableY(doc) + 8;
  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text(list.length + " hire" + (list.length === 1 ? "" : "s") + " · rental value " + money(value), 14, y);
  pdfFooters(doc, "Upcoming hires · generated by " + state.email);
  return doc;
}
function colourCommittedRow(data){
  if (data.section === "body" && data.row.raw && data.row.raw[7] === "Committed") data.cell.styles.fillColor = PDF_WARN;
}

/* ---- saving files (downloads capability) ---- */
let downloadsPromise = null;
function getDownloads(){
  if (!downloadsPromise){
    downloadsPromise = (window.claude && window.claude.use) ? window.claude.use("downloads").catch(noDownloads) : Promise.resolve(null);
  }
  return downloadsPromise;
}
function noDownloads(){ return null; }
async function savePdf(doc, filename){
  const downloads = await getDownloads();
  if (!downloads){
    doc.save(filename);
    toast("Downloaded " + filename);
    return true;
  }
  try {
    await downloads.save({filename:filename, data:doc.output("blob")});
    toast("Saved " + filename);
    return true;
  } catch (err){
    const code = err && err.code;
    if (code === "declined") toast("Download cancelled");
    else if (code === "rate_limited") toast("A save prompt is already open. Try again in a moment.");
    else toast("Couldn't save the PDF here. Open the page in claude.ai and try again.");
    return false;
  }
}
function downloadInspection(id){
  const r = inspectionById(id);
  if (state.detail && state.detail.kind === "inspection" && state.detail.id === id){ collectInspection(r); keepRealTasks(r); }
  if (!pdfLibraryReady()){ toast("The PDF tool didn't load. Check your connection and reload the page."); return; }
  savePdf(buildInspectionPdf(r), r.id + "-" + r.unit + "-inspection.pdf");
  if (state.detail && state.detail.kind === "inspection") render();
}
function downloadUpcoming(){
  const list = upcomingList();
  if (!list.length) return;
  if (!pdfLibraryReady()){ toast("The PDF tool didn't load. Check your connection and reload the page."); return; }
  savePdf(buildUpcomingPdf(list), "upcoming-hires-" + state.upcoming.from + "-to-" + state.upcoming.to + ".pdf");
}
function copyField(targetId){
  const el = document.getElementById(targetId);
  if (!el) return;
  function copiedOk(){ toast("Copied"); }
  function copyFailed(){ el.focus(); el.select(); toast("Text selected. Press Ctrl+C to copy"); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(el.value).then(copiedOk, copyFailed);
  else copyFailed();
}

/* ============ WhatsApp ============ */
function renderWaTemplateBox(tpl){
  return '<label class="field"><span>' + esc(tpl.label) + '</span><textarea id="wa-tpl-' + tpl.id + '" rows="3">' + esc(tpl.text) + "</textarea></label>";
}
function renderWhatsAppSettings(){
  return '<div class="box"><div class="media-head"><h2>WhatsApp</h2><span class="pill ok">Quick replies available now</span></div>' +
    '<label class="field"><span>Business WhatsApp number</span><input type="tel" id="s-wa" value="' + esc(settings.waNumber) + '"></label>' +
    '<p class="hint">Today: staff press "Message on WhatsApp" on a booking. WhatsApp opens with the message ready and they press send.</p>' +
    '<span class="lbl">Quick reply templates</span>' + each(settings.waTemplates, renderWaTemplateBox) +
    '<p class="hint">Placeholders: {name} {car} {start} {end} {pt} {ref} {amount} {deadline} {paybill}</p>' +
    '<div class="planned"><div class="media-head"><b>Next: WhatsApp Business API</b><span class="pill info">Planned</span></div>' +
      "<ul><li>Auto-reply to enquiries like \"Is the Jimny free next week?\" with live availability from the calendar.</li>" +
      "<li>Send the commitment fee request, fee reminders and pick-up reminders on WhatsApp as well as email.</li>" +
      "<li>Clients book or confirm a hold by replying, and the booking appears here under Needs action.</li>" +
      "<li>One shared inbox so any staff member can answer, with every chat linked to the client's bookings.</li></ul>" +
      '<p class="hint">Needs a verified Meta business account. Messages sent more than 24 hours after the client\'s last message must use templates approved by Meta.</p></div></div>';
}
function waDigits(phone){
  let d = String(phone || "").replace(/\D/g, "");
  if (d.charAt(0) === "0") d = "254" + d.slice(1);
  return d;
}
function waLink(phone, text){ return "https://wa.me/" + waDigits(phone) + "?text=" + encodeURIComponent(text); }
function renderWaChoice(tpl, i){
  return '<label class="option' + (i === 0 ? " on" : "") + '"><span><input type="radio" name="wa-choice" value="' + tpl.id + '"' + (i === 0 ? " checked" : "") + "> " + esc(tpl.label) + "</span></label>";
}
function openWhatsApp(ref){
  const b = bookingByRef(ref);
  modalState = {kind:"whatsapp", ref:ref};
  const first = fillTemplate(settings.waTemplates[0].text, b);
  openModal(modalHead(b.ref + " · " + esc(b.phone), "Message on WhatsApp") +
    '<div class="stack" style="gap:14px"><div class="options">' + each(settings.waTemplates, renderWaChoice) + "</div>" +
    '<label class="field"><span>Message (edit before sending)</span><textarea id="wa-text" rows="5">' + esc(first) + "</textarea></label>" +
    '<div class="actions"><a class="btn wa-btn" id="wa-open" href="' + esc(waLink(b.phone, first)) + '" target="_blank" rel="noopener">Open WhatsApp</a><button class="btn ghost" type="button" data-action="closeModal">Close</button></div>' +
    '<p class="hint">Opens WhatsApp (app or web) with this message ready for ' + esc(b.phone) + ". You press send there. With the Business API (planned), replies like this can go out automatically.</p></div>", true);
}
function updateWaLink(){
  const b = bookingByRef(modalState.ref);
  $("#wa-open").setAttribute("href", waLink(b.phone, $("#wa-text").value));
}
function pickWaTemplate(id){
  const b = bookingByRef(modalState.ref);
  for (const tpl of settings.waTemplates) if (tpl.id === id) $("#wa-text").value = fillTemplate(tpl.text, b);
  const opts = document.querySelectorAll("input[name=wa-choice]");
  for (const o of opts) o.closest(".option").classList.toggle("on", o.checked);
  updateWaLink();
}

/* ============ modals ============ */
let lastFocus = null;
function openModal(html, wide){
  lastFocus = document.activeElement;
  const m = $("#modal");
  m.className = "modal" + (wide ? " wide" : "");
  m.innerHTML = html;
  $("#overlay").hidden = false;
  const first = m.querySelector("input:not([type=hidden]),select,textarea,button:not(.x)");
  if (first) first.focus();
}
function closeModal(){
  $("#overlay").hidden = true;
  modalState = null;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
function modalHead(eyebrow, title){
  return '<div class="modal-head"><div>' + (eyebrow ? '<div class="eyebrow">' + eyebrow + "</div>" : "") + '<h2 id="modal-title">' + title + '</h2></div><button class="x" type="button" data-action="closeModal" aria-label="Close">×</button></div>';
}

/* ---- new booking ---- */
function openNewBooking(){
  modalState = {kind:"newBooking", mode:"type", typeId:"jimny3", start:addDays(TODAY, 3), end:addDays(TODAY, 8), hire:"u", unit:""};
  openModal(modalHead("Booking for a client", "New booking") +
    '<div class="seg" role="group" aria-label="Booking method"><button type="button" data-action="nbMode" data-mode="type" aria-pressed="true">Option 1 · Car type first</button><button type="button" data-action="nbMode" data-mode="dates" aria-pressed="false">Option 2 · Dates first</button></div>' +
    '<form id="form-newbooking" class="stack" style="gap:14px">' +
    '<div id="nb-type-wrap"><label class="field"><span>Car type</span><select id="nb-type">' + each(types, renderNbTypeOption) + "</select></label></div>" +
    '<div class="form-grid"><label class="field"><span>Pick-up date</span><input type="date" id="nb-start" min="' + TODAY + '" value="' + modalState.start + '"></label>' +
    '<label class="field"><span>Return date</span><input type="date" id="nb-end" min="' + addDays(TODAY, 1) + '" value="' + modalState.end + '"></label>' +
    '<label class="field"><span>Hire type</span><select id="nb-hire"><option value="u">Unequipped</option><option value="e">Equipped</option></select></label></div>' +
    '<div id="nb-choose"></div>' +
    '<div class="form-grid"><label class="field"><span>Client email (required)</span><input type="email" id="nb-email" required placeholder="name@example.com"></label>' +
    '<label class="field"><span>Name</span><input type="text" id="nb-name"></label><label class="field"><span>Phone</span><input type="tel" id="nb-phone"></label></div>' +
    '<div id="nb-summary"></div><div class="note err" id="nb-err" hidden></div>' +
    '<div class="actions"><button class="btn" type="submit">Create booking</button><button class="btn ghost" type="button" data-action="closeModal">Cancel</button></div></form>', true);
  renderNbParts();
}
function renderNbTypeOption(t){ return '<option value="' + t.id + '"' + (t.id === "jimny3" ? " selected" : "") + ">" + esc(typeName(t)) + (t.listed ? "" : " (hidden)") + "</option>"; }
function datesValid(){ return modalState.start && modalState.end && modalState.end > modalState.start; }
function renderNbTypeChoice(t){
  const free = datesValid() ? freeUnits(t.id, modalState.start, modalState.end).length : 0;
  const on = modalState.typeId === t.id;
  return '<label class="option' + (on ? " on" : "") + (free ? "" : " off") + '"><span><input type="radio" name="nb-typechoice" value="' + t.id + '" ' + (on ? "checked" : "") + (free ? "" : " disabled") + "> " + esc(typeName(t)) + '</span><span class="num ' + (free ? "" : "muted") + '">' + free + " free</span></label>";
}
function renderNbUnitOption(u){ return '<option value="' + u.code + '"' + (modalState.unit === u.code ? " selected" : "") + ">" + u.code + " · " + esc(u.plate) + "</option>"; }
function renderNbParts(){
  if (!modalState || modalState.kind !== "newBooking") return;
  $("#nb-type-wrap").hidden = modalState.mode !== "type";
  let choose = "";
  if (!datesValid()){
    choose = '<p class="hint">Choose a return date after the pick-up date.</p>';
  } else {
    if (modalState.mode === "dates") choose += '<div class="field"><span>Car types free for these dates</span><div class="options">' + each(types, renderNbTypeChoice) + "</div></div>";
    const free = freeUnits(modalState.typeId, modalState.start, modalState.end);
    let found = false;
    for (const u of free) if (u.code === modalState.unit) found = true;
    if (!found) modalState.unit = "";
    if (free.length){
      choose += '<label class="field"><span>Unit</span><select id="nb-unit"><option value="">Assign automatically (' + free[0].code + ")</option>" + each(free, renderNbUnitOption) + '</select></label><p class="hint num">' + free.length + " of " + unitsOfType(modalState.typeId).length + " " + esc(typeName(typeById(modalState.typeId))) + " units free for these dates.</p>";
    } else {
      choose += '<div class="note err">No ' + esc(typeName(typeById(modalState.typeId))) + " units are free for these dates." + (modalState.mode === "type" ? " Try other dates or Option 2." : " Pick another car type.") + "</div>";
    }
  }
  $("#nb-choose").innerHTML = choose;
  let summary = "";
  if (datesValid()){
    const q = quote(typeById(modalState.typeId), modalState.start, modalState.end, modalState.hire);
    summary = '<div class="lines" style="background:var(--surface);padding:12px"><div class="ln"><span>' + q.days + " days × " + money(q.rate) + '</span><span>' + money(q.total) + '</span></div><div class="ln total"><span>Commitment fee</span><span>' + money(q.commit) + '</span></div></div><p class="hint">' + (settings.autoEmail ? "The fee email goes to the client as soon as you create the booking." : "Automatic emails are off. You'll send the fee email from the booking.") + "</p>";
  }
  $("#nb-summary").innerHTML = summary;
}
function submitNewBooking(){
  const err = $("#nb-err");
  err.hidden = true;
  const email = $("#nb-email").value.trim();
  function fail(text){ err.textContent = text; err.hidden = false; }
  if (!datesValid()) return fail("Choose a return date after the pick-up date.");
  const t = typeById(modalState.typeId);
  if (diffDays(modalState.start, modalState.end) < t.minDays) return fail("Minimum hire for this car type is " + t.minDays + " days.");
  const free = freeUnits(t.id, modalState.start, modalState.end);
  if (!free.length) return fail("No units of this car type are free for these dates.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter the client's email. The booking and payment details go there.");
  const unit = modalState.unit || free[0].code;
  const b = makeBooking({ref:"BK-" + (++refSeq), typeId:t.id, unit:unit, start:modalState.start, end:modalState.end, hire:modalState.hire, status:"COMMITTED",
    name:$("#nb-name").value.trim(), email:email, phone:$("#nb-phone").value.trim(), feeEmailSent:settings.autoEmail, createdBy:"Admin (" + state.email + ")",
    deadline:settings.autoEmail ? addDays(TODAY, Math.ceil(settings.deadlineHours / 24)) : null, log:[{at:stamp(), text:"Booking created by admin. Unit " + unit + " assigned"}]});
  if (settings.autoEmail) b.log.push({at:stamp(), text:"Commitment fee email sent automatically (" + money(b.commitFee) + ")"});
  bookings.unshift(b);
  closeModal();
  state.detail = {kind:"booking", id:b.ref};
  render();
  toast(b.ref + " created on " + unit);
}

/* ---- approve payment ---- */
function openApprove(ref){
  const b = bookingByRef(ref);
  modalState = {kind:"approve", ref:ref};
  openModal(modalHead(b.ref, b.payRef ? "Approve payment" : "Record a payment") +
    '<form id="form-approve" class="stack" style="gap:14px">' +
    (b.payRef ? '<p>The client says they paid with reference <b class="mono">' + esc(b.payRef) + "</b>. Find it on your M-Pesa or bank statement before approving.</p>" : '<p>Use this when a client pays without entering a reference, for example by phone.</p>') +
    '<div class="form-grid"><label class="field"><span>Amount received (USD)</span><input type="number" id="ap-amount" min="1" value="' + b.commitFee + '"></label>' +
    '<label class="field"><span>Method</span><select id="ap-method"><option>M-Pesa</option><option>Bank transfer</option><option>Cash at office</option></select></label>' +
    '<label class="field"><span>Transaction reference</span><input type="text" id="ap-ref" value="' + esc(b.payRef) + '" required></label></div>' +
    '<p class="hint">Fee due: ' + money(b.commitFee) + '. Approving moves the booking to <b>Booked</b>.</p><div class="note err" id="ap-err" hidden></div>' +
    '<div class="actions"><button class="btn" type="submit">Approve and mark Booked</button><button class="btn ghost" type="button" data-action="closeModal">Cancel</button></div></form>');
}
function submitApprove(){
  const b = bookingByRef(modalState.ref);
  const amount = Number($("#ap-amount").value), ref = $("#ap-ref").value.trim(), method = $("#ap-method").value;
  const err = $("#ap-err");
  if (!ref){ err.textContent = "Enter the transaction reference."; err.hidden = false; return; }
  if (!(amount > 0)){ err.textContent = "Enter the amount received."; err.hidden = false; return; }
  b.payment = {amount:amount, method:method, ref:ref.toUpperCase(), approvedBy:state.email, at:stamp()};
  b.status = "BOOKED";
  b.log.push({at:stamp(), text:"Payment " + ref.toUpperCase() + " (" + money(amount) + ", " + method + ") approved. Status changed to Booked"});
  if (amount < b.commitFee) b.log.push({at:stamp(), text:"Amount is " + money(b.commitFee - amount) + " less than the fee due"});
  closeModal(); render(); toast(b.ref + " is now Booked");
}

/* ---- fee email ---- */
function openFeeEmail(ref){
  const b = bookingByRef(ref);
  modalState = {kind:"fee", ref:ref};
  openModal(modalHead(b.ref + " · to " + esc(b.email), "Commitment fee email") +
    '<form id="form-fee" class="stack" style="gap:14px"><label class="field" style="max-width:220px"><span>Amount to request (USD)</span><input type="number" id="fe-amount" min="1" value="' + b.commitFee + '"></label>' +
    '<p class="hint">Default comes from the car type setting (' + (typeById(b.typeId).commit.mode === "full" ? "full amount" : typeById(b.typeId).commit.pct + "%") + "). Changing it here only affects this booking.</p>" +
    '<div class="email-preview" id="fe-preview">' + esc(fillTemplate(settings.template, b)) + "</div>" +
    '<div class="actions"><button class="btn" type="submit">Send email</button><button class="btn ghost" type="button" data-action="closeModal">Cancel</button></div></form>', true);
}
function updateFeePreview(){
  const b = bookingByRef(modalState.ref);
  const copy = Object.assign({}, b, {commitFee:Number($("#fe-amount").value) || 0});
  $("#fe-preview").textContent = fillTemplate(settings.template, copy);
}
function submitFee(){
  const b = bookingByRef(modalState.ref);
  const amount = Number($("#fe-amount").value);
  if (!(amount > 0)) return;
  b.commitFee = amount;
  b.feeEmailSent = true;
  b.deadline = addDays(TODAY, Math.ceil(settings.deadlineHours / 24));
  b.log.push({at:stamp(), text:"Commitment fee email sent by admin (" + money(amount) + ", due " + niceDate(b.deadline) + ")"});
  closeModal(); render(); toast("Fee email sent to " + b.email + " (demo)");
}

/* ---- pickup / return ---- */
function markPickedUp(ref){
  const b = bookingByRef(ref), u = unitByCode(b.unit);
  if (u.status !== "listed"){ toast(u.code + " is " + UNIT_STATUS[u.status][0].toLowerCase() + ". Reassign the booking first."); return; }
  b.status = "ACTIVE"; u.status = "hire";
  b.log.push({at:stamp(), text:"Picked up. " + u.code + " is now on hire"});
  render(); toast(b.ref + " picked up. " + u.code + " is on hire");
}
function openReturn(ref){
  const b = bookingByRef(ref), u = unitByCode(b.unit);
  modalState = {kind:"return", ref:ref};
  openModal(modalHead(b.ref + " · " + u.code, "Mark returned") +
    '<form id="form-return" class="stack" style="gap:14px"><p>The unit goes into maintenance and stays off the website until you relist it.</p>' +
    '<div class="form-grid"><label class="field"><span>Returned on</span><input type="date" id="rt-date" value="' + TODAY + '"></label>' +
    '<label class="field"><span>Mileage at return (km)</span><input type="number" id="rt-km" min="' + u.mileage + '" value="' + (u.mileage + 1200) + '"></label>' +
    '<label class="field"><span>Maintenance days</span><input type="number" id="rt-days" min="0" value="2"></label></div>' +
    '<p class="hint" id="rt-until"></p>' +
    '<label class="field"><span>Maintenance notes</span><input type="text" id="rt-note" placeholder="e.g. Full service, check rear brakes"></label>' +
    '<label class="switch"><input type="checkbox" id="rt-inspect" checked> Write an inspection report now (PDF for the workshop)</label>' +
    '<div class="actions"><button class="btn" type="submit">Mark returned</button><button class="btn ghost" type="button" data-action="closeModal">Cancel</button></div></form>');
  updateReturnUntil();
}
function updateReturnUntil(){
  const date = $("#rt-date").value || TODAY, days = Math.max(0, Number($("#rt-days").value) || 0);
  $("#rt-until").textContent = days ? "Maintenance planned until " + niceDate(addDays(date, days)) + ". You still relist it yourself when it's ready." : "No maintenance period. You can relist it straight away.";
}
function submitReturn(){
  const b = bookingByRef(modalState.ref), u = unitByCode(b.unit);
  const date = $("#rt-date").value || TODAY, days = Math.max(0, Number($("#rt-days").value) || 0), note = $("#rt-note").value.trim();
  const km = Number($("#rt-km").value);
  if (km >= u.mileage) u.mileage = km;
  const until = addDays(date, days);
  b.status = "COMPLETED";
  b.log.push({at:stamp(), text:"Returned on " + niceDate(date) + ". Maintenance set until " + niceDate(until)});
  u.status = "maint"; u.maintUntil = until;
  if (days) blocks.push({id:"b" + (blockSeq++), unit:u.code, start:date, end:until, kind:"maint", note:note || "After " + b.ref});
  u.history.unshift({at:date, text:"Returned from " + b.ref + ". Maintenance until " + niceDate(until) + (note ? ": " + note : "")});
  const inspectNow = $("#rt-inspect").checked;
  closeModal();
  if (inspectNow){
    const r = createInspection(u.code, b.ref, date, days, note);
    state.detail = {kind:"inspection", id:r.id};
    render(); window.scrollTo(0, 0);
    toast(u.code + " returned. Fill in the inspection");
    return;
  }
  render(); toast(u.code + " is in maintenance until " + shortDate(until));
}
function openMaint(code){
  const u = unitByCode(code);
  modalState = {kind:"maint", code:code};
  openModal(modalHead(u.code, "Take out for maintenance") +
    '<form id="form-maint" class="stack" style="gap:14px"><div class="form-grid"><label class="field"><span>From</span><input type="date" id="mt-start" value="' + TODAY + '"></label><label class="field"><span>Until</span><input type="date" id="mt-end" value="' + addDays(TODAY, 2) + '"></label></div>' +
    '<label class="field"><span>Reason</span><input type="text" id="mt-note" placeholder="e.g. Clutch repair"></label><div class="note err" id="mt-err" hidden></div>' +
    '<div class="actions"><button class="btn" type="submit">Start maintenance</button><button class="btn ghost" type="button" data-action="closeModal">Cancel</button></div></form>');
}
function submitMaint(){
  const u = unitByCode(modalState.code), s = $("#mt-start").value, e = $("#mt-end").value, note = $("#mt-note").value.trim();
  if (!s || !e || e < s){ $("#mt-err").textContent = "The end date must be on or after the start date."; $("#mt-err").hidden = false; return; }
  if (unitBusy(u.code, s, e)){ $("#mt-err").textContent = "These dates overlap a booking or block on " + u.code + ". Reassign the booking first or pick other dates."; $("#mt-err").hidden = false; return; }
  blocks.push({id:"b" + (blockSeq++), unit:u.code, start:s, end:e, kind:"maint", note:note});
  if (s <= TODAY){ u.status = "maint"; u.maintUntil = e; }
  u.history.unshift({at:s, text:"Maintenance until " + niceDate(e) + (note ? ": " + note : "")});
  closeModal(); render(); toast(u.code + " is in maintenance");
}
function relist(code){
  const u = unitByCode(code);
  u.status = "listed";
  for (let i = blocks.length - 1; i >= 0; i--){
    const k = blocks[i];
    if (k.unit === code && k.kind === "maint" && k.end >= TODAY){
      if (k.start >= TODAY) blocks.splice(i, 1); else k.end = addDays(TODAY, -1);
    }
  }
  u.history.unshift({at:TODAY, text:"Relisted after maintenance" + (u.maintUntil && u.maintUntil > TODAY ? " (early, planned until " + niceDate(u.maintUntil) + ")" : "")});
  u.maintUntil = null;
  render(); toast(code + " is back on the website");
}

/* ---- reassign ---- */
function renderReassignOption(u){ return '<label class="option"><span><input type="radio" name="ra-unit" value="' + u.code + '"> <span class="mono">' + u.code + "</span> · " + esc(u.plate) + '</span><span class="muted num">' + u.mileage.toLocaleString("en-US") + " km</span></label>"; }
function openReassign(ref){
  const b = bookingByRef(ref);
  const free = [];
  for (const u of freeUnits(b.typeId, b.start, b.end, b.ref)) if (u.code !== b.unit) free.push(u);
  modalState = {kind:"reassign", ref:ref};
  openModal(modalHead(b.ref + " · now on " + b.unit, "Reassign unit") +
    '<form id="form-reassign" class="stack" style="gap:14px"><p>Free ' + esc(typeName(typeById(b.typeId))) + " units for " + shortDate(b.start) + " → " + shortDate(b.end) + ":</p>" +
    (free.length ? '<div class="options">' + each(free, renderReassignOption) + "</div>" : '<div class="note err">No other units of this type are free for these dates.</div>') +
    '<p class="hint">The client is not told about the change. They booked the car type, not a specific unit.</p>' +
    '<div class="actions"><button class="btn" type="submit" ' + (free.length ? "" : "disabled") + '>Move booking</button><button class="btn ghost" type="button" data-action="closeModal">Cancel</button></div></form>');
}
function submitReassign(){
  const picked = document.querySelector('input[name="ra-unit"]:checked');
  if (!picked){ toast("Choose a unit"); return; }
  const b = bookingByRef(modalState.ref), from = b.unit;
  b.unit = picked.value;
  b.log.push({at:stamp(), text:"Moved from " + from + " to " + b.unit});
  closeModal(); render(); toast(b.ref + " moved to " + b.unit);
}

/* ---- cancel / retire ---- */
function confirmCancel(ref){
  const b = bookingByRef(ref);
  modalState = {kind:"cancel", ref:ref};
  openModal(modalHead(b.ref, "Cancel this booking?") + "<p>" + b.unit + " is freed for " + shortDate(b.start) + " → " + shortDate(b.end) + "." + (b.payment ? " A payment of " + money(b.payment.amount) + " was received. Handle any refund under your cancellation policy." : " No payment has been approved.") + "</p>" +
    '<div class="actions"><button class="btn danger" type="button" data-action="doCancel">Yes, cancel booking</button><button class="btn ghost" type="button" data-action="closeModal">Keep it</button></div>');
}
function doCancel(){
  const b = bookingByRef(modalState.ref);
  b.status = "CANCELLED";
  b.log.push({at:stamp(), text:"Cancelled by admin"});
  closeModal(); render(); toast(b.ref + " cancelled");
}
function confirmRetire(code){
  const future = [];
  for (const b of bookings) if (b.unit === code && LIVE[b.status]) future.push(b.ref);
  modalState = {kind:"retire", code:code};
  openModal(modalHead(code, "Retire this unit?") +
    (future.length ? '<div class="note err">' + code + " still has live bookings: " + future.join(", ") + ". Reassign or cancel them first.</div>" : "<p>It is removed from the booking pool for good. Its past bookings and history are kept.</p>") +
    '<div class="actions"><button class="btn danger" type="button" data-action="doRetire" ' + (future.length ? "disabled" : "") + '>Retire unit</button><button class="btn ghost" type="button" data-action="closeModal">Cancel</button></div>');
}
function doRetire(){
  const u = unitByCode(modalState.code);
  u.status = "retired"; u.history.unshift({at:TODAY, text:"Retired"});
  closeModal(); render(); toast(u.code + " retired");
}
function unretire(code){ const u = unitByCode(code); u.status = "maint"; u.maintUntil = TODAY; u.history.unshift({at:TODAY, text:"Brought back into service. Waiting to be relisted"}); render(); toast(code + " is back. Relist it when ready"); }

/* ---- calendar blocks ---- */
function renderBlockUnitOption(u){ return '<option value="' + u.code + '"' + (modalState.code === u.code ? " selected" : "") + ">" + u.code + " · " + esc(typeName(typeById(u.typeId))) + "</option>"; }
function openBlockNew(code, day){
  modalState = {kind:"block", id:null, code:code || unitsOfType(state.cal.typeId)[0].code};
  openBlockForm({start:day || TODAY, end:day || TODAY, kind:"blackout", note:""}, "Block dates");
}
function openBlockEdit(id){
  let k = null;
  for (const x of blocks) if (x.id === id) k = x;
  modalState = {kind:"block", id:id, code:k.unit};
  openBlockForm(k, "Edit block");
}
function openBlockForm(k, title){
  const active = [];
  for (const u of units) if (u.status !== "retired") active.push(u);
  openModal(modalHead("Calendar", title) +
    '<form id="form-block" class="stack" style="gap:14px"><div class="form-grid"><label class="field"><span>Unit</span><select id="bl-unit">' + each(active, renderBlockUnitOption) + "</select></label>" +
    '<label class="field"><span>Type</span><select id="bl-kind"><option value="blackout"' + (k.kind === "blackout" ? " selected" : "") + '>Blocked (not for hire)</option><option value="maint"' + (k.kind === "maint" ? " selected" : "") + ">Maintenance</option></select></label>" +
    '<label class="field"><span>From</span><input type="date" id="bl-start" value="' + k.start + '"></label><label class="field"><span>Until</span><input type="date" id="bl-end" value="' + k.end + '"></label></div>' +
    '<label class="field"><span>Note</span><input type="text" id="bl-note" value="' + esc(k.note) + '" placeholder="e.g. Insurance inspection"></label><div class="note err" id="bl-err" hidden></div>' +
    '<div class="actions"><button class="btn" type="submit">Save block</button>' + (modalState.id ? '<button class="btn danger" type="button" data-action="deleteBlock">Remove block</button>' : "") + '<button class="btn ghost" type="button" data-action="closeModal">Cancel</button></div></form>');
}
function submitBlock(){
  const code = $("#bl-unit").value, s = $("#bl-start").value, e = $("#bl-end").value, kind = $("#bl-kind").value, note = $("#bl-note").value.trim();
  const err = $("#bl-err");
  if (!s || !e || e < s){ err.textContent = "The end date must be on or after the start date."; err.hidden = false; return; }
  let clash = false;
  for (const b of bookings) if (b.unit === code && LIVE[b.status] && overlaps(s, e, b.start, b.end)) clash = b.ref;
  for (const k of blocks) if (k.unit === code && k.id !== modalState.id && overlaps(s, e, k.start, k.end)) clash = clash || "another block";
  if (clash){ err.textContent = "These dates overlap " + clash + " on " + code + ". Reassign the booking or pick other dates."; err.hidden = false; return; }
  if (modalState.id){
    for (const k of blocks) if (k.id === modalState.id){ k.unit = code; k.start = s; k.end = e; k.kind = kind; k.note = note; }
  } else {
    blocks.push({id:"b" + (blockSeq++), unit:code, start:s, end:e, kind:kind, note:note});
  }
  closeModal(); render(); toast(code + " blocked " + shortDate(s) + " → " + shortDate(e));
}
function deleteBlock(){
  for (let i = 0; i < blocks.length; i++) if (blocks[i].id === modalState.id){ blocks.splice(i, 1); break; }
  closeModal(); render(); toast("Block removed");
}

/* ---- new car type ---- */
function openNewType(){
  modalState = {kind:"newType"};
  openModal(modalHead("Fleet", "New car type") +
    '<form id="form-newtype" class="stack" style="gap:14px"><div class="form-grid"><label class="field"><span>Make and model</span><input type="text" id="nt-name" placeholder="e.g. Toyota Prado" required></label>' +
    '<label class="field"><span>Variant</span><input type="text" id="nt-variant" placeholder="e.g. TX 5-door"></label>' +
    '<label class="field"><span>Category</span><select id="nt-cat"><option>Pickup</option><option>Station wagon</option><option>Compact SUV</option><option>SUV</option><option>Van</option></select></label></div>' +
    '<p class="hint">It starts hidden from the website. Add pricing, pictures and units, then switch it on.</p>' +
    '<div class="actions"><button class="btn" type="submit">Create car type</button><button class="btn ghost" type="button" data-action="closeModal">Cancel</button></div></form>');
}
function submitNewType(){
  const name = $("#nt-name").value.trim();
  if (!name) return;
  const id = "t" + Date.now();
  const cat = $("#nt-cat").value;
  types.push(makeType({id:id, name:name, variant:$("#nt-variant").value.trim(), category:cat, shape:cat === "Pickup" ? "pickup" : cat === "Compact SUV" ? "compact" : "wagon",
    seats:5, trans:"Manual", fuel:"Diesel", engine:"", description:"", rates:{u:[150,140,130,120,115,110], e:[180,170,160,150,145,140]}, deposit:500, km:300, commit:{mode:"percent", pct:30}, listed:false, pictures:0, video:null}));
  closeModal();
  state.detail = {kind:"type", id:id}; state.editor.tab = "details"; state.mediaErrors = [];
  render(); toast(name + " created. Fill in the details");
}

/* ============ media handling ============ */
const PIC_TYPES = {"image/jpeg":true, "image/png":true, "image/webp":true};
function loadImageSize(url){
  return new Promise(function readImage(resolve, reject){
    const img = new Image();
    img.onload = function imageLoaded(){ resolve({w:img.naturalWidth, h:img.naturalHeight}); };
    img.onerror = function imageFailed(){ reject(new Error("unreadable")); };
    img.src = url;
  });
}
function loadVideoMeta(url){
  return new Promise(function readVideo(resolve, reject){
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = function videoLoaded(){ resolve({duration:v.duration, w:v.videoWidth, h:v.videoHeight}); };
    v.onerror = function videoFailed(){ reject(new Error("unplayable")); };
    v.src = url;
  });
}
async function checkPicture(file, slotsLeft){
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return {error:file.name + ": HEIC photos can't be shown in most browsers. Export it as JPG and upload again."};
  if (!PIC_TYPES[file.type]) return {error:file.name + ": only JPG, PNG or WebP pictures are allowed."};
  if (file.size > 10 * 1048576) return {error:file.name + " is " + mb(file.size) + ". The limit is 10 MB."};
  if (slotsLeft <= 0) return {error:file.name + ": a car type can have at most 10 pictures. Remove one first."};
  const url = URL.createObjectURL(file);
  let size;
  try { size = await loadImageSize(url); } catch (e){ URL.revokeObjectURL(url); return {error:file.name + ": this file could not be read as an image."}; }
  if (size.h > size.w){ URL.revokeObjectURL(url); return {error:file.name + " is portrait (" + size.w + "×" + size.h + "). Use landscape pictures."}; }
  if (size.w < 1600 || size.h < 1000){ URL.revokeObjectURL(url); return {error:file.name + " is " + size.w + "×" + size.h + " px. The minimum is 1600×1000 px."}; }
  return {pic:{id:"p" + (picSeq++), caption:"", name:file.name, type:file.type, w:size.w, h:size.h, size:file.size, url:url}};
}
async function addPictures(fileList){
  const t = typeById(state.editor.typeId);
  const errors = [];
  for (const file of fileList){
    const result = await checkPicture(file, 10 - t.media.pictures.length);
    if (result.error) errors.push(result.error);
    else {
      t.media.pictures.push(result.pic);
      if (!t.media.coverId) t.media.coverId = result.pic.id;
      if (!t.media.posterId) t.media.posterId = result.pic.id;
    }
  }
  state.mediaErrors = errors;
  render();
  if (!errors.length) toast("Pictures added");
}
async function addVideo(file){
  const t = typeById(state.editor.typeId);
  const errors = [];
  const lower = file.name.toLowerCase();
  if (file.type === "video/quicktime" || lower.endsWith(".mov")) errors.push(file.name + ": MOV files aren't allowed. Export the video as MP4 (H.264).");
  else if (file.type !== "video/mp4") errors.push(file.name + ": only MP4 (H.264) videos are allowed.");
  else if (file.size > 150 * 1048576) errors.push(file.name + " is " + mb(file.size) + ". The limit is 150 MB.");
  if (!errors.length){
    const url = URL.createObjectURL(file);
    try {
      const meta = await loadVideoMeta(url);
      const longEdge = Math.max(meta.w, meta.h), shortEdge = Math.min(meta.w, meta.h);
      if (!meta.w) errors.push(file.name + ": this browser can't play the video. It may be HEVC/H.265. Export it as MP4 with H.264.");
      else if (meta.duration > 60.5) errors.push("This video is " + Math.floor(meta.duration / 60) + " min " + Math.round(meta.duration % 60) + " s. The limit is 1 minute.");
      else if (shortEdge > 1080 || longEdge > 1920) errors.push("This video is " + meta.w + "×" + meta.h + ". The maximum is 1080p (1920×1080).");
      if (errors.length) URL.revokeObjectURL(url);
      else t.media.video = {name:file.name, duration:meta.duration, w:meta.w, h:meta.h, size:file.size, url:url};
    } catch (e){
      URL.revokeObjectURL(url);
      errors.push(file.name + ": this browser can't play the video. It may be HEVC/H.265. Export it as MP4 with H.264.");
    }
  }
  state.mediaErrors = errors;
  render();
  if (!errors.length) toast("Video uploaded");
}
function movePicture(from, to){
  const pics = typeById(state.editor.typeId).media.pictures;
  if (to < 0 || to >= pics.length || from === to) return;
  const item = pics.splice(from, 1)[0];
  pics.splice(to, 0, item);
  render();
}
function wireMediaDrop(){
  const zone = $("#drop-zone");
  if (zone){
    zone.addEventListener("dragover", handleZoneDragOver);
    zone.addEventListener("dragleave", handleZoneDragLeave);
    zone.addEventListener("drop", handleZoneDrop);
  }
  const grid = $("#pics");
  if (grid){
    grid.addEventListener("dragstart", handlePicDragStart);
    grid.addEventListener("dragover", handlePicDragOver);
    grid.addEventListener("dragleave", handlePicDragLeave);
    grid.addEventListener("drop", handlePicDrop);
    grid.addEventListener("dragend", handlePicDragEnd);
  }
}
function handleZoneDragOver(e){ if (state.dragFrom !== null) return; e.preventDefault(); e.currentTarget.classList.add("over"); }
function handleZoneDragLeave(e){ e.currentTarget.classList.remove("over"); }
function handleZoneDrop(e){ if (state.dragFrom !== null) return; e.preventDefault(); e.currentTarget.classList.remove("over"); if (e.dataTransfer.files.length) addPictures(e.dataTransfer.files); }
function handlePicDragStart(e){
  const tile = e.target.closest(".pic");
  if (!tile) return;
  state.dragFrom = Number(tile.dataset.index);
  tile.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  try { e.dataTransfer.setData("text/plain", tile.dataset.index); } catch (err){ /* ignore */ }
}
function handlePicDragOver(e){
  if (state.dragFrom === null) return;
  const tile = e.target.closest(".pic");
  if (!tile) return;
  e.preventDefault();
  tile.classList.add("target");
}
function handlePicDragLeave(e){ const tile = e.target.closest(".pic"); if (tile) tile.classList.remove("target"); }
function handlePicDrop(e){
  const tile = e.target.closest(".pic");
  if (!tile || state.dragFrom === null) return;
  e.preventDefault();
  const from = state.dragFrom;
  state.dragFrom = null;
  movePicture(from, Number(tile.dataset.index));
}
function handlePicDragEnd(){ state.dragFrom = null; const d = document.querySelector(".pic.dragging"); if (d) d.classList.remove("dragging"); }

/* ============ actions (click) ============ */
const ACTIONS = {
  go:function actionGo(el){ state.page = el.dataset.page; state.detail = null; try { history.replaceState(null, "", "#" + state.page); } catch (e){ /* ignore */ } render(); window.scrollTo(0, 0); },
  back:function actionBack(){ state.detail = null; state.mediaErrors = []; render(); },
  signOut:function actionSignOut(){ state.signedIn = false; try { sessionStorage.removeItem("kifaru-admin"); } catch (e){ /* ignore */ } render(); },
  setFilter:function actionFilter(el){ state.filter = el.dataset.filter; render(); },
  openBooking:function actionOpenBooking(el){ const b = bookingByRef(el.dataset.ref); if (b) b.fresh = false; state.detail = {kind:"booking", id:el.dataset.ref}; render(); window.scrollTo(0, 0); },
  openType:function actionOpenType(el){ state.detail = {kind:"type", id:el.dataset.id}; state.editor.tab = "details"; state.mediaErrors = []; render(); window.scrollTo(0, 0); },
  openUnit:function actionOpenUnit(el){ state.detail = {kind:"unit", id:el.dataset.code}; render(); window.scrollTo(0, 0); },
  setTab:function actionTab(el){ state.editor.tab = el.dataset.tab; state.mediaErrors = []; render(); },
  calPrev:function actionPrev(){ state.cal.month--; if (state.cal.month < 0){ state.cal.month = 11; state.cal.year--; } render(); },
  calNext:function actionNext(){ state.cal.month++; if (state.cal.month > 11){ state.cal.month = 0; state.cal.year++; } render(); },
  openNewBooking:openNewBooking,
  nbMode:function actionNbMode(el){
    modalState.mode = el.dataset.mode;
    const btns = document.querySelectorAll("[data-action=nbMode]");
    for (const b of btns) b.setAttribute("aria-pressed", String(b.dataset.mode === modalState.mode));
    renderNbParts();
  },
  openApprove:function actionApprove(el){ openApprove(el.dataset.ref); },
  openFeeEmail:function actionFee(el){ openFeeEmail(el.dataset.ref); },
  markPickedUp:function actionPickup(el){ markPickedUp(el.dataset.ref); },
  openReturn:function actionReturn(el){ openReturn(el.dataset.ref); },
  openReassign:function actionReassign(el){ openReassign(el.dataset.ref); },
  confirmCancel:function actionConfirmCancel(el){ confirmCancel(el.dataset.ref); },
  doCancel:doCancel,
  relist:function actionRelist(el){ relist(el.dataset.code); },
  openMaint:function actionMaint(el){ openMaint(el.dataset.code); },
  confirmRetire:function actionConfirmRetire(el){ confirmRetire(el.dataset.code); },
  doRetire:doRetire,
  unretire:function actionUnretire(el){ unretire(el.dataset.code); },
  openBlockNew:function actionBlockNew(el){ openBlockNew(el.dataset.code, el.dataset.day); },
  openBlockEdit:function actionBlockEdit(el){ openBlockEdit(el.dataset.id); },
  deleteBlock:deleteBlock,
  openNewType:openNewType,
  closeModal:closeModal,
  setCover:function actionCover(el){ typeById(state.editor.typeId).media.coverId = el.dataset.id; render(); toast("Cover picture changed"); },
  movePic:function actionMove(el){ const i = Number(el.dataset.index); movePicture(i, i + Number(el.dataset.dir)); },
  removePic:function actionRemovePic(el){
    const m = typeById(state.editor.typeId).media;
    for (let i = 0; i < m.pictures.length; i++) if (m.pictures[i].id === el.dataset.id){ if (m.pictures[i].url) URL.revokeObjectURL(m.pictures[i].url); m.pictures.splice(i, 1); break; }
    if (m.coverId === el.dataset.id) m.coverId = m.pictures.length ? m.pictures[0].id : null;
    if (m.posterId === el.dataset.id) m.posterId = m.pictures.length ? m.pictures[0].id : null;
    const t = typeById(state.editor.typeId);
    if (!m.pictures.length && t.listed){ t.listed = false; toast("Picture removed. Car type hidden: it has no pictures"); } else toast("Picture removed");
    render();
  },
  setReportTab:function actionReportTab(el){ state.reportTab = el.dataset.tab; render(); },
  openInspection:function actionOpenInspection(el){ state.detail = {kind:"inspection", id:el.dataset.id}; render(); window.scrollTo(0, 0); },
  backToReports:function actionBackReports(){ state.page = "reports"; state.reportTab = "inspections"; state.detail = null; render(); },
  newInspection:function actionNewInspection(el){ openNewInspection(el.dataset.code); },
  downloadInspection:function actionDownloadInspection(el){ downloadInspection(el.dataset.id); },
  markInspectionSent:function actionMarkSent(el){
    const r = inspectionById(el.dataset.id);
    collectInspection(r); keepRealTasks(r);
    r.status = "sent"; r.sentTo = settings.workshopEmail; r.sentAt = stamp();
    unitByCode(r.unit).history.unshift({at:TODAY, text:"Inspection " + r.id + " sent to " + settings.workshopEmail});
    render(); toast(r.id + " marked as sent to the workshop");
  },
  addTask:function actionAddTask(){
    const r = inspectionById(state.detail.id);
    collectInspection(r);
    r.tasks.push({text:"", priority:"Medium"});
    render();
    const box = $("#task-text-" + (r.tasks.length - 1)); if (box) box.focus();
  },
  removeTask:function actionRemoveTask(el){
    const r = inspectionById(state.detail.id);
    collectInspection(r);
    r.tasks.splice(Number(el.dataset.index), 1);
    render();
  },
  copyField:function actionCopy(el){
    if (state.detail && state.detail.kind === "inspection"){ const r = inspectionById(state.detail.id); collectInspection(r); keepRealTasks(r); render(); }
    copyField(el.dataset.target);
  },
  setRange:function actionRange(el){ state.upcoming.from = TODAY; state.upcoming.to = addDays(TODAY, Number(el.dataset.days)); render(); },
  downloadUpcoming:downloadUpcoming,
  openWhatsApp:function actionWhatsApp(el){ openWhatsApp(el.dataset.ref); },
  removeVideo:function actionRemoveVideo(){ const m = typeById(state.editor.typeId).media; if (m.video && m.video.url) URL.revokeObjectURL(m.video.url); m.video = null; render(); toast("Video removed"); }
};
function handleClick(e){
  const el = e.target.closest("[data-action]");
  if (!el) return;
  if (el.tagName === "INPUT" && el.type !== "radio") return;
  const fn = ACTIONS[el.dataset.action];
  if (!fn) return;
  if (el.tagName === "BUTTON" || el.tagName === "TR" || el.tagName === "TD") e.preventDefault();
  e.stopPropagation();
  fn(el, e);
}
function handleOverlayClick(e){ if (e.target === $("#overlay")) closeModal(); }
function handleKey(e){ if (e.key === "Escape" && !$("#overlay").hidden) closeModal(); }

/* ============ forms (submit) ============ */
const FORMS = {
  "signin-form":function submitSignIn(){
    state.signedIn = true; state.email = $("#si-email").value.trim() || "admin@example.com";
    try { sessionStorage.setItem("kifaru-admin", state.email); } catch (e){ /* ignore */ }
    render();
  },
  "form-newbooking":submitNewBooking, "form-approve":submitApprove, "form-fee":submitFee, "form-return":submitReturn,
  "form-maint":submitMaint, "form-reassign":submitReassign, "form-block":submitBlock, "form-newtype":submitNewType,
  "form-details":function submitDetails(){
    const t = typeById(state.editor.typeId);
    t.name = $("#d-name").value.trim() || t.name; t.variant = $("#d-variant").value.trim(); t.category = $("#d-category").value;
    t.seats = Number($("#d-seats").value) || t.seats; t.trans = $("#d-trans").value; t.fuel = $("#d-fuel").value; t.engine = $("#d-engine").value.trim(); t.description = $("#d-desc").value.trim();
    render(); toast("Details saved");
  },
  "form-pricing":function submitPricing(){
    const t = typeById(state.editor.typeId);
    for (let i = 0; i < TIERS.length; i++){ t.rates.u[i] = Number($("#r-u-" + i).value) || t.rates.u[i]; t.rates.e[i] = Number($("#r-e-" + i).value) || t.rates.e[i]; }
    const mode = document.querySelector('input[name="c-mode"]:checked').value;
    t.commit = {mode:mode, pct:mode === "full" ? 100 : Math.min(100, Math.max(1, Number($("#c-pct").value) || 30))};
    t.deposit = Number($("#p-deposit").value) || 0; t.km = Number($("#p-km").value) || 0; t.minDays = Number($("#p-min").value) || 1;
    render(); toast("Pricing saved. New bookings use it");
  },
  "form-unit":function submitUnit(){
    const t = typeById(state.editor.typeId);
    const code = $("#u-code").value.trim().toUpperCase(), plate = $("#u-plate").value.trim().toUpperCase();
    if (!code || !plate) return;
    if (unitByCode(code)){ toast("Unit code " + code + " is already used"); return; }
    const u = makeUnit(code, t.id, plate, "listed", Number($("#u-km").value) || 0);
    u.history.push({at:TODAY, text:"Added to the fleet"});
    units.push(u);
    render(); toast(code + " added and listed");
  },
  "form-inspection":function submitInspection(){
    const r = inspectionById(state.detail.id);
    collectInspection(r); keepRealTasks(r);
    render(); toast(r.id + " saved");
  },
  "form-pickunit":function submitPickUnit(){ openNewInspection($("#pu-unit").value); },
  "form-notes":function submitNotes(){ unitByCode(state.detail.id).notes = $("#unit-notes").value; toast("Notes saved"); },
  "form-settings":function submitSettings(){
    settings.paybill = $("#s-paybill").value.trim(); settings.bank = $("#s-bank").value.trim(); settings.autoEmail = $("#s-auto").checked;
    settings.deadlineHours = Number($("#s-hours").value) || 48; settings.template = $("#s-template").value;
    settings.workshopEmail = $("#s-workshop").value.trim() || settings.workshopEmail;
    settings.waNumber = $("#s-wa").value.trim();
    for (const tpl of settings.waTemplates){ const box = $("#wa-tpl-" + tpl.id); if (box) tpl.text = box.value; }
    render(); toast("Settings saved");
  }
};
function handleSubmit(e){
  const fn = FORMS[e.target.id];
  if (!fn) return;
  e.preventDefault();
  fn(e);
}

/* ============ inputs (change / input) ============ */
function handleInput(e){
  const el = e.target, id = el.id;
  if (id === "bk-search"){
    state.search = el.value;
    const pos = el.selectionStart;
    render();
    const again = $("#bk-search"); again.focus(); try { again.setSelectionRange(pos, pos); } catch (err){ /* ignore */ }
    return;
  }
  if (el.dataset && el.dataset.caption){
    const m = typeById(state.editor.typeId).media;
    for (const p of m.pictures) if (p.id === el.dataset.caption) p.caption = el.value.slice(0, 40);
    return;
  }
  if (id === "fe-amount"){ updateFeePreview(); return; }
  if (id === "wa-text"){ updateWaLink(); return; }
  if (id === "rt-days" || id === "rt-date"){ updateReturnUntil(); return; }
  if (id === "s-template" || id === "s-paybill" || id === "s-bank" || id === "s-hours"){
    const draft = Object.assign({}, settings, {template:$("#s-template").value, paybill:$("#s-paybill").value, bank:$("#s-bank").value, deadlineHours:Number($("#s-hours").value) || 48});
    const saved = Object.assign({}, settings);
    Object.assign(settings, draft);
    $("#s-preview").textContent = fillTemplate(draft.template, bookings[0]);
    Object.assign(settings, saved);
    return;
  }
  if (id === "c-pct"){ updateCommitExample(); return; }
  if (modalState && modalState.kind === "newBooking"){
    if (id === "nb-start"){ modalState.start = el.value; renderNbParts(); }
    if (id === "nb-end"){ modalState.end = el.value; renderNbParts(); }
  }
}
function updateCommitExample(){
  const t = typeById(state.editor.typeId);
  const mode = document.querySelector('input[name="c-mode"]:checked').value;
  const draft = Object.assign({}, t, {commit:{mode:mode, pct:Number($("#c-pct").value) || 0}});
  $("#c-pct-wrap").hidden = mode === "full";
  $("#c-example").textContent = commitExample(draft);
}
function handleChange(e){
  const el = e.target, id = el.id;
  if (id === "cal-type"){ state.cal.typeId = el.value; render(); return; }
  if (id === "up-from" || id === "up-to"){
    if (el.value){ state.upcoming[id === "up-from" ? "from" : "to"] = el.value; }
    if (state.upcoming.to < state.upcoming.from) state.upcoming.to = state.upcoming.from;
    render(); return;
  }
  if (id === "up-type"){ state.upcoming.typeId = el.value; render(); return; }
  if (id === "up-committed"){ state.upcoming.committed = el.checked; render(); return; }
  if (el.name === "wa-choice"){ pickWaTemplate(el.value); return; }
  if (el.name && el.name.indexOf("it-") === 0){ const row = el.closest("tr"); if (row) row.classList.toggle("attn", el.value === "attention"); return; }
  if (id === "type-listed"){
    const t = typeById(state.editor.typeId);
    if (el.checked && (!t.media.pictures.length || !t.media.coverId)){
      el.checked = false; state.editor.tab = "media"; state.mediaErrors = ["Add at least one picture and choose a cover before showing this car type on the website."]; render(); return;
    }
    if (el.checked && !unitsOfType(t.id).length){ el.checked = false; toast("Add at least one unit first"); return; }
    t.listed = el.checked; toast(t.listed ? typeName(t) + " is on the website" : typeName(t) + " is hidden"); return;
  }
  if (id === "pic-input"){ if (el.files.length) addPictures(el.files); return; }
  if (id === "video-input"){ if (el.files.length) addVideo(el.files[0]); return; }
  if (id === "poster"){ typeById(state.editor.typeId).media.posterId = el.value; toast("Poster image changed"); return; }
  if (el.name === "c-mode"){ updateCommitExample(); return; }
  if (modalState && modalState.kind === "newBooking"){
    if (id === "nb-type"){ modalState.typeId = el.value; renderNbParts(); }
    if (id === "nb-hire"){ modalState.hire = el.value; renderNbParts(); }
    if (id === "nb-unit"){ modalState.unit = el.value; }
    if (el.name === "nb-typechoice"){ modalState.typeId = el.value; modalState.unit = ""; renderNbParts(); }
  }
}

/* ============ bookings from the Client Booking site (same browser) ============ */
const CLIENT_STORE = "kifaru-demo-client-bookings";
function readClientRequests(){
  try {
    const raw = localStorage.getItem(CLIENT_STORE);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e){ return []; }
}
function syncExisting(b, req){
  if (req.code && b.status === "COMMITTED" && !b.payRef){
    b.payRef = String(req.code).toUpperCase();
    b.log.push({at:stamp(), text:"Client entered payment reference " + b.payRef});
    return true;
  }
  if (req.status === "CANCEL_REQUESTED" && (b.status === "COMMITTED" || b.status === "BOOKED")){
    b.status = "CANCELLED";
    b.log.push({at:stamp(), text:"Cancelled by the client on the website"});
    return true;
  }
  return false;
}
function importOne(req){
  const t = typeById(req.carId);
  if (!t || !req.start || !req.end) return false;
  const free = freeUnits(t.id, req.start, req.end);
  const unit = free.length ? free[0].code : unitsOfType(t.id)[0].code;
  const where = req.method === "delivery" ? "Delivery to " + (req.address || "address not given") : "Collect from " + (req.location || "office");
  const log = [{at:stamp(), text:"Booking requested on the Client Booking site. " + where + (req.guide ? ". Driver-guide requested" : "")}];
  if (!free.length) log.push({at:stamp(), text:"No free " + typeName(t) + " unit for these dates. Held on " + unit + ": reassign it"});
  const b = makeBooking({ref:req.ref, typeId:t.id, unit:unit, start:req.start, end:req.end, pt:req.pt, rt:req.rt, hire:req.hire === "e" ? "e" : "u",
    status:"COMMITTED", name:req.name || "", email:req.email, phone:req.phone || "", feeEmailSent:settings.autoEmail, createdBy:"Customer website",
    deadline:addDays(TODAY, Math.ceil(settings.deadlineHours / 24)), log:log});
  if (req.total > b.total){
    b.total = req.total;
    b.commitFee = t.commit.mode === "full" ? b.total : Math.round(b.total * t.commit.pct / 100);
  }
  if (settings.autoEmail) b.log.push({at:stamp(), text:"Commitment fee email sent automatically (" + money(b.commitFee) + ")"});
  b.fresh = true;
  syncExisting(b, req);
  bookings.unshift(b);
  return true;
}
function importClientRequests(){
  let changed = 0;
  for (const req of readClientRequests()){
    if (!req || !req.ref) continue;
    const existing = bookingByRef(req.ref);
    if (existing){ if (syncExisting(existing, req)) changed++; }
    else if (importOne(req)) changed++;
  }
  return changed;
}
function handleStorage(e){
  if (e.key !== CLIENT_STORE) return;
  const changed = importClientRequests();
  if (changed && state.signedIn){ render(); toast("New activity from the Client Booking site"); }
}

/* ============ toast ============ */
let toastTimer = null;
function hideToast(){ $("#toast").hidden = true; }
function toast(text){ const el = $("#toast"); el.textContent = text; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 2800); }

/* ============ boot ============ */
document.addEventListener("click", handleClick);
document.addEventListener("submit", handleSubmit);
document.addEventListener("input", handleInput);
document.addEventListener("change", handleChange);
document.addEventListener("keydown", handleKey);
$("#overlay").addEventListener("click", handleOverlayClick);
try {
  const saved = sessionStorage.getItem("kifaru-admin");
  if (saved){ state.signedIn = true; state.email = saved; }
} catch (e){ /* ignore */ }
importClientRequests();
window.addEventListener("storage", handleStorage);
const startPage = location.hash.replace("#", "");
for (const item of MENU) if (item[0] === startPage) state.page = startPage;
render();
})();
