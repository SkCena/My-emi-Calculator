// Global Scope Configs
window.state = { currency: 'INR', rates: { 'INR': { sym: '₹', loc: 'en-IN' }, 'USD': { sym: '$', loc: 'en-US' }, 'EUR': { sym: '€', loc: 'de-DE' }, 'GBP': { sym: '£', loc: 'en-GB' } }, activePage: 'gen', lang: 'en' };
const emiState = { 'gen': { mo: false, vmo: false }, 'hl': { mo: false, vmo: false }, 'cl': { mo: false, vmo: false }, 'pl': { mo: false, vmo: false } };

// Core Utils
window.f = (val) => new Intl.NumberFormat(window.state.rates[window.state.currency].loc, { maximumFractionDigits: 0 }).format(Math.round(isNaN(parseFloat(val)) ? 0 : parseFloat(val)));
window.parseF = (str) => parseFloat(str.toString().replace(/,/g, '')) || 0;

// Auto-Save Utils
window.loadState = (k, def) => localStorage.getItem('myemi_'+k) !== null ? localStorage.getItem('myemi_'+k) : def;
window.saveState = (k, v) => localStorage.setItem('myemi_'+k, v);

// Number Ticker Animation
window.animateValue = function(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        obj.innerHTML = window.f(Math.floor(progress * (end - start) + start));
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = window.f(end);
    };
    window.requestAnimationFrame(step);
};

// SLIDER SMART ROUNDING LOGIC (500/1000 Steps)
window.bindInputSlider = function(sliderId, inputId, min, max, isNonLinear, onChange) {
    const s = document.getElementById(sliderId), i = document.getElementById(inputId);
    if (!s || !i) return;
    const vTS = (v) => (!isNonLinear ? v : (v<=min?0:(v>=max?100:100*Math.cbrt((v-min)/(max-min)))));
    
    const sTV = (sv) => {
        if (!isNonLinear) return parseFloat(sv);
        let val = min+(max-min)*Math.pow(parseFloat(sv)/100,3);
        // Smart step rounding added
        if (max >= 100000) return Math.round(val / 500) * 500;
        return Math.round(val);
    };
    
    s.addEventListener('input', () => { i.value = window.f(sTV(s.value)); onChange(false); });
    i.addEventListener('input', () => { let v = parseFloat(i.value.replace(/[^0-9.]/g, '')); if (!isNaN(v)) { s.value = vTS(v); onChange(false); }});
    i.addEventListener('blur', () => { let v = window.parseF(i.value); v = Math.min(Math.max(v, min), max); i.value = window.f(v); s.value = vTS(v); window.saveState(inputId, v); onChange(true); });
};

