(() => {
  const style=document.createElement('style');
  style.id='v15-prominent-check-style';
  style.textContent=`
    .jresult-hero{margin:12px 0 14px;padding:14px;border-radius:22px;background:linear-gradient(145deg,#fff,#fff8ef);border:2px solid #f2ddc5;box-shadow:0 8px 24px rgba(84,57,42,.07)}
    .jresult-heading{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}
    .jresult-heading strong{font-size:18px;color:#3b3938}.jresult-heading span{font-size:10px;color:var(--muted);background:#f7f2ed;border-radius:999px;padding:6px 9px;white-space:nowrap}
    .jresult-hero .jstatus{margin:0 0 12px;padding:15px 16px;border-radius:18px;font-size:15px;line-height:1.55;font-weight:900;letter-spacing:.01em}
    .jresult-hero .jstatus.ok{background:linear-gradient(135deg,#e8f7ec,#f7fff9);border:2px solid #98d1a8;box-shadow:none}
    .jresult-hero .jstatus.warn{background:linear-gradient(135deg,#fff0c9,#fff9ed);border:3px solid #f0b95e;box-shadow:0 0 0 5px rgba(240,185,94,.10)}
    .jresult-hero .jstatus.bad{background:linear-gradient(135deg,#ffe7e9,#fff6f6);border:4px solid #e54852;box-shadow:0 0 0 6px rgba(229,72,82,.09)}
    .jresult-hero .jgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .jresult-hero .jstat{padding:12px;border-radius:16px;background:#fff;border:1px solid #eee5de;min-width:0}
    .jresult-hero .jstat small{display:block;font-size:10px;color:var(--muted);margin-bottom:5px}
    .jresult-hero .jstat strong{font-size:20px;line-height:1.15;font-weight:950;color:#343230;word-break:break-word}
    .jresult-hero .jstat.diff-primary{grid-column:1/-1;background:linear-gradient(135deg,#fff4df,#fff);border:2px solid #f0c477;text-align:center;padding:14px}
    .jresult-hero .jstat.diff-primary small{font-size:11px;font-weight:800;color:#9a671e}
    .jresult-hero .jstat.diff-primary strong{font-size:29px;color:#dd7d21;letter-spacing:-.5px}
    .jresult-hero .jstat.tx-count{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:#faf8f5}
    .jresult-hero .jstat.tx-count small{margin:0}.jresult-hero .jstat.tx-count strong{font-size:14px}
    .jsettings-heading{font-size:13px;font-weight:900;margin:16px 2px 7px;color:#5e5752}
    #japanCheckCard>.jnote:first-of-type{margin-top:8px}
    #jacc,#jcards{opacity:.98}
    #jbase{font-size:14px;padding:13px;margin-top:11px}
    @media(max-width:480px){
      .jresult-hero{margin:10px 0 13px;padding:12px;border-radius:20px}
      .jresult-heading strong{font-size:17px}.jresult-heading span{font-size:9px;padding:5px 7px}
      .jresult-hero .jstatus{font-size:14px;padding:14px}
      .jresult-hero .jstat strong{font-size:18px}
      .jresult-hero .jstat.diff-primary strong{font-size:28px}
    }
  `;
  document.head.appendChild(style);

  function promote(){
    const card=document.getElementById('japanCheckCard');
    const status=document.getElementById('jstatus');
    const grid=status?.nextElementSibling?.classList?.contains('jgrid')?status.nextElementSibling:card?.querySelector('.jgrid');
    if(!card||!status||!grid)return;

    let hero=document.getElementById('jresultHero');
    if(!hero){
      hero=document.createElement('div');
      hero.id='jresultHero';hero.className='jresult-hero';
      hero.innerHTML='<div class="jresult-heading"><strong>🔎 日本資金對帳結果</strong><span>NT$1,000 提醒｜NT$15,000 重規劃</span></div>';
      const title=card.querySelector('.jtitle');
      title?.insertAdjacentElement('afterend',hero);
      hero.appendChild(status);hero.appendChild(grid);
    }

    const diff=document.getElementById('jdiff')?.closest('.jstat');if(diff)diff.classList.add('diff-primary');
    const count=document.getElementById('jcount')?.closest('.jstat');if(count)count.classList.add('tx-count');

    const acc=document.getElementById('jacc');
    if(acc&&!document.getElementById('jScopeHeading')){
      const h=document.createElement('div');h.id='jScopeHeading';h.className='jsettings-heading';h.textContent='比較範圍設定';acc.insertAdjacentElement('beforebegin',h);
    }
    const cards=document.getElementById('jcards');
    if(cards&&!document.getElementById('jCardHeading')){
      const h=document.createElement('div');h.id='jCardHeading';h.className='jsettings-heading';h.textContent='日本生活用信用卡';
      const prior=cards.previousElementSibling;
      if(prior?.classList?.contains('jnote')) prior.insertAdjacentElement('beforebegin',h); else cards.insertAdjacentElement('beforebegin',h);
    }
  }

  const oldRender=window.render;
  window.render=function(){oldRender();setTimeout(promote,40)};
  const observer=new MutationObserver(()=>promote());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(promote,180);
})();
