const CATS={
 lodging:{name:'住宿',icon:'🏠',color:'#ff9eb0',soft:'#fff0f4'},
 fixed:{name:'固定費用',icon:'🧺',color:'#7db686',soft:'#eef8ef'},
 daily:{name:'吃飯・咖啡・購物・日常交通',icon:'🍱',color:'#f3a45d',soft:'#fff5e9'},
 kansai:{name:'京都・關西小旅行',icon:'⛩️',color:'#7bbce5',soft:'#edf8ff'},
 bigTrip:{name:'大旅行',icon:'🧳',color:'#8f8bb9',soft:'#f1f0fb'},
 oneoff:{name:'一次性支出',icon:'🌸',color:'#f3839a',soft:'#fff0f4'}
};
const PLANS={
 '2026-09':{lodging:0,fixed:1500,daily:6000,kansai:0,bigTrip:0,oneoff:13680},
 '2026-10':{lodging:9900,fixed:2500,daily:16000,kansai:2000,bigTrip:0,oneoff:2000},
 '2026-11':{lodging:8620,fixed:2500,daily:17000,kansai:3000,bigTrip:0,oneoff:0},
 '2026-12':{lodging:8620,fixed:2500,daily:17000,kansai:2000,bigTrip:30000,oneoff:0},
 '2027-01':{lodging:8620,fixed:2500,daily:17000,kansai:2000,bigTrip:0,oneoff:0},
 '2027-02':{lodging:8620,fixed:2500,daily:16000,kansai:3000,bigTrip:30000,oneoff:0},
 '2027-03':{lodging:26130,fixed:2500,daily:19000,kansai:4000,bigTrip:0,oneoff:0},
 '2027-04':{lodging:6566,fixed:412,daily:3000,kansai:0,bigTrip:0,oneoff:0}
};
const MONTHS=Object.keys(PLANS);
const KEY='serina-kakeibo-v3',OLD_KEYS=['serina-kakeibo-v2','serina-kakeibo'];
const FALLBACK_RATE=0.204635;
let state=loadState(),pending=null,currentPage='home',bookMode='calendar',selectedDate=null;

