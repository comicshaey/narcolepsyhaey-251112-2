
// 데이터 로딩 (경로 폴백 및 에러 표시)
async function loadData(){
  const urls = ['data.json', './data.json', '/ordinary-wage/data.json'];
  let lastErr = null;
  for(const u of urls){
    try{
      const r = await fetch(u + '?v=' + Date.now());
      if(!r.ok) throw new Error('HTTP ' + r.status);
      const txt = await r.text();
      return JSON.parse(txt.replace(/\bNaN\b/g,'0'));
    }catch(e){
      console.warn('[ordinary-wage] data.json 로딩 실패:', u, e);
      lastErr = e;
    }
  }
  throw lastErr || new Error('data.json 로딩 실패');
}

// 돈 표기
function money(n){ return (Math.round(n)||0).toLocaleString(); }

// 수당 입력칸 구성
function rebuildAllowanceInputs(box, job, fixed){
  box.innerHTML='';
  const names=["정액급식비","위험수당","급식운영수당","기술정보수당","특수업무수당","특수교육지원수당","면허가산수당","정기상여금","명절휴가비","교무행정사(직무수당)"];
  for(const name of names){
    const flag = job?.적용?.[name] || '×';
    const row = document.createElement('div'); row.className='allow-row';
    const lab = document.createElement('label'); lab.textContent = name + (flag==='×'?' (미적용)':' (적용)');
    const inp = document.createElement('input'); inp.type='number'; inp.min='0'; inp.step='1'; inp.value=(fixed?.[name]||0); inp.dataset.name=name;
    if(flag==='×'){ inp.disabled=true; inp.classList.add('disabled'); }
    row.appendChild(lab); row.appendChild(inp); box.appendChild(row);
  }
}

// 날짜 파싱
function parseYmd(s){
  if(!s) return null;
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if(!m) return null;
  return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
}

// 근속연수 계산
function calcYears(startDateStr, calcDateStr){
  const s = parseYmd(startDateStr);
  const b = parseYmd(calcDateStr);
  if(!s || !b) return null;
  let y = b.getFullYear() - s.getFullYear();
  const anniv = new Date(b.getFullYear(), s.getMonth(), s.getDate());
  if(b < anniv) y -= 1;
  return Math.max(0, y);
}

// 근속수당: 연 40,000원, 상한 23년
function computeTenureAmount(years){
  const y = Math.max(0, Math.min(Number(years||0), 23));
  return y * 40000;
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const note = document.getElementById('note');
  const jobSel = document.getElementById('job');
  const yearsInp = document.getElementById('years');
  const startDateInp = document.getElementById('startDate');
  const calcDateInp = document.getElementById('calcDate');
  const yearsMode = document.getElementById('yearsMode');
  const allowBox = document.getElementById('allowBox');
  const outBase = document.getElementById('outBase');
  const outTenure = document.getElementById('outTenure');
  const outSum = document.getElementById('outSum');
  const outHourly = document.getElementById('outHourly');
  const resetBtn = document.getElementById('resetBtn');

  let data;
  try{
    data = await loadData();
  }catch(e){
    console.error('[ordinary-wage] 데이터 로딩 실패:', e);
    jobSel.innerHTML = '<option>데이터 로딩 실패 (F12→Console 확인)</option>';
    return;
  }

  const snap = data.snapshot || {jobs:[], fixedAmounts:{}};
  note.textContent = ' (수당 금액 기준: ' + (data.meta?.사용스냅샷 || '2025.03.01') + ', 월 ' + (data.meta?.월통상임금산정시간 || 209) + '시간)';

  // 직종 목록 채우기
  jobSel.innerHTML = '';
  if (Array.isArray(snap.jobs) && snap.jobs.length > 0){
    for(const j of snap.jobs){
      if(!j || !j.직종) continue;
      const op=document.createElement('option'); op.value=j.직종; op.textContent=j.직종; jobSel.appendChild(op);
    }
  }
  // 비어있을 때 최소 안전장치
  if (jobSel.options.length === 0){
    console.warn('[ordinary-wage] jobs가 비어 있음: data.json 구조 확인 필요');
    jobSel.innerHTML = '<option>직종 데이터 없음</option>';
  }

  // 계산 시점 기본값: 오늘
  const today = new Date();
  const pad = n => String(n).padStart(2,'0');
  calcDateInp.value = today.getFullYear() + '-' + pad(today.getMonth()+1) + '-' + pad(today.getDate());

  function readAllowMap(){
    const m={}; allowBox.querySelectorAll('input[type=number]').forEach(i=>{ if(!i.disabled) m[i.dataset.name]=Number(i.value||0); });
    return m;
  }

  function syncYearsMode(){
    if(startDateInp.value){
      yearsInp.disabled = true;
      yearsInp.classList.add('disabled');
      yearsMode.textContent = '입사일 기준 자동 계산 중';
    }else{
      yearsInp.disabled = false;
      yearsInp.classList.remove('disabled');
      yearsMode.textContent = '미입력시 근속연수 수동 입력 가능';
    }
  }

  function recalc(){
    const job = (snap.jobs||[]).find(j=>j.직종===jobSel.value) || (snap.jobs||[])[0];
    if(!job){ return; }

    if(startDateInp.value){
      const y = calcYears(startDateInp.value, calcDateInp.value);
      if(y!=null) yearsInp.value = y;
    }
    syncYearsMode();

    const years = Number(yearsInp.value||0);
    const tAmt = computeTenureAmount(years);
    const base = Number(job.기본급||0);
    const allowMap = readAllowMap();
    const sum = base + tAmt + Object.values(allowMap).reduce((a,b)=>a+b,0);
    const hourly = sum / (data.meta?.월통상임금산정시간 || 209);

    outBase.textContent = money(base);
    outTenure.textContent = money(tAmt) + ' (연 40,000원, 상한 23년)';
    outSum.textContent = money(sum);
    outHourly.textContent = money(Math.round(hourly));
  }

  // 수당 입력칸 구성
  rebuildAllowanceInputs(allowBox, (snap.jobs||[])[0] || {}, snap.fixedAmounts || {});

  // 이벤트
  jobSel.addEventListener('change', recalc);
  yearsInp.addEventListener('input', recalc);
  allowBox.addEventListener('input', recalc);
  startDateInp.addEventListener('input', recalc);
  calcDateInp.addEventListener('input', recalc);
  resetBtn.addEventListener('click', ()=>{
    yearsInp.value = 0;
    startDateInp.value = '';
    const now = new Date();
    calcDateInp.value = now.getFullYear() + '-' + (String(now.getMonth()+1).padStart(2,'0')) + '-' + (String(now.getDate()).padStart(2,'0'));
    recalc();
  });

  // 초기 계산
  recalc();
});
