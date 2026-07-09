// --- 1. GENERATE DYNAMIC EMI PAGES IN HTML ---
const emiConfigs = {
    'hl': { title: 'Home Loan EMI Calculator', dp: 3000000, dr: 8.5, dt: 20, maxP: 20000000 },
    'cl': { title: 'Car Loan EMI Calculator', dp: 800000, dr: 9.5, dt: 5, maxP: 5000000 },
    'pl': { title: 'Personal Loan EMI Calculator', dp: 300000, dr: 13, dt: 3, maxP: 2500000 }
};

let emiHtml = '';
for (const [id, cfg] of Object.entries(emiConfigs)) {
    emiHtml += `
    <div id="page-${id}" class="page-view">
        <div class="hero-fade" style="text-align: center; margin-bottom: 32px;" class="anim-top d-1"><h1>${cfg.title}</h1><p class="subtext mt-2">Symbol only — not a live currency conversion.</p></div>
        <div class="ledger-card grid">
            <div>
                <div id="${id}-error" class="error-text">Values must be greater than zero.</div>
                <div class="input-group anim-left d-2"><div class="input-header"><label>Loan Amount</label><div class="value-box-wrapper"><span class="currency-symbol">₹</span><input type="text" id="${id}-p-in" class="value-box"></div></div><div class="slider-container"><input type="range" id="${id}-p-slide" min="0" max="100"></div></div>
                <div class="input-group anim-left d-3"><div class="input-header"><label>Rate (p.a.)</label><div class="value-box-wrapper"><input type="text" id="${id}-r-in" class="value-box" style="width:70px;"><span style="font-weight:700; color:var(--mint-dark); margin-left:4px;">%</span></div></div><div class="slider-container"><input type="range" id="${id}-r-slide" min="1" max="25" step="0.05"></div></div>
                <div class="input-group anim-left d-4"><div class="input-header"><label>Tenure</label><div class="btn-group"><button class="btn-toggle active" onclick="window.setTenureMode('${id}', false)" id="${id}-btn-yr">Years</button><button class="btn-toggle" onclick="window.setTenureMode('${id}', true)" id="${id}-btn-mo">Months</button></div><div class="value-box-wrapper"><input type="text" id="${id}-t-in" class="value-box" style="width:70px;"><span id="${id}-t-lbl" style="font-weight:700; color:var(--mint-dark); margin-left:4px;">Yr</span></div></div><div class="slider-container"><input type="range" id="${id}-t-slide" min="1" max="30"></div></div>
                <hr class="anim-left d-5"><div class="input-group anim-left d-5"><div class="input-header"><label>Extra Monthly Prepayment</label><div class="value-box-wrapper"><span class="currency-symbol">₹</span><input type="text" id="${id}-ex-in" class="value-box"></div></div><div class="slider-container"><input type="range" id="${id}-ex-slide" min="0" max="100"></div></div>
            </div>
            <div class="sticky-col">
                <div class="hero-display anim-top d-2"><h3>Monthly EMI</h3><div class="hero-amount mono"><span class="currency-symbol">₹</span><span id="${id}-res-emi">0</span></div></div>
                <div class="chart-container anim-scale d-3"><canvas id="${id}-chart"></canvas></div>
                <div class="mt-4 anim-right d-4"><div class="result-row"><span class="result-label">Principal</span><span class="result-value mono"><span class="currency-symbol">₹</span><span id="${id}-res-p">0</span></span></div><div class="result-row"><span class="result-label">Interest</span><span class="result-value mono"><span class="currency-symbol">₹</span><span id="${id}-res-i">0</span></span></div><div class="result-row"><span class="result-label">Total Payable</span><span class="result-value mono"><span class="currency-symbol">₹</span><span id="${id}-res-t">0</span></span></div></div>
                <div id="${id}-prepay-block" style="display:none; background:var(--mint-bg); padding:16px; border-radius:8px; margin-top:20px; transition: background 0.4s ease;" class="anim-right d-5"><h4 style="color:var(--text-heading); margin-bottom:12px;">Prepayment Savings</h4><div class="result-row"><span class="result-label">New Tenure</span><span class="result-value mono" id="${id}-pre-tenure"></span></div><div class="result-row"><span class="result-label">Time Saved</span><span class="result-value mono" id="${id}-pre-saved-time"></span></div><div class="result-row"><span class="result-label">Interest Saved</span><span class="result-value mono" style="color:var(--mint-dark);"><span class="currency-symbol">₹</span><span id="${id}-pre-saved-int"></span></span></div></div>
                <div class="btn-action-group anim-bottom d-5"><button class="btn-whatsapp" onclick="window.shareWhatsApp()">Share 💬</button><button class="btn-sec" onclick="window.exportCSV('${id}')">CSV ⬇️</button><button class="btn-sec" onclick="window.print()">Print 🖨️</button></div>
            </div>
        </div>
        <div class="ledger-card mt-4 anim-bottom d-5"><div class="input-header"><h2>Amortization Schedule</h2><div class="btn-group"><button class="btn-toggle active" id="${id}-view-yr" onclick="window.setViewMode('${id}', false)">Yearly</button><button class="btn-toggle" id="${id}-view-mo" onclick="window.setViewMode('${id}', true)">Monthly</button></div></div><div class="table-wrapper"><table><thead><tr><th>Period</th><th>Principal Paid</th><th>Interest Paid</th><th>Balance</th></tr></thead><tbody id="${id}-schedule-body" class="mono"></tbody></table></div></div>
    </div>`;
}
document.getElementById('emi-pages-container').innerHTML = emiHtml;