// Donut Chart Engine
const charts = {};
window.drawDonut = function(canvasId, v1, v2, c1, c2, l1, l2) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || canvas.offsetParent === null) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ctx = canvas.getContext('2d'), dpr = window.devicePixelRatio || 1, size = Math.min(canvas.parentElement.getBoundingClientRect().width, 240);
    if (canvas.width !== size * dpr) { canvas.width = size * dpr; canvas.height = size * dpr; canvas.style.width = size + 'px'; canvas.style.height = size + 'px'; ctx.scale(dpr, dpr); }
    const cx = size/2, cy = size/2, r = size/2 - 20, th = 24, total = v1 + v2 || 1, p1 = v1/total, p2 = v2/total;
    
    if (!charts[canvasId]) {
        charts[canvasId] = { hover: 0 };
        const upd = (e) => {
            const rect = canvas.getBoundingClientRect(), x = (e.touches?e.touches[0].clientX:e.clientX)-rect.left-cx, y = (e.touches?e.touches[0].clientY:e.clientY)-rect.top-cy, dist = Math.sqrt(x*x + y*y);
            let h = 0; if (dist > r-th && dist < r+th) { let ang = Math.atan2(y,x)+Math.PI/2; if(ang<0)ang+=Math.PI*2; h = ang < p1*Math.PI*2 ? 1 : 2; }
            if (h !== charts[canvasId].hover) { charts[canvasId].hover = h; render(); }
        };
        canvas.addEventListener('mousemove', upd); canvas.addEventListener('touchmove', upd, {passive:true});
        canvas.addEventListener('mouseleave', () => { charts[canvasId].hover = 0; render(); }); canvas.addEventListener('touchend', () => { charts[canvasId].hover = 0; render(); });
    }

    const render = () => {
        ctx.clearRect(0,0,size,size); const h = charts[canvasId].hover;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19,42,67,0.06)'; ctx.lineWidth = th; ctx.stroke();
        const dSeg = (s, e, c, ish, iso) => { if(s===e)return; ctx.beginPath(); ctx.arc(cx,cy,r,s-Math.PI/2,e-Math.PI/2); ctx.strokeStyle = c; ctx.lineWidth = ish?th+4:th; ctx.lineCap = 'round'; ctx.globalAlpha = iso?0.4:1; ctx.stroke(); ctx.globalAlpha = 1; };
        dSeg(0, Math.max(0, p1*Math.PI*2 - 0.05), isDark ? '#34D399' : c1, h===1, h===2); dSeg(p1*Math.PI*2, Math.max(p1*Math.PI*2, Math.PI*2 - 0.05), isDark ? '#4ADE80' : c2, h===2, h===1);
        
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let mTxt = h===1 ? Math.round(p1*100)+'%' : h===2 ? Math.round(p2*100)+'%' : Math.round(Math.max(p1,p2)*100)+'%';
        let sTxt = h===1 ? l1 : h===2 ? l2 : (p1>p2?l1:l2);
        if (total===1 && v1===0 && v2===0) { mTxt = '0%'; sTxt = 'No Data'; }
        ctx.font = 'bold 32px Sora'; ctx.fillStyle = isDark ? '#FFFFFF' : '#132A43'; ctx.fillText(mTxt, cx, cy - 8); ctx.font = '14px Inter'; ctx.fillStyle = isDark ? '#A3B5AA' : '#5B6472'; ctx.fillText(sTxt, cx, cy + 18);
    };
    render();
}

// Math Formula
const calcEmiObj = (P, R, T_mo) => { let r = (R/12)/100; return r===0 ? P/T_mo : P*r*Math.pow(1+r,T_mo)/(Math.pow(1+r,T_mo)-1); };

window.runGen = (animate = false) => {
    let P = window.parseF(document.getElementById('gen-p-in').value), R = window.parseF(document.getElementById('gen-r-in').value), T = window.parseF(document.getElementById('gen-t-in').value);
    if(P<=0||R<=0||T<=0){ document.getElementById('gen-error').style.display='block'; return; } document.getElementById('gen-error').style.display='none';
    let n = emiState.gen.mo ? T : T*12;
    let emi = calcEmiObj(P, R, n), tInt = (emi*n)-P;
    
    if(animate) { window.animateValue(document.getElementById('gen-res-emi'), 0, emi, 800); window.animateValue(document.getElementById('gen-res-i'), 0, tInt, 800); window.animateValue(document.getElementById('gen-res-t'), 0, P+tInt, 800); }
    else { document.getElementById('gen-res-emi').innerHTML = window.f(emi); document.getElementById('gen-res-i').innerHTML = window.f(tInt); document.getElementById('gen-res-t').innerHTML = window.f(P+tInt); }
    document.getElementById('gen-res-p').textContent = window.f(P); window.drawDonut('gen-chart', P, tInt, '#132A43', '#0E9F6E', 'Principal', 'Interest');
};

