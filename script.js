// Grade to point maps
const SCALES = {
  'default': { 'H':10,'S':9,'A':8,'B':7,'C':6 },
  '10-9-8-7-6': { 'H':10,'S':9,'A':8,'B':7,'C':6 },
  '4-point': { 'A':4,'B':3,'C':2,'D':1,'F':0 }
}

const tbody = document.getElementById('tbody');
const addRowBtn = document.getElementById('addRow');
const calcBtn = document.getElementById('calc');
const resetBtn = document.getElementById('reset');
const exportBtn = document.getElementById('export');
const totalCreditsEl = document.getElementById('totalCredits');
const weightedSumEl = document.getElementById('weightedSum');
const gpaEl = document.getElementById('gpa');
const scaleSelect = document.getElementById('scaleSelect');

function makeRow(subject='',credits=3,grade='H'){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="subj" placeholder="e.g. DBMS" value="${escapeHtml(subject)}"></td>
    <td><input type="number" class="credits" min="0" step="0.5" value="${credits}"></td>
    <td><select class="gradeSel"></select></td>
    <td><input type="number" class="points" readonly></td>
    <td style="text-align:center"><button class="remove" title="remove">🗑️</button></td>
  `;

  const select = tr.querySelector('.gradeSel');
  const currentScale = getCurrentScale();
  for(const g of Object.keys(currentScale)){
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    select.appendChild(opt);
  }
  select.value = grade in currentScale ? grade : Object.keys(currentScale)[0];

  const pointsIn = tr.querySelector('.points');
  function updatePoints(){
    const sc = getCurrentScale();
    const gradeKey = select.value;
    const pt = sc[gradeKey] ?? 0;
    pointsIn.value = pt;
  }

  select.addEventListener('change',()=>{ updatePoints(); refreshSummary(); });
  tr.querySelector('.credits').addEventListener('input',()=>refreshSummary());
  tr.querySelector('.remove').addEventListener('click',()=>{ tr.remove(); refreshSummary(); });

  updatePoints();
  return tr;
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function getCurrentScale(){ return SCALES[scaleSelect.value] || SCALES['default']; }

function refreshGradeOptions(){
  const rows = tbody.querySelectorAll('tr');
  const sc = getCurrentScale();
  rows.forEach(row=>{
    const sel = row.querySelector('.gradeSel');
    const prev = sel.value;
    sel.innerHTML='';
    for(const g of Object.keys(sc)){
      const opt = document.createElement('option');
      opt.value=g;
      opt.textContent=g;
      sel.appendChild(opt);
    }
    sel.value = prev in sc ? prev : Object.keys(sc)[0];
    row.querySelector('.points').value = sc[sel.value];
  });
  refreshSummary();
}

function refreshSummary(){
  const rows = tbody.querySelectorAll('tr');
  let totalCredits=0, weightedSum=0;
  const sc = getCurrentScale();
  rows.forEach(row=>{
    const cred = parseFloat(row.querySelector('.credits').value) || 0;
    const grade = row.querySelector('.gradeSel').value;
    const pt = sc[grade] ?? 0;
    totalCredits += cred;
    weightedSum += (pt * cred);
    row.querySelector('.points').value = pt;
  });
  totalCreditsEl.textContent = totalCredits.toFixed(2).replace(/\.00$/,'');
  weightedSumEl.textContent = weightedSum.toFixed(2).replace(/\.00$/,'');
  const gpa = totalCredits>0 ? (weightedSum/totalCredits) : 0;
  gpaEl.textContent = gpa.toFixed(2);
}

function calculateGPA(){ refreshSummary(); alert('GPA calculated: ' + gpaEl.textContent); }

function exportCSV(){
  const rows = tbody.querySelectorAll('tr');
  if(rows.length===0){ alert('No subjects to export'); return; }
  const sc = getCurrentScale();
  const lines = ['Subject,Credits,Grade,Points'];
  rows.forEach(r=>{
    const subj = r.querySelector('.subj').value.replace(/,/g,'');
    const cred = r.querySelector('.credits').value;
    const grade = r.querySelector('.gradeSel').value;
    const pt = r.querySelector('.points').value;
    lines.push([subj,cred,grade,pt].join(','));
  });
  lines.push('TotalCredits,'+totalCreditsEl.textContent);
  lines.push('WeightedSum,'+weightedSumEl.textContent);
  lines.push('GPA,'+gpaEl.textContent);
  const blob = new Blob([lines.join('\n')],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='gpa_export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// initial rows
function seed(){
  tbody.innerHTML='';
  tbody.appendChild(makeRow('Mathematics',4,'H'));
  tbody.appendChild(makeRow('DBMS',3,'A'));
  tbody.appendChild(makeRow('Java',3,'B'));
  tbody.appendChild(makeRow('Physics',2,'S'));
  refreshSummary();
}

addRowBtn.addEventListener('click',()=>{ tbody.appendChild(makeRow('','3',Object.keys(getCurrentScale())[0])); refreshSummary(); });
calcBtn.addEventListener('click',calculateGPA);
resetBtn.addEventListener('click',()=>{ if(confirm('Reset all subjects to default?')) seed(); });
exportBtn.addEventListener('click',exportCSV);
scaleSelect.addEventListener('change',refreshGradeOptions);

// start
seed();