function loadState(){
  let raw=localStorage.getItem(KEY);
  if(!raw){
    for(const k of OLD_KEYS){if(localStorage.getItem(k)){raw=localStorage.getItem(k);break}}
  }
  try{
    const j=raw?JSON.parse(raw):{};
    return {
      transactions:Array.isArray(j.transactions)?j.transactions:[],
      currency:j.currency||'JPY', fxRate:+j.fxRate||FALLBACK_RATE,
      fxUpdated:j.fxUpdated||'', fxSource:j.fxSource||'備用匯率',
      settings:j.settings||{smallOverrun:2000,travelShare:70}
    };
  }catch(e){
    return {transactions:[],currency:'JPY',fxRate:FALLBACK_RATE,fxUpdated:'',fxSource:'備用匯率',settings:{smallOverrun:2000,travelShare:70}};
  }
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function ymdLocal(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function ym(s){return s.slice(0,7)}
function sum(o){return Object.values(o).reduce((a,b)=>a+(+b||0),0)}
function currentYM(){return ymdLocal().slice(0,7)}
function selectedMonth(){return document.getElementById('monthSelect').value}
function twdToShown(v){return state.currency==='TWD'?v:v/state.fxRate}
function money(v){
  const n=twdToShown(+v||0);
  return state.currency==='TWD'?`NT$${Math.round(n).toLocaleString('zh-TW')}`:`¥${Math.round(n).toLocaleString('ja-JP')}`;
}
function txTWD(t){return +t.twdValue||0}
function monthSpent(m){return state.transactions.filter(t=>ym(t.date)===m).reduce((a,t)=>a+txTWD(t),0)}
function catSpent(m,c){return state.transactions.filter(t=>ym(t.date)===m&&t.category===c).reduce((a,t)=>a+txTWD(t),0)}
function daySpent(date){return state.transactions.filter(t=>t.date===date).reduce((a,t)=>a+txTWD(t),0)}

function installV9LayoutFixes(){
  if(document.getElementById('v9-layout-fixes')) return;
  const style=document.createElement('style');
  style.id='v9-layout-fixes';
  style.textContent=`
    .global-head{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:6px!important;overflow:hidden!important}
    .brand{min-width:0!important;overflow:hidden!important}.brand strong{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    .head-actions{display:flex!important;align-items:center!important;gap:5px!important;min-width:0!important;flex:0 0 auto!important}
    .month-chip{-webkit-appearance:none!important;appearance:none!important;box-sizing:border-box!important;width:116px!important;min-width:116px!important;max-width:116px!important;height:40px!important;padding:0 14px!important;font-size:12px!important;line-height:40px!important;text-align:center!important;text-align-last:center!important;white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important;background:#fff!important}
    .currency-chip{box-sizing:border-box!important;width:58px!important;min-width:58px!important;max-width:58px!important;height:40px!important;padding:0 5px!important;font-size:12px!important;line-height:1!important;white-space:nowrap!important}
    .quick-add{overflow:hidden!important}.input-row,.amount-wrap,.form-grid,.quick-add form,.field{min-width:0!important;max-width:100%!important}
    .amount-wrap .symbol{left:14px!important;min-width:54px!important;width:54px!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;white-space:nowrap!important;pointer-events:none!important}
    .amount-wrap input{min-width:0!important;max-width:100%!important;padding-left:80px!important}
    @media(max-width:932px){.form-grid{grid-template-columns:minmax(0,1fr)!important}.field.full{grid-column:auto!important}}
    @media(max-width:480px){
      .app{padding-left:10px!important;padding-right:10px!important}.global-head{margin-left:-10px!important;margin-right:-10px!important;padding-left:10px!important;padding-right:10px!important}
      .brand small{font-size:8.5px!important}.brand strong{font-size:13px!important}.month-chip{width:114px!important;min-width:114px!important;max-width:114px!important;padding:0 12px!important;font-size:12px!important}.currency-chip{width:54px!important;min-width:54px!important;max-width:54px!important}
      .amount-wrap .symbol{left:14px!important;min-width:58px!important;width:58px!important;font-size:17px!important}.amount-wrap input{padding-left:82px!important;font-size:23px!important}
    }
    @media(max-width:375px){.brand small{display:none!important}.brand strong{font-size:12px!important}.month-chip{width:112px!important;min-width:112px!important;max-width:112px!important}.currency-chip{width:52px!important;min-width:52px!important;max-width:52px!important}}
  `;
  document.head.appendChild(style);
}

function init(){
  installV9LayoutFixes();
  const ms=document.getElementById('monthSelect');
  MONTHS.forEach(m=>{const [y,mo]=m.split('-');const o=document.createElement('option');o.value=m;o.textContent=`${y}/${String(+mo).padStart(2,'0')}`;ms.appendChild(o)});
  const cur=currentYM();ms.value=MONTHS.includes(cur)?cur:(cur<MONTHS[0]?MONTHS[0]:MONTHS.at(-1));
  ms.addEventListener('change',()=>{selectedDate=null;render()});
  const cs=document.getElementById('categoryInput');
  Object.entries(CATS).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=`${v.icon} ${v.name}`;cs.appendChild(o)});
  document.getElementById('dateInput').value=ymdLocal();
  document.getElementById('expenseForm').addEventListener('submit',submitExpense);
  document.getElementById('importFile').addEventListener('change',importJSON);
  window.addEventListener('resize',()=>drawTrend());
  setCurrency(state.currency||'JPY',false);
  render();refreshFX(false);
}
function showPage(name){
  currentPage=name;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`nav-${name}`).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='book')renderBook();
  if(name==='analysis')setTimeout(()=>drawTrend(),0);
}
function toggleCurrency(){setCurrency(state.currency==='JPY'?'TWD':'JPY')}
function setCurrency(c,rerender=true){
  state.currency=c;save();
  document.getElementById('globalCurrency').textContent=c==='JPY'?'¥':'NT$';
  document.getElementById('inputSymbol').textContent=c==='JPY'?'¥':'NT$';
  document.getElementById('inputModeText').textContent=c==='JPY'?'輸入日圓':'輸入台幣';
  if(rerender)render();
}