// TENURE MONTH 360 LIMIT FIX
window.setTenureMode = (id, isMo) => {
    emiState[id].mo = isMo;
    document.getElementById(`${id}-btn-mo`).classList.toggle('active', isMo); document.getElementById(`${id}-btn-yr`).classList.toggle('active', !isMo);
    document.getElementById(`${id}-t-lbl`).textContent = isMo ? window.t('mo_short') : window.t('yr_short');
    
    let v = window.parseF(document.getElementById(`${id}-t-in`).value);
    let newVal = isMo ? v*12 : v/12;
    document.getElementById(`${id}-t-in`).value = window.f(newVal);
    
    const slider = document.getElementById(`${id}-t-slide`);
    slider.max = isMo ? 360 : 30; // UPDATED LIMIT
    
    const runner = id === 'gen' ? (anim) => window.runGen(anim) : (anim) => window.runEMI(id, anim);
    window.bindInputSlider(`${id}-t-slide`, `${id}-t-in`, 1, isMo ? 360 : 30, false, runner); 
    runner(true);
};
window.setViewMode = (id, isMoView) => { emiState[id].vmo = isMoView; document.getElementById(`${id}-view-mo`).classList.toggle('active', isMoView); document.getElementById(`${id}-view-yr`).classList.toggle('active', !isMoView); window.runEMI(id, false); };

window.runEMI = (id, animate = false) => {
    let P = window.parseF(document.getElementById(`${id}-p-in`).value), R = window.parseF(document.getElementById(`${id}-r-in`).value), T = window.parseF(document.getElementById(`${id}-t-in`).value), ex = window.parseF(document.getElementById(`${id}-ex-in`).value);
    if(P<=0||R<=0||T<=0){ document.getElementById(`${id}-error`).style.display='block'; return; } document.getElementById(`${id}-error`).style.display='none';
    let n = emiState[id].mo ? T : T*12, emi = calcEmiObj(P, R, n), r = (R/12)/100;
    
    let bal = P, tInt = 0, html = '', yPrin = 0, yInt = 0, actN = 0;
    for(let i=1; i<=n && bal>0.01; i++){
        let iTm = bal*r, pTm = emi-iTm+ex; if(pTm>bal) pTm = bal+iTm;
        bal -= (pTm-ex); let aPTm = pTm; bal -= ex; if(bal<0) bal=0;
        yPrin+=aPTm; yInt+=iTm; tInt+=iTm; actN++;
        
        if(emiState[id].vmo) html+=`<tr><td>Yr ${Math.ceil(i/12)}, Mo ${i%12===0 ? 12 : i%12}</td><td>${window.f(aPTm)}</td><td>${window.f(iTm)}</td><td>${window.f(bal)}</td></tr>`;
        if(i%12===0 || bal===0){ if(!emiState[id].vmo) html+=`<tr><td>Year ${Math.ceil(i/12)}</td><td>${window.f(yPrin)}</td><td>${window.f(yInt)}</td><td>${window.f(bal)}</td></tr>`; yPrin=0; yInt=0; }
    }
    
    if(animate) { window.animateValue(document.getElementById(`${id}-res-emi`), 0, emi, 800); window.animateValue(document.getElementById(`${id}-res-i`), 0, tInt, 800); window.animateValue(document.getElementById(`${id}-res-t`), 0, P+tInt, 800); }
    else { document.getElementById(`${id}-res-emi`).innerHTML = window.f(emi); document.getElementById(`${id}-res-i`).innerHTML = window.f(tInt); document.getElementById(`${id}-res-t`).innerHTML = window.f(P+tInt); }
    
    document.getElementById(`${id}-res-p`).textContent = window.f(P); document.getElementById(`${id}-schedule-body`).innerHTML = html; window.drawDonut(`${id}-chart`, P, tInt, '#132A43', '#0E9F6E', 'Principal', 'Interest');
    const pBlk = document.getElementById(`${id}-prepay-block`);
    if(ex>0){ pBlk.style.display='block'; let sMo = n-actN; document.getElementById(`${id}-pre-tenure`).textContent = `${Math.floor(actN/12)}y ${actN%12}m`; document.getElementById(`${id}-pre-saved-time`).textContent = `${Math.floor(sMo/12)}y ${sMo%12}m`; document.getElementById(`${id}-pre-saved-int`).textContent = window.f(((emi*n)-P)-tInt); } else { pBlk.style.display='none'; }
};

