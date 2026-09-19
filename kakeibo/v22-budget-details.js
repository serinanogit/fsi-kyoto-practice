(() => {
  const MONTH_HINTS={
    lodging:'宿舍／飯店',
    fixed:'健保・電費・洗衣・網路等',
    daily:'餐食・日用品・購物・日常交通',
    kansai:'京都・大阪・關西週末活動',
    bigTrip:'大型旅行整包預算',
    oneoff:'名古屋／入住用品等'
  };

  if(window.CATS && CATS.fixed) CATS.fixed.name='固定生活費';

  const style=document.createElement('style');
  style.textContent=`
    #budgetDetailModal .detail-row{align-items:flex-start!important}
    #budgetDetailModal .detail-main{min-width:0;flex:1}
    #budgetDetailModal .detail-sub{font-size:10px;line-height:1.45;color:var(--muted);margin-top:3px;font-weight:500}
    #budgetDetailModal .detail-section-title{font-size:11px;font-weight:900;color:#6a625e;margin:12px 0 4px}
    #budgetDetailModal .detail-note b{color:var(--ink)}
    #catGrid .cat-desc{font-size:10px;color:var(--muted);line-height:1.35;margin:2px 0 7px 48px}
  `;
  document.head.appendChild(style);

  function daysInBudgetMonth(month){
    if(month==='2026-09') return 10;
    if(month==='2027-04') return 4;
    const [y,m]=month.split('-').map(Number);
    return new Date(y,m,0).getDate();
  }

  function row(name,amount,sub=''){return {name,amount,sub}}

  function detail(month,cat,total){
    let rows=[],note='金額是「預算預留」，不是一定要花完；實際支出仍以記帳為準。';

    if(cat==='lodging'){
      if(month==='2026-09'){
        rows=[row('9月住宿',0,'抵日前後已付款的飯店費用已從這份「剩餘日本預算」排除，不再重複計入。')];
      }else if(month==='2026-10'){
        rows=[row('百萬遍宿舍月費預留',8500,'10月住宿主體。'),row('入館費／匯率與雜費緩衝',1400,'保留給入住初期與匯率差，不代表一定會全花。')];
      }else if(['2026-11','2026-12','2027-01','2027-02'].includes(month)){
        rows=[row('百萬遍宿舍月費預留',total,'此月住宿只編宿舍，不含日常生活費。')];
      }else if(month==='2027-03'){
        rows=[row('百萬遍宿舍月費預留',8620,'交換最後一個宿舍月份。'),row('退宿後飯店預留',17510,'3月退宿後至4月離日前的住宿預算之一。')];
      }else if(month==='2027-04'){
        rows=[row('離日前飯店預留',6566,'4月最後幾天住宿。')];
      }
      note+='<br><br><b>住宿</b>只放宿舍／飯店，不包含洗衣、電費、吃飯或交通。';
    }else if(cat==='fixed'){
      if(month==='2026-09'){
        rows=[
          row('9/21–9/30 固定生活費緩衝',1500,'這筆不是特定帳單，而是抵日後前10天的固定費預留；可能用到宿舍洗衣、電費／健保首期或通訊等。實際帳單出來後再改成真實金額。')
        ];
      }else if(['2026-10','2026-11','2026-12','2027-01','2027-02','2027-03'].includes(month)){
        rows=[
          row('國民健康保險（估）',400,'每月先預留；收到區役所／保險實際金額後更新。'),
          row('宿舍電費（估）',850,'依實際用電變動。'),
          row('洗衣／烘衣（估）',350,'宿舍投幣洗衣等使用費。'),
          row('手機／網路／其他固定帳單緩衝（估）',900,'包含通訊、宿舍網路或其他小額固定帳單；若實際沒有這些費用，剩餘就留在預算裡。')
        ];
      }else if(month==='2027-04'){
        rows=[row('最後4天固定生活費緩衝',412,'離日前少量固定／通訊／洗衣等預留。')];
      }
      note+='<br><br><b>固定生活費不是吃飯或購物。</b>目前主要是健保、宿舍電費、洗衣／烘衣、手機／網路與固定帳單緩衝；其中多數仍是估算值。';
    }else if(cat==='daily'){
      const days=daysInBudgetMonth(month),avg=Math.round(total/Math.max(days,1));
      rows=[
        row('日常共同池',total,`包含吃飯、咖啡、超市／日用品、小額購物與平常移動交通；不含住宿、固定帳單與另外編列的旅行。`),
        row('平均可用／日',avg,`以這個月預算涵蓋的 ${days} 天平均分配，只是參考，不要求每天花一樣。`)
      ];
      note+='<br><br>這類故意不硬拆成「餐費多少／購物多少」，避免某天多吃、某天少買時反而難記；只看整個共同池有沒有超支。';
    }else if(cat==='kansai'){
      rows=[row('京都・大阪・關西週末活動共同池',total,'交通、門票、餐飲等小旅行支出都從這裡扣；平日通勤／日常移動則放在日常共同池。')];
      note+='<br><br>這是「小旅行」預算，不包含12月／2月的大型旅行。';
    }else if(cat==='bigTrip'){
      if(total>0) rows=[row(month==='2026-12'?'12月大型旅行':'2月大型旅行',total,'交通＋住宿＋當地活動的整包上限，實際行程確定後可以再細拆。')];
      else rows=[row('本月沒有另外編大型旅行',0,'')];
      note+='<br><br>大型旅行是獨立池，不會跟平常吃飯或關西週末小旅行混在一起。';
    }else if(cat==='oneoff'){
      if(month==='2026-09'){
        rows=[
          row('名古屋尚未發生的現場支出',7680,'飯店等已支付項目不重複算，只留尚未發生的現場花費。'),
          row('入住初期用品',6000,'寢具／日用品／收納／生活用品等抵日初期一次性採買。')
        ];
      }else if(month==='2026-10'){
        rows=[row('入住後補買用品',2000,'搬進宿舍後才發現缺少的生活用品預留。')];
      }else{
        rows=[row('本月沒有另外編一次性支出',0,'')];
      }
      note+='<br><br>一次性支出是「買一次就不會每月重複」的項目，不應塞進固定生活費。';
    }
    return {rows,note};
  }

  window.openBudgetDetail=function(cat){
    const m=selectedMonth(),plan=adjustedPlan(m),c=CATS[cat],total=plan[cat]||0,d=detail(m,cat,total);
    document.getElementById('budgetDetailTitle').textContent=`${c.icon} ${c.name}｜${m.replace('-','/')} 細項`;
    document.getElementById('budgetDetailTotal').textContent=money(total);
    const host=document.getElementById('budgetDetailRows');host.innerHTML='';
    d.rows.forEach(x=>{
      const r=document.createElement('div');r.className='detail-row';
      r.innerHTML=`<div class="detail-main"><div class="name">${x.name}</div>${x.sub?`<div class="detail-sub">${x.sub}</div>`:''}</div><span class="amt">${money(x.amount)}</span>`;
      host.appendChild(r);
    });
    const note=document.getElementById('budgetDetailNote');
    note.innerHTML=d.note;
    document.getElementById('budgetDetailModal').classList.add('show');
  };

  function addHints(){
    const plan=adjustedPlan(selectedMonth());
    const visible=Object.entries(CATS).filter(([k])=>(plan[k]||0)!==0||catSpent(selectedMonth(),k)!==0).map(([k])=>k);
    document.querySelectorAll('#catGrid .cat').forEach((el,i)=>{
      const k=visible[i]; if(!k) return;
      const name=el.querySelector('.cat-name');
      if(name && k==='fixed') name.textContent='固定生活費';
      if(!el.querySelector('.cat-desc') && MONTH_HINTS[k]){
        const desc=document.createElement('div');desc.className='cat-desc';desc.textContent=MONTH_HINTS[k];
        const top=el.querySelector('.cat-top'); if(top) top.insertAdjacentElement('afterend',desc);
      }
    });
  }

  function markCathayInvestment(){
    document.querySelectorAll('.asset-name').forEach(el=>{
      if(el.textContent.trim()==='國泰｜台幣') el.textContent='國泰｜台幣（投資）';
    });
  }

  const oldRender=window.render;
  window.render=function(){oldRender();setTimeout(()=>{addHints();markCathayInvestment()},0)};
  setTimeout(()=>{addHints();markCathayInvestment()},120);
})();