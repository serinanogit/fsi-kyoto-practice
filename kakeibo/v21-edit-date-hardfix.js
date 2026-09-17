(() => {
  const css=document.createElement('style');
  css.textContent=`
    /* v21: hard fix iOS date input overflow in edit modal */
    #editTxModal .edit-grid{overflow:hidden!important}
    #editTxModal .edit-field{min-width:0!important;max-width:100%!important;overflow:hidden!important}
    #editTxModal .edit-field.v21-date-field{min-width:0!important;max-width:100%!important;overflow:hidden!important}
    #editTxModal .v21-date-wrap{
      position:relative!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      height:39px!important;
      border:1px solid var(--line)!important;
      border-radius:12px!important;
      background:#fff!important;
      overflow:hidden!important;
      box-sizing:border-box!important;
    }
    #editTxModal .v21-date-text{
      display:block!important;
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      padding:0 8px!important;
      box-sizing:border-box!important;
      text-align:center!important;
      font-size:13px!important;
      line-height:1!important;
      white-space:nowrap!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
      pointer-events:none!important;
    }
    #editTxModal .v21-date-wrap #editDate{
      position:absolute!important;
      inset:0!important;
      display:block!important;
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
    @media(max-height:700px){#editTxModal .v21-date-wrap{height:35px!important}.v21-date-text{font-size:12px!important}}
  `;
  document.head.appendChild(css);

  function fmt(v){
    if(!v)return '選擇日期';
    const [y,m,d]=v.split('-').map(Number);
    return `${y}年${m}月${d}日`;
  }
  function install(){
    const input=document.getElementById('editDate');
    if(!input||input.dataset.v21Installed)return;
    input.dataset.v21Installed='1';
    const field=input.closest('.edit-field');
    if(!field)return;
    field.classList.add('v21-date-field');
    let wrap=input.closest('.v21-date-wrap');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='v21-date-wrap';
      const text=document.createElement('span');
      text.className='v21-date-text';
      text.textContent=fmt(input.value);
      input.parentNode.insertBefore(wrap,input);
      wrap.appendChild(text);
      wrap.appendChild(input);
    }
    const sync=()=>{const text=wrap.querySelector('.v21-date-text');if(text)text.textContent=fmt(input.value)};
    input.addEventListener('change',sync);
    input.addEventListener('input',sync);
    sync();
  }
  function syncOnShow(){
    install();
    const modal=document.getElementById('editTxModal');
    if(!modal)return;
    const input=document.getElementById('editDate');
    const text=modal.querySelector('.v21-date-text');
    if(input&&text)text.textContent=fmt(input.value);
  }
  const obs=new MutationObserver(()=>setTimeout(syncOnShow,0));
  obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','value']});
  setTimeout(syncOnShow,120);
})();
