(() => {
 const keyToCat={
  '住宿':'lodging','固定費用':'fixed','固定生活費':'fixed',
  '吃飯・咖啡・購物・日常交通':'daily',
  '京都・關西小旅行':'kansai','大旅行':'bigTrip',
  '一次性支出':'oneoff',
  'gift':'gift','salary':'salary','scholarship':'scholarship','refund':'refund','otherIncome':'otherIncome'
 };
 const incoming=new Set(['gift','salary','scholarship','refund','otherIncome']);
 const css=document.createElement('style');
 css.textContent=`
 #safeCsvBox{margin:12px 0;background:#fff;border:1px solid #ebdfd6;border-radius:17px;padding:12px;font-size:12px}
 #safeCsvBox strong{font-size:15px}
 #safeCsvBox p{color:#7e7169;line-height:1.6}
 #safeCsvBox select,#safeCsvBox button{width:100%;font-size:13px;min-height:41px;border-radius:12px;margin-top:7px;padding:8px}
 #safeCsvBox select{border:1px solid #e2d5cb;background:#fff}
 #safeCsvBox button{border:0;background:#5e9875;color:white;font-weight:900}
 #safeCsvMessage{margin-top:8px;line-height:1.6;color:#4e7059}
 `;document.head.appendChild(css);

 function setup(){
  const page=document.getElementById('page-settings');
  if(!page||document.getElementById('safeCsvBox'))return;
  const box=document.createElement('div');box.id='safeCsvBox';
  box.innerHTML=`<strong>📁 安全補匯過去的記帳 CSV</strong>
  <p>直接讀取你手機中的 CSV，不會上傳到 GitHub、不會覆蓋既有記錄。相同日期／金額／分類／備註的記錄會比對並跳過，避免重複計帳。</p>
  <select id="safeCsvScope"><option value="past">只補 2026年9～10月</option><option value="all">補 CSV 中所有月份</option></select>
  <button type="button" id="safeCsvBtn">選擇 CSV 檔案並預覽</button>
  <input id="safeCsvFile" type="file" accept=".csv,text/csv" style="display:none">
  <div id="safeCsvMessage"></div>`;
  const finance=document.getElementById('safeFinanceCard');
  if(finance)finance.insertAdjacentElement('afterend',box);else page.appendChild(box);
  box.querySelector('#safeCsvBtn').onclick=()=>box.querySelector('#safeCsvFile').click();
  box.querySelector('#safeCsvFile').onchange=onFile;
 }

 function readCsv(text){
  const records=[],row=[];let field='',quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++){
   const c=text[i];
   if(quoted){
    if(c==='"'&&text[i+1]==='"'){field+='"';i++}
    else if(c==='"')quoted=false;
    else field+=c;
   }else if(c==='"'){quoted=true}
   else if(c===','){row.push(field);field=''}
   else if(c==='\n'||c==='\r'){
    if(c==='\r'&&text[i+1]==='\n')i++;
    row.push(field);field='';
    if(row.some(v=>v!==''))records.push(row.splice(0,row.length));
    else row.length=0;
   }else field+=c;
  }
  row.push(field);if(row.some(v=>v!==''))records.push(row);
  if(!records.length)throw Error('CSV 沒有資料');
  const headers=records.shift().map(x=>x.trim());
  for(const col of ['date','category','original_amount','currency','twd_value','payment','need','note']){
   if(!headers.includes(col))throw Error('缺少欄位：'+col);
  }
  return records.map((arr,i)=>{
   const obj={};headers.forEach((h,j)=>obj[h]=arr[j]||'');
   const cat=keyToCat[obj.category]||obj.category;
   const amount=Number(obj.original_amount),twd=Number(obj.twd_value);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(obj.date)||!Number.isFinite(amount)||amount<=0||!Number.isFinite(twd)||twd<0||!['JPY','TWD'].includes(obj.currency)||!MONTHS.includes(obj.date.slice(0,7)))throw Error('第'+(i+2)+'列日期／幣別／金額不正確');
   return {id:'',date:obj.date,category:cat,type:incoming.has(cat)?'income':'expense',originalAmount:amount,currency:obj.currency,twdValue:twd,fxRate:obj.currency==='JPY'?twd/amount:state.fxRate,payment:obj.payment||'其他',need:obj.need||'normal',note:obj.note||''};
  });
 }
 function sig(t){
  return [t.date,t.category,Number(t.originalAmount).toFixed(4),t.currency,t.payment||'',t.need||'normal',t.note||''].join('|');
 }
 async function onFile(e){
  const f=e.target.files?.[0];if(!f)return;
  const m=document.getElementById('safeCsvMessage');
  try{
   const rows=readCsv(await f.text());
   const scope=document.getElementById('safeCsvScope').value;
   const candidates=rows.filter(t=>scope==='all'||['2026-09','2026-10'].includes(t.date.slice(0,7)));
   const existing=new Map();
   state.transactions.forEach(t=>existing.set(sig(t),(existing.get(sig(t))||0)+1));
   const newRows=[];
   for(const t of candidates){
    const s=sig(t),q=existing.get(s)||0;
    if(q>0){existing.set(s,q-1);continue}
    newRows.push(t);
   }
   const skipped=candidates.length-newRows.length;
   if(!newRows.length){m.textContent='✅ 已比對 '+candidates.length+' 筆；全部已存在，沒有重複匯入。';return}
   const byMonth={};newRows.forEach(t=>byMonth[t.date.slice(0,7)]=(byMonth[t.date.slice(0,7)]||0)+1);
   const question='CSV 共 '+rows.length+' 筆；這次範圍 '+candidates.length+' 筆；已存在 '+skipped+' 筆；待補 '+newRows.length+' 筆。\\n'+Object.entries(byMonth).map(([k,v])=>k+'：'+v+' 筆').join('\\n')+'\\n確認「只新增、不覆蓋」嗎？';
   if(!confirm(question)){m.textContent='已取消，帳本沒有任何更動。';return}
   const prefix=String(Date.now());
   newRows.forEach((t,i)=>{t.id='csv_'+prefix+'_'+i;state.transactions.push(t)});
   save();if(typeof window.serinaFinanceInvalidateBaseline==='function')window.serinaFinanceInvalidateBaseline('匯入舊交易');
   render();m.textContent='✅ 已安全補入 '+newRows.length+' 筆，略過已存在的 '+skipped+' 筆。原有資產及信用卡資料未被覆蓋。';
  }catch(err){m.textContent='⚠️ 匯入失敗：'+String(err.message||err)}
  finally{e.target.value=''}
 }
 setup();
})();