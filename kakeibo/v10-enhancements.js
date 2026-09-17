(() => {
  const INCOME_CATS={
    salary:{name:'打工／薪資',icon:'💼',color:'#4b9a69',soft:'#edf8ef'},
    scholarship:{name:'獎學金／補助',icon:'🎓',color:'#5a88c7',soft:'#eef5ff'},
    refund:{name:'退款／回饋',icon:'↩️',color:'#7c9b78',soft:'#f0f7ee'},
    gift:{name:'家人／其他收入',icon:'🎁',color:'#b184b9',soft:'#f7eff9'},
    otherIncome:{name:'其他收入',icon:'💰',color:'#5aa37a',soft:'#eef9f2'}
  };
  const DEFAULT_ASSETS=[
    {id:'cathay_twd',name:'國泰｜台幣',currency:'TWD'},
    {id:'cathay_jpy',name:'國泰｜日圓',currency:'JPY'},
    {id:'esun_twd',name:'玉山｜台幣',currency:'TWD'},
    {id:'esun_jpy',name:'玉山｜日圓',currency:'JPY'},
    {id:'sinopac_twd',name:'永豐｜台幣',currency:'TWD'},
    {id:'sinopac_jpy',name:'永豐｜日圓',currency:'JPY'},
    {id:'post_twd',name:'郵局｜活存',currency:'TWD'},
    {id:'post_fixed',name:'郵局｜定存',currency:'TWD'},
    {id:'ctbc_twd',name:'中信｜台幣',currency:'TWD'},
    {id:'chb_twd',name:'彰銀｜台幣',currency:'TWD'},
    {id:'cash_twd',name:'手邊現金｜台幣',currency:'TWD'},
    {id:'cash_jpy',name:'手邊現金｜日圓',currency:'JPY'}
  ];
  let entryType='expense',assetMasked=true;
  if(!state.assets) state.assets={};

  const style=document.createElement('style');
  style.textContent=`
    .cat{cursor:pointer;position:relative}.cat:active{transform:scale(.992)}
    .cat-chevron{position:absolute;right:12px;top:14px;color:#b2aaa5;font-size:15px;font-weight:900}
    .flow-strip{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 0}
    .flow-pill{background:#fff;border:1px solid var(--line);border-radius:17px;padding:11px 12px;box-shadow:0 3px 12px rgba(70,45,40,.04)}
    .flow-pill .k{font-size:10px;color:var(--muted)}.flow-pill .v{font-size:16px;font-weight:900;margin-top:3px}.flow-pill.income .v{color:var(--ok)}
    .entry-type{display:grid;grid-template-columns:1fr 1fr;gap:4px;background:#f2ece7;border-radius:16px;padding:4px;margin-bottom:10px}
    .entry-type button{border:0;border-radius:13px;background:transparent;padding:10px;font-weight:900;color:var(--muted)}
    .entry-type button.active.expense{background:#fff;color:var(--mikan-deep);box-shadow:0 2px 9px rgba(70,50,45,.08)}
    .entry-type button.active.income{background:#fff;color:var(--ok);box-shadow:0 2px 9px rgba(70,50,45,.08)}
    .tx.income{border-color:#dcecdf;background:linear-gradient(145deg,#fff,#f6fbf7)}.tx.income .tx-amt{color:var(--ok)}
    .detail-sheet{max-height:78vh;overflow:auto}.detail-sheet h3{color:var(--ink)}
    .detail-total{display:flex;justify-content:space-between;align-items:center;background:var(--mikan-soft);border-radius:16px;padding:12px 13px;margin:10px 0 12px}
    .detail-total strong{font-size:20px;color:var(--mikan-deep)}
    .detail-row{display:flex;justify-content:space-between;gap:14px;padding:11px 2px;border-bottom:1px solid #f0ebe7;font-size:13px}.detail-row:last-child{border-bottom:0}
    .detail-row .name{font-weight:760}.detail-row .amt{font-weight:900;white-space:nowrap}
    .detail-note{margin-top:10px;font-size:11px;line-height:1.6;color:var(--muted);background:#faf7f4;border-radius:14px;padding:11px}
    .assets-card{margin-top:12px}.assets-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}.assets-head h3{margin:0;font-size:16px}
    .privacy-note{font-size:11px;line-height:1.55;color:#5e765f;background:var(--matcha-soft);border-radius:15px;padding:11px;margin-bottom:10px}
    .asset-total{display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,var(--sky-soft),#fff);border-radius:16px;padding:11px 12px;margin-bottom:10px}.asset-total strong{font-size:18px}
    .asset-list{display:flex;flex-direction:column;gap:7px}.asset-row{display:grid;grid-template-columns:minmax(0,1fr) 92px 58px;gap:7px;align-items:center}
    .asset-name{font-size:12px;font-weight:800;min-width:0}.asset-input{width:100%;min-width:0;border:1px solid var(--line);border-radius:12px;padding:9px;text-align:right;background:#fff}.asset-cur{font-size:11px;color:var(--muted);text-align:center}
    .mask-btn{border:1px solid var(--line);background:#fff;border-radius:12px;padding:8px 10px;font-size:11px;font-weight:800;color:#5e5956}
    @media(max-width:480px){.asset-row{grid-template-columns:minmax(0,1fr) 88px 48px}}
  `;
  document.head.appendChild(style);

  function syncDateDisplay(){
    const input=document.getElementById('dateInput'),display=document.getElementById('dateDisplay');
    if(!input||!display)return;
    if(!input.value){display.textContent='選擇日期';return}
    const [y,m,d]=input.value.split('-').map(Number);display.textContent=`${y}年${m}月${d}日`;
  }

  function injectUI(){
    const fx=document.querySelector('.fxbar');
    if(fx && !document.getElementById('monthIncome')){
      fx.insertAdjacentHTML('afterend',`<div class="flow-strip"><div class="flow-pill income"><div class="k">本月收入</div><div id="monthIncome" class="v">+¥0</div></div><div class="flow-pill"><div class="k">本月淨流出</div><div id="monthNetOutflow" class="v">¥0</div></div></div>`);
    }
    const form=document.getElementById('expenseForm');
    if(form && !document.getElementById('expenseTypeBtn')){
      const inputRow=form.querySelector('.input-row');
      inputRow.insertAdjacentHTML('beforebegin',`<div class="entry-type"><button id="expenseTypeBtn" type="button" class="active expense">支出</button><button id="incomeTypeBtn" type="button">收入</button></div>`);
      document.getElementById('expenseTypeBtn').onclick=()=>setEntryType('expense');
      document.getElementById('incomeTypeBtn').onclick=()=>setEntryType('income');
    }
    const settings=document.getElementById('page-settings');
    if(settings && !document.getElementById('assetList')){
      settings.insertAdjacentHTML('beforeend',`<div class="card assets-card"><div class="assets-head"><h3>我的資產 🏦</h3><button id="maskAssetsBtn" class="mask-btn">顯示金額</button></div><div class="privacy-note">🔒 金額只存在你目前這個瀏覽器的 localStorage，不會寫進公開 GitHub 原始碼，也不需要填帳號或卡號。換裝置不會自動同步，除非你匯出／匯入備份。</div><div class="asset-total"><span>資產合計</span><strong id="assetTotal">••••••</strong></div><div id="assetList" class="asset-list"></div></div>`);
      document.getElementById('maskAssetsBtn').onclick=toggleAssetMask;
    }
    if(!document.getElementById('budgetDetailModal')){
      document.body.insertAdjacentHTML('beforeend',`<div id="budgetDetailModal" class="modal"><div class="sheet detail-sheet"><h3 id="budgetDetailTitle">預算細項</h3><div class="detail-total"><span>本月預算</span><strong id="budgetDetailTotal">—</strong></div><div id="budgetDetailRows"></div><div id="budgetDetailNote" class="detail-note"></div><div class="sheet-actions"><button class="cancel" onclick="closeBudgetDetail()">關閉</button><button class="confirm" onclick="closeBudgetDetail()">知道了</button></div></div></div>`);
    }
  }

  function txType(t){return t.type||'expense'}
  function txCatMeta(t){return txType(t)==='income'?(INCOME_CATS[t.category]||{name:t.category,icon:'💰',color:'#4b9a69',soft:'#edf8ef'}):(CATS[t.category]||{name:t.category,icon:'🧾',color:'#bbb',soft:'#f5f5f5'})}
  window.monthSpent=function(m){return state.transactions.filter(t=>ym(t.date)===m&&txType(t)==='expense').reduce((a,t)=>a+txTWD(t),0)};
  window.catSpent=function(m,c){return state.transactions.filter(t=>ym(t.date)===m&&txType(t)==='expense'&&t.category===c).reduce((a,t)=>a+txTWD(t),0)};
  function monthIncome(m){return state.transactions.filter(t=>ym(t.date)===m&&txType(t)==='income').reduce((a,t)=>a+txTWD(t),0)}

  function setEntryType(type){
    entryType=type;
    const eb=document.getElementById('expenseTypeBtn'),ib=document.getElementById('incomeTypeBtn');
    eb.className=type==='expense'?'active expense':'';ib.className=type==='income'?'active income':'';
    updateEntryUI();
  }
  window.setEntryType=setEntryType;
  function updateEntryUI(){
    const cs=document.getElementById('categoryInput');if(!cs)return;
    const src=entryType==='income'?INCOME_CATS:CATS;cs.innerHTML='';
    Object.entries(src).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=`${v.icon} ${v.name}`;cs.appendChild(o)});
    const payment=document.getElementById('paymentInput');
    payment.innerHTML=entryType==='income'?'<option>銀行入帳</option><option>現金收入</option><option>其他</option>':'<option>玉山熊本熊卡</option><option>永豐提款 → 現金</option><option>日圓現金</option><option>其他</option>';
    const need=document.getElementById('needInput');need.disabled=entryType==='income';need.style.opacity=entryType==='income'?'.45':'1';
  }

  function budgetDetailRows(month,cat,total){
    const rows=[];let note='這是目前交換預算的規劃細項；實際帳單或消費仍以你記帳的金額為準。';
    if(cat==='lodging'){
      if(month==='2026-10') rows.push(['百萬遍宿舍月費',8500],['入館費／匯率緩衝',1400]);
      else if(['2026-11','2026-12','2027-01','2027-02'].includes(month)) rows.push(['百萬遍宿舍月費',total]);
      else if(month==='2027-03') rows.push(['百萬遍宿舍月費',8620],['退宿後飯店預留',17510]);
      else if(month==='2027-04') rows.push(['離日前飯店預留',6566]);
      else rows.push(['已付款住宿已從剩餘預算排除',0]);
    }else if(cat==='fixed'){
      if(total===2500){rows.push(['國民健康保險（估）',400],['電費（估）',850],['洗衣（估）',350],['手機／網路／其他固定費（估）',900]);note+=' 固定費拆分先用估算值，之後收到實際帳單可以再調。'}
      else if(month==='2026-09') rows.push(['抵日後固定生活費緩衝',1500]);
      else if(month==='2027-04') rows.push(['最後幾天固定費緩衝',412]);
    }else if(cat==='oneoff'){
      if(month==='2026-09') rows.push(['名古屋尚未發生的現場支出',7680],['入住初期用品',6000]);
      else if(month==='2026-10') rows.push(['入住後補買用品',2000]);
      else rows.push(['本月沒有另外安排一次性支出',0]);
    }else if(cat==='daily') rows.push(['餐食・咖啡・日用品・購物・日常交通共同池',total]);
    else if(cat==='kansai') rows.push(['京都／大阪／關西週末交通與玩樂共同池',total]);
    else if(cat==='bigTrip') rows.push(['大型旅行整包預算',total]);
    return {rows,note};
  }
  window.openBudgetDetail=function(cat){
    const m=selectedMonth(),plan=adjustedPlan(m),c=CATS[cat],total=plan[cat]||0,d=budgetDetailRows(m,cat,total);
    document.getElementById('budgetDetailTitle').textContent=`${c.icon} ${c.name}｜${m.replace('-','/')} 細項`;
    document.getElementById('budgetDetailTotal').textContent=money(total);
    const host=document.getElementById('budgetDetailRows');host.innerHTML='';d.rows.forEach(([n,a])=>{const r=document.createElement('div');r.className='detail-row';r.innerHTML=`<span class="name">${n}</span><span class="amt">${money(a)}</span>`;host.appendChild(r)});
    document.getElementById('budgetDetailNote').textContent=d.note;document.getElementById('budgetDetailModal').classList.add('show');
  };
  window.closeBudgetDetail=()=>document.getElementById('budgetDetailModal').classList.remove('show');

  function renderAssets(){
    const host=document.getElementById('assetList');if(!host)return;host.innerHTML='';let totalTwd=0;
    DEFAULT_ASSETS.forEach(a=>{const val=+(state.assets?.[a.id]||0);totalTwd+=a.currency==='TWD'?val:val*state.fxRate;const row=document.createElement('div');row.className='asset-row';row.innerHTML=`<div class="asset-name">${a.name}</div><input class="asset-input" ${assetMasked?'type="password"':'type="number"'} inputmode="decimal" step="1" min="0" value="${val||''}" placeholder="0"><div class="asset-cur">${a.currency}</div>`;row.querySelector('input').onchange=e=>{state.assets[a.id]=Math.max(0,+e.target.value||0);save();renderAssets()};host.appendChild(row)});
    document.getElementById('assetTotal').textContent=assetMasked?'••••••':money(totalTwd);document.getElementById('maskAssetsBtn').textContent=assetMasked?'顯示金額':'隱藏金額';
  }
  function toggleAssetMask(){assetMasked=!assetMasked;renderAssets()}
  window.toggleAssetMask=toggleAssetMask;

  window.txElement=function(t){
    const c=txCatMeta(t),inc=txType(t)==='income',div=document.createElement('div');div.className='tx'+(inc?' income':'');
    div.innerHTML=`<div class="tx-icon" style="background:${c.soft||'#f5f5f5'}">${c.icon}</div><div><div class="tx-title">${t.note||c.name}</div><div class="tx-meta">${inc?'收入':'支出'}・${c.name} ・ ${t.payment||''}</div></div><div><div class="tx-amt">${inc?'+':''}${money(txTWD(t))}</div><button class="tx-del" onclick="deleteTx('${t.id}')">刪除</button></div>`;return div;
  };
  window.matchSearch=function(t,q){if(!q)return true;q=q.toLowerCase();return (t.note||'').toLowerCase().includes(q)||(txCatMeta(t).name||'').toLowerCase().includes(q)||(t.payment||'').toLowerCase().includes(q)};
  window.renderCalendar=function(y,mo,q){
    const grid=document.getElementById('calendarGrid');if(!grid)return;grid.innerHTML='';const first=new Date(y,mo-1,1),startDow=first.getDay(),days=new Date(y,mo,0).getDate(),prevDays=new Date(y,mo-1,0).getDate(),today=ymdLocal();
    for(let i=0;i<42;i++){let dy,yy=y,mm=mo,other=false;if(i<startDow){dy=prevDays-startDow+i+1;mm=mo-1;if(mm===0){mm=12;yy--}other=true}else if(i>=startDow+days){dy=i-(startDow+days)+1;mm=mo+1;if(mm===13){mm=1;yy++}other=true}else dy=i-startDow+1;const ds=`${yy}-${String(mm).padStart(2,'0')}-${String(dy).padStart(2,'0')}`,txs=state.transactions.filter(t=>t.date===ds&&matchSearch(t,q)),total=txs.filter(t=>txType(t)==='expense').reduce((a,t)=>a+txTWD(t),0),cell=document.createElement('div');cell.className='day';if(other)cell.classList.add('other');if(i%7===0)cell.classList.add('sun');if(i%7===6)cell.classList.add('sat');if(ds===today)cell.classList.add('today');if(ds===selectedDate)cell.classList.add('selected');const dots=txs.slice(0,4).map(t=>`<i style="background:${txCatMeta(t).color||'#bbb'}"></i>`).join('');cell.innerHTML=`<span class="day-num">${dy}</span>${total?`<div class="day-total">${money(total)}</div>`:''}<div class="dots">${dots}</div>`;cell.onclick=()=>{if(!other){selectedDate=ds;renderBook()}};grid.appendChild(cell)}renderSelectedDay(q);
  };
  window.renderSelectedDay=function(q){const d=new Date(selectedDate+'T00:00:00'),labels=['週日','週一','週二','週三','週四','週五','週六'];document.getElementById('selectedDayTitle').textContent=`${d.getMonth()+1}月${d.getDate()}日 ${labels[d.getDay()]}`;const txs=state.transactions.filter(t=>t.date===selectedDate&&matchSearch(t,q)).sort((a,b)=>String(b.id).localeCompare(String(a.id))),exp=txs.filter(t=>txType(t)==='expense').reduce((a,t)=>a+txTWD(t),0),inc=txs.filter(t=>txType(t)==='income').reduce((a,t)=>a+txTWD(t),0);document.getElementById('dailySummary').innerHTML=`<span>${txs.length} 筆・支出 ${money(exp)}${inc?`・收入 +${money(inc)}`:''}</span><strong>${money(exp-inc)}</strong>`;const list=document.getElementById('dailyTransactions');list.innerHTML='';if(!txs.length){list.innerHTML='<div class="empty">沒有記錄・按「＋」新增一筆 🌸</div>';return}txs.forEach(t=>list.appendChild(txElement(t)))};
  window.renderMonthList=function(m,q){const host=document.getElementById('monthList');if(!host)return;host.innerHTML='';const txs=state.transactions.filter(t=>ym(t.date)===m&&matchSearch(t,q)).sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));if(!txs.length){host.innerHTML='<div class="empty">這個月還沒有記錄 🌸</div>';return}const groups={};txs.forEach(t=>(groups[t.date]??=[]).push(t));Object.keys(groups).sort((a,b)=>b.localeCompare(a)).forEach(date=>{const total=groups[date].filter(t=>txType(t)==='expense').reduce((a,t)=>a+txTWD(t),0),inc=groups[date].filter(t=>txType(t)==='income').reduce((a,t)=>a+txTWD(t),0),g=document.createElement('div');g.className='list-group';g.innerHTML=`<div class="list-date"><b>${date.slice(5).replace('-',' / ')}</b><span>${money(total)}${inc?` / +${money(inc)}`:''}</span></div>`;const list=document.createElement('div');list.className='tx-list';groups[date].forEach(t=>list.appendChild(txElement(t)));g.appendChild(list);host.appendChild(g)})};

  function enhanceBudgetCards(){document.querySelectorAll('#catGrid .cat').forEach((el,i)=>{const keys=Object.entries(CATS).filter(([k])=>{const p=adjustedPlan(selectedMonth());return (p[k]||0)!==0||catSpent(selectedMonth(),k)!==0}).map(([k])=>k);const k=keys[i];if(!k)return;el.querySelector('.cat-chevron')||el.insertAdjacentHTML('afterbegin','<span class="cat-chevron">›</span>');el.onclick=()=>openBudgetDetail(k)})}
  function renderFlow(){const m=selectedMonth(),inc=monthIncome(m),spent=monthSpent(m);const a=document.getElementById('monthIncome'),b=document.getElementById('monthNetOutflow');if(a)a.textContent='+'+money(inc);if(b)b.textContent=money(Math.max(0,spent-inc))}

  const baseRender=window.render;
  window.render=function(){baseRender();renderFlow();enhanceBudgetCards();renderAssets()};
  const baseSetCurrency=window.setCurrency;
  window.setCurrency=function(c,rerender=true){baseSetCurrency(c,false);const btn=document.getElementById('globalCurrency');if(btn)btn.textContent=c==='JPY'?'¥':'NT$';if(rerender)render()};

  const form=document.getElementById('expenseForm');
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const amount=+document.getElementById('amountInput').value,date=document.getElementById('dateInput').value,currency=state.currency;if(!amount||!date)return;
      const tx={id:String(Date.now())+Math.random().toString(16).slice(2),type:entryType,date,category:document.getElementById('categoryInput').value,payment:document.getElementById('paymentInput').value,need:entryType==='income'?'':document.getElementById('needInput').value,note:document.getElementById('noteInput').value.trim(),currency,originalAmount:amount,fxRate:state.fxRate,twdValue:currency==='TWD'?amount:amount*state.fxRate};
      const m=ym(date);if(!MONTHS.includes(m)){alert('目前預算範圍是 2026/09～2027/04。');return}
      if(entryType==='income'){state.transactions.push(tx);save();document.getElementById('amountInput').value='';document.getElementById('noteInput').value='';document.getElementById('monthSelect').value=m;selectedDate=date;render();showPage('book');return}
      const budget=sum(adjustedPlan(m)),after=monthSpent(m)+txTWD(tx);
      if(after>budget){pending=tx;const over=after-budget,th=state.settings?.smallOverrun??2000,share=state.settings?.travelShare??70;document.getElementById('overspendText').innerHTML=`記入後，本月會超支 <b>${money(over)}</b>。<br><br>${over<=th?'屬於「小額超支」，月結時會優先從未來旅費扣回。':`屬於「大額超支」，月結時預設約 ${share}% 從旅費扣、${100-share}% 從下一個月生活費扣。`}`;document.getElementById('overspendModal').classList.add('show')}
      else{state.transactions.push(tx);save();document.getElementById('amountInput').value='';document.getElementById('noteInput').value='';document.getElementById('monthSelect').value=m;selectedDate=date;render();showPage('book')}
    },true);
  }

  injectUI();
  const di=document.getElementById('dateInput');if(di){di.addEventListener('change',syncDateDisplay);di.addEventListener('input',syncDateDisplay)}syncDateDisplay();
  updateEntryUI();renderAssets();setCurrency(state.currency||'JPY',true);
})();
