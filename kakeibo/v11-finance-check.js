(() => {
  const ASSET_META = {
    cathay_twd:'TWD', cathay_jpy:'JPY', esun_twd:'TWD', esun_jpy:'JPY',
    sinopac_twd:'TWD', sinopac_jpy:'JPY', post_twd:'TWD', post_fixed:'TWD',
    japanpost_jpy:'JPY', ctbc_twd:'TWD', chb_twd:'TWD', cash_twd:'TWD', cash_jpy:'JPY'
  };
  if(!state.creditCards || !Array.isArray(state.creditCards)){
    state.creditCards=[
      {id:'cc1',name:'信用卡 1',limitTwd:0,outstandingTwd:0,outstandingJpy:0},
      {id:'cc2',name:'信用卡 2',limitTwd:0,outstandingTwd:0,outstandingJpy:0}
    ];
  }
  if(!state.reconcile) state.reconcile={thresholdTwd:1000,baseline:null};
  if(!state.reconcile.thresholdTwd) state.reconcile.thresholdTwd=1000;
  save();

  const style=document.createElement('style');
  style.textContent=`
    .cc-card,.reconcile-card{margin-top:12px}
    .finance-title{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}
    .finance-title h3{margin:0;font-size:16px}.finance-note{font-size:11px;line-height:1.6;color:var(--muted);margin:8px 0 10px}
    .cc-list{display:flex;flex-direction:column;gap:10px}.cc-row{border:1px solid var(--line);border-radius:17px;padding:11px;background:#fff}
    .cc-row-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}.cc-name{width:100%;min-width:0;border:0;background:transparent;font-weight:900;font-size:13px;padding:4px 2px;outline:none}
    .cc-remove{border:0;background:#fff1f1;color:#c3484f;border-radius:10px;padding:7px 9px;font-size:10px;font-weight:800}
    .cc-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:8px}.cc-field label{display:block;font-size:9px;color:var(--muted);margin:0 0 4px 2px}.cc-field input{width:100%;min-width:0;border:1px solid var(--line);border-radius:11px;padding:8px;text-align:right;background:#fff;font-size:11px}
    .cc-summary{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.cc-stat{background:#f8f6f3;border-radius:11px;padding:8px}.cc-stat .k{font-size:9px;color:var(--muted)}.cc-stat .v{font-size:12px;font-weight:900;margin-top:2px}.cc-stat.debt .v{color:#bd3d48}
    .cc-add{border:1px dashed #dfcfc5;background:#fffaf5;color:#7b6c65;border-radius:14px;padding:10px;width:100%;font-weight:850;margin-top:9px}
    .networth-box{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.networth-stat{border-radius:14px;padding:10px;background:linear-gradient(135deg,#edf8ff,#fff)}.networth-stat.debt{background:linear-gradient(135deg,#fff0f1,#fff)}.networth-stat .k{font-size:10px;color:var(--muted)}.networth-stat .v{font-size:16px;font-weight:900;margin-top:3px}
    .reconcile-status{border-radius:17px;padding:13px;margin:10px 0;font-weight:850;line-height:1.5}.reconcile-status.ok{background:#edf8ef;color:#39734d;border:2px solid #b9dfc3}.reconcile-status.bad{background:#fff0f1;color:#b42f3b;border:3px solid #e54852;box-shadow:0 0 0 5px rgba(229,72,82,.07)}.reconcile-status.idle{background:#f7f4f0;color:#766c66;border:1px solid var(--line)}
    .reconcile-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.rec-stat{background:#faf8f5;border-radius:13px;padding:9px}.rec-stat .k{font-size:9px;color:var(--muted)}.rec-stat .v{font-size:13px;font-weight:900;margin-top:3px}
    .reconcile-controls{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end;margin-top:10px}.reconcile-controls label{font-size:10px;color:var(--muted)}.reconcile-controls input{width:100%;border:1px solid var(--line);border-radius:12px;padding:9px;background:#fff}.baseline-btn{border:0;background:linear-gradient(135deg,#72a976,#5b996a);color:#fff;border-radius:13px;padding:10px 12px;font-weight:900;white-space:nowrap}
    .home-reconcile{display:none;border-radius:17px;padding:12px 13px;margin:10px 0;font-size:12px;font-weight:850;line-height:1.5}.home-reconcile.show{display:block}.home-reconcile.bad{background:#fff0f1;color:#b42f3b;border:3px solid #e54852}.home-reconcile.ok{background:#eef8ef;color:#39734d;border:1px solid #b9dfc3}
    @media(max-width:480px){.cc-fields{grid-template-columns:1fr}.cc-summary{grid-template-columns:1fr 1fr}.networth-box,.reconcile-grid{grid-template-columns:1fr 1fr}.reconcile-controls{grid-template-columns:1fr}.baseline-btn{width:100%}}
  `;
  document.head.appendChild(style);

  function assetsNative(){
    let twd=0,jpy=0;
    const a=state.assets||{};
    Object.entries(ASSET_META).forEach(([id,cur])=>{const v=+(a[id]||0);if(cur==='JPY')jpy+=v;else twd+=v});
    return {twd,jpy};
  }
  function cardsNative(){
    let twd=0,jpy=0,limit=0;
    (state.creditCards||[]).forEach(c=>{limit+=+(c.limitTwd||0);twd+=+(c.outstandingTwd||0);jpy+=+(c.outstandingJpy||0)});
    return {twd,jpy,limit};
  }
  function netNative(){const a=assetsNative(),c=cardsNative();return {twd:a.twd-c.twd,jpy:a.jpy-c.jpy}}
  function toTwd(n){return n.twd+n.jpy*state.fxRate}
  function creditDebtTwd(){const c=cardsNative();return c.twd+c.jpy*state.fxRate}
  function grossAssetsTwd(){const a=assetsNative();return a.twd+a.jpy*state.fxRate}

  function txDeltaSinceBaseline(){
    const b=state.reconcile?.baseline;if(!b)return {twd:0,jpy:0};
    const old=new Set(b.txIds||[]);let twd=0,jpy=0;
    (state.transactions||[]).forEach(t=>{
      if(old.has(t.id))return;
      const sign=(t.type||'expense')==='income'?1:-1;
      const amt=+(t.originalAmount||0);
      if((t.currency||'TWD')==='JPY')jpy+=sign*amt;else twd+=sign*amt;
    });
    return {twd,jpy};
  }
  function expectedNative(){
    const b=state.reconcile?.baseline;if(!b)return null;
    const d=txDeltaSinceBaseline();return {twd:+b.twd+d.twd,jpy:+b.jpy+d.jpy};
  }
  function reconcileResult(){
    const actual=netNative(),expected=expectedNative();if(!expected)return null;
    const actualTwd=toTwd(actual),expectedTwd=toTwd(expected),diff=actualTwd-expectedTwd,threshold=+(state.reconcile.thresholdTwd||1000);
    return {actual,expected,actualTwd,expectedTwd,diff,threshold,ok:Math.abs(diff)<=threshold};
  }

  function inject(){
    const settings=document.getElementById('page-settings');
    if(settings&&!document.getElementById('creditCardList')){
      settings.insertAdjacentHTML('beforeend',`<div class="card cc-card"><div class="finance-title"><h3>信用卡／未繳款 💳</h3><span style="font-size:10px;color:var(--muted)">額度不算資產</span></div><div class="finance-note">信用卡「額度」只是可借用上限，不會從資產扣除；只有目前已使用、尚未繳清的金額才是負債，會自動從淨資產扣掉。</div><div id="creditCardList" class="cc-list"></div><button id="addCreditCard" class="cc-add">＋ 新增信用卡</button><div class="networth-box"><div class="networth-stat debt"><div class="k">信用卡未繳合計</div><div id="creditDebtTotal" class="v">—</div></div><div class="networth-stat"><div class="k">淨資產（資產－卡費）</div><div id="netWorthTotal" class="v">—</div></div></div></div>`);
      document.getElementById('addCreditCard').onclick=()=>{state.creditCards.push({id:'cc'+Date.now(),name:'新信用卡',limitTwd:0,outstandingTwd:0,outstandingJpy:0});save();renderFinanceV11()};
    }
    if(settings&&!document.getElementById('reconcileStatus')){
      settings.insertAdjacentHTML('beforeend',`<div class="card reconcile-card"><div class="finance-title"><h3>記帳 Double Check ✅</h3><span style="font-size:10px;color:var(--muted)">預設容許 NT$1,000</span></div><div class="finance-note">先把所有銀行餘額與信用卡未繳款更新正確，再按「以目前狀態建立基準」。之後系統會用「基準淨資產＋已記收入－已記支出」推算應有資產；如果和你更新的實際資產差超過門檻，就顯示「有帳未計」。匯率變動會以目前 JPY/TWD 匯率重算，不會單純因匯率波動誤報。</div><div id="reconcileStatus" class="reconcile-status idle">尚未建立對帳基準。</div><div class="reconcile-grid"><div class="rec-stat"><div class="k">應有淨資產</div><div id="expectedNet" class="v">—</div></div><div class="rec-stat"><div class="k">實際淨資產</div><div id="actualNet" class="v">—</div></div><div class="rec-stat"><div class="k">差額</div><div id="reconcileDiff" class="v">—</div></div><div class="rec-stat"><div class="k">基準後已記交易</div><div id="reconcileTxCount" class="v">—</div></div></div><div class="reconcile-controls"><div><label>警示門檻（TWD）</label><input id="reconcileThreshold" type="number" inputmode="numeric" min="0" step="100" value="${state.reconcile.thresholdTwd||1000}"></div><button id="setBaseline" class="baseline-btn">以目前狀態建立／重設基準</button></div></div>`);
      document.getElementById('reconcileThreshold').onchange=e=>{state.reconcile.thresholdTwd=Math.max(0,+e.target.value||1000);save();renderFinanceV11()};
      document.getElementById('setBaseline').onclick=setBaseline;
    }
    const home=document.getElementById('page-home');
    if(home&&!document.getElementById('homeReconcile')){
      const flow=document.querySelector('.flow-strip');
      (flow||home.querySelector('.fxbar'))?.insertAdjacentHTML('afterend','<div id="homeReconcile" class="home-reconcile"></div>');
    }
  }

  function cardRow(c){
    const row=document.createElement('div');row.className='cc-row';
    row.innerHTML=`<div class="cc-row-top"><input class="cc-name" value="${String(c.name||'信用卡').replaceAll('"','&quot;')}" aria-label="信用卡名稱"><button class="cc-remove">刪除</button></div><div class="cc-fields"><div class="cc-field"><label>信用額度（TWD）</label><input class="cc-limit" type="number" inputmode="numeric" min="0" step="100" value="${+c.limitTwd||''}" placeholder="0"></div><div class="cc-field"><label>未繳／已使用（TWD）</label><input class="cc-twd" type="number" inputmode="decimal" min="0" step="1" value="${+c.outstandingTwd||''}" placeholder="0"></div><div class="cc-field"><label>未繳／已使用（JPY）</label><input class="cc-jpy" type="number" inputmode="decimal" min="0" step="1" value="${+c.outstandingJpy||''}" placeholder="0"></div></div><div class="cc-summary"><div class="cc-stat"><div class="k">可用額度（約）</div><div class="v cc-available">—</div></div><div class="cc-stat debt"><div class="k">未繳合計（約）</div><div class="v cc-debt">—</div></div></div>`;
    const commit=()=>{c.name=row.querySelector('.cc-name').value.trim()||'信用卡';c.limitTwd=Math.max(0,+row.querySelector('.cc-limit').value||0);c.outstandingTwd=Math.max(0,+row.querySelector('.cc-twd').value||0);c.outstandingJpy=Math.max(0,+row.querySelector('.cc-jpy').value||0);save();renderFinanceV11()};
    row.querySelectorAll('input').forEach(i=>i.addEventListener('change',commit));
    row.querySelector('.cc-remove').onclick=()=>{state.creditCards=state.creditCards.filter(x=>x.id!==c.id);save();renderFinanceV11()};
    const debt=+(c.outstandingTwd||0)+ +(c.outstandingJpy||0)*state.fxRate,avail=Math.max(0,+(c.limitTwd||0)-debt);
    row.querySelector('.cc-available').textContent='NT$'+Math.round(avail).toLocaleString('zh-TW');
    row.querySelector('.cc-debt').textContent='NT$'+Math.round(debt).toLocaleString('zh-TW');
    return row;
  }

  function setBaseline(){
    const n=netNative();
    state.reconcile.baseline={twd:n.twd,jpy:n.jpy,txIds:(state.transactions||[]).map(t=>t.id),createdAt:new Date().toISOString()};
    save();renderFinanceV11();
  }

  function renderFinanceV11(){
    inject();
    const list=document.getElementById('creditCardList');if(list){list.innerHTML='';(state.creditCards||[]).forEach(c=>list.appendChild(cardRow(c)))}
    const debt=creditDebtTwd(),gross=grossAssetsTwd(),net=gross-debt;
    const debtEl=document.getElementById('creditDebtTotal'),netEl=document.getElementById('netWorthTotal');
    if(debtEl)debtEl.textContent='NT$'+Math.round(debt).toLocaleString('zh-TW');
    if(netEl)netEl.textContent='NT$'+Math.round(net).toLocaleString('zh-TW');
    const assetTotal=document.getElementById('assetTotal');if(assetTotal&&assetTotal.textContent!=='••••••')assetTotal.textContent=money(net);

    const r=reconcileResult(),status=document.getElementById('reconcileStatus'),home=document.getElementById('homeReconcile');
    if(!r){
      if(status){status.className='reconcile-status idle';status.textContent='尚未建立對帳基準。請先確認銀行餘額與信用卡未繳款都正確，再建立基準。'}
      if(home){home.className='home-reconcile';home.textContent=''}
      ['expectedNet','actualNet','reconcileDiff','reconcileTxCount'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='—'});
      return;
    }
    const diffAbs=Math.abs(r.diff),diffText=(r.diff>=0?'+':'−')+'NT$'+Math.round(diffAbs).toLocaleString('zh-TW');
    if(status){
      if(r.ok){status.className='reconcile-status ok';status.textContent=`✅ 對帳正常｜帳面與實際差 ${diffText}，在 NT$${Math.round(r.threshold).toLocaleString('zh-TW')} 容許範圍內。`}
      else{status.className='reconcile-status bad';status.textContent=`⚠️ 有帳未計｜帳面與實際差 ${diffText}，已超過 NT$${Math.round(r.threshold).toLocaleString('zh-TW')}。請檢查是否漏記支出／收入、卡費，或尚未更新某個帳戶餘額。`}
    }
    if(home){home.className='home-reconcile show '+(r.ok?'ok':'bad');home.textContent=r.ok?`✅ 對帳正常｜差額 ${diffText}`:`⚠️ 有帳未計｜差額 ${diffText}，請先對帳再繼續花錢。`}
    const e1=document.getElementById('expectedNet'),e2=document.getElementById('actualNet'),e3=document.getElementById('reconcileDiff'),e4=document.getElementById('reconcileTxCount');
    if(e1)e1.textContent='NT$'+Math.round(r.expectedTwd).toLocaleString('zh-TW');if(e2)e2.textContent='NT$'+Math.round(r.actualTwd).toLocaleString('zh-TW');if(e3)e3.textContent=diffText;
    if(e4){const old=new Set(state.reconcile.baseline?.txIds||[]);e4.textContent=(state.transactions||[]).filter(t=>!old.has(t.id)).length+' 筆'}
  }

  inject();
  const baseRender=window.render;
  window.render=function(){baseRender();setTimeout(renderFinanceV11,0)};
  setTimeout(renderFinanceV11,0);
})();