async function fetchJSON(url,ms=6500){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),ms);
  try{const r=await fetch(url,{cache:'no-store',signal:ctrl.signal});if(!r.ok)throw new Error(String(r.status));return await r.json()}
  finally{clearTimeout(timer)}
}
async function refreshFX(userInitiated=false){
  setFXStatus('loading','正在取得今日 JPY/TWD 匯率…');
  const sources=[
    {name:'ExchangeRate-API',url:'https://open.er-api.com/v6/latest/JPY',parse:j=>+j?.rates?.TWD},
    {name:'currency-api CDN',url:'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json',parse:j=>+(j?.jpy?.twd)},
    {name:'currency-api fallback',url:'https://latest.currency-api.pages.dev/v1/currencies/jpy.json',parse:j=>+(j?.jpy?.twd)}
  ];
  for(const s of sources){
    try{
      const j=await fetchJSON(s.url),rate=s.parse(j);
      if(Number.isFinite(rate)&&rate>.1&&rate<.4){
        state.fxRate=rate;state.fxUpdated=new Date().toISOString();state.fxSource=s.name;save();
        setFXStatus('ok',`1 JPY ≈ ${rate.toFixed(6)} TWD ・ ${s.name}`);render();return;
      }
    }catch(e){}
  }
  setFXStatus('bad',`自動匯率暫時連不上，沿用上次 ${state.fxRate.toFixed(6)}。可按更新或手動輸入。`);
  if(userInitiated) setTimeout(()=>manualFX(true),200);
}
function setFXStatus(type,text){
  const d=document.getElementById('fxDot'),t=document.getElementById('fxText');if(!d||!t)return;
  d.classList.toggle('bad',type==='bad');t.textContent=text;
}
function manualFX(fromFailure=false){
  const v=prompt(`${fromFailure?'自動來源目前無法連線。\n':''}輸入 1 JPY = 幾 TWD，例如 0.2046`,state.fxRate);
  if(v!==null&&Number.isFinite(+v)&&+v>.1&&+v<.4){
    state.fxRate=+v;state.fxUpdated=new Date().toISOString();state.fxSource='手動';save();render();setFXStatus('ok',`1 JPY ≈ ${state.fxRate.toFixed(6)} TWD ・ 手動設定`);
  }
}

