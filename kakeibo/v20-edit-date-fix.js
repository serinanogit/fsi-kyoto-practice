(() => {
  const css=document.createElement('style');
  css.textContent=`
    /* v20: robust iPhone date field inside compact edit modal */
    #editTxModal .edit-date-shell{
      position:relative!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      height:39px!important;
      overflow:hidden!important;
      border:1px solid var(--line)!important;
      border-radius:12px!important;
      background:#fff!important;
      box-sizing:border-box!important;
    }
    #editTxModal .edit-date-shell .edit-date-display{
      display:block!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      padding:0 8px!important;
      overflow:hidden!important;
      white-space:nowrap!important;
      text-overflow:ellipsis!important;
      text-align:center!important;
      font-size:14px!important;
      line-height:1!important;
      color:var(--ink)!important;
      pointer-events:none!important;
      box-sizing:border-box!important;
    }
    #editTxModal .edit-date-shell #editDate{
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      height:100%!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      opacity:0!important;
      -webkit-appearance:none!important;
      appearance:none!important;
      cursor:pointer!important;
      box-sizing:border-box!important;
    }
    #editTxModal .edit-grid > .edit-field{
      min-width:0!important;
      max-width:100%!important;
      overflow:hidden!important;
    }
    @media(max-height:700px){
      #editTxModal .edit-date-shell{height:35px!important}
      #editTxModal .edit-date-shell .edit-date-display{font-size:13px!important}
    }
  `;
  document.head.appendChild(css);

  function fmtDate(v){
    if(!v)return '選擇日期';
    const p=v.split('-').map(Number);
    if(p.length!==3||p.some(x=>!Number.isFinite(x)))return v;
    return `${p[0]}年${p[1]}月${p[2]}日`;
  }

  function syncDisplay(input,display){
    if(!input||!display)return;
    display.textContent=fmtDate(input.value);
  }

  function fix(){
    const input=document.getElementById('editDate');
    if(!input)return;
    let shell=input.closest('.edit-date-shell');
    if(!shell){
      shell=document.createElement('div');
      shell.className='edit-date-shell';
      const parent=input.parentNode;
      parent.insertBefore(shell,input);
      const display=document.createElement('span');
      display.className='edit-date-display';
      shell.appendChild(display);
      shell.appendChild(input);
      input.addEventListener('change',()=>syncDisplay(input,display));
      input.addEventListener('input',()=>syncDisplay(input,display));
      input.addEventListener('focus',()=>syncDisplay(input,display));
    }
    const display=shell.querySelector('.edit-date-display');
    syncDisplay(input,display);
  }

  const observer=new MutationObserver(()=>setTimeout(fix,0));
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','value']});
  setInterval(()=>{
    const modal=document.getElementById('editTxModal');
    if(modal?.classList.contains('show'))fix();
  },250);
  setTimeout(fix,160);
})();
