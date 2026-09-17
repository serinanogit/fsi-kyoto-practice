(() => {
  const STORE='serina-kakeibo-finance-v13';
  const FLEX=['bigTrip','kansai','daily','oneoff'];
  const LABEL={bigTrip:'大旅行',kansai:'京都・關西小旅行',daily:'日常生活',oneoff:'一次性支出'};
  const ACC=[
    ['cathay_twd','TWD'],['cathay_jpy','JPY'],['esun_twd','TWD'],['esun_jpy','JPY'],
    ['sinopac_twd','TWD'],['sinopac_jpy','JPY'],['post_twd','TWD'],['post_fixed','TWD'],
    ['japanpost_jpy','JPY'],['ctbc_twd','TWD'],['chb_twd','TWD'],['cash_twd','TWD'],['cash_jpy','JPY']
  ].map(([id,currency])=>({id,currency}));

  function getF(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch(e){return {}}}
  function putF(f){localStorage.setItem(STORE,JSON.stringify(f))}
  function fmt(v){return 'NT$'+Math.round(Math.abs(v||0)).toLocaleString('zh-TW')}
  function monthNow(){return currentYM()}
  function selectedIds(f){return new Set(f.j?.accounts||[])}
  function pool(f){
    let twd=0,jpy=0; const s=selectedIds(f);
    ACC.forEach(a=>{if(!s.has(a.id))return;const v=+(state.assets?.[a.id]||0);a.currency==='JPY'?jpy+=v:twd+=v});
    (state.creditCards||[]).forEach(c=>{if((f.j?.cards||[]).includes(c.id)){twd-=+(c.outstandingTwd||0);jpy-=+(c.outstandingJpy||0)}});
    return {twd,jpy};
  }
  function incomeOK(t,f){
    const p=t.payment||'',s=selectedIds(f);
    if(p==='現金收入')return t.currency==='JPY'?s.has('cash_jpy'):s.has('cash_twd');
    if(p.includes('玉山'))return s.has('esun_jpy')||s.has('esun_twd');
    if(p.includes('永豐'))return s.has('sinopac_jpy')||s.has('sinopac_twd');
    if(p.includes('日本郵局'))return s.has('japanpost_jpy');
    return p==='銀行入帳';
  }
  function delta(f){
    const b=f.j?.base;if(!b)return null;
    const old=new Set(b.ids||[]);let twd=0,jpy=0;
    (state.transactions||[]).forEach(t=>{
      if(old.has(t.id))return;
      const type=t.type||'expense';if(type==='income'&&!incomeOK(t,f))return;
      const sign=type==='income'?1:-1,amt=+(t.originalAmount||0);if(!amt)return;
      (t.currency||'TWD')==='JPY'?jpy+=sign*amt:twd+=sign*amt;
    });
    return {twd,jpy};
  }
  function shortage(){
    const f=getF(),b=f.j?.base,d=delta(f);if(!b||!d)return null;
    const a=pool(f),actual=a.twd+a.jpy*state.fxRate,expected=(+b.twd+d.twd)+(+b.jpy+d.jpy)*state.fxRate;
    return Math.max(0,expected-actual);
  }

  function futureItems(){
    const now=monthNow(),items=[];
    MONTHS.forEach(m=>{
      if(m<now)return;
      const p=adjustedPlan(m);
      FLEX.forEach(cat=>{
        const av=Math.max(0,(p[cat]||0)-catSpent(m,cat));
        if(av>0)items.push({m,cat,av});
      });
    });
    return items;
  }
  function allocateByWeights(items,target,weightFn){
    let remaining=Math.min(target,items.reduce((s,x)=>s+x.av,0));
    const cuts=[],left=items.map(x=>({...x,left:x.av}));
    let guard=0;
    while(remaining>0.5&&guard++<8){
      const active=left.filter(x=>x.left>0.5);if(!active.length)break;
      const weights=active.map(x=>Math.max(0.0001,weightFn(x)));
      const totalW=weights.reduce((a,b)=>a+b,0);let used=0;
      active.forEach((x,i)=>{
        const want=i===active.length-1?remaining-used:remaining*weights[i]/totalW;
        const take=Math.min(x.left,want);x.left-=take;used+=take;
        let c=cuts.find(z=>z.m===x.m&&z.cat===x.cat);if(!c){c={m:x.m,cat:x.cat,cut:0};cuts.push(c)}c.cut+=take;
      });
      if(used<0.5)break;remaining-=used;
    }
    return {cuts:cuts.filter(x=>x.cut>0.5).map(x=>({...x,cut:Math.round(x.cut)})),uncovered:Math.max(0,Math.round(target-cuts.reduce((s,x)=>s+x.cut,0)))};
  }
  function planA(shortTwd){
    const items=futureItems();
    return {...allocateByWeights(items,shortTwd,x=>x.av),label:'A｜依剩餘預算比例',desc:'依目前後續各月尚未使用的彈性預算比例縮減；最保守、最接近原本計畫。'};
  }
  function completedHistory(){
    const now=monthNow(),byMonth={},byCat={bigTrip:0,kansai:0,daily:0,oneoff:0};
    (state.transactions||[]).forEach(t=>{
      if((t.type||'expense')!=='expense'||!FLEX.includes(t.category)||ym(t.date)>=now)return;
      const v=txTWD(t);if(v<=0)return;
      byMonth[ym(t.date)]=(byMonth[ym(t.date)]||0)+v;byCat[t.category]+=v;
    });
    const months=Object.keys(byMonth).filter(m=>byMonth[m]>0),total=Object.values(byCat).reduce((a,b)=>a+b,0);
    return {months,total,byCat};
  }
  function planB(shortTwd){
    const items=futureItems(),hist=completedHistory();
    if(hist.months.length<2||hist.total<=0)return {disabled:true,months:hist.months.length,label:'B｜依實際花費習慣',desc:'至少累積 2 個已完成月份的實際彈性支出後才啟用，避免太早用少量資料改壞預算。'};
    const availByCat={bigTrip:0,kansai:0,daily:0,oneoff:0};items.forEach(x=>availByCat[x.cat]+=x.av);
    const availTotal=Object.values(availByCat).reduce((a,b)=>a+b,0)||1;
    const ratio={};FLEX.forEach(cat=>{
      const actualShare=hist.byCat[cat]/hist.total,planShare=availByCat[cat]/availTotal;
      const r=(actualShare+0.05*planShare)/(planShare+1e-9);
      ratio[cat]=Math.max(0.35,Math.min(3,r));
    });
    // Spend-more-than-planned categories are protected; spend-less categories absorb more cuts.
    const out=allocateByWeights(items,shortTwd,x=>x.av/ratio[x.cat]);
    return {...out,disabled:false,months:hist.months.length,label:'B｜依實際花費習慣',desc:`使用 ${hist.months.length} 個已完成月份的實際支出結構；花得比原計畫多的類別少砍、花得少的類別多砍。`};
  }
  function groupRows(plan){
    const by={};plan.cuts.forEach(x=>{by[x.m]??={total:0,cats:{}};by[x.m].total+=x.cut;by[x.m].cats[x.cat]=(by[x.m].cats[x.cat]||0)+x.cut});return by;
  }
  function renderPreview(plan){
    const host=document.getElementById('v17Preview');if(!host)return;
    host.innerHTML=`<div class="v17-plan-desc">${plan.desc}</div>`;
    if(plan.disabled){host.insertAdjacentHTML('beforeend',`<div class="v17-disabled">目前只有 ${plan.months} 個已完成月份，B 暫不建議使用。</div>`);return}
    const by=groupRows(plan);
    Object.entries(by).forEach(([m,o])=>{
      const detail=Object.entries(o.cats).map(([c,v])=>`${LABEL[c]} −${fmt(v)}`).join('・');
      host.insertAdjacentHTML('beforeend',`<div class="v17-row"><div><b>${m.replace('-','/')}</b><small>${detail}</small></div><strong>−${fmt(o.total)}</strong></div>`);
    });
    if(plan.uncovered>0)host.insertAdjacentHTML('beforeend',`<div class="v17-uncovered">目前可調整的彈性預算仍不足 ${fmt(plan.uncovered)}</div>`);
  }
  function apply(plan,mode){
    if(plan.disabled||!plan.cuts?.length)return;
    const ok=confirm(`${mode==='A'?'方案 A：依剩餘預算比例':'方案 B：依實際花費習慣'}\n\n確定要套用這個重新規劃方案嗎？\n住宿與固定必要支出不會調降。`);
    if(!ok)return;
    const f=getF();f.j=f.j||{};f.j.cuts=f.j.cuts||{};
    plan.cuts.forEach(x=>{f.j.cuts[x.m]??={};f.j.cuts[x.m][x.cat]=+(f.j.cuts[x.m][x.cat]||0)+x.cut});
    const a=pool(f);f.j.base={twd:a.twd,jpy:a.jpy,ids:(state.transactions||[]).map(t=>t.id)};f.j.lastReplanMode=mode;putF(f);location.reload();
  }

  const css=document.createElement('style');css.textContent=`
    .v17-choices{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.v17-choice{border:2px solid #e8ddd4;background:#fff;border-radius:14px;padding:10px;text-align:left;color:#534d49}.v17-choice b{display:block;font-size:12px}.v17-choice small{display:block;font-size:9px;color:var(--muted);margin-top:4px;line-height:1.45}.v17-choice.active{border-color:#ed9d5c;background:#fff7ee;box-shadow:0 0 0 3px rgba(237,157,92,.08)}.v17-choice:disabled{opacity:.45}.v17-plan-desc{font-size:11px;line-height:1.6;color:#685f59;margin:8px 0}.v17-row{display:flex;justify-content:space-between;gap:8px;background:#fff;border-radius:11px;padding:9px;margin-top:6px;align-items:center}.v17-row b{font-size:11px}.v17-row small{display:block;font-size:9px;color:var(--muted);margin-top:3px;line-height:1.4}.v17-row strong{font-size:12px;white-space:nowrap}.v17-disabled,.v17-uncovered{font-size:10px;line-height:1.5;border-radius:10px;padding:9px;margin-top:7px}.v17-disabled{background:#f5f2ef;color:#817a76}.v17-uncovered{background:#fff0f1;color:#b42f3b}.v17-apply{width:100%;border:0;border-radius:12px;padding:11px;margin-top:9px;font-weight:900;background:linear-gradient(135deg,#ed9d5c,#ff8067);color:#fff}
  `;document.head.appendChild(css);

  function enhance(){
    const box=document.getElementById('replanBox');if(!box||!box.classList.contains('show'))return;
    if(box.querySelector('.v17-choices'))return;
    const shortTwd=shortage();if(!shortTwd||shortTwd<15000)return;
    const A=planA(shortTwd),B=planB(shortTwd);let selected='A';
    box.innerHTML=`<h4>🚨 已達重新規劃門檻</h4><p>先確認漏記都補完；若這筆差額確實代表日本可用資金變少，再從 A／B 選一種方案。未按確認前，不會修改任何月預算。</p><div class="v17-choices"><button id="v17A" class="v17-choice active"><b>方案 A｜保守調整</b><small>依剩餘彈性預算比例</small></button><button id="v17B" class="v17-choice" ${B.disabled?'disabled':''}><b>方案 B｜趨勢調整</b><small>${B.disabled?'需至少 2 個完整月份':'依實際花費習慣'}</small></button></div><div id="v17Preview"></div><button id="v17Apply" class="v17-apply">確認套用方案 A</button><button id="v17Later" class="rclear" style="width:100%;margin-top:7px;border:0;border-radius:11px;padding:9px;font-weight:900">先不調整</button>`;
    renderPreview(A);
    const a=box.querySelector('#v17A'),b=box.querySelector('#v17B'),applyBtn=box.querySelector('#v17Apply');
    a.onclick=()=>{selected='A';a.classList.add('active');b.classList.remove('active');renderPreview(A);applyBtn.textContent='確認套用方案 A'};
    b.onclick=()=>{if(B.disabled)return;selected='B';b.classList.add('active');a.classList.remove('active');renderPreview(B);applyBtn.textContent='確認套用方案 B'};
    applyBtn.onclick=()=>apply(selected==='A'?A:B,selected);
    box.querySelector('#v17Later').onclick=()=>box.classList.remove('show');
  }

  const obs=new MutationObserver(()=>setTimeout(enhance,20));obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  const oldRender=window.render;window.render=function(){oldRender();setTimeout(enhance,80)};
  setTimeout(enhance,220);
})();