function adjustments(){
  const adj={};MONTHS.forEach(m=>adj[m]={daily:0,kansai:0,bigTrip:0});
  const now=currentYM();
  for(let i=0;i<MONTHS.length-1;i++){
    const m=MONTHS[i],next=MONTHS[i+1];if(m>=now)break;
    const p=adjustedPlan(m,adj),b=sum(p),s=monthSpent(m),delta=b-s;
    if(delta>0){
      const lifeSaving=Math.max(0,(p.daily||0)-catSpent(m,'daily'));
      adj[next].daily+=lifeSaving;
    }else if(delta<0){
      const over=-delta,threshold=state.settings?.smallOverrun??2000,share=(state.settings?.travelShare??70)/100;
      const travel=over<=threshold?over:over*share,daily=over<=threshold?0:over*(1-share);
      deductFutureTravel(i+1,travel,adj);adj[next].daily-=daily;
    }
  }
  return adj;
}
function deductFutureTravel(start,amount,adj){
  let left=amount;
  for(let i=start;i<MONTHS.length&&left>0;i++){
    const m=MONTHS[i];
    let avail=Math.max(0,(PLANS[m].bigTrip||0)+(adj[m].bigTrip||0)),take=Math.min(left,avail);adj[m].bigTrip-=take;left-=take;
    if(left<=0)break;
    avail=Math.max(0,(PLANS[m].kansai||0)+(adj[m].kansai||0));take=Math.min(left,avail);adj[m].kansai-=take;left-=take;
  }
  if(left>0&&MONTHS[start])adj[MONTHS[start]].daily-=left;
}
function adjustedPlan(m,cache){
  const a=cache||adjustments(),p={...PLANS[m]};
  ['daily','kansai','bigTrip'].forEach(k=>p[k]=Math.max(0,(p[k]||0)+(a[m]?.[k]||0)));return p;
}
function dateRange(m){
  const [y,mo]=m.split('-').map(Number);let start=new Date(y,mo-1,1),end=new Date(y,mo,0);
  if(m==='2026-09')start=new Date(2026,8,21);if(m==='2027-04')end=new Date(2027,3,4);return{start,end};
}
function daysRemaining(m){
  const {start,end}=dateRange(m),today=new Date();today.setHours(0,0,0,0);
  if(today>end)return 0;let from=today>start?today:start;if(from>end)return 0;return Math.floor((end-from)/86400000)+1;
}
function projected(m,spent){
  const {start,end}=dateRange(m),today=new Date();today.setHours(0,0,0,0);
  if(today<start||today>end)return spent;
  const elapsed=Math.floor((today-start)/86400000)+1,total=Math.floor((end-start)/86400000)+1;
  return spent/Math.max(1,elapsed)*total;
}
function render(){
  const m=selectedMonth()||MONTHS[0],adj=adjustments(),plan=adjustedPlan(m,adj);
  const budget=sum(plan),spent=monthSpent(m),remain=budget-spent,pct=budget?spent/budget:0,days=daysRemaining(m),daily=days?Math.max(0,remain)/days:0,proj=projected(m,spent);
  document.getElementById('heroRemain').textContent=money(remain);
  document.getElementById('heroBudget').textContent=money(budget);
  document.getElementById('heroSpent').textContent=money(spent);
  document.getElementById('heroDaily').textContent=money(daily);
  document.getElementById('heroSub').textContent=`剩 ${days} 天 ・ 月底推估 ${money(proj)}`;
  const ring=document.getElementById('progressRing'),cap=Math.max(0,Math.min(100,pct*100));ring.style.setProperty('--p',`${cap*3.6}deg`);ring.dataset.pct=`${Math.round(pct*100)}%`;
  const a=document.getElementById('alertBox');a.className='alert';a.textContent='';
  if(pct>=1){a.className='alert danger show';a.textContent=`🚨 已超支 ${money(spent-budget)}。從現在開始每一筆新增支出都請先確認必要性；超支會扣回未來旅費／生活費。`}
  else if(pct>=.85||proj>budget){a.className='alert danger show';a.textContent=`🚨 本月快花見底了！只剩 ${money(remain)}。照現在速度月底可能到 ${money(proj)}。`}
  else if(pct>=.7){a.className='alert warn show';a.textContent=`⚠️ 已使用 ${Math.round(pct*100)}%。接下來平均每天建議不超過 ${money(daily)}。`}
  const grid=document.getElementById('catGrid');grid.innerHTML='';
  Object.entries(CATS).forEach(([k,c])=>{
    const b=plan[k]||0,s=catSpent(m,k);if(b===0&&s===0)return;const r=b-s,p=b?s/b:0,cls=p>=1?'danger':p>=.85?'warn':'';
    const d=document.createElement('div');d.className='cat';d.innerHTML=`<div class="cat-top"><div class="cat-icon" style="background:${c.soft}">${c.icon}</div><div class="cat-name">${c.name}</div></div><div class="cat-remain">${r>=0?'剩 '+money(r):'超 '+money(-r)}</div><div class="cat-sub">預算 ${money(b)} ・ 已花 ${money(s)}</div><div class="bar"><i class="${cls}" style="width:${Math.min(100,p*100)}%;background:${c.color}"></i></div>`;grid.appendChild(d);
  });
  renderBook();renderRecent();renderAnalysis(m,budget,spent,proj);
  if(currentPage==='analysis')setTimeout(()=>drawTrend(),0);
}
