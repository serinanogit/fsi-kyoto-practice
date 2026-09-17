(() => {
  const style=document.createElement('style');
  style.textContent=`
    .jresult-inline{margin:12px 0 0;padding:13px;border-radius:20px;background:linear-gradient(145deg,#fff,#fff9f1);border:2px solid #f1dcc7;box-shadow:0 7px 20px rgba(84,57,42,.06)}
    .jresult-inline-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:9px}
    .jresult-inline-head strong{font-size:16px;color:#3b3938}.jresult-inline-head span{font-size:9px;color:var(--muted);background:#f7f2ed;border-radius:999px;padding:5px 7px;white-space:nowrap}
    .jresult-inline .jstatus{margin:0 0 10px;padding:13px 14px;border-radius:16px;font-size:13px;line-height:1.5;font-weight:900}
    .jresult-inline .jstatus.ok{background:linear-gradient(135deg,#e8f7ec,#f7fff9);border:2px solid #98d1a8}
    .jresult-inline .jstatus.warn{background:linear-gradient(135deg,#fff0c9,#fff9ed);border:3px solid #f0b95e;box-shadow:0 0 0 4px rgba(240,185,94,.08)}
    .jresult-inline .jstatus.bad{background:linear-gradient(135deg,#ffe7e9,#fff6f6);border:4px solid #e54852;box-shadow:0 0 0 5px rgba(229,72,82,.08)}
    .jresult-inline .jgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .jresult-inline .jstat{padding:11px;border-radius:14px;background:#fff;border:1px solid #eee5de;min-width:0}
    .jresult-inline .jstat small{display:block;font-size:9px;color:var(--muted);margin-bottom:4px}
    .jresult-inline .jstat strong{font-size:17px;line-height:1.15;font-weight:950;color:#343230;word-break:break-word}
    .jresult-inline .jstat.diff-primary{grid-column:1/-1;background:linear-gradient(135deg,#fff4df,#fff);border:2px solid #f0c477;text-align:center;padding:13px}
    .jresult-inline .jstat.diff-primary small{font-size:10px;font-weight:800;color:#9a671e}
    .jresult-inline .jstat.diff-primary strong{font-size:27px;color:#dd7d21;letter-spacing:-.5px}
    .jresult-inline .jstat.tx-count{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;padding:8px 11px;background:#faf8f5}
    .jresult-inline .jstat.tx-count small{margin:0}.jresult-inline .jstat.tx-count strong{font-size:13px}
    #jbase{font-size:14px;padding:13px;margin-top:11px}
    .jresult-flash{animation:jflash .75s ease-out}
    @keyframes jflash{0%{box-shadow:0 0 0 0 rgba(246,161,58,.32)}55%{box-shadow:0 0 0 8px rgba(246,161,58,.12)}100%{box-shadow:0 7px 20px rgba(84,57,42,.06)}}
    @media(max-width:480px){.jresult-inline{padding:11px;border-radius:18px}.jresult-inline-head strong{font-size:15px}.jresult-inline-head span{font-size:8.5px}.jresult-inline .jstatus{font-size:12px;padding:12px}.jresult-inline .jstat strong{font-size:16px}.jresult-inline .jstat.diff-primary strong{font-size:25px}}
  `;
  document.head.appendChild(style);

  function place(){
    const card=document.getElementById('japanCheckCard');
    const btn=document.getElementById('jbase');
    const status=document.getElementById('jstatus');
    const grid=status?.nextElementSibling?.classList?.contains('jgrid')?status.nextElementSibling:card?.querySelector('.jgrid');
    if(!card||!btn||!status||!grid)return;
    let box=document.getElementById('jresultInline');
    if(!box){
      box=document.createElement('div');box.id='jresultInline';box.className='jresult-inline';
      box.innerHTML='<div class="jresult-inline-head"><strong>🔎 比對結果</strong><span>NT$1,000 提醒｜NT$15,000 重規劃</span></div>';
      btn.insertAdjacentElement('afterend',box);
    }
    if(status.parentElement!==box)box.appendChild(status);
    if(grid.parentElement!==box)box.appendChild(grid);
    const diff=document.getElementById('jdiff')?.closest('.jstat');if(diff)diff.classList.add('diff-primary');
    const count=document.getElementById('jcount')?.closest('.jstat');if(count)count.classList.add('tx-count');
  }

  function bindScroll(){
    const btn=document.getElementById('jbase');
    if(!btn||btn.dataset.v16Bound)return;btn.dataset.v16Bound='1';
    btn.addEventListener('click',()=>setTimeout(()=>{
      place();const box=document.getElementById('jresultInline');if(!box)return;box.classList.remove('jresult-flash');void box.offsetWidth;box.classList.add('jresult-flash');box.scrollIntoView({behavior:'smooth',block:'nearest'});
    },80));
  }

  function run(){place();bindScroll()}
  const oldRender=window.render;window.render=function(){oldRender();setTimeout(run,35)};
  const observer=new MutationObserver(run);observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(run,160);
})();
