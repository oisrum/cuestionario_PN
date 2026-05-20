// Banco de preguntas — cargado desde data/tXX.js antes de este script
const TEMAS_META={
  32:{label:"Tema 32",title:"Tema 32",sub:"Ley de Seguridad Vial · Competencias en materia de tráfico",expected:256},
  33:{label:"Tema 33",title:"Tema 33",sub:"Reglamento General de Conductores · RD 818/2009",expected:218},
  34:{label:"Tema 34",title:"Tema 34",sub:"Reglamento General de Vehículos · Seguro obligatorio",expected:176}
};
const TEMA_BANKS={32:Q32,33:Q33,34:Q34};

let currentTema=32,currentIdx=0,answers={};

function loadState(){try{const r=localStorage.getItem('cuestionarios_PN_state');if(r){const s=JSON.parse(r);currentTema=s.currentTema||32;currentIdx=s.currentIdx||0;answers=s.answers||{};}}catch(e){}}
function saveState(){try{localStorage.setItem('cuestionarios_PN_state',JSON.stringify({currentTema,currentIdx,answers}));}catch(e){}}
function getBank(){return TEMA_BANKS[currentTema]||[];}
function getAns(){return answers[currentTema]||{};}
function setAns(n,letter){if(!answers[currentTema])answers[currentTema]={};answers[currentTema][n]=letter;saveState();}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function renderTemaStrip(){
  const strip=document.getElementById('temaStrip');strip.innerHTML='';
  Object.keys(TEMAS_META).forEach(k=>{
    const t=TEMAS_META[k];const bank=TEMA_BANKS[k]||[];const has=bank.length>0;
    const btn=document.createElement('button');
    btn.className='tema-chip'+(parseInt(k)===currentTema?' active':'')+(has?'':' empty');
    btn.textContent=t.label+(has?' · '+bank.length:' · pendiente');
    btn.onclick=()=>{
      if(!has){alert('Este tema aún no está extraído. Pide en el chat: "extrae el Tema '+k+'" y lo voy añadiendo página a página.');return;}
      currentTema=parseInt(k);currentIdx=0;saveState();renderAll();
    };
    strip.appendChild(btn);
  });
}

function renderHero(){
  const meta=TEMAS_META[currentTema];const bank=getBank();const ans=getAns();
  const answered=Object.keys(ans).length;let ok=0,err=0;
  bank.forEach(q=>{if(ans[q.n]){if(ans[q.n]===q.correct)ok++;else err++;}});
  document.getElementById('temaTitle').textContent=meta.title;
  document.getElementById('temaSub').textContent=meta.sub+(meta.note?' · '+meta.note:'');
  document.getElementById('statTotal').textContent=answered;
  document.getElementById('statOk').textContent=ok;
  document.getElementById('statErr').textContent=err;
  const pct=bank.length?Math.round(answered/bank.length*100):0;
  document.getElementById('progressFill').style.width=pct+'%';
  document.getElementById('progressText').textContent=answered+' de '+bank.length;
  document.getElementById('progressPct').textContent=pct+'%';
}

