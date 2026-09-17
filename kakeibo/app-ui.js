function setBookMode(mode){
  bookMode=mode;document.getElementById('calendarTab').classList.toggle('active',mode==='calendar');document.getElementById('listTab').classList.toggle('active',mode==='list');document.getElementById('calendarView').style.display=mode==='calendar'?'block':'none';document.getElementById('listView').style.display=mode==='list'?'block':'none';renderBook();
}
function shiftMonth(dir){const m=selectedMonth(),i=MONTHS.indexOf(m),ni=Math.max(0,Math.min(MONTHS.length-1,i+dir));document.getElementById('monthSelect').value=MONTHS[ni];selectedDate=null;render()}
function clearSearch(){document.getElementById('searchInput').value='';renderBook()}
function matchSearch(t,q){if(!q)return true;q=q.toLowerCase();return (t.note||'').toLowerCase().includes(q)||(CATS[t.category]?.name||'').toLowerCase().includes(q)||(t.payment||'').toLowerCase().includes(q)}
function renderBook(){
  const m=selectedMonth()||MONTHS[0],[y,mo]=m.split('-').map(Number);document.getElementById('bookMonthLabel').textContent=`${y}年${mo}月`;const q=(document.getElementById('searchInput')?.value||'').trim();
  if(!selectedDate||ym(selectedDate)!==m){const today=ymdLocal();selectedDate=ym(today)===m?today:`${m}-01`}
  renderCalendar(y,mo,q);renderMonthList(m,q);
}
function renderCalendar(y,mo,q){
  const grid=document.getElementById('calendarGrid');if(!grid)return;grid.innerHTML='';
  const first=new Date(y,mo-1,1),startDow=first.getDay(),days=new Date(y,mo,0).getDate(),prevDays=new Date(y,mo-1,0).getDate(),today=ymdLocal();
  for(let i=0;i<42;i++){
    let dy,yy=y,mm=mo,other=false;
    if(i<startDow){dy=prevDays-startDow+i+1;mm=mo-1;if(mm===0){mm=12;yy--}other=true}
    else if(i>=startDow+days){dy=i-(startDow+days)+1;mm=mo+1;if(mm===13){mm=1;yy++}other=true}
    else dy=i-startDow+1;
    const ds=`${yy}-${String(mm).padStart(2,'0')}-${String(dy).padStart(2,'0')}`,txs=state.transactions.filter(t=>t.date===ds&&matchSearch(t,q)),total=txs.reduce((a,t)=>a+txTWD(t),0),cell=document.createElement('div');
    cell.className='day';if(other)cell.classList.add('other');if(i%7===0)cell.classList.add('sun');if(i%7===6)cell.classList.add('sat');if(ds===today)cell.classList.add('today');if(ds===selectedDate)cell.classList.add('selected');
    const dots=txs.slice(0,4).map(t=>`<i style="background:${CATS[t.category]?.color||'#bbb'}"></i>`).join('');
    cell.innerHTML=`<span class="day-num">${dy}</span>${total?`<div class="day-total">${money(total)}</div>`:''}<div class="dots">${dots}</div>`;cell.onclick=()=>{if(!other){selectedDate=ds;renderBook()}};grid.appendChild(cell);
  }
  renderSelectedDay(q);
}
function renderSelectedDay(q){
  const d=new Date(selectedDate+'T00:00:00'),labels=['週日','週一','週二','週三','週四','週五','週六'];document.getElementById('selectedDayTitle').textContent=`${d.getMonth()+1}月${d.getDate()}日 ${labels[d.getDay()]}`;
  const txs=state.transactions.filter(t=>t.date===selectedDate&&matchSearch(t,q)).sort((a,b)=>String(b.id).localeCompare(String(a.id))),total=txs.reduce((a,t)=>a+txTWD(t),0);
  document.getElementById('dailySummary').innerHTML=`<span>${txs.length} 筆支出</span><strong>${money(total)}</strong>`;const list=document.getElementById('dailyTransactions');list.innerHTML='';
  if(!txs.length){list.innerHTML='<div class="empty">沒有記錄・按「＋」新增一筆 🌸</div>';return}txs.forEach(t=>list.appendChild(txElement(t)));
}
function renderMonthList(m,q){
  const host=document.getElementById('monthList');if(!host)return;host.innerHTML='';const txs=state.transactions.filter(t=>ym(t.date)===m&&matchSearch(t,q)).sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
  if(!txs.length){host.innerHTML='<div class="empty">這個月還沒有記錄 🌸</div>';return}
  const groups={};txs.forEach(t=>(groups[t.date]??=[]).push(t));
  Object.keys(groups).sort((a,b)=>b.localeCompare(a)).forEach(date=>{const total=groups[date].reduce((a,t)=>a+txTWD(t),0),g=document.createElement('div');g.className='list-group';g.innerHTML=`<div class="list-date"><b>${date.slice(5).replace('-',' / ')}</b><span>${money(total)}</span></div>`;const list=document.createElement('div');list.className='tx-list';groups[date].forEach(t=>list.appendChild(txElement(t)));g.appendChild(list);host.appendChild(g)});
}
function txElement(t){const c=CATS[t.category]||{name:t.category,icon:'🧾',soft:'#f5f5f5'},div=document.createElement('div');div.className='tx';div.innerHTML=`<div class="tx-icon" style="background:${c.soft||'#f5f5f5'}">${c.icon}</div><div><div class="tx-title">${t.note||c.name}</div><div class="tx-meta">${c.name} ・ ${t.payment||''}</div></div><div><div class="tx-amt">${money(txTWD(t))}</div><button class="tx-del" onclick="deleteTx('${t.id}')">刪除</button></div>`;return div}
function renderRecent(){const host=document.getElementById('recentTransactions'),rows=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id))).slice(0,6);document.getElementById('recentCount').textContent=rows.length?`最近 ${rows.length} 筆`:'';host.innerHTML='';if(!rows.length){host.innerHTML='<div class="empty">還沒有記帳紀錄 🌸</div>';return}rows.forEach(t=>host.appendChild(txElement(t)))}
function renderAnalysis(m,budget,spent,proj){
  const arr=Object.keys(CATS).map(k=>({k,v:catSpent(m,k)})).sort((a,b)=>b.v-a.v),top=arr[0];let text=top&&top.v>0?`目前花最多的是 <b>${CATS[top.k].name}</b>（${money(top.v)}）。`:'目前還沒有支出紀錄。';const i=MONTHS.indexOf(m);
  if(i>0){const p=monthSpent(MONTHS[i-1]);if(p>0)text+=` 和上個月相比，目前${spent>=p?'多':'少'}花 <b>${money(Math.abs(spent-p))}</b>。`}
  if(proj>budget)text+=` <span style="color:#bd2b39"><b>照目前速度月底可能超出 ${money(proj-budget)}。</b></span>`;else if(spent>0)text+=` 若維持目前速度，月底預估還能留下約 <b>${money(Math.max(0,budget-proj))}</b>。`;
  document.getElementById('insight').innerHTML=text;const host=document.getElementById('analysisCats');host.innerHTML='';const max=Math.max(...arr.map(x=>x.v),1);
  arr.filter(x=>x.v>0).forEach(x=>{const c=CATS[x.k],r=document.createElement('div');r.className='analysis-row';r.innerHTML=`<div class="name">${c.icon} ${c.name}</div><div class="amt">${money(x.v)}</div><div class="analysis-track"><i style="width:${x.v/max*100}%;background:${c.color}"></i></div>`;host.appendChild(r)});if(!host.children.length)host.innerHTML='<div class="empty">記帳後會顯示分類支出比例。</div>';
}
function drawTrend(){
  const cv=document.getElementById('trendCanvas');if(!cv||currentPage!=='analysis')return;const w=cv.clientWidth||320,h=220,dpr=window.devicePixelRatio||1;cv.width=w*dpr;cv.height=h*dpr;const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const adj=adjustments(),data=MONTHS.map(m=>({m,b:sum(adjustedPlan(m,adj)),s:monthSpent(m)})),max=Math.max(...data.flatMap(d=>[d.b,d.s]),1),left=24,right=10,top=20,bottom=30,cw=w-left-right,ch=h-top-bottom,group=cw/data.length;ctx.font='10px -apple-system,BlinkMacSystemFont,sans-serif';ctx.textAlign='center';
  data.forEach((d,i)=>{const x=left+i*group+group/2,bw=Math.max(6,group*.22),bh=d.b/max*ch,sh=d.s/max*ch;roundRect(ctx,x-bw-2,top+ch-bh,bw,bh,5,'#ffd4dc');roundRect(ctx,x+2,top+ch-sh,bw,sh,5,'#f6a13a');ctx.fillStyle='#8a8584';ctx.fillText(`${+d.m.slice(5)}月`,x,h-9)});ctx.textAlign='left';ctx.fillStyle='#6f6b69';ctx.fillText('淡色＝預算　橘色＝實際',left,11);
}
function roundRect(ctx,x,y,w,h,r,fill){if(h<1)return;ctx.beginPath();const rr=Math.min(r,w/2,h/2);ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();ctx.fillStyle=fill;ctx.fill()}
function buildTx(){const amount=+document.getElementById('amountInput').value,date=document.getElementById('dateInput').value,currency=state.currency;return{id:String(Date.now())+Math.random().toString(16).slice(2),date,category:document.getElementById('categoryInput').value,payment:document.getElementById('paymentInput').value,need:document.getElementById('needInput').value,note:document.getElementById('noteInput').value.trim(),currency,originalAmount:amount,fxRate:state.fxRate,twdValue:currency==='TWD'?amount:amount*state.fxRate}}
function submitExpense(e){
  e.preventDefault();const tx=buildTx();if(!tx.originalAmount||!tx.date)return;const m=ym(tx.date);if(!MONTHS.includes(m)){alert('目前預算範圍是 2026/09～2027/04。');return}const budget=sum(adjustedPlan(m)),after=monthSpent(m)+txTWD(tx);
  if(after>budget){pending=tx;const over=after-budget,th=state.settings?.smallOverrun??2000,share=state.settings?.travelShare??70;document.getElementById('overspendText').innerHTML=`記入後，本月會超支 <b>${money(over)}</b>。<br><br>${over<=th?'屬於「小額超支」，月結時會優先從未來旅費扣回。':`屬於「大額超支」，月結時預設約 ${share}% 從旅費扣、${100-share}% 從下一個月生活費扣。`}`;document.getElementById('overspendModal').classList.add('show')}else saveTx(tx);
}
function saveTx(tx){state.transactions.push(tx);save();document.getElementById('amountInput').value='';document.getElementById('noteInput').value='';document.getElementById('monthSelect').value=ym(tx.date);selectedDate=tx.date;render();showPage('book')}
function cancelPending(){pending=null;document.getElementById('overspendModal').classList.remove('show')}
function confirmPending(){if(pending)saveTx(pending);pending=null;document.getElementById('overspendModal').classList.remove('show')}
function deleteTx(id){if(confirm('確定刪除這筆記帳？')){state.transactions=state.transactions.filter(t=>t.id!==id);save();render()}}
function download(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function exportJSON(){download('serina_kyoto_kakeibo_backup.json',JSON.stringify(state,null,2),'application/json')}
function exportCSV(){const rows=[['date','category','original_amount','currency','twd_value','payment','need','note'],...state.transactions.map(t=>[t.date,CATS[t.category]?.name||t.category,t.originalAmount,t.currency,t.twdValue,t.payment||'',t.need||'',t.note||''])];const esc=v=>`"${String(v).replaceAll('"','""')}"`;download('serina_kyoto_kakeibo.csv','\ufeff'+rows.map(r=>r.map(esc).join(',')).join('\n'),'text/csv;charset=utf-8')}
function importJSON(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(!Array.isArray(j.transactions))throw new Error();state={...state,...j};save();location.reload()}catch(err){alert('這個備份檔格式不正確。')}};r.readAsText(f)}
init();
