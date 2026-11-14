(() => {
  const FLEX=['bigTrip','kansai','oneoff','daily'];
  const months=MONTHS.slice();
  const empty=()=>Object.fromEntries(months.map(m=>[m,{daily:0,kansai:0,bigTrip:0,oneoff:0}]));
  const totals=p=>Object.values(p).reduce((s,v)=>s+(+v||0),0);
  const avail=(m,c,carry,plans)=>Math.max(0,(+plans[m]?.[c]||0)+(+carry[m]?.[c]||0));

  function compute(plans=PLANS,now=currentYM()){
    const carry=empty(),excess=[],unfunded=[];
    for(let i=0;i<months.length;i++){
      const m=months[i];if(m>=now)break;
      const b={...plans[m]};
      FLEX.forEach(c=>b[c]=Math.max(0,(b[c]||0)+carry[m][c]));
      const delta=totals(b)-monthSpent(m);
      if(Math.abs(delta)<0.001)continue;
      const future=months.slice(i+1);
      if(!future.length){excess.push({month:m,amount:delta});continue}
      if(delta>0){
        // Divide savings equally, including future months that are already closed.
        const piece=delta/future.length;
        future.forEach(mm=>carry[mm].daily+=piece);
        continue;
      }
      let pending=-delta,active=future.slice(),loops=0;
      // Cut equally per future month, capped by its available flexible budget.
      while(pending>0.01&&active.length&&loops++<30){
        const share=pending/active.length;
        let cutTotal=0;
        const next=[];
        for(const mm of active){
          let rem=share;
          for(const c of FLEX){
            if(rem<=0.001)break;
            const cut=Math.min(rem,avail(mm,c,carry,plans));
            if(cut>0){carry[mm][c]-=cut;rem-=cut;cutTotal+=cut}
          }
          if(FLEX.reduce((s,c)=>s+avail(mm,c,carry,plans),0)>0.001)next.push(mm);
        }
        pending-=cutTotal;
        if(cutTotal<0.001)break;
        active=next;
      }
      if(pending>0.01)unfunded.push({month:m,amount:pending});
    }
    const adjusted={};
    months.forEach(m=>{
      adjusted[m]={...plans[m]};
      FLEX.forEach(c=>adjusted[m][c]=Math.max(0,(+plans[m]?.[c]||0)+(carry[m]?.[c]||0)));
    });
    return {carry,adjusted,unfunded,excess};
  }
  window.serinaPlanEngine={compute};

  window.adjustments=function(){return compute().carry};
  window.adjustedPlan=function(m,cache){
    const a=cache||adjustments();
    const p={...PLANS[m]};
    FLEX.forEach(c=>p[c]=Math.max(0,(p[c]||0)+(a[m]?.[c]||0)));
    return p;
  };

  const css=document.createElement('style');
  css.textContent='.carry-note{font-size:11px;color:#7b6c63;line-height:1.6;margin:8px 0;padding:10px;border-radius:13px;background:#fff5e8}';
  document.head.appendChild(css);

  // Explain carryover in the budget interface. Applied to every completed month only.
  const prior=window.render;
  window.render=function(){
    prior();
    const box=document.getElementById('carryDetails');
    if(box){
      const e=compute(),m=selectedMonth(),p=e.carry[m]||{},v=totals(p);
      box.textContent='已完成月份的結餘平攤至後續月份：'+(v>=0?'+':'−')+'NT$'+Math.round(Math.abs(v)).toLocaleString('zh-TW')+
        '（已包含在本月分類預算）。'+(e.unfunded.length?' 警告：仍有未分配的超支，請重新規劃。':'');
    }
  };
  setTimeout(()=>render(),50);
})();