function renderQuestion(){
  const bank=getBank();const c=document.getElementById('qContainer');
  if(bank.length===0){
    c.innerHTML=`<div class="card"><div class="empty"><h3>Este tema aún no está extraído</h3><p>Pide en el chat: <strong>"extrae el Tema ${currentTema}"</strong> y se irán añadiendo las preguntas página a página desde el PDF.</p></div></div>`;
    document.getElementById('navCurrent').textContent='0';document.getElementById('navTotal').textContent='0';
    document.getElementById('prevBtn').disabled=true;document.getElementById('nextBtn').disabled=true;return;
  }
  if(currentIdx>=bank.length)currentIdx=bank.length-1;
  if(currentIdx<0)currentIdx=0;
  const q=bank[currentIdx];const ans=getAns();const sel=ans[q.n];const isAnswered=!!sel;
  let optionsHtml='';
  ['a','b','c','d'].forEach(letter=>{
    if(!q.o[letter])return;
    let cls='option';
    if(isAnswered){if(letter===q.correct)cls+=' correct';else if(letter===sel)cls+=' incorrect';else cls+=' dim';}
    else if(sel===letter)cls+=' selected';
    optionsHtml+=`<button class="${cls}" data-letter="${letter}" ${isAnswered?'disabled':''}><span class="option-letter">${letter}</span><span class="option-text">${escapeHtml(q.o[letter])}</span></button>`;
  });
  let feedbackHtml='';
  if(isAnswered){
    const ok=sel===q.correct;let whyItems='';
    ['a','b','c','d'].forEach(letter=>{
      if(!q.why[letter])return;
      const isCorrect=letter===q.correct;const isSel=letter===sel;
      let liClass='';if(isCorrect)liClass='ok';else if(isSel)liClass='err';
      whyItems+=`<li class="${liClass}"><span class="letter">${letter})</span><span>${escapeHtml(q.why[letter])}</span></li>`;
    });
    feedbackHtml=`<div class="feedback ${ok?'ok':'err'}"><div class="feedback-head"><span class="feedback-icon">${ok?'✓':'×'}</span>${ok?'Correcto · Respuesta: '+q.correct+')':'Incorrecto · La correcta es la '+q.correct+')'}</div><ul class="why-list">${whyItems}</ul></div>`;
  }
  c.innerHTML=`<div class="card"><div class="q-head"><span class="q-num">Pregunta ${q.n}</span><span class="q-flag">${isAnswered?(sel===q.correct?'Acertada':'Fallada'):'Sin contestar'}</span></div><div class="q-text">${escapeHtml(q.q)}</div><div class="options" id="optionsBox">${optionsHtml}</div>${feedbackHtml}${isAnswered?`<div class="actions"><button class="btn btn-secondary" id="redoBtn">Volver a intentar</button><button class="btn btn-primary" id="nextAfterBtn">Siguiente pregunta</button></div>`:''}</div>`;
  document.getElementById('navCurrent').textContent=(currentIdx+1);
  document.getElementById('navTotal').textContent=bank.length;
  document.getElementById('prevBtn').disabled=currentIdx===0;
  document.getElementById('nextBtn').disabled=currentIdx===bank.length-1;
  if(!isAnswered){
    document.querySelectorAll('#optionsBox .option').forEach(btn=>{
      btn.addEventListener('click',()=>{setAns(q.n,btn.dataset.letter);renderAll();});
    });
  } else {
    document.getElementById('redoBtn').addEventListener('click',()=>{if(answers[currentTema])delete answers[currentTema][q.n];saveState();renderAll();});
    document.getElementById('nextAfterBtn').addEventListener('click',()=>{if(currentIdx<bank.length-1){currentIdx++;saveState();renderAll();}});
  }
}

function renderAll(){renderTemaStrip();renderHero();renderQuestion();window.scrollTo({top:0,behavior:'smooth'});}
function navQ(delta){const bank=getBank();const newIdx=currentIdx+delta;if(newIdx>=0&&newIdx<bank.length){currentIdx=newIdx;saveState();renderAll();}}
function openGridModal(){
  const bank=getBank();const ans=getAns();const modal=document.getElementById('modalContent');let gridHtml='';
  bank.forEach((q,i)=>{let cls='';if(ans[q.n])cls='answered '+(ans[q.n]===q.correct?'ok':'err');if(i===currentIdx)cls+=' current';gridHtml+=`<button class="${cls}" data-idx="${i}">${q.n}</button>`;});
  modal.innerHTML=`<button class="modal-close" onclick="closeModal()">×</button><div class="modal-title">${TEMAS_META[currentTema].title}</div><div class="modal-sub">Toca cualquier pregunta para ir directamente</div><div class="modal-grid">${gridHtml}</div>`;
  document.getElementById('modalBg').classList.add('open');
  modal.querySelectorAll('.modal-grid button').forEach(btn=>{btn.addEventListener('click',()=>{currentIdx=parseInt(btn.dataset.idx);saveState();closeModal();renderAll();});});
}
function closeModal(){document.getElementById('modalBg').classList.remove('open');}

document.getElementById('prevBtn').addEventListener('click',()=>navQ(-1));
document.getElementById('nextBtn').addEventListener('click',()=>navQ(1));
document.getElementById('gridBtn').addEventListener('click',openGridModal);
document.getElementById('modalBg').addEventListener('click',e=>{if(e.target.id==='modalBg')closeModal();});
let _resetPending=false,_resetTimer=null;
document.getElementById('resetBtn').addEventListener('click',()=>{
  if(_resetPending){
    clearTimeout(_resetTimer);_resetPending=false;
    document.getElementById('resetBtn').textContent='Reiniciar';
    if(answers[currentTema])delete answers[currentTema];
    currentIdx=0;saveState();renderAll();
  } else {
    _resetPending=true;
    document.getElementById('resetBtn').textContent='¿Seguro? (confirma)';
    _resetTimer=setTimeout(()=>{_resetPending=false;document.getElementById('resetBtn').textContent='Reiniciar';},3000);
  }
});

loadState();renderAll();
