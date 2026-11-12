/* Scene drawings for Client Booking v2.
   Ten drawings per car, one for each gallery slide, so the picture changes
   with the detail underneath it. A drawing shows until the real photo loads,
   and stays if there is no photo. Colours come from the theme tokens, so the
   drawings follow the palette and the light or dark setting. */
(function sceneLibrary(){
"use strict";

const W = 320, H = 200;
const DIMS = {
  pickup:{bodyW:200, roofW:104, roofH:30},
  wagon:{bodyW:196, roofW:150, roofH:36},
  compact:{bodyW:168, roofW:126, roofH:38}
};
const SIDE = {
  pickup:"M18 82V58l40-6 18-26h50l12 26h86v30M80 30l-14 22h56l-8-22zM138 52v30M73 86h102M18 82h25M205 82h19",
  wagon:"M14 82V52l20-6 16-24h168l6 24v36M58 26l-12 20h70V26zM124 26v20h46V26zM178 26v20h40l-4-20zM73 86h102M14 82h29M205 82h19",
  compact:"M34 82V46l18-6 12-22h112l10 24v40M68 22l-10 18h52V22zM118 22v18h52l-8-18zM83 86h68M34 82h19M181 82h5"
};
const SIDE_WHEELS = {
  pickup:[[58,86],[190,86]],
  wagon:[[58,86],[190,86]],
  compact:[[68,86],[166,86]]
};

function svg(inner){
  return '<svg class="ph-draw" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" fill="none" ' +
    'stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
}
function dims(car){ return DIMS[car.shape] || DIMS.wagon; }
function text(x, y, s, size, anchor){
  return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" font-family="Helvetica,Arial,sans-serif" font-weight="700" ' +
    'text-anchor="' + (anchor || "middle") + '" fill="currentColor" stroke="none">' + s + "</text>";
}
function accentFill(opacity){ return 'fill="var(--accent)" fill-opacity="' + opacity + '" stroke="none"'; }
/* The car seen from the side, scaled and moved into place. */
function sideCar(car, x, y, scale){
  const path = SIDE[car.shape] || SIDE.wagon, wheels = SIDE_WHEELS[car.shape] || SIDE_WHEELS.wagon;
  let circles = "";
  for (const w of wheels) circles += '<circle cx="' + w[0] + '" cy="' + w[1] + '" r="15"/>';
  return '<g transform="translate(' + x + " " + y + ") scale(" + scale + ')" stroke-width="' + (3 / scale).toFixed(2) + '"><path d="' + path + '"/>' + circles + "</g>";
}
function ground(y){ return '<path d="M20 ' + y + "h" + (W - 40) + '" stroke-width="2.5" opacity=".45"/>'; }

/* 1 · the car from the front, used with the price slide */
function sceneFront(car){
  const d = dims(car), bw = d.bodyW, bx = (W - bw) / 2, by = 94, bh = 54;
  const rw = bw - 58, rx = (W - rw) / 2, ry = by - d.roofH - 4;
  const lamp = 34, ly = by + 12;
  return svg(
    '<path d="M' + (bx + 20) + " " + by + "L" + rx + " " + ry + "h" + rw + "L" + (bx + bw - 20) + " " + by + '"/>' +
    '<path d="M' + (rx + 12) + " " + (ry + 9) + "h" + (rw - 24) + '" stroke-width="2" opacity=".45"/>' +
    '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="10"/>' +
    '<rect x="' + (bx + 12) + '" y="' + ly + '" width="' + lamp + '" height="18" rx="5" ' + accentFill(".85") + "/>" +
    '<rect x="' + (bx + bw - 12 - lamp) + '" y="' + ly + '" width="' + lamp + '" height="18" rx="5" ' + accentFill(".85") + "/>" +
    '<path d="M' + (W / 2 - 27) + " " + (ly + 2) + "h54M" + (W / 2 - 27) + " " + (ly + 13) + 'h54" stroke-width="2.5"/>' +
    '<rect x="' + (bx - 8) + '" y="' + (by + bh - 8) + '" width="' + (bw + 16) + '" height="14" rx="5"/>' +
    '<circle cx="' + (bx + 28) + '" cy="' + (by + bh + 16) + '" r="15"/>' +
    '<circle cx="' + (bx + bw - 28) + '" cy="' + (by + bh + 16) + '" r="15"/>'
  );
}
/* 2 · a full fuel gauge and a jerrycan, for what the car comes with */
function sceneFuel(){
  const cx = 116, cy = 140, r = 62;
  let ticks = "";
  for (let i = 0; i <= 4; i++){
    const a = Math.PI - (i * Math.PI) / 4;
    const x1 = cx + Math.cos(a) * r, y1 = cy - Math.sin(a) * r;
    const x2 = cx + Math.cos(a) * (r - 12), y2 = cy - Math.sin(a) * (r - 12);
    ticks += '<path d="M' + x1.toFixed(1) + " " + y1.toFixed(1) + "L" + x2.toFixed(1) + " " + y2.toFixed(1) + '" stroke-width="2.5"/>';
  }
  return svg(
    '<path d="M' + (cx - r) + " " + cy + "A" + r + " " + r + " 0 0 1 " + (cx + r) + " " + cy + '"/>' + ticks +
    '<path d="M' + cx + " " + cy + "L" + (cx + 46) + " " + (cy - 38) + '" stroke="var(--accent)" stroke-width="5"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="var(--accent)" stroke="none"/>' +
    text(cx - r + 2, cy + 22, "E", 17) + text(cx + r - 2, cy + 22, "F", 17) +
    '<rect x="222" y="96" width="62" height="74" rx="7"/>' +
    '<path d="M234 96v-9h22v9" stroke-width="2.5"/>' +
    '<rect x="262" y="86" width="16" height="10" rx="3" ' + accentFill(".8") + "/>" +
    '<path d="M234 112l38 42M272 112l-38 42" stroke-width="2.5" opacity=".55"/>' +
    ground(182)
  );
}
/* 3 · seats and the gear lever */
function sceneSeats(){
  function seat(x){
    return '<rect x="' + (x + 8) + '" y="48" width="30" height="18" rx="8"/>' +
      '<rect x="' + x + '" y="66" width="46" height="72" rx="12"/>' +
      '<rect x="' + (x - 8) + '" y="134" width="62" height="22" rx="9"/>' +
      '<path d="M' + (x + 14) + ' 82v44" stroke-width="2" opacity=".45"/>';
  }
  return svg(
    seat(44) + seat(118) +
    '<path d="M238 160V104" stroke-width="6"/>' +
    '<circle cx="238" cy="92" r="15" ' + accentFill(".85") + "/>" +
    '<circle cx="238" cy="92" r="15"/>' +
    '<path d="M214 160h48l-8-14h-32z"/>' +
    '<path d="M220 66h36M220 66v22M256 66v22M220 88h36" stroke-width="2.5" opacity=".5"/>' +
    ground(172)
  );
}
/* 4 · the engine bay */
function sceneEngine(){
  return svg(
    '<path d="M30 78L132 40" stroke-width="4"/>' +
    '<path d="M86 60l18 26" stroke-width="2.5" opacity=".6"/>' +
    '<rect x="92" y="96" width="92" height="58" rx="8"/>' +
    '<rect x="104" y="80" width="18" height="16" rx="4"/>' +
    '<rect x="128" y="80" width="18" height="16" rx="4"/>' +
    '<rect x="152" y="80" width="18" height="16" rx="4"/>' +
    '<path d="M104 118h68" stroke-width="2.5" opacity=".5"/>' +
    '<circle cx="222" cy="124" r="22"/><circle cx="222" cy="124" r="8"/>' +
    '<circle cx="262" cy="94" r="13"/>' +
    '<path d="M213 103l40-1" stroke-width="2.5"/>' +
    '<rect x="34" y="112" width="48" height="42" rx="6" ' + accentFill(".18") + "/>" +
    '<rect x="34" y="112" width="48" height="42" rx="6"/>' +
    '<path d="M44 112v-8h8v8M64 112v-8h8v8" stroke-width="2.5"/>' +
    ground(166)
  );
}
/* 5 · the car on an open road, for the long-hire slide */
function sceneRoad(car){
  return svg(
    '<circle cx="258" cy="48" r="22" stroke="var(--accent)" stroke-width="4"/>' +
    '<path d="M24 98h272" stroke-width="2.5" opacity=".5"/>' +
    '<path d="M116 200L146 98h28l30 102" stroke-width="2.5" opacity=".55"/>' +
    '<path d="M158 112v10M156 136v14M152 166v20" stroke-width="3" opacity=".4"/>' +
    '<path d="M30 98c0-14 10-22 22-22s22 8 22 22" stroke-width="2.5" opacity=".6"/>' +
    '<path d="M52 98v-16" stroke-width="2.5" opacity=".6"/>' +
    '<path d="M274 98c0-11 8-17 17-17" stroke-width="2.5" opacity=".45"/>' +
    sideCar(car, 74, 104, 0.62) +
    ground(182)
  );
}
/* 6 · a roof tent and a camp, for the camping kit slide */
function sceneCamp(car){
  return svg(
    '<rect x="56" y="76" width="92" height="30" rx="6" ' + accentFill(".18") + "/>" +
    '<rect x="56" y="76" width="92" height="30" rx="6"/>' +
    '<path d="M148 82l34 22h-34" stroke-width="2.5"/>' +
    '<path d="M182 104v18" stroke-width="2.5"/>' +
    sideCar(car, 22, 100, 0.62) +
    '<path d="M214 170v-26l20-12v26M214 144h34M248 132v38" stroke-width="2.5"/>' +
    '<path d="M258 170l20-18 20 18" stroke-width="2.5"/>' +
    '<path d="M278 152c-8-10 0-16 0-22 6 8 14 10 10 22" stroke="var(--accent)" stroke-width="3"/>' +
    ground(172)
  );
}
/* 7 · the back of the car, for the deposit slide */
function sceneRear(car){
  const spare = car.shape === "wagon" ?
    '<circle cx="160" cy="138" r="27"/><circle cx="160" cy="138" r="12"/>' :
    '<rect x="78" y="124" width="164" height="34" rx="6" stroke-width="2.5" opacity=".6"/><path d="M142 150h36" stroke-width="3"/>';
  return svg(
    '<rect x="62" y="80" width="196" height="80" rx="10"/>' +
    '<rect x="84" y="90" width="152" height="30" rx="6" stroke-width="2.5" opacity=".6"/>' +
    '<rect x="66" y="126" width="20" height="30" rx="4" ' + accentFill(".85") + "/>" +
    '<rect x="234" y="126" width="20" height="30" rx="4" ' + accentFill(".85") + "/>" +
    spare +
    '<rect x="54" y="160" width="212" height="14" rx="5"/>' +
    '<circle cx="96" cy="182" r="13"/><circle cx="224" cy="182" r="13"/>'
  );
}
/* 8 · a map pin, for pick-up and delivery */
function sceneMap(car){
  return svg(
    '<rect x="26" y="30" width="268" height="140" rx="10" stroke-width="2.5" opacity=".55"/>' +
    '<path d="M26 112h268M96 30v140M216 30v140" stroke-width="2" opacity=".3"/>' +
    '<path d="M160 44a26 26 0 0 1 26 26c0 19-26 48-26 48s-26-29-26-48a26 26 0 0 1 26-26z" stroke="var(--accent)" stroke-width="4"/>' +
    '<circle cx="160" cy="70" r="9" fill="var(--accent)" stroke="none"/>' +
    '<path d="M44 150v-28h38v28" stroke-width="2.5"/>' +
    '<path d="M38 122l25-16 25 16" stroke-width="2.5"/>' +
    sideCar(car, 214, 122, 0.3) +
    ground(178)
  );
}
/* 9 · a licence and a steering wheel, for who can drive */
function sceneLicence(){
  return svg(
    '<rect x="24" y="58" width="152" height="98" rx="9"/>' +
    '<rect x="38" y="74" width="44" height="54" rx="5" stroke-width="2.5"/>' +
    '<circle cx="60" cy="92" r="9" stroke-width="2.5"/>' +
    '<path d="M46 122c4-9 24-9 28 0" stroke-width="2.5"/>' +
    '<path d="M96 82h66M96 100h66M96 118h40" stroke-width="2.5" opacity=".6"/>' +
    '<rect x="38" y="138" width="124" height="8" rx="4" ' + accentFill(".4") + "/>" +
    '<circle cx="246" cy="108" r="48"/><circle cx="246" cy="108" r="15"/>' +
    '<path d="M246 60v33M205 132l28-16M287 132l-28-16" stroke-width="4"/>'
  );
}
/* 10 · an odometer and a clock, for the last slide */
function sceneOdo(){
  let cells = "";
  for (let i = 0; i < 6; i++) cells += '<rect x="' + (74 + i * 20) + '" y="142" width="16" height="22" rx="3" stroke-width="2.5" opacity=".7"/>';
  let ticks = "";
  for (let i = 0; i <= 6; i++){
    const a = Math.PI * 1.15 - (i * Math.PI * 1.3) / 6;
    const x1 = 116 + Math.cos(a) * 54, y1 = 104 - Math.sin(a) * 54;
    const x2 = 116 + Math.cos(a) * 44, y2 = 104 - Math.sin(a) * 44;
    ticks += '<path d="M' + x1.toFixed(1) + " " + y1.toFixed(1) + "L" + x2.toFixed(1) + " " + y2.toFixed(1) + '" stroke-width="2.5"/>';
  }
  return svg(
    '<circle cx="116" cy="104" r="62"/>' + ticks +
    '<path d="M116 104L82 74" stroke="var(--accent)" stroke-width="5"/>' +
    '<circle cx="116" cy="104" r="7" fill="var(--accent)" stroke="none"/>' + cells +
    '<circle cx="252" cy="70" r="30"/>' +
    '<path d="M252 50v20l14 9" stroke-width="3"/>' +
    '<path d="M222 140h60M222 160h44" stroke-width="2.5" opacity=".45"/>'
  );
}

const SCENES = [sceneFront, sceneFuel, sceneSeats, sceneEngine, sceneRoad, sceneCamp, sceneRear, sceneMap, sceneLicence, sceneOdo];

function sceneSvg(car, i){
  const draw = SCENES[((i % SCENES.length) + SCENES.length) % SCENES.length];
  return draw(car);
}
window.KIFARU_SCENE = sceneSvg;
})();