window.runComp = (animate = false) => {
    let p1=window.parseF(document.getElementById('ca-p-in').value), r1=window.parseF(document.getElementById('ca-r-in').value), t1=window.parseF(document.getElementById('ca-t-in').value)*12;
    let p2=window.parseF(document.getElementById('cb-p-in').value), r2=window.parseF(document.getElementById('cb-r-in').value), t2=window.parseF(document.getElementById('cb-t-in').value)*12;
    if(p1<=0||r1<=0||t1<=0||p2<=0||r2<=0||t2<=0) return;
    let e1 = calcEmiObj(p1,r1,t1), i1 = (e1*t1)-p1; let e2 = calcEmiObj(p2,r2,t2), i2 = (e2*t2)-p2;
    
    if(animate){ window.animateValue(document.getElementById('ca-res-emi'), 0, e1, 800); window.animateValue(document.getElementById('cb-res-emi'), 0, e2, 800); }
    else { document.getElementById('ca-res-emi').innerHTML = window.f(e1); document.getElementById('cb-res-emi').innerHTML = window.f(e2); }
    document.getElementById('ca-res-i').textContent = window.f(i1); document.getElementById('cb-res-i').textContent = window.f(i2);
    
    const wBox = document.getElementById('comp-winner-box');
    if(i1 !== i2) { wBox.style.display = 'block'; document.getElementById('comp-winner-title').textContent = `${i1 < i2 ? window.t('comp_option_a') : window.t('comp_option_b')} ${window.t('comp_is_better')}`; document.getElementById('comp-savings').textContent = window.f(Math.abs(i1 - i2)); } else { wBox.style.display = 'none'; }
};

window.runSIP = (animate = false) => {
    let M = window.parseF(document.getElementById('sip-m-in').value), R = window.parseF(document.getElementById('sip-r-in').value), T = window.parseF(document.getElementById('sip-t-in').value);
    if(M<=0||R<=0||T<=0){ document.getElementById('sip-error').style.display='block'; return; } document.getElementById('sip-error').style.display='none';
    let i = (R/12)/100, n = T*12, fv = M*((Math.pow(1+i,n)-1)/i)*(1+i), inv = M*n;
    
    if(animate) { 
        window.animateValue(document.getElementById('sip-res-total'), 0, fv, 800); 
        window.animateValue(document.getElementById('sip-res-ret'), 0, fv-inv, 800); 
        window.animateValue(document.getElementById('sip-res-total-final'), 0, fv, 800); // TOTAL MATURITY ADDED
    }
    else { 
        document.getElementById('sip-res-total').innerHTML = window.f(fv); 
        document.getElementById('sip-res-ret').innerHTML = window.f(fv-inv); 
        document.getElementById('sip-res-total-final').innerHTML = window.f(fv); // TOTAL MATURITY ADDED
    }
    document.getElementById('sip-res-inv').textContent = window.f(inv); window.drawDonut('sip-chart', inv, fv-inv, '#132A43', '#0E9F6E', 'Invested', 'Returns');
};

