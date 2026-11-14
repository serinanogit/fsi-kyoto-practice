(() => {
 const input=document.getElementById('amountInput');if(!input)return;
 input.readOnly=true;input.setAttribute('inputmode','none');input.placeholder='點這裡用計算機輸入';
 const css=document.createElement('style');
 css.textContent=`
 #amountInput[readonly]{cursor:pointer;caret-color:transparent}
 .ser-calc-mask{position:fixed;inset:0;z-index:10050;background:#16131b88;display:none;align-items:flex-end;justify-content:center}
 .ser-calc-mask.show{display:flex}
 .ser-calc{width:min(100%,520px);background:#222326;color:#fff;padding:10px 10px max(14px,env(safe-area-inset-bottom));box-sizing:border-box;border-radius:22px 22px 0 0;box-shadow:0 -12px 30px #0004}
 .ser-calc-head{display:flex;align-items:center;justify-content:space-between;padding:7px 10px 9px}
 .ser-calc-head strong{font-size:15px}.ser-calc-close{border:0;color:#fff;background:transparent;font-size:24px;min-width:44px}
 .ser-calc-screen{padding:10px 12px 12px;min-height:75px;border-radius:14px;background:#35363c;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;overflow:hidden}
 .ser-calc-expr{font-size:27px;line-height:1.2;font-variant-numeric:tabular-nums;max-width:100%;overflow:auto;white-space:nowrap}
 .ser-calc-preview{font-size:13px;color:#aee1b6;margin-top:4px;min-height:18px}
 .ser-calc-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:9px}
 .ser-calc-grid button{border:0;background:#3d3e43;color:#fff;border-radius:10px;height:56px;font-size:25px;font-weight:650;touch-action:manipulation}
 .ser-calc-grid button.op{background:#595257;color:#ffbf76}
 .ser-calc-grid button.strong{background:#f4a34e;color:#292323}
 .ser-calc-grid button.clear{background:#735456;color:#fff}
 .ser-calc-grid button.done{background:#5a9d78;color:#fff;font-size:17px}
 .ser-calc-hint{font-size:10px;color:#b5b5ba;margin:8px 2px 0;text-align:center}
 @media(max-height:700px){.ser-calc-grid button{height:43px;font-size:21px}.ser-calc-screen{min-height:53px}.ser-calc-expr{font-size:23px}}
 `;document.head.appendChild(css);
 const mask=document.createElement('div');mask.className='ser-calc-mask';mask.id='serinaCalc';
 mask.innerHTML=`<div class="ser-calc" role="dialog" aria-modal="true" aria-label="記帳計算機">
 <div class="ser-calc-head"><strong>🧮 記帳計算機 <span id="calcCurr"></span></strong><button type="button" class="ser-calc-close" data-key="close">×</button></div>
 <div class="ser-calc-screen"><div id="calcExpression" class="ser-calc-expr">0</div><div id="calcPreview" class="ser-calc-preview"></div></div>
 <div class="ser-calc-grid">
 <button type="button" class="clear" data-key="AC">AC</button><button type="button" data-key="back">⌫</button><button type="button" data-key="00">00</button><button type="button" data-key="000">000</button>
 <button type="button" data-key="7">7</button><button type="button" data-key="8">8</button><button type="button" data-key="9">9</button><button type="button" class="op" data-key="÷">÷</button>
 <button type="button" data-key="4">4</button><button type="button" data-key="5">5</button><button type="button" data-key="6">6</button><button type="button" class="op" data-key="×">×</button>
 <button type="button" data-key="1">1</button><button type="button" data-key="2">2</button><button type="button" data-key="3">3</button><button type="button" class="op" data-key="−">−</button>
 <button type="button" data-key=".">.</button><button type="button" data-key="0">0</button><button type="button" class="strong" data-key="=">=</button><button type="button" class="op" data-key="+">+</button>
 <button type="button" class="done" style="grid-column:span 4" data-key="done">✓ 套用到記帳金額</button>
 </div><div class="ser-calc-hint">例：250 + 180 + 70 = 500，套用後才會進入記帳表單</div>
 </div>`;document.body.appendChild(mask);
 let expr='',overflow='';
 const operations=/[+−×÷]/;
 function evaluate(s){
  s=s.replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/');
  if(!/^[0-9]+(?:\.[0-9]+)?(?:[+\-*/][0-9]+(?:\.[0-9]+)?)*$/.test(s))return null;
  const nums=s.split(/[+\-*/]/).map(Number),ops=s.match(/[+\-*/]/g)||[],n=[nums[0]],o=[];
  ops.forEach((op,i)=>{const v=nums[i+1];if(op==='*'||op==='/'){const a=n.pop();n.push(op==='*'?a*v:a/v)}else{n.push(v);o.push(op)}});
  let res=n[0];o.forEach((op,i)=>{res=op==='+'?res+n[i+1]:res-n[i+1]});
  return Number.isFinite(res)&&res>=0&&res<=1e9?Math.round((res+Number.EPSILON)*100)/100:null;
 }
 function sync(){
  document.getElementById('calcExpression').textContent=expr||'0';
  const v=evaluate(expr);
  document.getElementById('calcPreview').textContent=v===null?'':'＝ '+v.toLocaleString('zh-TW',{maximumFractionDigits:2});
 }
 function open(){
  expr=String(input.value||'').trim();if(!/^[0-9]+(?:\.[0-9]+)?$/.test(expr))expr='';
  document.getElementById('calcCurr').textContent=state.currency==='TWD'?'NT$':'¥';
  overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  input.blur();mask.classList.add('show');sync();
 }
 function close(){mask.classList.remove('show');document.body.style.overflow=overflow}
 function press(key){
  if(key==='close'){close();return}
  if(key==='AC'){expr='';sync();return}
  if(key==='back'){expr=expr.slice(0,-1);sync();return}
  if(key==='done'||key==='='){
   const v=evaluate(expr);if(v===null){document.getElementById('calcPreview').textContent='請先完成算式，不能除以零或輸入負數';return}
   expr=String(v);input.value=expr;input.dispatchEvent(new Event('input',{bubbles:true}));sync();
   if(key==='done')close();
   return;
  }
  if(operations.test(key)){
   if(!expr)return;
   expr=operations.test(expr.slice(-1))?expr.slice(0,-1)+key:expr+key;
  }else if(key==='.'){
   const seg=expr.split(operations).slice(-1)[0];if(seg.includes('.'))return;expr+=seg?'.':'0.';
  }else if(expr.length<40){expr+=key}
  sync();
 }
 input.addEventListener('click',open);
 mask.addEventListener('click',e=>{
  if(e.target===mask)close();
  const b=e.target.closest('button[data-key]');if(b)press(b.dataset.key);
 });
})();