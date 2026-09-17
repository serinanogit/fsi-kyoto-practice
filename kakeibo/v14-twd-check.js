(() => {
  const STORE='serina-kakeibo-finance-v13';
  const ACC=[
    ['cathay_twd','國泰｜台幣','TWD'],['cathay_jpy','國泰｜日圓','JPY'],
    ['esun_twd','玉山｜台幣','TWD'],['esun_jpy','玉山｜日圓','JPY'],
    ['sinopac_twd','永豐｜台幣','TWD'],['sinopac_jpy','永豐｜日圓','JPY'],
    ['post_twd','台灣郵局｜活存','TWD'],['post_fixed','台灣郵局｜定存','TWD'],
    ['japanpost_jpy','日本郵局｜日圓','JPY'],['ctbc_twd','中信｜台幣','TWD'],
    ['chb_twd','彰銀｜台幣','TWD'],['cash_twd','手邊現金｜台幣','TWD'],['cash_jpy','手邊現金｜日圓','JPY']
  ].map(([id,name,currency])=>({id,name,currency}));

  function getF(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch(e){return {}}}
  function putF(f){localStorage.setItem(STORE,JSON.stringify(f))}
  function moneyTwd(v){return 'NT$'+Math.round(Math.abs(v||0)).toLocaleString('zh-TW')}
  function moneyJpy(v){return '¥'+Math.round(Math.abs(v||0)).toLocaleString('ja-JP')}

  function ensureSettings(){
    const f=getF();
    f.j=f.j||{};
    if(!Number.isFinite(+f.j.warnTwd)) f.j.warnTwd=1000;
    if(!Number.isFinite(+f.j.replanTwd)) f.j.replanTwd=15000;
    f.j.warn=(+f.j.warnTwd||1000)/state.fxRate;
    f.j.replan=(+f.j.replanTwd||15000)/state.fxRate;
    putF(f);
    return f;
  }

  function selectedIds(f){return new Set(f.j?.accounts||[])}
  function pool(f){
    let twd=0,jpy=0; const s=selectedIds(f);
    ACC.forEach(a=>{if(!s.has(a.id)) return; const v=+(state.assets?.[a.id]||0); a.currency==='JPY'?jpy+=v:twd+=v});
    (state.creditCards||[]).forEach(c=>{if((f.j?.cards||[]).includes(c.id)){twd-=+(c.outstandingTwd||0);jpy-=+(c.outstandingJpy||0)}});
    return {twd,jpy};
  }
  function incomeOK(t,f){
    const p=t.payment||'',s=selectedIds(f);
    if(p==='現金收入') return (t.currency==='JPY'?s.has('cash_jpy'):s.has('cash_twd'));
    if(p.includes('玉山')) return s.has('esun_jpy')||s.has('esun_twd');
    if(p.includes('永豐')) return s.has('sinopac_jpy')||s.has('sinopac_twd');
    if(p.includes('日本郵局')) return s.has('japanpost_jpy');
    return p==='銀行入帳';
  }
  function delta(f){
    const b=f.j?.base;if(!b)return null;
    const old=new Set(b.ids||[]);let twd=0,jpy=0,n=0;
    (state.transactions||[]).forEach(t=>{
      if(old.has(t.id))return;
      const type=t.type||'expense';if(type==='income'&&!incomeOK(t,f))return;
      const sign=type==='income'?1:-1,amt=+(t.originalAmount||0);if(!amt)return;
      (t.currency||'TWD')==='JPY'?jpy+=sign*amt:twd+=sign*amt;n++;
    });
    return {twd,jpy,n};
  }
  function result(f){
    const b=f.j?.base,d=delta(f);if(!b||!d)return null;
    const actual=pool(f),expected={twd:+b.twd+d.twd,jpy:+b.jpy+d.jpy};
    const actualTwd=actual.twd+actual.jpy*state.fxRate;
    const expectedTwd=expected.twd+expected.jpy*state.fxRate;
    const diffTwd=actualTwd-expectedTwd;
    return {actual,expected,actualTwd,expectedTwd,diffTwd,absTwd:Math.abs(diffTwd),diffJpy:diffTwd/state.fxRate,n:d.n};
  }

  function proportionalSuggestion(shortTwd){
    const now=currentYM(),items=[];
    MONTHS.forEach(m=>{
      if(m<now)return;
      const p=adjustedPlan(m);
      ['bigTrip','kansai','daily','oneoff'].forEach(cat=>{
        const available=Math.max(0,(p[cat]||0)-catSpent(m,cat));
        if(available>0) items.push({m,cat,available});
      });
    });
    const total=items.reduce((s,x)=>s+x.available,0),target=Math.min(shortTwd,total);
    if(!total||!target)return {cuts:[],uncovered:shortTwd};
    let remaining=target,remainingAvail=total;const cuts=[];
    items.forEach((x,i)=>{
      let cut=i===items.length-1?Math.min(x.available,remaining):Math.min(x.available,Math.round(remaining*x.available/remainingAvail));
      remaining-=cut;remainingAvail-=x.available;if(cut>0)cuts.push({m:x.m,cat:x.cat,cut});
    });
    return {cuts,uncovered:Math.max(0,shortTwd-target)};
  }

  function applyConfirmed(cuts){
    if(!cuts?.length)return;
    const ok=confirm('確定要依目前剩餘彈性預算的比例，重新調整後續每月金錢計畫嗎？\n\n住宿與固定必要支出不會調降。按「取消」不會更動任何預算。');
    if(!ok)return;
    const f=getF();f.j=f.j||{};f.j.cuts=f.j.cuts||{};
    cuts.forEach(x=>{f.j.cuts[x.m]??={};f.j.cuts[x.m][x.cat]=+(f.j.cuts[x.m][x.cat]||0)+x.cut});
    const a=pool(f);f.j.base={twd:a.twd,jpy:a.jpy,ids:(state.transactions||[]).map(t=>t.id)};
    putF(f);location.reload();
  }

  function patchThresholdInputs(f){
    const wi=document.getElementById('jwarn'),ri=document.getElementById('jreplan');
    if(wi){
      const lab=wi.closest('div')?.querySelector('label');if(lab)lab.textContent='漏記提醒（TWD）';
      if(document.activeElement!==wi)wi.value=+f.j.warnTwd||1000;
      wi.onchange=e=>{const q=getF();q.j=q.j||{};q.j.warnTwd=Math.max(0,+e.target.value||1000);q.j.warn=q.j.warnTwd/state.fxRate;putF(q);patch()};
    }
    if(ri){
      const lab=ri.closest('div')?.querySelector('label');if(lab)lab.textContent='重新規劃門檻（TWD）';
      if(document.activeElement!==ri)ri.value=+f.j.replanTwd||15000;
      ri.onchange=e=>{const q=getF();q.j=q.j||{};q.j.replanTwd=Math.max(0,+e.target.value||15000);q.j.replan=q.j.replanTwd/state.fxRate;putF(q);patch()};
    }
  }

  function patchReplanBox(r,f){
    const box=document.getElementById('replanBox');if(!box)return;
    const threshold=+f.j.replanTwd||15000;
    if(!r||r.diffTwd>=0||r.absTwd<threshold){box.classList.remove('show');return}
    const s=proportionalSuggestion(r.absTwd);
    box.classList.add('show');
    box.innerHTML='<h4>🚨 已達重新規劃門檻</h4><p id="v14ReplanText"></p><div id="v14ReplanRows"></div><div class="ract"><button id="v14Apply" class="rapply">確認並套用新月預算</button><button id="v14Cancel" class="rclear">先不調整</button></div>';
    document.getElementById('v14ReplanText').textContent=`目前日本可用資金比帳上少 ${moneyTwd(r.absTwd)}（約 ${moneyJpy(r.absTwd/state.fxRate)}）。先補記漏掉的支出；若確認這不是漏記，而是真實資金短少，以下才是重新規劃預覽。會依目前後續各月「剩餘彈性預算」的比例同比例縮減，住宿與固定必要支出不動。按確認前不會修改任何預算。`;
    const by={};s.cuts.forEach(x=>by[x.m]=(by[x.m]||0)+x.cut);
    const rows=document.getElementById('v14ReplanRows');
    Object.entries(by).forEach(([m,v])=>rows.insertAdjacentHTML('beforeend',`<div class="rrow"><span>${m.replace('-','/')} 預算預計減少</span><b>−${moneyTwd(v)}</b></div>`));
    if(s.uncovered>1)rows.insertAdjacentHTML('beforeend',`<div class="rrow"><span>目前彈性預算仍不足</span><b>${moneyTwd(s.uncovered)}</b></div>`);
    document.getElementById('v14Apply').onclick=()=>applyConfirmed(s.cuts);
    document.getElementById('v14Cancel').onclick=()=>box.classList.remove('show');
  }

  function patch(){
    const f=ensureSettings();patchThresholdInputs(f);
    const r=result(f),status=document.getElementById('jstatus'),home=document.getElementById('homeJapanCheck');
    if(!status)return;
    if(!r){patchReplanBox(null,f);return}

    const warn=+f.j.warnTwd||1000,replan=+f.j.replanTwd||15000;
    const sign=r.diffTwd>=0?'+':'−',diff=`${sign}${moneyTwd(r.absTwd)}`,approx=`約 ${sign}${moneyJpy(Math.abs(r.diffJpy))}`;
    const diffEl=document.getElementById('jdiff');if(diffEl)diffEl.textContent=`${diff}（${approx}）`;

    if(r.absTwd<=warn){
      status.className='jstatus ok';status.textContent=`✅ 對帳正常｜差 ${diff}（${approx}），在 ${moneyTwd(warn)} 容許範圍內。`;
      if(home){home.className='homej show ok';home.textContent=`✅ 日本資金對帳正常｜差 ${diff}`}
    }else if(r.diffTwd<0&&r.absTwd>=replan){
      status.className='jstatus bad';status.textContent=`🚨 不一致｜實際日本可用資金比帳上少 ${moneyTwd(r.absTwd)}（${moneyJpy(r.absTwd/state.fxRate)}）。先補記漏掉的支出；若補完仍差超過 ${moneyTwd(replan)}，才需要重新規劃後續月預算，而且必須由你確認後才會更新。`;
      if(home){home.className='homej show bad';home.textContent=`🚨 記帳不一致 ${moneyTwd(r.absTwd)}｜先補記；確認後才可重規劃`}
    }else{
      status.className='jstatus warn';
      status.textContent=r.diffTwd<0?`⏰ 記帳！！不一致｜實際日本可用資金比帳上少 ${moneyTwd(r.absTwd)}（${moneyJpy(r.absTwd/state.fxRate)}），已超過 ${moneyTwd(warn)}。請先檢查漏記支出。`:`⏰ 記帳！！不一致｜實際日本可用資金比帳上多 ${moneyTwd(r.absTwd)}（${moneyJpy(r.absTwd/state.fxRate)}）。請檢查漏記收入、退款或帳戶餘額。`;
      if(home){home.className='homej show warn';home.textContent=`⏰ 記帳！！日本資金不一致｜差 ${diff}`}
    }
    patchReplanBox(r,f);
  }

  const prior=window.render;window.render=function(){prior();setTimeout(patch,20)};
  setTimeout(patch,120);
})();
