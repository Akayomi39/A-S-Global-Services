/* ════════════════════════════════════════
   A&S Global Services – main.js
   ════════════════════════════════════════ */

// ── KONFIGURATION ──────────────────────
const WA_PHONE = '491734577817';          // <-- echte WhatsApp-Nummer ohne +
const TO_EMAIL = 'asglobal.hausservice@gmail.com';
const EJS_KEY  = 'DEIN_PUBLIC_KEY';       // emailjs.com
const EJS_SVC  = 'DEIN_SERVICE_ID';
const EJS_TPL  = 'DEIN_TEMPLATE_ID';
const AUFWAND  = 160;                      // Aufwandspauschale (unsichtbar eingerechnet)

try { emailjs.init({ publicKey: EJS_KEY }); } catch(e) {}

// ══════════════════════════════════════════
// HELPER: WhatsApp SVG
// ══════════════════════════════════════════
const WA_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

// ══════════════════════════════════════════
// TILT HERO CARD
// ══════════════════════════════════════════
function tilt(e, el) {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg)`;
}

// ══════════════════════════════════════════
// WIZARD STATE
// ══════════════════════════════════════════
let wizStep = 1;
const WIZ_TOTAL = 4;
const WIZ_STEPS = [
    { id:1, label:'Leistungen' },
    { id:2, label:'Details'    },
    { id:3, label:'Objekt'     },
    { id:4, label:'Kontakt'    },
];

const selSvc   = new Set();
const chkRenov = new Set();
const r = {};   // radio selections
const n = {     // number inputs
    'pflaster-m2': 0,
    'cleaning-m2': 0, 'cleaning-h': 1,
    'entruemp-m2': 0, 'hh-m2': 0,
    'moebel-anzahl': 1,
};

function rSet(key, val) { r[key] = val; }
function rGet(key, def) { return r[key] != null ? r[key] : def; }

// ── POPUP TOAST ─────────────────────────
function showToast(msg) {
    let toast = document.getElementById('wiz-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'wiz-toast';
        toast.style.cssText = `
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.92);
      background:#1a0a0a;border:1.5px solid #ef4444;border-radius:10px;
      padding:1.6rem 2rem;max-width:340px;width:90%;z-index:9999;
      font-family:'DM Sans',sans-serif;text-align:center;
      box-shadow:0 20px 60px rgba(0,0,0,.7);
      opacity:0;transition:opacity .22s ease,transform .22s ease;pointer-events:none;
    `;
        document.body.appendChild(toast);
    }
    toast.innerHTML = `
    <div style="font-size:1.6rem;margin-bottom:.6rem">⚠️</div>
    <div style="color:#fff;font-size:.95rem;font-weight:500;margin-bottom:.4rem">Hinweis</div>
    <div style="color:#fca5a5;font-size:.83rem;line-height:1.6">${msg}</div>
    <button onclick="document.getElementById('wiz-toast').style.opacity='0';document.getElementById('wiz-toast').style.pointerEvents='none'"
      style="margin-top:1rem;background:#ef4444;color:#fff;border:none;border-radius:4px;padding:.45rem 1.2rem;font-family:'DM Sans',sans-serif;font-size:.8rem;cursor:pointer">
      OK, verstanden
    </button>`;
    // backdrop
    let bd = document.getElementById('wiz-toast-bd');
    if (!bd) {
        bd = document.createElement('div');
        bd.id = 'wiz-toast-bd';
        bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9998;opacity:0;transition:opacity .22s';
        bd.onclick = () => { toast.style.opacity='0'; toast.style.pointerEvents='none'; bd.style.opacity='0'; bd.style.pointerEvents='none'; };
        document.body.appendChild(bd);
    }
    bd.style.pointerEvents = 'auto'; bd.style.opacity = '1';
    toast.style.pointerEvents = 'auto';
    requestAnimationFrame(() => { toast.style.opacity='1'; toast.style.transform='translate(-50%,-50%) scale(1)'; });
    // auto close after 5s
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity='0'; toast.style.pointerEvents='none'; bd.style.opacity='0'; bd.style.pointerEvents='none'; }, 5000);
}

// ── PRICE CALCULATION ─────────────────────
function midOf(lo, hi) { return Math.round((lo + hi) / 2); }
function fmt(v) { return v.toLocaleString('de-DE'); }

function calcPrice() {
    let total = 0;
    const lines = []; // for the WhatsApp/Email message

    // ── PFLASTER
    if (selSvc.has('pflaster') && rGet('pfl-grad')) {
        const m2 = n['pflaster-m2'];
        const rates = { leicht:[4,6], normal:[6,10], stark:[10,15] };
        const [lo, hi] = rates[rGet('pfl-grad')] || [6, 10];
        const part = midOf(lo * m2, hi * m2) + 100; // +100 Maschine
        total += part;
        lines.push(`• Pflastersteine reinigen (${m2} m², ${rGet('pfl-grad')})`);
    }

    // ── RENOVIERUNG
    if (selSvc.has('renovierung')) {
        lines.push('• Malerarbeiten: Preis nach Stundenlohn (wird mitgeteilt)');
    }

    // ── CLEANING
    if (selSvc.has('cleaning') && rGet('cl-art')) {
        const art = rGet('cl-art');
        const m2  = n['cleaning-m2'];
        let part  = 0;
        if (art === 'einmalig-leicht') {
            part = midOf(4*m2, 6*m2);
            lines.push(`• Reinigungsservice – Einmalig, leicht verschmutzt (${m2} m²)`);
        } else if (art === 'einmalig-normal') {
            part = midOf(6*m2, 10*m2);
            lines.push(`• Reinigungsservice – Einmalig, normal (${m2} m²)`);
        } else if (art === 'einmalig-stark') {
            part = midOf(10*m2, 20*m2);
            lines.push(`• Reinigungsservice – Einmalig, stark verschmutzt (${m2} m²)`);
        } else if (art === 'dauer') {
            lines.push(`• Reinigungsservice – Dauerauftrag (${m2} m², Preis nach Aufwand)`);
            const schedule = getCleaningSchedule();
            if (schedule) {
                lines.push(`  - Zeitraum: ${schedule.zeitraum}`);
                if (schedule.weekLines.length) {
                    lines.push('  - Termine im Wochenplan:');
                    schedule.weekLines.forEach(wl => lines.push(`    · ${wl}`));
                } else {
                    lines.push('    · Noch keine Termine im Wochenplan ausgewählt');
                }
            } else {
                lines.push('  - Zeitraum: ⚠ noch nicht angegeben');
            }
        }
        total += part;
    }

    // ── ENTRÜMPELUNG
    if (selSvc.has('entruemp') && rGet('ent-grad')) {
        const m2 = n['entruemp-m2'];
        const rates = { wenig:[20,30], normal:[30,50], messi:[50,100] };
        const [lo, hi] = rates[rGet('ent-grad')] || [30, 50];
        const part = midOf(lo * m2, hi * m2);
        total += part;
        lines.push(`• Entrümpelung (${m2} m², ${rGet('ent-grad')})`);
    }

    // ── HAUSHALTSAUFLÖSUNG
    if (selSvc.has('haushaltsaufloesung') && rGet('hh-grad')) {
        const m2 = n['hh-m2'];
        const anlass = document.getElementById('wiz-hh-anlass')?.value.trim() || '';
        const rates = { wenig:[20,30], normal:[30,50], messi:[50,100] };
        const [lo, hi] = rates[rGet('hh-grad')] || [30, 50];
        const part = midOf(lo * m2, hi * m2);
        total += part;
        lines.push(`• Haushaltsauflösung (${m2} m², ${rGet('hh-grad')}${anlass ? ', Anlass: '+anlass : ''})`);
    }

    if (selSvc.has('moebelmontage') && rGet('mm-art')) {
        const beschreibung = document.getElementById('wiz-mm-beschreibung')?.value.trim() || '';
        lines.push(`• Möbelmontage (${n['moebel-anzahl']} Stück, ${rGet('mm-art')}${beschreibung ? `, Beschreibung: ${beschreibung}` : ''}; Preis nach Aufwand)`);
    }

    if (selSvc.has('umzug') && rGet('umzug-umfang')) {
        const abholung = document.getElementById('wiz-umzug-abholung')?.value.trim() || 'nicht angegeben';
        const ziel = document.getElementById('wiz-umzug-ziel')?.value.trim() || 'nicht angegeben';
        lines.push(`• Umzug (${rGet('umzug-umfang')}; Abholung: ${abholung}; Ziel: ${ziel}; Preis nach Aufwand)`);
    }

    if (total === 0 && lines.length === 0) return { total: 0, lines, hasVal: false };

    // ── ZUSCHLÄGE
    const baseM2 = (selSvc.has('cleaning') ? n['cleaning-m2'] : 0)
        + (selSvc.has('entruemp') ? n['entruemp-m2'] : 0)
        + (selSvc.has('haushaltsaufloesung') ? n['hh-m2'] : 0)
        + (selSvc.has('pflaster') ? n['pflaster-m2'] : 0)
        || 50;

    // Parken
    if (rGet('parken') === 'nein') {
        const z = Math.round(1.5 * baseM2);
        total += z;
    }

    // Etage ohne Aufzug
    if (rGet('aufzug') === 'nein') {
        const eMap = { '2':2, '3':3, '4':5, '5':7, '6':10 };
        const rate = eMap[rGet('etage')] || 0;
        if (rate > 0) {
            const z = rate * baseM2;
            total += z;
        }
    }

    // Entfernung
    const distMid = { '10': 10, '30': 35, '100': 75 };
    const dAdd = distMid[rGet('entf')] || 0;
    if (dAdd > 0) { total += dAdd; }

    // Aufwandspauschale unsichtbar
    total += AUFWAND;

    return { total: Math.round(total), lines, hasVal: true };
}

// ── UPDATE SIDEBAR ─────────────────────────
function wizUpdateSummary() {
    calcPrice();
    const el = document.getElementById('wiz-sum-lines');
    if (!el) return;

    if (selSvc.size === 0) {
        el.innerHTML = '<div class="wiz-sum-empty">Noch keine Auswahl getroffen</div>';
        return;
    }

    const svcNames = {
        pflaster:'Pflastersteine reinigen',
        renovierung:'Malerarbeiten', cleaning:'Reinigungsservice',
        entruemp:'Entrümpelung', haushaltsaufloesung:'Haushaltsauflösung',
        moebelmontage:'Möbelmontage', umzug:'Umzug'
    };
    let html = '';
    selSvc.forEach(s => {
        html += `<div class="wiz-sum-line"><span>${svcNames[s]||s}</span><span style="color:var(--gold)">✓</span></div>`;
    });

    if (selSvc.has('cleaning') && rGet('cl-art') === 'dauer') {
        const schedule = getCleaningSchedule();
        if (schedule) {
            html += `<div class="wiz-sum-line" style="display:block"><span style="color:var(--gold)">📅 Zeitraum: ${schedule.zeitraum}</span></div>`;
            if (schedule.weekLines.length) {
                html += `<div class="wiz-sum-line" style="display:block;line-height:1.7">${schedule.weekLines.map(wl => `• ${wl}`).join('<br>')}</div>`;
                if (schedule.hasMissingTimes) html += `<div class="wiz-sum-line" style="display:block;color:#c0392b">⚠ Bitte Tageszeit für jeden Termin wählen</div>`;
            } else {
                html += `<div class="wiz-sum-line" style="display:block;color:#c0392b">⚠ Bitte Termine im Wochenplan wählen</div>`;
            }
        } else {
            html += `<div class="wiz-sum-line" style="display:block;color:#c0392b">⚠ Bitte Zeitraum für Dauerauftrag angeben</div>`;
        }
    }

    if (rGet('parken') === 'nein')  html += `<div class="wiz-sum-line"><span>kein Parkplatz</span><span style="color:var(--gold)">+</span></div>`;
    if (rGet('objektart') !== 'Haus' && rGet('etage'))
        html += `<div class="wiz-sum-line"><span>${floorLabel(rGet('etage'))}</span><span style="color:var(--gold)">${rGet('aufzug') === 'nein' ? '+' : ''}</span></div>`;
    if (rGet('entf') && rGet('entf') !== '0')
        html += `<div class="wiz-sum-line"><span></span><span style="color:var(--gold)"></span></div>`;
    if (rGet('objektart'))
        html += `<div class="wiz-sum-line"><span>Objektart: ${rGet('objektart')}</span><span style="color:var(--gold)">✓</span></div>`;

    el.innerHTML = html;
}

// ══════════════════════════════════════════
// PROGRESS BAR
// ══════════════════════════════════════════
function wizBuildProgress() {
    const wrap = document.getElementById('wiz-prog-steps');
    if (!wrap) return;
    wrap.innerHTML = '';
    WIZ_STEPS.forEach((s, i) => {
        const item = document.createElement('div');
        item.className = 'wiz-step-item' + (s.id < wizStep ? ' clickable' : '');
        if (s.id < wizStep) item.onclick = () => wizGoTo(s.id);
        const isDone   = s.id < wizStep;
        const isActive = s.id === wizStep;
        item.innerHTML = `
      <div class="wiz-dot ${isDone?'done':isActive?'active':''}">${isDone ? '✓' : s.id}</div>
      <div class="wiz-step-label ${isActive?'active':''}">${s.label}</div>`;
        wrap.appendChild(item);
        if (i < WIZ_STEPS.length - 1) {
            const conn = document.createElement('div');
            conn.className = 'wiz-connector' + (isDone ? ' done' : '');
            wrap.appendChild(conn);
        }
    });

    const fill = document.getElementById('wiz-bar-fill');
    if (fill) fill.style.width = ((wizStep - 1) / (WIZ_TOTAL - 1) * 100) + '%';

    const ctr = document.getElementById('wiz-counter');
    if (ctr) ctr.textContent = `Schritt ${wizStep} von ${WIZ_TOTAL}`;

    const btnBack = document.getElementById('wiz-btn-back');
    const btnNext = document.getElementById('wiz-btn-next');
    if (btnBack) btnBack.style.display = wizStep > 1 ? 'flex' : 'none';
    if (btnNext) btnNext.style.display = wizStep === WIZ_TOTAL ? 'none' : 'flex';
}

// ══════════════════════════════════════════
// STEP 1 – SERVICES
// ══════════════════════════════════════════
const SVC_DEF = [
    { id:'entruemp',             icon:'📦', name:'Entrümpelung'          },
    { id:'haushaltsaufloesung',  icon:'🏠', name:'Haushaltsauflösung'    },
    { id:'cleaning',             icon:'🧹', name:'Reinigungsservice'      },
    { id:'pflaster',             icon:'🧱', name:'Pflastersteine reinigen'},
    { id:'moebelmontage',        icon:'🪛', name:'Möbelmontage'          },
    { id:'umzug',                icon:'🚚', name:'Umzug'                 },
];

function wizBuildStep1() {
    const grid = document.getElementById('wiz-tiles');
    if (!grid) return;
    grid.innerHTML = '';
    SVC_DEF.forEach(s => {
        const tile = document.createElement('div');
        tile.className = 'wiz-tile' + (selSvc.has(s.id) ? ' sel' : '');
        tile.innerHTML = `<span class="wiz-tile-icon">${s.icon}</span><div class="wiz-tile-name">${s.name}</div>`;
        tile.onclick = () => {
            const isAdding = !selSvc.has(s.id);
            if (s.id === 'renovierung' && isAdding && !selSvc.has('entruemp')) {
                showToast('Malerarbeiten kann nur in Kombination mit einer <strong>Entrümpelung</strong> gebucht werden. Bitte wählen Sie zuerst die Entrümpelung aus.');
                return;
            }
            if (s.id === 'entruemp' && !isAdding && selSvc.has('renovierung')) {
                selSvc.delete('renovierung');
                grid.querySelectorAll('.wiz-tile').forEach(t => {
                    if (t.querySelector('.wiz-tile-name')?.textContent === 'Malerarbeiten') t.classList.remove('sel');
                });
            }
            isAdding ? selSvc.add(s.id) : selSvc.delete(s.id);
            tile.classList.toggle('sel', selSvc.has(s.id));
            wizUpdateSummary();
        };
        grid.appendChild(tile);
    });
}

// ══════════════════════════════════════════
// STEP 2 – DETAILS
// ══════════════════════════════════════════
function wizBuildStep2() {
    const blocks = ['pflaster','renovierung','cleaning','entruemp','haushaltsaufloesung','moebelmontage','umzug'];
    blocks.forEach(b => {
        const el = document.getElementById('wiz-block-' + b);
        if (el) el.style.display = selSvc.has(b) ? 'block' : 'none';
    });

    if (selSvc.has('pflaster')) {
        buildWizRadio('pfl-grad', 'wiz-pfl-grad', [
            { v:'leicht', t:'Leicht verschmutzt'          },
            { v:'normal', t:'Normal (Moos, Grünbelag)'    },
            { v:'stark',  t:'Stark verschmutzt + Unkraut' },
        ], 'normal');
    }

    if (selSvc.has('entruemp')) {
        buildWizRadio('ent-grad', 'wiz-ent-grad', [
            { v:'wenig',  t:'Wenig Möbel / kaum Gegenstände' },
            { v:'normal', t:'Normale Menge'                  },
            { v:'messi',  t:'Stark gefüllt / Messie-Wohnung' },
        ], 'normal');
    }

    if (selSvc.has('haushaltsaufloesung')) {
        buildWizRadio('hh-grad', 'wiz-hh-grad', [
            { v:'wenig',  t:'Wenig Möbel / kaum Gegenstände' },
            { v:'normal', t:'Normale Menge'                  },
            { v:'messi',  t:'Stark gefüllt / Messie-Wohnung' },
        ], 'normal');
    }

    if (selSvc.has('moebelmontage')) {
        buildWizRadio('mm-art', 'wiz-mm-art', [
            { v:'Schrank / Regal', t:'Schrank oder Regal' },
            { v:'Bett / Kommode / Tisch', t:'Bett, Kommode oder Tisch' },
            { v:'Küche', t:'Küche' },
            { v:'Sonstiges', t:'Sonstige Möbel' },
        ], 'Schrank / Regal');
    }

    if (selSvc.has('umzug')) {
        buildWizRadio('umzug-umfang', 'wiz-umzug-umfang', [
            { v:'Kleintransport', t:'Kleintransport (wenige Möbel/Kisten)' },
            { v:'1–2 Zimmer', t:'Wohnung mit 1–2 Zimmern' },
            { v:'3+ Zimmer / Haus', t:'3 oder mehr Zimmer / Haus' },
        ], '1–2 Zimmer');
    }

    if (selSvc.has('cleaning')) {
        buildWizRadio('cl-art', 'wiz-cl-art', [
            { v:'einmalig-leicht', t:'Einmalig – Leicht'           },
            { v:'einmalig-normal', t:'Einmalig – Normal'           },
            { v:'einmalig-stark',  t:'Einmalig – Stark verschmutzt'},
            { v:'dauer',           t:'Dauerauftrag (regelmäßig)'   },
        ], 'einmalig-normal', () => {
            const dw  = document.getElementById('wiz-cl-dauerart-wrap');
            const hw  = document.getElementById('wiz-cl-h-wrap');
            const dtw = document.getElementById('wiz-cl-datum-wrap');
            const gw  = document.getElementById('wiz-cl-grid-wrap');
            const isDauer = rGet('cl-art') === 'dauer';
            if (dw)  dw.style.display  = isDauer ? 'block' : 'none';
            if (hw)  hw.style.display  = (isDauer && rGet('cl-dauer') === 'pro-h') ? 'block' : 'none';
            if (dtw) dtw.style.display = isDauer ? 'block' : 'none';
            if (!isDauer && gw) gw.style.display = 'none';
            wizUpdateSummary();
        });
        buildWizRadio('cl-dauer', 'wiz-cl-dauerart', [
            { v:'pro-m2', t:'Abrechnung pro m²'     },
            { v:'pro-h',  t:'Abrechnung pro Stunde' },
        ], 'pro-m2', () => {
            const hw = document.getElementById('wiz-cl-h-wrap');
            if (hw) hw.style.display = rGet('cl-dauer') === 'pro-h' ? 'block' : 'none';
            wizUpdateSummary();
        });
        const dw  = document.getElementById('wiz-cl-dauerart-wrap');
        const hw  = document.getElementById('wiz-cl-h-wrap');
        const dtw = document.getElementById('wiz-cl-datum-wrap');
        const isDauerNow = rGet('cl-art') === 'dauer';
        if (dw)  dw.style.display  = isDauerNow ? 'block' : 'none';
        if (hw)  hw.style.display  = (isDauerNow && rGet('cl-dauer') === 'pro-h') ? 'block' : 'none';
        if (dtw) dtw.style.display = isDauerNow ? 'block' : 'none';
        if (isDauerNow) wizClBuildGrid();
    }

}

// ══════════════════════════════════════════
// WOCHENPLAN-GRID für Dauerauftrag
// ══════════════════════════════════════════
function parseLocalDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function wizClBuildGrid() {
    const startIn = document.getElementById('wiz-cl-start');
    const endIn   = document.getElementById('wiz-cl-end');
    const gridWrap= document.getElementById('wiz-cl-grid-wrap');
    const table   = document.getElementById('wiz-cl-grid');
    if (!startIn || !endIn || !table || !gridWrap) return;

    const sv = startIn.value;
    const ev = endIn.value;
    if (!sv || !ev) { gridWrap.style.display = 'none'; wizClUpdateSchedulePreview(); return; }

    const start = parseLocalDate(sv);
    const end   = parseLocalDate(ev);
    if (isNaN(start) || isNaN(end) || end < start) { gridWrap.style.display = 'none'; wizClUpdateSchedulePreview(); return; }

    const dayLabels = ['Mo','Di','Mi','Do','Fr','Sa','So'];

    const getMonday = d => {
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1 - day);
        const m = new Date(d);
        m.setDate(d.getDate() + diff);
        m.setHours(0,0,0,0);
        return m;
    };

    const firstMon = getMonday(start);
    const lastMon  = getMonday(end);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const numWeeks  = Math.round((lastMon - firstMon) / msPerWeek) + 1;
    const maxWeeks  = Math.min(numWeeks, 52);

    const today = new Date(); today.setHours(0,0,0,0);

    if (!window._wzSel) window._wzSel = {};

    table.innerHTML = '';

    const thead = document.createElement('thead');
    const hrow  = document.createElement('tr');
    const th0   = document.createElement('th');
    th0.textContent = '';
    hrow.appendChild(th0);
    dayLabels.forEach(dl => {
        const th = document.createElement('th');
        th.textContent = dl;
        hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let w = 0; w < maxWeeks; w++) {
        const row = document.createElement('tr');

        const weekMon = new Date(firstMon.getTime() + w * msPerWeek);
        const tdLbl   = document.createElement('td');
        tdLbl.className = 'wz-week-label';
        tdLbl.textContent = `Woche ${w + 1}`;
        row.appendChild(tdLbl);

        for (let d = 0; d < 7; d++) {
            const cellDate = new Date(weekMon.getTime() + d * 24 * 60 * 60 * 1000);
            const td = document.createElement('td');
            td.textContent = cellDate.getDate();

            if (cellDate < start || cellDate > end || cellDate < today) {
                td.style.background = 'var(--dark3)';
                td.style.opacity = '.35';
                td.style.cursor = 'default';
            } else {
                if (cellDate.getTime() === today.getTime()) td.classList.add('wz-today');
                const key = `${w}-${d}`;
                if (key in window._wzSel) td.classList.add('wz-sel');
                td.onclick = () => {
                    if (key in window._wzSel) { delete window._wzSel[key]; td.classList.remove('wz-sel'); }
                    else { window._wzSel[key] = ''; td.classList.add('wz-sel'); }
                    wizClUpdateSchedulePreview();
                    wizUpdateSummary();
                };
            }
            row.appendChild(td);
        }
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    gridWrap.style.display = 'block';
    wizClUpdateSchedulePreview();
    wizUpdateSummary();
}

function wizClUpdateSchedulePreview() {
    const box = document.getElementById('wiz-cl-schedule-preview');
    if (!box) return;
    const schedule = getCleaningSchedule();
    if (!schedule) { box.style.display = 'none'; box.innerHTML = ''; return; }

    let html = `<div class="wcsp-zeitraum">📅 Zeitraum: ${schedule.zeitraum}</div>`;
    if (schedule.weekLines.length) {
        html += '<ul>' + schedule.appointments.map(a => `<li>${a.label}: <select class="wiz-time-select" onchange="wizClSetTime('${a.key}', this.value)"><option value="">Tageszeit wählen</option><option value="morgens" ${a.time === 'morgens' ? 'selected' : ''}>morgens</option><option value="mittags" ${a.time === 'mittags' ? 'selected' : ''}>mittags</option><option value="nachmittags" ${a.time === 'nachmittags' ? 'selected' : ''}>nachmittags</option><option value="abends" ${a.time === 'abends' ? 'selected' : ''}>abends</option></select></li>`).join('') + '</ul>';
    } else {
        html += '<div class="wcsp-empty">⚠ Bitte oben mindestens einen Termin im Wochenplan anklicken.</div>';
    }
    box.innerHTML = html;
    box.style.display = 'block';
}

function wizClSetTime(key, value) {
    if (!window._wzSel || !(key in window._wzSel)) return;
    window._wzSel[key] = value;
    wizClUpdateSchedulePreview();
    wizUpdateSummary();
}

function getCleaningSchedule() {
    const startIn = document.getElementById('wiz-cl-start');
    const endIn   = document.getElementById('wiz-cl-end');
    if (!startIn || !endIn || !startIn.value || !endIn.value) return null;

    const start = parseLocalDate(startIn.value);
    const end   = parseLocalDate(endIn.value);
    if (isNaN(start) || isNaN(end) || end < start) return null;

    const dayNames = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
    const getMonday = d => {
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1 - day);
        const m = new Date(d);
        m.setDate(d.getDate() + diff);
        m.setHours(0,0,0,0);
        return m;
    };
    const firstMon = getMonday(start);
    const fmtDate  = d => d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' });

    const sel = window._wzSel || {};
    const weeks = {};
    Object.keys(sel).forEach(key => {
        const [w, d] = key.split('-').map(Number);
        const date = new Date(firstMon.getTime() + (w * 7 + d) * 24 * 60 * 60 * 1000);
        if (date < start || date > end) return;
        if (!weeks[w]) weeks[w] = [];
        weeks[w].push({ dayIdx: d, date });
    });

    const appointments = [];
    const weekLines = Object.keys(weeks)
        .map(Number)
        .sort((a, b) => a - b)
        .map(w => {
            const days = weeks[w]
                .sort((a, b) => a.dayIdx - b.dayIdx)
                .map(o => {
                    const key = `${w}-${o.dayIdx}`;
                    const time = sel[key] || '';
                    appointments.push({ key, label: `${dayNames[o.dayIdx]} (${fmtDate(o.date)})`, time });
                    return `${dayNames[o.dayIdx]} (${fmtDate(o.date)})${time ? ` – ${time}` : ' – Tageszeit wählen'}`;
                })
                .join(', ');
            return `Woche ${w + 1}: ${days}`;
        });

    return { zeitraum: `${fmtDate(start)} – ${fmtDate(end)}`, weekLines, appointments, hasMissingTimes: appointments.some(a => !a.time) };
}

// ══════════════════════════════════════════
// STEP 3 – OBJEKT
// ══════════════════════════════════════════
function wizBuildStep3() {
    buildWizRadio('objektart', 'wiz-objektart', [
        { v:'Haus', t:'Haus' },
        { v:'Wohnung', t:'Wohnung' },
    ], 'Wohnung', () => { updateObjectFields(); wizUpdateSummary(); });

    buildWizRadio('aufzug', 'wiz-aufzug', [
        { v:'ja',   t:'Ja, Aufzug vorhanden'  },
        { v:'nein', t:'Nein, kein Aufzug'     },
    ], 'ja', () => {
        wizUpdateSummary();
    });

    buildWizRadio('etage', 'wiz-etage', [
        { v:'eg', t:'Erdgeschoss'            },
        { v:'1', t:'1. Etage'                },
        { v:'2', t:'2. Etage'               },
        { v:'3', t:'3. Etage'               },
        { v:'4', t:'4. Etage'               },
        { v:'5', t:'5. Etage'               },
        { v:'6', t:'6. Etage oder höher'    },
    ], 'eg', () => { wizUpdateSummary(); });

    buildWizRadio('parken', 'wiz-parken', [
        { v:'ja',   t:'Ja – Parken direkt vor dem Gebäude möglich' },
        { v:'nein', t:'Nein – kein Parkplatz vor dem Gebäude'      },
    ], 'ja');

    buildWizRadio('entf', 'wiz-entf', [
        { v:'10',  t:'0 – 10 km (Offenbach)' },
        { v:'30',  t:'10 – 30 km Entfernung'             },
        { v:'100', t:'30 – 100 km Entfernung'            },
    ], '10');

    updateObjectFields();
}

function updateObjectFields() {
    const er = document.getElementById('wiz-etage-row');
    if (er) er.style.display = rGet('objektart') === 'Haus' ? 'none' : 'block';
}

function floorLabel(value) {
    return value === 'eg' ? 'Erdgeschoss' : `${value || '1'}. Etage`;
}

// ══════════════════════════════════════════
// HELPERS: BUILD RADIO / CHECKS
// ══════════════════════════════════════════
function buildWizRadio(key, elId, opts, def, onChange) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (r[key] == null) r[key] = def;
    el.innerHTML = '';
    opts.forEach(o => {
        const row = document.createElement('div');
        row.className = 'wiz-radio' + (r[key] === o.v ? ' sel' : '');
        row.innerHTML = `<div class="wiz-radio-dot"></div><span class="wiz-radio-text">${o.t}</span>`;
        row.onclick = () => {
            r[key] = o.v;
            el.querySelectorAll('.wiz-radio').forEach(x => x.classList.remove('sel'));
            row.classList.add('sel');
            if (onChange) onChange();
            wizUpdateSummary();
        };
        el.appendChild(row);
    });
}

function buildWizChecks(elId, opts, set) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = '';
    opts.forEach(o => {
        const row = document.createElement('div');
        row.className = 'wiz-check' + (set.has(o.id) ? ' sel' : '');
        row.innerHTML = `<div class="wiz-check-box">${set.has(o.id) ? '✓' : ''}</div><span class="wiz-check-text">${o.t}</span>`;
        row.onclick = () => {
            set.has(o.id) ? set.delete(o.id) : set.add(o.id);
            row.classList.toggle('sel');
            row.querySelector('.wiz-check-box').textContent = set.has(o.id) ? '✓' : '';
            wizUpdateSummary();
        };
        el.appendChild(row);
    });
}

// ══════════════════════════════════════════
// NUMBER STEPPERS
// ══════════════════════════════════════════
function wizNum(key, delta) {
    const min = key.endsWith('-m2') ? 0 : 1;
    n[key] = Math.max(min, (n[key] || 1) + delta);
    const el = document.getElementById('wiz-n-' + key);
    if (el) el.value = n[key];
    wizUpdateSummary();
}

function wizNumInput(key, val) {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
        n[key] = parsed;
        wizUpdateSummary();
    }
}

// ══════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════
function wizGoTo(step) {
    document.querySelectorAll('.wiz-step').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('wiz-s' + step);
    if (el) el.classList.add('active');
    wizStep = step;
    wizBuildProgress();
    if (step === 2) wizBuildStep2();
    if (step === 3) wizBuildStep3();
    const conf = document.getElementById('konfigurator');
    if (conf) conf.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function wizNext() {
    if (wizStep === 1 && selSvc.size === 0) {
        alert('Bitte wählen Sie mindestens eine Leistung aus.');
        return;
    }
    if (wizStep === 2 && selSvc.has('cleaning') && rGet('cl-art') === 'dauer') {
        const startIn = document.getElementById('wiz-cl-start');
        const endIn   = document.getElementById('wiz-cl-end');
        if (!startIn?.value || !endIn?.value) {
            showToast('Bitte geben Sie für den <strong>Dauerauftrag</strong> ein Start- und Enddatum an.');
            return;
        }
        const schedule = getCleaningSchedule();
        if (!schedule || schedule.weekLines.length === 0) {
            showToast('Bitte wählen Sie im <strong>Wochenplan</strong> mindestens einen Termin (Wochentag) für den Dauerauftrag aus.');
            return;
        }
        if (schedule.hasMissingTimes) {
            showToast('Bitte wählen Sie für jeden Termin im <strong>Wochenplan</strong> eine Tageszeit.');
            return;
        }
    }
    if (wizStep < WIZ_TOTAL) wizGoTo(wizStep + 1);
}

function wizBack() {
    if (wizStep > 1) wizGoTo(wizStep - 1);
}

// ══════════════════════════════════════════
// BUILD MESSAGE (Übersichtlich formatiert)
// ══════════════════════════════════════════
function wizBuildMsg() {
    const vorname = document.getElementById('wf-vorname')?.value.trim() || '';
    const nachname= document.getElementById('wf-nachname')?.value.trim() || '';
    const tel     = document.getElementById('wf-tel')?.value.trim() || '';
    const email   = document.getElementById('wf-email')?.value.trim() || '';
    const strasse = document.getElementById('wf-strasse')?.value.trim() || '';
    const hausnummer = document.getElementById('wf-hausnummer')?.value.trim() || '';
    const plz = document.getElementById('wf-plz')?.value.trim() || '';
    const ort = document.getElementById('wf-ort')?.value.trim() || '';
    const adresse = [strasse && hausnummer ? `${strasse} ${hausnummer}` : strasse || hausnummer, plz && ort ? `${plz} ${ort}` : plz || ort].filter(Boolean).join(', ');
    const notiz   = document.getElementById('wf-notiz')?.value.trim() || '';
    const dsgvo   = document.getElementById('wf-dsgvo')?.checked;
    const name    = (vorname + ' ' + nachname).trim();

    if (!name) { alert('Bitte Vor- und Nachname eintragen.'); return null; }
    if (!strasse || !hausnummer || !plz || !ort) { alert('Bitte geben Sie Straße, Hausnummer, Postleitzahl und Ort an.'); return null; }
    if (!dsgvo) { alert('Bitte die Datenschutzerklärung akzeptieren.'); return null; }

    if (selSvc.has('cleaning') && rGet('cl-art') === 'dauer') {
        const schedule = getCleaningSchedule();
        if (!schedule) {
            alert('Bitte geben Sie für den Dauerauftrag (Reinigungsservice) einen Zeitraum (Start- und Enddatum) an.');
            return null;
        }
        if (schedule.weekLines.length === 0) {
            alert('Bitte wählen Sie im Wochenplan mindestens einen Termin für den Dauerauftrag aus.');
            return null;
        }
        if (schedule.hasMissingTimes) {
            alert('Bitte wählen Sie für jeden Termin im Wochenplan eine Tageszeit.');
            return null;
        }
    }

    const { total, lines, hasVal } = calcPrice();

    // Entfernung ermitteln
    const distText = { '10': '0 – 10 km (Offenbach)', '30': '10 – 30 km', '100': '30 – 100 km' }[rGet('entf')] || '–';

    const msgSections = [
        '=== NEUE ANFRAGE – A&S Global Services ===',
        [
            `Kunde:    ${name}`,
            tel     ? `Tel/WA:   ${tel}`    : '',
            email   ? `E-Mail:   ${email}`  : '',
            adresse ? `Objekt:   ${adresse}`: ''
        ].filter(Boolean).join('\n'),
        [
            '--- LEISTUNGEN ---',
            lines.length ? lines.join('\n') : '• Keine Leistungen gewählt'
        ].join('\n'),
        [
            '--- OBJEKTDATEN ---',
            `Objektart:   ${rGet('objektart') || '–'}`,
            `Aufzug:      ${rGet('aufzug') === 'ja' ? 'Vorhanden' : 'Nicht vorhanden'}`,
            `Etage:       ${rGet('objektart') === 'Haus' ? 'Nicht relevant (Haus)' : `${floorLabel(rGet('etage'))}${rGet('aufzug') === 'nein' ? ' (ohne Aufzug)' : ' (mit Aufzug)'}`}`,
            `Parken:      ${rGet('parken') === 'ja' ? 'Vorhanden / Direkt vor dem Objekt' : 'Kein Parkplatz'}`,
            `Entfernung:  ${distText}`
        ].filter(Boolean).join('\n'),
        notiz ? `--- ANMERKUNGEN ---\n${notiz}` : ''
    ];

    const msg = msgSections.filter(s => s && s.trim().length > 0).join('\n\n');

    return { msg, name, tel, email };
}

// ══════════════════════════════════════════
// SEND
// ══════════════════════════════════════════
function wizSendWA() {
    const d = wizBuildMsg(); if (!d) return;
    window.open('https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(d.msg), '_blank');
    wizShowSuccess();
}

function wizSendMail() {
    const d = wizBuildMsg(); if (!d) return;
    const subj = 'Angebotsanfrage – ' + d.name;
    if (EJS_KEY !== 'DEIN_PUBLIC_KEY') {
        emailjs.send(EJS_SVC, EJS_TPL, {
            from_name: d.name, reply_to: d.email,
            subject: subj, message: d.msg, to_email: TO_EMAIL
        })
            .then(() => wizShowSuccess())
            .catch(() => {
                const s = document.getElementById('wiz-send-status');
                if (s) { s.style.display='block'; s.style.color='#f87171'; s.textContent='Fehler – bitte WhatsApp nutzen.'; }
            });
    } else {
        window.location.href = 'mailto:' + TO_EMAIL
            + '?subject=' + encodeURIComponent(subj)
            + '&body='    + encodeURIComponent(`Von: ${d.name}${d.email ? '\nAntwort: ' + d.email : ''}\n\n${d.msg}`);
        wizShowSuccess();
    }
}

function wizShowSuccess() {
    document.getElementById('wiz-body')?.style.setProperty('display', 'none');
    const prog = document.getElementById('wiz-progress-wrap');
    if (prog) prog.style.display = 'none';
    document.getElementById('wiz-btn-back')?.style.setProperty('display', 'none');
    document.getElementById('wiz-btn-next')?.style.setProperty('display', 'none');
    document.getElementById('wiz-success')?.style.setProperty('display', 'block');
}

function wizReset() {
    selSvc.clear(); chkRenov.clear();
    Object.keys(r).forEach(k => delete r[k]);
    Object.assign(n, { 'pflaster-m2':0,'cleaning-m2':0,'cleaning-h':1,'entruemp-m2':0,'hh-m2':0,'moebel-anzahl':1 });

    ['wiz-n-pflaster-m2','wiz-n-cleaning-m2','wiz-n-entruemp-m2','wiz-n-hh-m2'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '0';
    });
    const furnitureCount = document.getElementById('wiz-n-moebel-anzahl');
    if (furnitureCount) furnitureCount.value = '1';
    const cleaningHours = document.getElementById('wiz-n-cleaning-h');
    if (cleaningHours) cleaningHours.textContent = '1';
    ['wiz-hh-anlass','wiz-mm-beschreibung','wiz-umzug-abholung','wiz-umzug-ziel','wf-vorname','wf-nachname','wf-tel','wf-email','wf-strasse','wf-hausnummer','wf-plz','wf-ort','wf-notiz'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    const dsgvo = document.getElementById('wf-dsgvo');
    if (dsgvo) dsgvo.checked = false;

    window._wzSel = {};
    const startIn = document.getElementById('wiz-cl-start');
    const endIn   = document.getElementById('wiz-cl-end');
    if (startIn) startIn.value = '';
    if (endIn)   endIn.value   = '';
    const gridWrap = document.getElementById('wiz-cl-grid-wrap');
    if (gridWrap) gridWrap.style.display = 'none';
    const preview = document.getElementById('wiz-cl-schedule-preview');
    if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }

    document.getElementById('wiz-body')?.style.removeProperty('display');
    const prog = document.getElementById('wiz-progress-wrap');
    if (prog) prog.style.display = '';
    document.getElementById('wiz-btn-back')?.style.removeProperty('display');
    document.getElementById('wiz-btn-next')?.style.removeProperty('display');
    document.getElementById('wiz-success')?.style.setProperty('display', 'none');
    wizGoTo(1);
    wizBuildStep1();
    wizUpdateSummary();
}

// ══════════════════════════════════════════
// GENERAL CONTACT (Kontakt section)
// ══════════════════════════════════════════
function sendWhatsApp(e) {
    e.preventDefault();
    const msg = document.getElementById('wa-msg')?.value.trim()
        || 'Hallo, ich interessiere mich für Ihren Service. Können Sie mir ein Angebot machen?';
    window.open('https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(msg), '_blank');
}

async function sendEmail() {
    const btn    = document.getElementById('mail-send-btn');
    const status = document.getElementById('mail-status');
    const name   = document.getElementById('mail-name')?.value.trim();
    const reply  = document.getElementById('mail-reply')?.value.trim();
    const subject= document.getElementById('mail-subject')?.value.trim() || 'Anfrage A&S Global Services';
    const body   = document.getElementById('mail-body')?.value.trim();

    if (!name || !body) {
        if (status) { status.style.display='block'; status.style.color='#f87171'; status.textContent='Bitte Name und Nachricht ausfüllen.'; }
        return;
    }
    if (btn) { btn.textContent='⏳ Wird gesendet...'; btn.style.opacity='.7'; btn.disabled=true; }
    if (status) status.style.display = 'none';

    if (EJS_KEY !== 'DEIN_PUBLIC_KEY') {
        try {
            await emailjs.send(EJS_SVC, EJS_TPL, { from_name:name, reply_to:reply, subject, message:body, to_email:TO_EMAIL });
            if (status) { status.style.display='block'; status.style.color='#4ade80'; status.textContent='✓ Nachricht gesendet!'; }
            ['mail-name','mail-reply','mail-subject','mail-body'].forEach(id => {
                const el = document.getElementById(id); if(el) el.value = '';
            });
        } catch(err) {
            if (status) { status.style.display='block'; status.style.color='#f87171'; status.textContent='Fehler. Bitte direkt per E-Mail schreiben.'; }
        }
    } else {
        window.location.href = 'mailto:' + TO_EMAIL
            + '?subject=' + encodeURIComponent(subject)
            + '&body='    + encodeURIComponent(`Von: ${name}${reply ? '\nAntwort: ' + reply : ''}\n\n${body}`);
    }
    if (btn) { btn.textContent='✉️ E-Mail senden'; btn.style.opacity='1'; btn.disabled=false; }
}

// ══════════════════════════════════════════
// SLIDESHOW
// ══════════════════════════════════════════
let ssTimer;
function buildSlide() {
    const ss = document.getElementById('slideshow');
    const dotsEl = document.getElementById('ssDots');
    if (!ss || !dotsEl) return;
    const slides = ss.querySelectorAll('.slide');
    slides.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'ss-dot' + (i === 0 ? ' active' : '');
        d.onclick = () => ssGoTo(i);
        dotsEl.appendChild(d);
    });
    let drag=false, sx=0, sl=0;
    ss.addEventListener('mousedown', e => { drag=true; sx=e.pageX-ss.offsetLeft; sl=ss.scrollLeft; ss.style.userSelect='none'; });
    ss.addEventListener('mousemove', e => { if(!drag) return; ss.scrollLeft=sl-(e.pageX-ss.offsetLeft-sx); });
    ['mouseup','mouseleave'].forEach(ev => ss.addEventListener(ev, () => { drag=false; ss.style.userSelect=''; }));
    ss.addEventListener('scroll', updateDots);
    // On phones, treat a horizontal swipe as one gallery step. This also lets
    // a swipe at either end wrap around to the opposite end of the gallery.
    let touchStartX = 0, touchStartY = 0, touchMovedHorizontally = false;
    ss.addEventListener('touchstart', event => {
        if (event.touches.length !== 1) return;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchMovedHorizontally = false;
    }, { passive: true });
    ss.addEventListener('touchmove', event => {
        if (event.touches.length !== 1) return;
        const dx = event.touches[0].clientX - touchStartX;
        const dy = event.touches[0].clientY - touchStartY;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
            touchMovedHorizontally = true;
            event.preventDefault();
        }
    }, { passive: false });
    ss.addEventListener('touchend', event => {
        if (!touchMovedHorizontally || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 35) ssMove(dx < 0 ? 1 : -1);
    }, { passive: true });
    startAuto();
    ss.addEventListener('mouseenter', () => clearInterval(ssTimer));
    ss.addEventListener('mouseleave', startAuto);
}
function startAuto() { ssTimer = setInterval(() => ssMove(1), 4200); }
function updateDots() {
    const ss = document.getElementById('slideshow');
    if (!ss) return;
    const w = (ss.querySelector('.slide')?.offsetWidth || 320) + (parseFloat(getComputedStyle(ss).gap) || 0);
    const idx = Math.round(ss.scrollLeft / w);
    document.querySelectorAll('.ss-dot').forEach((d,i) => d.classList.toggle('active', i===idx));
}
function ssGoTo(i) {
    const ss = document.getElementById('slideshow');
    if (!ss) return;
    const slide = ss.querySelectorAll('.slide')[i];
    if (!slide) return;
    ss.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
}
function ssMove(dir) {
    const ss = document.getElementById('slideshow');
    if (!ss) return;
    const slides = ss.querySelectorAll('.slide');
    const w = (slides[0]?.offsetWidth || 320) + (parseFloat(getComputedStyle(ss).gap) || 0);
    const cur = Math.round(ss.scrollLeft / w);
    ssGoTo((cur + dir + slides.length) % slides.length);
}

const RESULT_IMAGES = [
    { src:'ergebnis-clean-1.jpg', alt:'Entrümpeltes Wohnzimmer' },
    { src:'ergebnis-clean-2.jpg', alt:'Entrümpeltes Schlafzimmer' },
    { src:'ergebnis-clean-3.jpg', alt:'Entrümpelter Keller' },
    { src:'ergebnis-clean-4.jpg', alt:'Entrümpelte Küche' },
];
let activeResult = 0;

function openResult(index) {
    const lightbox = document.getElementById('gallery-lightbox');
    const image = document.getElementById('gallery-lightbox-image');
    if (!lightbox || !image || !RESULT_IMAGES[index]) return;
    activeResult = index;
    image.src = RESULT_IMAGES[index].src;
    image.alt = RESULT_IMAGES[index].alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function changeResult(direction) {
    activeResult = (activeResult + direction + RESULT_IMAGES.length) % RESULT_IMAGES.length;
    openResult(activeResult);
}

function closeResult(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('gallery-lightbox')?.classList.remove('open');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', event => {
    const lightbox = document.getElementById('gallery-lightbox');
    if (!lightbox?.classList.contains('open')) return;
    if (event.key === 'Escape') closeResult();
    if (event.key === 'ArrowLeft') changeResult(-1);
    if (event.key === 'ArrowRight') changeResult(1);
});

// ══════════════════════════════════════════
// FAQ
// ══════════════════════════════════════════
const FAQS = [
    {
        category: '📦 Entrümpelung & Haushaltsauflösung',
        items: [
            { q:'Wie läuft das bei euch ab, wenn ich etwas entrümpeln lassen will?', a:'Ganz einfach: Du meldest dich bei uns, wir schauen uns das kurz an (oder klären es am Telefon), und dann bekommst du einen klaren Preis. Wenn du einverstanden bist, kommen wir vorbei und machen die Sache komplett leer. Du musst dich um nichts kümmern.' },
            { q:'Wie schnell geht sowas?', a:'Meistens ziemlich schnell. Wenn es dringend ist, versuchen wir auch kurzfristige Termine möglich zu machen.' },
            { q:'Was genau macht ihr bei einer Haushaltsauflösung?', a:'Wir räumen eine komplette Wohnung oder ein Haus komplett leer – also wirklich alles. Möbel, Sachen, einfach alles was weg muss. Am Ende ist die Wohnung leer und besenrein.' },
            { q:'Muss ich dabei sein?', a:'Nein, musst du nicht. Viele Kunden geben uns einfach den Schlüssel oder sind nur am Anfang kurz da. Den Rest übernehmen wir.' }
        ]
    },
    {
        category: '🧹 Reinigungsservice',
        items: [
            { q:'Was genau reinigen wir eigentlich?', a:'Eigentlich alles, was sauber werden soll: Treppenhäuser, Wohnungen, Gewerberäume oder ganze Objekte. Hauptsache es soll am Ende ordentlich und sauber aussehen.' },
            { q:'Macht ihr das auch regelmäßig für Hausverwaltungen?', a:'Ja, genau darauf sind wir ausgelegt. Viele Kunden wollen jemanden, der einfach zuverlässig jede Woche kommt und sich darum kümmert.' }
        ]
    },
    {
        category: '🧱 Pflastersteine reinigen',
        items: [
            { q:'Wie bekommt ihr die Pflastersteine wieder sauber?', a: 'Wir benutzen professionelle Geräte, die richtig tief reinigen. Moos, Dreck und diese dunklen Flecken gehen damit deutlich besser weg.'},
            { q:'Sieht das danach wirklich wieder gut aus?', a: 'Ja, der Unterschied ist meistens ziemlich krass – vorher dunkel und schmutzig, danach deutlich heller und gepflegter.'}
        ]
    },
    {
        category: '🪛 Möbelmontage',
        items: [
            { q:'Welche Möbel montieren Sie?', a:'Wir montieren Schränke, Betten, Kommoden, Regale, Tische, Stühle und viele weitere Möbel.' },
            { q:'Übernehmen Sie auch die Demontage?', a:'Ja. Auf Wunsch bauen wir Ihre Möbel fachgerecht ab und am neuen Standort wieder auf.' },
            { q:'Können Sie auch bereits gekaufte Möbel montieren?', a:'Ja. Wir montieren auch neu gelieferte oder bereits vorhandene Möbel.' },
            { q:'Was kostet eine Möbelmontage?', a:'Der Preis richtet sich nach Art, Anzahl und Größe der Möbel sowie dem Montageaufwand. Gerne erstellen wir Ihnen ein individuelles Angebot.' },
            { q:'Kann ich vorab Fotos schicken?', a:'Ja. Fotos und Informationen zu den Möbeln helfen uns, den Aufwand besser einzuschätzen und ein passendes Angebot zu erstellen.' },
            { q:'Montieren Sie auch Möbel nach einem Umzug?', a:'Ja. Wir können die Möbel am alten Standort abbauen, transportieren und am neuen Standort wieder aufbauen.' },
            { q:'Wie kann ich einen Termin vereinbaren?', a:'Kontaktieren Sie uns telefonisch, per WhatsApp oder per E-Mail. Wir besprechen den Auftrag und vereinbaren anschließend einen passenden Termin.' }
        ]
    },
    {
        category: '🚚 Umzug',
        items: [
            { q:'Welche Umzüge übernehmen Sie?', a:'Wir übernehmen private und kleinere gewerbliche Umzüge sowie einzelne Transport- und Trageleistungen.' },
            { q:'Was gehört zu einem Umzug dazu?', a:'Je nach Auftrag können wir den Abbau, das Tragen, Be- und Entladen, den Transport sowie den Aufbau der Möbel übernehmen.' },
            { q:'Bieten Sie auch reine Transportleistungen an?', a:'Ja. Wenn Sie lediglich Unterstützung beim Transport benötigen, können Sie auch einzelne Leistungen buchen.' },
            { q:'Muss ich meine Möbel vorher abbauen?', a:'Nein. Auf Wunsch übernehmen wir den Möbelabbau und den anschließenden Wiederaufbau.' },
            { q:'Was ist, wenn die Wohnung keinen Aufzug hat?', a:'Auch Umzüge in Wohnungen ohne Aufzug sind möglich. Die Anzahl der Etagen wird bei der Planung und Angebotserstellung berücksichtigt.' },
            { q:'Wohin bieten Sie Umzüge an?', a:'Unser Schwerpunkt liegt auf Offenbach, Frankfurt am Main und Umgebung. Weitere Strecken sind nach Absprache möglich.' },
            { q:'Wie wird der Preis für einen Umzug berechnet?', a:'Der Preis hängt unter anderem von der Menge des Umzugsguts, der Entfernung, den Etagen, dem Arbeitsaufwand und dem benötigten Transport ab.' },
            { q:'Wie kann ich ein Angebot erhalten?', a:'Schicken Sie uns am besten den Abhol- und Zielort sowie Fotos oder eine kurze Beschreibung des Umzugsguts. Anschließend können wir den Aufwand einschätzen und Ihnen ein individuelles Angebot erstellen.' }
        ]
    },
    {
        category: '💬 Allgemein & Kontakt',
        items: [
            { q:'Wie frage ich euch am einfachsten an?', a: 'Am schnellsten per WhatsApp oder Anruf. Du sagst kurz, was du brauchst, und wir kümmern uns um den Rest.'}
        ]
    }
];

function buildFAQ() {
    const list = document.getElementById('faqList');
    if (!list) return;
    list.innerHTML = '';
    let globalIndex = 0;

    FAQS.forEach((group, index) => {
        const catTitle = document.createElement('h3');
        const marginTop = index === 0 ? '0' : '2.5rem';
        catTitle.style.cssText = `font-family:'Aldhabi',serif; font-size:1.8rem; color:var(--accent); margin: ${marginTop} 0 0.5rem 0; border-bottom: 1px solid rgba(0,0,0,.08); padding-bottom: 0.5rem;`;
        catTitle.textContent = group.category;
        list.appendChild(catTitle);

        group.items.forEach(f => {
            const item = document.createElement('div');
            item.className = 'faq-item';
            item.innerHTML = `
              <button class="faq-question" id="fq${globalIndex}" onclick="toggleFAQ(${globalIndex})">${f.q}
                <span class="faq-icon">+</span>
              </button>
              <div class="faq-answer" id="fa${globalIndex}"><div class="faq-answer-inner">${f.a}</div></div>`;
            list.appendChild(item);
            globalIndex++;
        });
    });
}

function toggleFAQ(i) {
    const btn = document.getElementById('fq' + i);
    const ans = document.getElementById('fa' + i);
    if (!btn || !ans) return;

    const wasOpen = btn.classList.contains('open');

    document.querySelectorAll('.faq-question').forEach(b => b.classList.remove('open'));
    document.querySelectorAll('.faq-answer').forEach(a => a.style.maxHeight = '0');

    if (!wasOpen) {
        btn.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 'px';
    }
}

// ══════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════
function openModal(id) { document.getElementById('modal-'+id)?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById('modal-'+id)?.classList.remove('open'); document.body.style.overflow=''; }
document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if(e.target===m) { m.classList.remove('open'); document.body.style.overflow=''; } });
});

// ══════════════════════════════════════════
// COOKIE
// ══════════════════════════════════════════
function closeCookie() {
    document.getElementById('cookieBanner')?.classList.remove('show');
    try { localStorage.setItem('ck','1'); } catch(e) {}
}
try { if (!localStorage.getItem('ck')) setTimeout(() => document.getElementById('cookieBanner')?.classList.add('show'), 1400); } catch(e) {}

// ══════════════════════════════════════════
// NAV MOBILE
// ══════════════════════════════════════════
function toggleNav() {
    const menu = document.getElementById('mobileNav');
    const button = document.querySelector('.nav-burger');
    if (!menu) return;
    const isOpen = menu.classList.toggle('open');
    button?.setAttribute('aria-expanded', String(isOpen));
}
function closeNav()  {
    document.getElementById('mobileNav')?.classList.remove('open');
    document.querySelector('.nav-burger')?.setAttribute('aria-expanded', 'false');
}

// ══════════════════════════════════════════
// SCROLL ANIMATIONS
// ══════════════════════════════════════════
const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; }
    });
}, { threshold: .08 });

document.querySelectorAll('.service-card,.ba-card,.process-step,.ba-feature,.contact-card,.quality-card,.faq-item').forEach(el => {
    el.style.opacity='0'; el.style.transform='translateY(20px)';
    el.style.transition='opacity .52s ease,transform .52s ease';
    observer.observe(el);
});

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
wizBuildProgress();
wizBuildStep1();
wizUpdateSummary();
buildFAQ();
(function setClMinDate(){
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const startIn = document.getElementById('wiz-cl-start');
    const endIn   = document.getElementById('wiz-cl-end');
    if (startIn) startIn.min = todayStr;
    if (endIn)   endIn.min   = todayStr;
})();

// ── VORHER/NACHHER MORPH ──────────────
function initMorph() {
    const imgV = document.getElementById('ba-img-vorher');
    const imgN = document.getElementById('ba-img-nachher');
    const badge = document.getElementById('ba-badge');
    if (!imgV || !imgN || !badge) return;
    badge.className = 'ba-morph-badge vorher';
    badge.textContent = 'VORHER';
    let showingNachher = false;
    setInterval(() => {
        showingNachher = !showingNachher;
        if (showingNachher) {
            imgN.style.opacity = '1';
            badge.textContent = 'NACHHER';
            badge.className = 'ba-morph-badge nachher';
        } else {
            imgN.style.opacity = '0';
            badge.textContent = 'VORHER';
            badge.className = 'ba-morph-badge vorher';
        }
    }, 5000);
}
initMorph();
buildSlide();