// --- 2. PARALLAX SCROLL FADE-OUT EFFECT ---
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const header = document.getElementById('main-header');
    const heroTitles = document.querySelectorAll('.hero-fade');
    
    // Add blurred glass-morphism header background on scroll
    if (scrollY > 20) { header.classList.add('scrolled'); } 
    else { header.classList.remove('scrolled'); }
    
    // Fade out top title texts slowly based on scroll depth
    heroTitles.forEach(title => {
        let opacity = 1 - (scrollY / 250); // Fades completely by 250px down
        title.style.opacity = Math.max(opacity, 0);
        title.style.transform = `translateY(${scrollY * 0.3}px)`; // Slight push down
    });
});

// --- 3. UI, ROUTING & THEME ---
window.toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-btn').textContent = isDark ? '🌙' : '☀️';
    window.saveState('theme', isDark ? 'light' : 'dark');
    window.runGen(); ['hl','cl','pl'].forEach(id => window.runEMI(id, false)); window.runSIP();
};

if(window.loadState('theme', 'light') === 'dark') window.toggleTheme();

document.getElementById('currency-select').addEventListener('change', (e) => {
    window.state.currency = e.target.value;
    document.querySelectorAll('.currency-symbol').forEach(el => el.textContent = window.state.rates[window.state.currency].sym);
    runActiveCalc(false); if(window.state.activePage !== 'comp') window.runComp(false);
});

// GST Logic Binder
document.getElementById('gst-mode-add').onclick = () => { window.gstAdd=true; document.getElementById('gst-mode-add').classList.add('active'); document.getElementById('gst-mode-rem').classList.remove('active'); window.runGST(true); };
document.getElementById('gst-mode-rem').onclick = () => { window.gstAdd=false; document.getElementById('gst-mode-rem').classList.add('active'); document.getElementById('gst-mode-add').classList.remove('active'); window.runGST(true); };
document.getElementById('gst-r-sel').onchange = (e) => { document.getElementById('gst-custom-box').style.display = e.target.value==='custom'?'block':'none'; window.runGST(true); };
['gst-a-in', 'gst-c-in'].forEach(id => { const el = document.getElementById(id); el.addEventListener('input', () => el.value=el.value.replace(/[^0-9.]/g,'')); el.addEventListener('blur', () => { el.value=window.f(window.parseF(el.value)); window.saveState(id, el.value); window.runGST(true);}); });

const titles = { 'gen': 'My EMI Calculator', 'hl': emiConfigs.hl.title, 'cl': emiConfigs.cl.title, 'pl': emiConfigs.pl.title, 'comp': 'Compare Loans | My EMI Calculator', 'sip': 'SIP Calculator | My EMI Calculator', 'gst': 'GST Calculator | My EMI Calculator' };

window.switchTab = (tabId) => {
    window.state.activePage = tabId;
    document.querySelectorAll('.page-view').forEach(el => { el.classList.remove('active', 'assemble'); void el.offsetWidth; });
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.toggle('active', el.dataset.target === tabId));
    document.getElementById(`page-${tabId}`).classList.add('active', 'assemble');
    document.title = titles[tabId]; 
    runActiveCalc(true); window.scrollTo({ top: 0, behavior: 'smooth' });
};

const runActiveCalc = (animate) => {
    if(window.state.activePage==='gen') window.runGen(animate); else if(['hl','cl','pl'].includes(window.state.activePage)) window.runEMI(window.state.activePage, animate); else if(window.state.activePage==='comp') window.runComp(animate); else if(window.state.activePage==='sip') window.runSIP(animate); else if(window.state.activePage==='gst') window.runGST(animate);
};

