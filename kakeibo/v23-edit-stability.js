(() => {
  const css=document.createElement('style');
  css.textContent=`
    /* v23: stable iPhone edit-date field, no polling / no recursive MutationObserver */
    #editTxModal .edit-grid{
      grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      overflow:hidden!important;
    }
    #editTxModal .edit-field{
      min-width:0!important;
      max-width:100%!important;
      box-sizing:border-box!important;
    }
    #editTxModal .v23-date-field{
      min-width:0!important;
      max-width:100%!important;
      overflow:hidden!important;
    }
    #editTxModal .v23-date-wrap{
      position:relative!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      height:39px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      overflow:hidden!important;
      border:1px solid var(--line)!important;
      border-radius:12px!important;
      background:#fff!important;
      box-sizing:border-box!important;
    }
    #editTxModal .v23-date-text{
      display:block!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      padding:0 5px!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
      white-space:nowrap!important;
      text-align:center!important;
      font-size:12px!important;
      line-height:1!important;
      color:var(--ink)!important;
      pointer-events:none!important;
      box-sizing:border-box!important;
    }
    #editTxModal .v23-date-wrap #editDate{
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      min-width:0!important;
      max-width:100%!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      opacity:0!important;
      background:transparent!important;
      -webkit-appearance:none!important;
      appearance:none!important;
      box-sizing:border-box!important;
      cursor:pointer!important;
    }
    @media(max-width:430px){
      #editTxModal .edit-grid{column-gap:7px!important}
      #editTxModal .v23-date-text{font-size:11.5px!important;padding:0 3px!important}
    }
    @media(max-height:700px){
      #editTxModal .v23-date-wrap{height:35px!important}
      #editTxModal .v23-date-text{font-size:11px!important}
    }
  `;
  document.head.appendChild(css);

  function formatDate(value){
    if(!value)return '選擇日期';
    const p=value.split('-').map(Number);
    if(p.length!==3||p.some(n=>!Number.isFinite(n)))return value;
    return `${p[0]}年${p[1]}月${p[2]}日`;
  }

  function installAndSync(){
    const input=document.getElementById('editDate');
    if(!input)return;

    const field=input.closest('.edit-field');
    if(!field)return;
    field.classList.add('v23-date-field');

    let wrap=input.closest('.v23-date-wrap');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='v23-date-wrap';
      const text=document.createElement('span');
      text.className='v23-date-text';
      input.parentNode.insertBefore(wrap,input);
      wrap.appendChild(text);
      wrap.appendChild(input);

      const sync=()=>{text.textContent=formatDate(input.value)};
      input.addEventListener('change',sync);
      input.addEventListener('input',sync);
    }

    const text=wrap.querySelector('.v23-date-text');
    if(text && text.textContent!==formatDate(input.value)){
      text.textContent=formatDate(input.value);
    }
  }

  // The edit modal is created lazily by v18. Watch only until it exists, then disconnect.
  if(document.getElementById('editTxModal')){
    installAndSync();
  }else{
    const once=new MutationObserver(()=>{
      if(document.getElementById('editTxModal')){
        once.disconnect();
        installAndSync();
      }
    });
    once.observe(document.body,{childList:true,subtree:true});
  }

  // Each time the user opens Edit, v18 assigns the date programmatically.
  // Sync once after that click; no timers, polling, or permanent DOM observer.
  document.addEventListener('click',e=>{
    if(e.target.closest('.swipe-action.edit')){
      requestAnimationFrame(()=>installAndSync());
    }
  },false);
})();