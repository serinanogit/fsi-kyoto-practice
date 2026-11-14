(() => {
 const FKEY='serina-kakeibo-finance-v13',KEY='serina-kakeibo-safe-v24';
 function load(k){try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return {}}}
 const legacy=load(FKEY),C=load(KEY);
 const ACCOUNT=[
  ['cathay_twd','國泰｜台幣','TWD'],['cathay_jpy','國泰｜日圓','JPY'],
  ['esun_twd','玉山｜台幣','TWD'],['esun_jpy','玉山｜日圓','JPY'],
  ['sinopac_twd','永豐｜台幣','TWD'],['sinopac_jpy','永豐｜日圓','JPY'],
  ['post_twd','台灣郵局｜活存','TWD'],['post_fixed','台灣郵局｜定存','TWD'],
  ['japanpost_jpy','日本郵局｜日圓','JPY'],['ctbc_twd','中信｜台幣','TWD'],
  ['chb_twd','彰銀｜台幣','TWD'],['cash_twd','手邊現金｜台幣','TWD'],
  ['cash_jpy','手邊現金｜日圓','JPY']
 ].map(([id,name,currency])=>({id,name,currency}));
 const NORMAL=['esun_twd','esun_jpy','sinopac_twd','sinopac_jpy','cash_jpy'];
 C.accounts=Array.isArray(C.accounts)?C.accounts:(Array.isArray(legacy.j?.accounts)?legacy.j.accounts.slice():NORMAL);
 C.cards=Array.isArray(C.cards)?C.cards:(Array.isArray(legacy.j?.cards)?legacy.j.cards.slice():[]);
 C.reserve=Number.isFinite(+C.reserve)?Math.max(0,+C.reserve):20000;
 C.threshold=Number.isFinite(+C.threshold)?Math.max(0,+C.threshold):1000;
 C.plans=C.plans||{};

 // Keep prior local assets and credit cards. Never publish actual balances to GitHub.
 if(legacy.assets && Object.keys(legacy.assets).length){
  state.assets={...legacy.assets,...(state.assets||{})};
  for(const k of Object.keys(legacy.assets))if(state.assets[k]===undefined)state.assets[k]=legacy.assets[k];
 }
 if(Array.isArray(legacy.cards)&&legacy.cards.length)state.creditCards=legacy.cards;
 const oldSave=window.save;
 function persist(){
  localStorage.setItem(KEY,JSON.stringify(C));
  legacy.assets=state.assets||{};
  legacy.cards=state.creditCards||[];
  localStorage.setItem(FKEY,JSON.stringify(legacy));
 }
 function saveAll(){persist();oldSave();setTimeout(update,0)}
 window.save=saveAll;
 Object.keys(C.plans).forEach(m=>{if(PLANS[m])PLANS[m]={...PLANS[m],...C.plans[m]}});
 persist();

 const RECOMMEND={
  '2026-11':{lodging:8620,fixed:2500,daily:23880,kansai:3000,bigTrip:0,oneoff:2000},
  '2026-12':{lodging:8620,fixed:2500,daily:25880,kansai:3000,bigTrip:0,oneoff:0},
  '2027-01':{lodging:8620,fixed:2500,daily:25880,kansai:3000,bigTrip:0,oneoff:0},
  '2027-02':{lodging:8620,fixed:2500,daily:25880,kansai:3000,bigTrip:0,oneoff:0},
  '2027-03':{lodging:26130,fixed:2500,daily:19370,kansai:4000,bigTrip:0,oneoff:0},
  '2027-04':{lodging:6566,fixed:412,daily:3022,kansai:0,bigTrip:0,oneoff:0}
 };
 const fmt=v=>'NT$'+Math.round(Math.abs(v||0)).toLocaleString('zh-TW');
 const monthLabels={'2026-11':'11月','2026-12':'12月','2027-01':'1月','2027-02':'2月','2027-03':'3月','2027-04':'4月'};
 const total=p=>Object.values(p).reduce((s,v)=>s+(+v||0),0);

 const css=document.createElement('style');
 css.textContent=`
 #page-settings .reconcile-card,#homeReconcile{display:none!important}
 #safeFinanceCard{margin-top:15px}
 #safeFinanceCard h3{font-size:17px;margin:6px 0 10px}
 #safeFinanceCard h4{font-size:14px;margin:13px 0 6px}
 #safeFinanceCard .sf-note{font-size:11px;line-height:1.65;color:#82756c;margin:7px 0}
 #safeFinanceCard .sf-check{display:flex;align-items:center;justify-content:space-between;gap:7px;padding:6px 3px;font-size:12px;border-bottom:1px solid #f4ece6}
 #safeFinanceCard .sf-check label{display:flex;gap:8px;align-items:center;flex:1}
 #safeFinanceCard .sf-check input{accent-color:#5c9674;width:17px;height:17px}
 #safeFinanceCard details{border:1px solid #eee2d9;padding:11px;border-radius:13px;margin:9px 0;background:#fffcf9}
 #safeFinanceCard summary{font-size:12px;font-weight:850;cursor:pointer}
 #safeFinanceCard .sf-result{border:1px solid #ddd4c8;border-radius:15px;padding:12px;margin:10px 0;background:#faf8f6;font-size:12px;line-height:1.7}
 #safeFinanceCard .sf-result.ok{background:#f1faf2;border-color:#a7d5b4;color:#2b694a}
 #safeFinanceCard .sf-result.warn{background:#fff5e8;border-color:#e2b77c;color:#9c5c19}
 #safeFinanceCard .sf-result.danger{background:#fff0f1;border-color:#e3a0a6;color:#a42b39}
 #safeFinanceCard .sf-controls{display:grid;grid-template-columns:1fr 1fr;gap:7px}
 #safeFinanceCard .sf-controls button,#safeFinanceCard .sf-btn{border:0;border-radius:13px;padding:11px 8px;min-height:43px;font-size:12px;font-weight:900;background:#5e9975;color:white;cursor:pointer}
 #safeFinanceCard .sf-controls button.secondary{background:#eee7df;color:#665c52}
 #safeFinanceCard input[type=number]{width:105px;min-width:0;max-width:100%;box-sizing:border-box;padding:7px;border:1px solid #e6d8cd;border-radius:9px;text-align:right}
 #safeFinanceCard .sf-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:9px 0}
 #safeFinanceCard .sf-stat{background:#f6f4f1;padding:10px;border-radius:11px}
 #safeFinanceCard .sf-stat small{display:block;font-size:10px;color:#7c716c}
 #safeFinanceCard .sf-stat strong{display:block;font-size:15px;margin-top:4px}
 #safeFinanceCard .sf-planline{display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #f0eae4;font-size:12px}
 #safeFinanceCard .sf-divider{height:1px;background:#eadfd6;margin:16px 0}
 #safeFinanceCard .sf-risk{padding:9px;background:#fff6e4;border-radius:11px;color:#80561d;font-size:11px;line-height:1.6}
 #safeFinanceCard .sf-warn{color:#ad3749!important;font-weight:800}
 #safeHomeStatus{margin:9px 0;font-size:12px;padding:12px;background:#f6f3ed;border-radius:14px}
 @media(max-width:390px){#safeFinanceCard .sf-controls{grid-template-columns:1fr}#safeFinanceCard .sf-stat strong{font-size:13px}}
 `;
 document.head.appendChild(css);

 function assetPool(){
  const selected=new Set(C.accounts);
  let twd=0,jpy=0;
  ACCOUNT.forEach(a=>{
   if(!selected.has(a.id))return;
   const value=Number(state.assets?.[a.id]||0);
   if(a.currency==='TWD')twd+=value;else jpy+=value;
  });
  (state.creditCards||[]).forEach(c=>{
   if(C.cards.includes(c.id)){twd-=Number(c.outstandingTwd||0);jpy-=Number(c.outstandingJpy||0)}
  });
  return {twd,jpy,value:twd+jpy*state.fxRate};
 }
 function paymentIncluded(t){
  const p=t.payment||'',ids=new Set(C.accounts);
  if((t.type||'expense')==='income'){
   if(p==='現金收入')return ids.has(t.currency==='JPY'?'cash_jpy':'cash_twd');
   if(p.includes('玉山'))return ids.has('esun_twd')||ids.has('esun_jpy');
   if(p.includes('永豐'))return ids.has('sinopac_twd')||ids.has('sinopac_jpy');
   if(p.includes('日本郵局'))return ids.has('japanpost_jpy');
   return false;
  }
  if(p.includes('玉山熊本熊卡'))return (state.creditCards||[]).some(c=>C.cards.includes(c.id)&&String(c.name).includes('玉山'));
  if(p.includes('國泰'))return (state.creditCards||[]).some(c=>C.cards.includes(c.id)&&String(c.name).includes('國泰'));
  if(p==='日圓現金')return ids.has('cash_jpy');
  if(p==='永豐提款 → 現金')return ids.has('cash_jpy')||ids.has('sinopac_jpy');
  if(p==='現金')return ids.has(t.currency==='JPY'?'cash_jpy':'cash_twd');
  return false;
 }
 function flow(t){
  if(!paymentIncluded(t))return {twd:0,jpy:0};
  const sign=(t.type||'expense')==='income'?1:-1,amt=sign*Number(t.originalAmount||0);
  return (t.currency||'TWD')==='JPY'?{twd:0,jpy:amt}:{twd:amt,jpy:0};
 }
 function snapshot(){
  const flows={};
  (state.transactions||[]).forEach(t=>{if(t?.id)flows[String(t.id)]=flow(t)});
  return flows;
 }
 function diff(){
  if(!C.baseline)return null;
  const actual=assetPool(),before=C.baseline;
  let twd=0,jpy=0,changed=0;
  const old=before.flows||{},now=snapshot();
  new Set([...Object.keys(old),...Object.keys(now)]).forEach(id=>{
   const a=now[id]||{twd:0,jpy:0},b=old[id]||{twd:0,jpy:0};
   const dt=a.twd-b.twd,dj=a.jpy-b.jpy;
   if(Math.abs(dt)>0.001||Math.abs(dj)>0.001){changed++;twd+=dt;jpy+=dj}
  });
  const expected={twd:before.twd+twd,jpy:before.jpy+jpy};
  const expectedValue=expected.twd+expected.jpy*state.fxRate;
  const difference=actual.value-expectedValue;
  const moved=Math.abs(actual.twd-before.twd)+Math.abs(actual.jpy-before.jpy);
  return {actual,expected,expectedValue,difference,changed,moved,verified:changed>0||moved>0.001};
 }
 function createBaseline(){
  if(C.baseline&&!confirm('重設會把先前未解決的差額歸零，並失去從舊起點追蹤變動的能力。確定仍要重設嗎？'))return;
  if(!confirm('這是建立「追蹤起點」，不是檢驗以前的帳有沒有記對。請先確認銀行／現金／信用卡未繳款已更新，再繼續。'))return;
  const a=assetPool();C.baseline={twd:a.twd,jpy:a.jpy,flows:snapshot(),at:new Date().toISOString()};
  persist();update();
 }
 window.serinaFinanceInvalidateBaseline=function(reason){
  C.baseline=null;C.invalidReason=reason;persist();update();
 };

 function financeUI(){
  const settings=document.getElementById('page-settings');
  if(!settings||document.getElementById('safeFinanceCard'))return;
  const card=document.createElement('section');card.id='safeFinanceCard';card.className='card';
  card.innerHTML=`
   <h3>🔎 日本資金對帳・安全預算 v24</h3>
   <div class="sf-note">對帳只算勾選的日本使用資金，凍結資產和投資不當作可以花的生活費。建立基準≠對帳成功。</div>
   <details><summary>核對：哪些帳戶屬於日本使用資金？</summary><div id="sfAccounts"></div><div class="sf-note">國泰、郵局及其他封印資產預設不納入。若你自己勾選它們，會改變比較範圍並清除舊基準。</div>
   <h4>日本生活用信用卡（未繳款會扣掉）</h4><div id="sfCards"></div></details>
   <div class="sf-grid"><div class="sf-stat"><small>實際日本可用淨額</small><strong id="sfActual">—</strong></div><div class="sf-stat"><small>追蹤基準／帳上應有</small><strong id="sfExpected">—</strong></div></div>
   <div id="sfStatus" class="sf-result">尚未建立對帳起點。</div>
   <div class="sf-controls"><button type="button" id="sfCheckBtn">核對目前差額</button><button type="button" class="secondary" id="sfBaseBtn">建立／重設追蹤起點</button></div>
   <div class="sf-note">按下「建立」後，若沒有新交易或餘額變動，只能顯示「尚無可檢驗變動」，不會假裝已對帳成功。</div>
   <div class="sf-divider"></div>
   <h3>🧺 依實際支出重新規劃</h3>
   <div class="sf-note">這個功能與對帳差額完全分開，任何時候都能重新估算。目標接近每月 NT$40,000（已含宿舍與小旅行）；大旅行不額外加預算。</div>
   <div class="sf-check"><label>日本資金池最低安全緩衝</label><input id="sfReserve" type="number" inputmode="numeric" step="1000" min="0" value="20000"><b>NT$</b></div>
   <div class="sf-check"><label>對帳差額提醒門檻</label><input id="sfThreshold" type="number" inputmode="numeric" step="100" min="0" value="1000"><b>NT$</b></div>
   <div id="sfPlanRows"></div><div id="sfPlanFoot" class="sf-result"></div>
   <button type="button" id="sfPlanApply" class="sf-btn">確認套用安全版月預算</button>
   <div class="sf-risk">🔒 國泰緊急預備金與台灣郵局資金都不在這裡拿來提高消費上限。12月、2月原先另外編列的各 NT$30,000 大旅行暫不列入新方案；要出發需另外檢查資金或收入。</div>
   <div id="sfHistory" class="sf-note"></div>
  `;
  settings.appendChild(card);
  const home=document.getElementById('page-home');
  if(home&&!document.getElementById('safeHomeStatus')){
   (home.querySelector('.flow-strip')||home.querySelector('.fxbar'))?.insertAdjacentHTML('afterend','<div id="safeHomeStatus">日本資金對帳：尚未建立新的追蹤起點。</div>');
  }
  if(!document.getElementById('carryDetails')){
   const g=document.getElementById('catGrid'),x=document.createElement('div');
   x.id='carryDetails';x.className='carry-note';
   if(g)g.insertAdjacentElement('afterend',x);
  }
  document.getElementById('sfCheckBtn').onclick=update;
  document.getElementById('sfBaseBtn').onclick=createBaseline;
  document.getElementById('sfReserve').onchange=e=>{C.reserve=Math.max(0,+e.target.value||0);persist();update()};
  document.getElementById('sfThreshold').onchange=e=>{C.threshold=Math.max(0,+e.target.value||0);persist();update()};
  document.getElementById('sfPlanApply').onclick=applyProposal;
  drawChecks();
 }
 function drawChecks(){
  const acc=document.getElementById('sfAccounts'),cards=document.getElementById('sfCards');
  if(!acc||!cards)return;
  acc.innerHTML='';cards.innerHTML='';
  ACCOUNT.forEach(a=>{
   const row=document.createElement('div');row.className='sf-check';
   const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=C.accounts.includes(a.id);
   input.onchange=()=>{
    C.accounts=input.checked?[...new Set([...C.accounts,a.id])]:C.accounts.filter(id=>id!==a.id);
    C.baseline=null;C.invalidReason='比較帳戶範圍已改變';persist();update();
   };
   label.appendChild(input);label.appendChild(document.createTextNode(a.name));
   row.appendChild(label);const sym=document.createElement('small');sym.textContent=a.currency;row.appendChild(sym);acc.appendChild(row);
  });
  (state.creditCards||[]).forEach(c=>{
   const row=document.createElement('div');row.className='sf-check';
   const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=C.cards.includes(c.id);
   input.onchange=()=>{
    C.cards=input.checked?[...new Set([...C.cards,c.id])]:C.cards.filter(id=>id!==c.id);
    C.baseline=null;C.invalidReason='比較信用卡範圍已改變';persist();update();
   };
   label.appendChild(input);label.appendChild(document.createTextNode(c.name||'信用卡'));
   row.appendChild(label);cards.appendChild(row);
  });
 }
 function candidate(){
  const plans=Object.fromEntries(MONTHS.map(m=>[m,{...PLANS[m]}]));
  const now=currentYM();
  Object.keys(RECOMMEND).forEach(m=>{if(m>=now)plans[m]={...RECOMMEND[m]}});
  return plans;
 }
 function evaluatePlan(plans){
  const now=currentYM(),engine=window.serinaPlanEngine?.compute(plans,now);
  const detailed=engine?.adjusted||plans;
  let remaining=0;
  MONTHS.filter(m=>m>=now).forEach(m=>{remaining+=total(detailed[m])-monthSpent(m)});
  const pool=assetPool().value;
  return {remaining,pool,safe:pool-remaining,engine};
 }
 function applyProposal(){
  const plans=candidate(),p=evaluatePlan(plans);
  if(p.safe+0.5<C.reserve){
   alert('按目前勾選的日本資金與紀錄，這個方案仍會壓低你設定的安全緩衝。請先核對資產及卡費，或減少可支出金額後再套用。');
   return;
  }
  if(!confirm('要把「目前月份及未來月份」改成安全版預算嗎？\\n\\n這不會刪除任何帳目、銀行餘額或信用卡資料。原先額外兩趟各 NT$30,000 大旅行將不再列入預算。'))return;
  Object.keys(RECOMMEND).forEach(m=>{
   if(m>=currentYM()){C.plans[m]={...RECOMMEND[m]};PLANS[m]={...RECOMMEND[m]}}
  });
  persist();render();update();alert('安全版每月預算已套用。既有記帳與資產都保留。');
 }
 function updatePlan(){
  const rows=document.getElementById('sfPlanRows'),foot=document.getElementById('sfPlanFoot'),btn=document.getElementById('sfPlanApply');
  if(!rows||!foot||!btn)return;
  const plans=candidate(),p=evaluatePlan(plans),now=currentYM();
  rows.innerHTML='';
  Object.keys(RECOMMEND).filter(m=>m>=now).forEach(m=>{
   const row=document.createElement('div');row.className='sf-planline';
   const amount=total(plans[m]);
   row.innerHTML='<span>'+m+'　'+(monthLabels[m]||'')+'</span><b>'+fmt(amount)+'</b>';
   rows.appendChild(row);
  });
  foot.className='sf-result '+(p.safe>=C.reserve?'ok':'danger');
  foot.textContent='目前勾選資金淨額 '+fmt(p.pool)+'；按新方案扣除已記支出後，預計尚需 '+fmt(p.remaining)+'；可保留 '+(p.safe<0?'−':'')+fmt(p.safe)+'。設定的安全緩衝 '+fmt(C.reserve)+'。'+(p.safe<C.reserve?' ⚠️ 目前不足安全底線，不可直接套用。':' ✅ 達安全底線，但仍要持續控制支出。');
  if(p.engine?.unfunded?.length)foot.textContent+=' ⚠️ 舊月份有超支無法分攤到剩餘彈性預算。';
  btn.disabled=p.safe<C.reserve||!!p.engine?.unfunded?.length;
  btn.style.opacity=btn.disabled?'.45':'1';
 }
 function history(){
  const h=document.getElementById('sfHistory');if(!h)return;
  const rows=['2026-09','2026-10','2026-11'].map(m=>{
   const list=state.transactions.filter(t=>ym(t.date)===m);
   const spent=list.filter(t=>(t.type||'expense')!=='income').reduce((s,t)=>s+txTWD(t),0);
   const income=list.filter(t=>(t.type||'expense')==='income').reduce((s,t)=>s+txTWD(t),0);
   return m+' 支出 '+fmt(spent)+'／收入 '+fmt(income);
  });
  h.textContent='📊 已記帳的月份：'+rows.join('；')+'。收入不直接增加生活費上限。';
 }
 function update(){
  financeUI();
  const status=document.getElementById('sfStatus');if(!status)return;
  const a=assetPool(),r=diff();
  document.getElementById('sfActual').textContent=fmt(a.value);
  document.getElementById('sfExpected').textContent=r?fmt(r.expectedValue):'尚無基準';
  const home=document.getElementById('safeHomeStatus');
  if(!r){
   status.className='sf-result';
   status.textContent=C.invalidReason?'需要重建追蹤起點（'+C.invalidReason+'）。':'尚未建立追蹤起點。先核對資產與卡費，之後按「建立／重設追蹤起點」。';
  }else if(!r.verified){
   status.className='sf-result';
   status.textContent='已建立追蹤起點，但沒有新交易或資產變動。差額雖然是 0，這不是對帳成功，也無法驗證舊帳完整。';
  }else{
   const d=r.difference,sign=d>=0?'+':'−';
   status.className='sf-result '+(Math.abs(d)<=C.threshold?'ok':d<0?'danger':'warn');
   status.textContent=(Math.abs(d)<=C.threshold?'✅ 追蹤期間帳實變動一致':'⚠️ 追蹤期間帳實變動不一致')+'｜差額 '+sign+fmt(d)+'，涉及 '+r.changed+' 筆新增／編輯／刪除記錄。'+(d< -C.threshold?' 實際資金較少，請檢查漏記支出或信用卡。':d>C.threshold?' 實際資金較多，請查收入、退款或額外資金。':' 本結果不代表更早的帳已經核對。');
  }
  if(home)home.textContent='日本資金檢查：'+status.textContent;
  const threshold=document.getElementById('sfThreshold'),reserve=document.getElementById('sfReserve');
  if(threshold&&document.activeElement!==threshold)threshold.value=C.threshold;
  if(reserve&&document.activeElement!==reserve)reserve.value=C.reserve;
  updatePlan();history();
 }
 const prior=window.render;
 window.render=function(){prior();setTimeout(update,0)};
 financeUI();saveAll();render();update();
})();