document.querySelectorAll('.nav-tab').forEach(btn => btn.addEventListener('click', (e) => window.switchTab(e.target.dataset.target)));

// --- 4. DEFAULT BINDINGS ---
const bindValues = (prefix, defP, defR, defT, maxP) => {
    document.getElementById(`${prefix}-p-in`).value = window.f(window.loadState(`${prefix}-p-in`, defP)); document.getElementById(`${prefix}-p-slide`).value = 100*Math.cbrt((window.parseF(window.loadState(`${prefix}-p-in`, defP))-100)/(maxP-100)); 
    document.getElementById(`${prefix}-r-in`).value = window.loadState(`${prefix}-r-in`, defR); document.getElementById(`${prefix}-r-slide`).value = window.loadState(`${prefix}-r-in`, defR); 
    document.getElementById(`${prefix}-t-in`).value = window.loadState(`${prefix}-t-in`, defT); document.getElementById(`${prefix}-t-slide`).value = window.loadState(`${prefix}-t-in`, defT);
};

bindValues('gen', 1000000, 8.5, 5, 10000000);
window.bindInputSlider('gen-p-slide', 'gen-p-in', 100, 10000000, true, (anim) => window.runGen(anim)); window.bindInputSlider('gen-r-slide', 'gen-r-in', 1, 25, false, (anim) => window.runGen(anim)); window.bindInputSlider('gen-t-slide', 'gen-t-in', 1, 30, false, (anim) => window.runGen(anim));

for(const [id, cfg] of Object.entries(emiConfigs)){
    bindValues(id, cfg.dp, cfg.dr, cfg.dt, cfg.maxP);
    document.getElementById(`${id}-ex-in`).value = window.loadState(`${id}-ex-in`, 0); document.getElementById(`${id}-ex-slide`).value = window.loadState(`${id}-ex-in`, 0);
    window.bindInputSlider(`${id}-p-slide`, `${id}-p-in`, 100, cfg.maxP, true, (anim) => window.runEMI(id, anim)); window.bindInputSlider(`${id}-r-slide`, `${id}-r-in`, 1, 25, false, (anim) => window.runEMI(id, anim)); window.bindInputSlider(`${id}-t-slide`, `${id}-t-in`, 1, 30, false, (anim) => window.runEMI(id, anim)); window.bindInputSlider(`${id}-ex-slide`, `${id}-ex-in`, 0, 50000, true, (anim) => window.runEMI(id, anim));
}

document.getElementById('ca-p-in').value = window.f(window.loadState('ca-p-in', 3000000)); document.getElementById('ca-r-in').value = window.loadState('ca-r-in', 8.5); document.getElementById('ca-t-in').value = window.loadState('ca-t-in', 20); document.getElementById('cb-p-in').value = window.f(window.loadState('cb-p-in', 3000000)); document.getElementById('cb-r-in').value = window.loadState('cb-r-in', 9.0); document.getElementById('cb-t-in').value = window.loadState('cb-t-in', 15);
['ca-p-in','ca-r-in','ca-t-in','cb-p-in','cb-r-in','cb-t-in'].forEach(id => { const el = document.getElementById(id); el.addEventListener('input', () => el.value=el.value.replace(/[^0-9.]/g,'')); el.addEventListener('blur', () => { el.value=window.f(window.parseF(el.value)); window.saveState(id, el.value); window.runComp(true);}); });

document.getElementById('sip-m-in').value = window.f(window.loadState('sip-m-in', 5000)); document.getElementById('sip-m-slide').value = 100*Math.cbrt((window.parseF(window.loadState('sip-m-in', 5000))-100)/(200000-100)); document.getElementById('sip-r-in').value = window.loadState('sip-r-in', 12); document.getElementById('sip-r-slide').value = window.loadState('sip-r-in', 12); document.getElementById('sip-t-in').value = window.loadState('sip-t-in', 10); document.getElementById('sip-t-slide').value = window.loadState('sip-t-in', 10);
window.bindInputSlider('sip-m-slide', 'sip-m-in', 100, 200000, true, (anim) => window.runSIP(anim)); window.bindInputSlider('sip-r-slide', 'sip-r-in', 1, 30, false, (anim) => window.runSIP(anim)); window.bindInputSlider('sip-t-slide', 'sip-t-in', 1, 40, false, (anim) => window.runSIP(anim));

document.getElementById('gst-a-in').value = window.f(window.loadState('gst-a-in', 1000)); document.getElementById('gst-c-in').value = window.loadState('gst-c-in', 18);

// Start
runActiveCalc(true); window.runComp(true); window.runGST(true);
