(() => {
  const css=document.createElement('style');
  css.textContent=`
    /* v19: compact edit sheet — keep the entire editor visible on iPhone */
    #editTxModal.show{
      align-items:center!important;
      justify-content:center!important;
      padding:max(8px,env(safe-area-inset-top,0px)) 10px max(8px,env(safe-area-inset-bottom,0px))!important;
      overscroll-behavior:contain;
    }
    #editTxModal .edit-sheet{
      width:min(96vw,520px)!important;
      max-width:520px!important;
      max-height:calc(100dvh - 20px)!important;
      height:auto!important;
      overflow:hidden!important;
      padding:13px 14px 12px!important;
      border-radius:23px!important;
      box-sizing:border-box!important;
    }
    #editTxModal .edit-sheet h3{
      margin:0 0 7px!important;
      font-size:19px!important;
      line-height:1.15!important;
    }
    #editTxModal .edit-grid{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      gap:6px 8px!important;
    }
    #editTxModal .edit-field{
      min-width:0!important;
      margin:0!important;
    }
    #editTxModal .edit-field.full,
    #editTxModal .edit-field:nth-child(6){
      grid-column:1/-1!important;
    }
    #editTxModal .edit-field label{
      font-size:9px!important;
      line-height:1!important;
      margin:0 0 3px 3px!important;
    }
    #editTxModal .edit-field input,
    #editTxModal .edit-field select{
      min-width:0!important;
      width:100%!important;
      min-height:39px!important;
      height:39px!important;
      padding:7px 10px!important;
      border-radius:12px!important;
      font-size:14px!important;
      line-height:1.15!important;
      box-sizing:border-box!important;
    }
    #editTxModal .edit-amount{
      grid-template-columns:82px minmax(0,1fr)!important;
      gap:6px!important;
    }
    #editTxModal #editNote{
      height:38px!important;
    }
    #editTxModal .edit-help{
      margin:6px 0 0!important;
      padding:0!important;
      background:transparent!important;
      font-size:9px!important;
      line-height:1.35!important;
    }
    #editTxModal .edit-help-toggle{
      width:100%;
      border:0;
      background:#faf7f4;
      color:var(--muted);
      border-radius:10px;
      padding:7px 9px;
      text-align:left;
      font:inherit;
      font-size:9px;
      font-weight:800;
    }
    #editTxModal .edit-help-body{
      margin-top:4px;
      padding:7px 9px;
      border-radius:10px;
      background:#faf7f4;
    }
    #editTxModal .sheet-actions{
      display:grid!important;
      grid-template-columns:1fr 1fr!important;
      gap:7px!important;
      margin-top:7px!important;
    }
    #editTxModal .sheet-actions button{
      min-height:40px!important;
      padding:8px 10px!important;
      border-radius:12px!important;
      font-size:13px!important;
    }
    body.v19-edit-locked{
      position:fixed!important;
      left:0!important;
      right:0!important;
      width:100%!important;
      overflow:hidden!important;
      overscroll-behavior:none!important;
    }
    @media(max-height:700px){
      #editTxModal .edit-sheet{padding:10px 12px 9px!important}
      #editTxModal .edit-sheet h3{font-size:17px!important;margin-bottom:5px!important}
      #editTxModal .edit-grid{gap:4px 7px!important}
      #editTxModal .edit-field label{font-size:8px!important;margin-bottom:2px!important}
      #editTxModal .edit-field input,#editTxModal .edit-field select{height:35px!important;min-height:35px!important;padding:5px 9px!important;font-size:13px!important}
      #editTxModal #editNote{height:34px!important}
      #editTxModal .edit-help-toggle{padding:5px 8px!important}
      #editTxModal .sheet-actions{margin-top:5px!important}
      #editTxModal .sheet-actions button{min-height:36px!important;padding:6px 9px!important}
    }
  `;
  document.head.appendChild(css);

  let locked=false,scrollY=0;

  function compactHelp(modal){
    const help=modal?.querySelector('.edit-help');
    if(!help||help.dataset.v19Done)return;
    help.dataset.v19Done='1';
    const original=help.textContent.trim();
    help.innerHTML=`<button type="button" class="edit-help-toggle">ⓘ 匯率說明（點一下展開）</button><div class="edit-help-body" hidden></div>`;
    help.querySelector('.edit-help-body').textContent=original;
    help.querySelector('.edit-help-toggle').addEventListener('click',()=>{
      const body=help.querySelector('.edit-help-body');
      body.hidden=!body.hidden;
      help.querySelector('.edit-help-toggle').textContent=body.hidden?'ⓘ 匯率說明（點一下展開）':'ⓘ 匯率說明（收起）';
    });
  }

  function lockBackground(){
    if(locked)return;
    locked=true;scrollY=window.scrollY||window.pageYOffset||0;
    document.body.classList.add('v19-edit-locked');
    document.body.style.top=`-${scrollY}px`;
  }
  function unlockBackground(){
    if(!locked)return;
    locked=false;
    document.body.classList.remove('v19-edit-locked');
    document.body.style.top='';
    window.scrollTo(0,scrollY);
  }

  function wire(modal){
    if(!modal||modal.dataset.v19Wired)return;
    modal.dataset.v19Wired='1';
    compactHelp(modal);
    modal.addEventListener('touchmove',e=>{
      if(e.target===modal)e.preventDefault();
    },{passive:false});
  }

  function sync(){
    const modal=document.getElementById('editTxModal');
    if(!modal)return;
    wire(modal);compactHelp(modal);
    if(modal.classList.contains('show'))lockBackground();else unlockBackground();
  }

  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('pagehide',unlockBackground);
  setTimeout(sync,120);
})();