// --- SHARE VIA WHATSAPP ---
window.shareWhatsApp = () => {
    const id = window.state.activePage, sym = window.state.rates[window.state.currency].sym;
    let lines = [];
    if (id === 'gen' || ['hl','cl','pl'].includes(id)) {
        const label = id === 'gen' ? 'EMI Calculation' : (typeof emiConfigs !== 'undefined' ? emiConfigs[id].title : 'EMI Calculation');
        lines.push(`*${label}*`);
        lines.push(`Loan Amount: ${sym}${document.getElementById(`${id}-res-p`).textContent}`);
        lines.push(`Monthly EMI: ${sym}${document.getElementById(`${id}-res-emi`).textContent}`);
        lines.push(`Total Interest: ${sym}${document.getElementById(`${id}-res-i`).textContent}`);
        lines.push(`Total Payable: ${sym}${document.getElementById(`${id}-res-t`).textContent}`);
    } else if (id === 'sip') {
        lines.push('*SIP Calculation*');
        lines.push(`Invested Amount: ${sym}${document.getElementById('sip-res-inv').textContent}`);
        lines.push(`Estimated Returns: ${sym}${document.getElementById('sip-res-ret').textContent}`);
        lines.push(`Total Value: ${sym}${document.getElementById('sip-res-total').textContent}`);
    } else if (id === 'gst') {
        lines.push('*GST Calculation*');
        lines.push(`Base Amount: ${sym}${document.getElementById('gst-res-base').textContent}`);
        lines.push(`Total GST: ${sym}${document.getElementById('gst-res-gst').textContent}`);
        lines.push(`Final Amount: ${sym}${document.getElementById('gst-res-final').textContent}`);
    } else if (id === 'comp') {
        lines.push('*Loan Comparison*');
        lines.push(`Option A — EMI: ${sym}${document.getElementById('ca-res-emi').textContent}, Interest: ${sym}${document.getElementById('ca-res-i').textContent}`);
        lines.push(`Option B — EMI: ${sym}${document.getElementById('cb-res-emi').textContent}, Interest: ${sym}${document.getElementById('cb-res-i').textContent}`);
    }
    lines.push(''); lines.push('Calculated via My EMI Calculator');
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
};

// --- CSV EXPORT (summary for gen/sip/gst/comp, full schedule for hl/cl/pl) ---
window.exportCSV = (id) => {
    const sym = window.state.rates[window.state.currency].sym;
    let csv = '';
    if (id === 'gen') {
        const unit = emiState.gen.mo ? 'Months' : 'Years';
        csv += 'Field,Value\n';
        csv += `Loan Amount,${sym}${document.getElementById('gen-res-p').textContent}\n`;
        csv += `Interest Rate,${document.getElementById('gen-r-in').value}%\n`;
        csv += `Tenure,${document.getElementById('gen-t-in').value} ${unit}\n`;
        csv += `Monthly EMI,${sym}${document.getElementById('gen-res-emi').textContent}\n`;
        csv += `Total Interest,${sym}${document.getElementById('gen-res-i').textContent}\n`;
        csv += `Total Payable,${sym}${document.getElementById('gen-res-t').textContent}\n`;
    } else if (['hl','cl','pl'].includes(id)) {
        csv += 'Period,Principal Paid,Interest Paid,Balance\n';
        document.querySelectorAll(`#${id}-schedule-body tr`).forEach(tr => {
            const cells = Array.from(tr.children).map(td => `"${td.textContent.replace(/,/g,'')}"`);
            csv += cells.join(',') + '\n';
        });
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${id}-emi-calculation.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

window.gstAdd = true;
window.runGST = (animate = false) => {
    let amt = window.parseF(document.getElementById('gst-a-in').value), rSel = document.getElementById('gst-r-sel').value, rate = rSel==='custom' ? window.parseF(document.getElementById('gst-c-in').value) : window.parseF(rSel);
    let b, g, fn; if(window.gstAdd){ b = amt; g = b*(rate/100); fn = b+g; } else { fn = amt; b = fn/(1+(rate/100)); g = fn-b; }
    
    if(animate) window.animateValue(document.getElementById('gst-res-final'), 0, fn, 800);
    else document.getElementById('gst-res-final').innerHTML = window.f(fn);
    document.getElementById('gst-res-base').textContent = window.f(b); document.getElementById('gst-res-gst').textContent = window.f(g); document.getElementById('gst-res-cgst').textContent = window.f(g/2); document.getElementById('gst-res-sgst').textContent = window.f(g/2);
};
