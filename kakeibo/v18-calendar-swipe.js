(() => {
  const INCOME_CATS={
    salary:{name:'打工／薪資',icon:'💼'},
    scholarship:{name:'獎學金／補助',icon:'🎓'},
    refund:{name:'退款／回饋',icon:'↩️'},
    gift:{name:'家人／其他收入',icon:'🎁'},
    otherIncome:{name:'其他收入',icon:'💰'}
  };

  const css=document.createElement('style');
  css.textContent=`
    .swipe-row{position:relative;overflow:hidden;border-radius:18px}
    .swipe-actions{position:absolute;inset:0 0 0 auto;width:142px;display:flex;justify-content:flex-end;align-items:stretch;z-index:0}
    .swipe-action{width:71px;border:0;color:#fff;font-weight:900;font-size:13px}
    .swipe-action.edit{background:#67a7d8}.swipe-action.delete{background:#e4555e}
    .swipe-row>.tx{position:relative;z-index:1;margin:0;transition:transform .18s ease;will-change:transform;touch-action:pan-y;background:#fff}
    .swipe-row.open>.tx{transform:translateX(-142px)}
    .swipe-row .tx-del{display:none!important}
    .edit-sheet{max-height:82vh;overflow:auto}.edit-sheet h3{color:var(--ink);margin-bottom:10px}
    .edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .edit-field label{display:block;font-size:10px;color:var(--muted);margin:0 0 5px 3px}
    .edit-field input,.edit-field select{width:100%;min-width:0;border:1px solid var(--line);border-radius:14px;background:#fff;padding:11px;color:var(--ink);box-sizing:border-box}
    .edit-field.full{grid-column:1/-1}
    .edit-amount{display:grid;grid-template-columns:86px 1fr;gap:8px}
    .edit-help{font-size:10px;color:var(--muted);line-height:1.55;margin-top:9px;background:#faf7f4;border-radius:12px;padding:9px}
    @media(max-width:480px){.edit-grid{grid-template-columns:1fr}.edit-field.full{grid-column:auto}.swipe-actions{width:132px}.swipe-action{width:66px}.swipe-row.open>.tx{transform:translateX(-132px)}}
  `;
  document.head.appendChild(css);

  let pendingCalendarDate=null;

  function formatDateDisplay(value){
    if(!value)return '選擇日期';
    const [y,m,d]=value.split('-').map(Number);return `${y}年${m}月${d}日`;
  }
  function setAddDate(date){
    const input=document.getElementById('dateInput');if(!input||!date)return;
    input.value=date;
    const display=document.getElementById('dateDisplay');if(display)display.textContent=formatDateDisplay(date);
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  // When a date is selected in the calendar, remember it for the next "+ 記一筆" action.
  function bindCalendarDates(){
    const grid=document.getElementById('calendarGrid');if(!grid||grid.dataset.v18Bound)return;
    grid.dataset.v18Bound='1';
    grid.addEventListener('click',()=>{
      setTimeout(()=>{if(window.selectedDate||typeof selectedDate!=='undefined'){const d=window.selectedDate||selectedDate;if(d)pendingCalendarDate=d}},0);
    });
  }

  const oldShowPage=window.showPage;
  if(typeof oldShowPage==='function'){
    window.showPage=function(name){
      if(name==='add'){
        const d=pendingCalendarDate || (typeof selectedDate!=='undefined'&&selectedDate) || null;
        if(d)setTimeout(()=>setAddDate(d),0);
      }
      oldShowPage(name);
      if(name==='add'){
        const d=pendingCalendarDate || (typeof selectedDate!=='undefined'&&selectedDate) || null;
        if(d)setTimeout(()=>setAddDate(d),25);
      }
    };
  }

  function getTxId(tx){
    if(tx.dataset.txId)return tx.dataset.txId;
    const b=tx.querySelector('.tx-del');
    const s=b?.getAttribute('onclick')||'';
    const m=s.match(/deleteTx\(['\"]([^'\"]+)['\"]\)/);
    if(m){tx.dataset.txId=m[1];return m[1]}
    return null;
  }
  function closeOthers(except){document.querySelectorAll('.swipe-row.open').forEach(r=>{if(r!==except)r.classList.remove('open')})}

  function makeSwipe(tx){
    if(!tx||tx.closest('.swipe-row'))return;
    const id=getTxId(tx);if(!id)return;
    const wrap=document.createElement('div');wrap.className='swipe-row';
    const actions=document.createElement('div');actions.className='swipe-actions';
    actions.innerHTML='<button class="swipe-action edit" type="button">修改</button><button class="swipe-action delete" type="button">刪除</button>';
    tx.parentNode.insertBefore(wrap,tx);wrap.appendChild(actions);wrap.appendChild(tx);
    actions.querySelector('.edit').onclick=e=>{e.stopPropagation();wrap.classList.remove('open');openEdit(id)};
    actions.querySelector('.delete').onclick=e=>{e.stopPropagation();wrap.classList.remove('open');deleteTx(id)};
    let sx=0,sy=0,dx=0,tracking=false,horizontal=false;
    tx.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;const t=e.touches[0];sx=t.clientX;sy=t.clientY;dx=0;tracking=true;horizontal=false;closeOthers(wrap)},{passive:true});
    tx.addEventListener('touchmove',e=>{if(!tracking||e.touches.length!==1)return;const t=e.touches[0],mx=t.clientX-sx,my=t.clientY-sy;dx=mx;if(!horizontal&&Math.abs(mx)>8&&Math.abs(mx)>Math.abs(my)*1.25)horizontal=true;if(horizontal){e.preventDefault();const max=window.innerWidth<=480?132:142;const base=wrap.classList.contains('open')?-max:0;const x=Math.max(-max,Math.min(0,base+mx));tx.style.transform=`translateX(${x}px)`}},{passive:false});
    tx.addEventListener('touchend',()=>{if(!tracking)return;tracking=false;tx.style.transform='';if(!horizontal)return;const threshold=36;if(dx<-threshold)wrap.classList.add('open');else if(dx>threshold)wrap.classList.remove('open')},{passive:true});
    tx.addEventListener('click',()=>{if(wrap.classList.contains('open'))wrap.classList.remove('open')});
  }
  function enhanceTransactions(){document.querySelectorAll('.tx').forEach(makeSwipe)}

  function ensureModal(){
    if(document.getElementById('editTxModal'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="editTxModal" class="modal"><div class="sheet edit-sheet"><h3>✏️ 修改這筆記帳</h3><div class="edit-grid"><div class="edit-field"><label>類型</label><select id="editType"><option value="expense">支出</option><option value="income">收入</option></select></div><div class="edit-field"><label>日期</label><input id="editDate" type="date"></div><div class="edit-field full"><label>金額</label><div class="edit-amount"><select id="editCurrency"><option value="JPY">JPY ¥</option><option value="TWD">TWD NT$</option></select><input id="editAmount" type="number" min="0" step="1" inputmode="decimal"></div></div><div class="edit-field"><label>分類</label><select id="editCategory"></select></div><div class="edit-field"><label>付款／入帳方式</label><select id="editPayment"></select></div><div class="edit-field"><label>必要性</label><select id="editNeed"><option value="normal">一般支出</option><option value="necessary">必要支出</option><option value="treat">想買／享受</option></select></div><div class="edit-field full"><label>備註</label><input id="editNote" placeholder="備註"></div></div><div class="edit-help">修改金額時：如果幣別不變，會沿用原本這筆交易記錄的匯率；若更換幣別，改用目前家計簿匯率換算。</div><div class="sheet-actions"><button id="editCancel" class="cancel" type="button">取消</button><button id="editSave" class="confirm" type="button">儲存修改</button></div></div></div>`);
    document.getElementById('editCancel').onclick=()=>document.getElementById('editTxModal').classList.remove('show');
    document.getElementById('editType').onchange=()=>fillEditOptions(document.getElementById('editType').value);
  }

  function fillEditOptions(type,tx){
    const cat=document.getElementById('editCategory'),pay=document.getElementById('editPayment'),need=document.getElementById('editNeed');
    cat.innerHTML='';const src=type==='income'?INCOME_CATS:CATS;Object.entries(src).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=`${v.icon||''} ${v.name}`;cat.appendChild(o)});
    pay.innerHTML=type==='income'?'<option>玉山｜日圓</option><option>永豐｜日圓</option><option>日本郵局｜日圓</option><option>現金收入</option><option>其他</option>':'<option>玉山熊本熊卡</option><option>永豐提款 → 現金</option><option>日圓現金</option><option>其他</option>';
    need.disabled=type==='income';need.style.opacity=type==='income'?'.45':'1';
    if(tx){cat.value=tx.category||cat.value;if([...pay.options].some(o=>o.value===tx.payment))pay.value=tx.payment;else{const o=document.createElement('option');o.value=tx.payment||'其他';o.textContent=tx.payment||'其他';pay.appendChild(o);pay.value=o.value}need.value=tx.need||'normal'}
  }

  function openEdit(id){
    ensureModal();const tx=state.transactions.find(t=>String(t.id)===String(id));if(!tx)return;
    const type=tx.type||'expense';document.getElementById('editType').value=type;document.getElementById('editDate').value=tx.date||'';document.getElementById('editCurrency').value=tx.currency||'TWD';document.getElementById('editAmount').value=tx.originalAmount||'';document.getElementById('editNote').value=tx.note||'';fillEditOptions(type,tx);
    document.getElementById('editSave').onclick=()=>saveEdit(id,tx);
    document.getElementById('editTxModal').classList.add('show');
  }
  function saveEdit(id,oldTx){
    const tx=state.transactions.find(t=>String(t.id)===String(id));if(!tx)return;
    const oldCurrency=oldTx.currency||'TWD',newCurrency=document.getElementById('editCurrency').value,amount=+document.getElementById('editAmount').value;
    if(!amount){alert('請輸入金額');return}
    tx.type=document.getElementById('editType').value;tx.date=document.getElementById('editDate').value;tx.currency=newCurrency;tx.originalAmount=amount;tx.category=document.getElementById('editCategory').value;tx.payment=document.getElementById('editPayment').value;tx.need=tx.type==='income'?'':document.getElementById('editNeed').value;tx.note=document.getElementById('editNote').value.trim();
    if(newCurrency==='TWD')tx.twdValue=amount;else{const rate=newCurrency===oldCurrency?(+oldTx.fxRate||state.fxRate):state.fxRate;tx.fxRate=rate;tx.twdValue=amount*rate}
    save();document.getElementById('editTxModal').classList.remove('show');document.getElementById('monthSelect').value=ym(tx.date);selectedDate=tx.date;pendingCalendarDate=tx.date;render();showPage('book');
  }

  function run(){bindCalendarDates();enhanceTransactions()}
  const oldRender=window.render;window.render=function(){oldRender();setTimeout(run,35)};
  const observer=new MutationObserver(()=>setTimeout(run,0));observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(run,180);
})();
