
const ENTERPRISE_KEY='goldenStructuralEnterprise2026';
const LEGACY_KEYS=['goldenStructuralPlatformV1','goldenTaviRegistryV2','golden_tavi_agendamentos_v1'];
const ADMIN_EMAIL='leandrogoldenstructural@gmail.com';
const $=id=>document.getElementById(id);
const uid=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`;
const nowISO=()=>new Date().toISOString().slice(0,10);
const monthISO=()=>new Date().toISOString().slice(0,7);
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const safe=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const fmtDate=s=>{if(!s)return'-';const p=String(s).slice(0,10).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:s};
const blankDb=()=>({version:8,meta:{createdAt:new Date().toISOString(),adminEmail:ADMIN_EMAIL},professionals:[],hospitals:[],insurers:[],procedures:[],visits:[],farol:[],forecasts:[],mix:[],materials:[],migrationLog:[]});
let db=loadDb();

function loadDb(){
  try{
    const raw=localStorage.getItem(ENTERPRISE_KEY);
    const d=raw?JSON.parse(raw):blankDb();
    for(const k of Object.keys(blankDb()))if(d[k]===undefined)d[k]=blankDb()[k];
    return d;
  }catch(e){console.error(e);return blankDb()}
}
function save(){db.meta.updatedAt=new Date().toISOString();localStorage.setItem(ENTERPRISE_KEY,JSON.stringify(db))}
function go(page){
  document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
  $(page)?.classList.add('active');
  const titles={dashboard:'Strategic Command Center™',agenda:'Agenda Inteligente',visitas:'Sales CRM — Visitas',profissionais:'People Hub™',hospitais:'Hospital Hub™',convenios:'Convênios e Operadoras',procedimentos:'Procedure Registry™',farol:'FAROL Intelligence™',forecast:'Forecast Comercial',relatorios:'Report Center™',dados:'Migration Center™'};
  $('pageTitle').textContent=titles[page]||'Golden Structural Platform';
  $('sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});renderAll();
}
document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>go(b.dataset.page));
$('mobileMenu').onclick=()=>$('sidebar').classList.toggle('open');

function resetForm(form,id){$(form).reset();$(id).value='';renderSelects()}
function hospitalName(id){return db.hospitals.find(x=>String(x.id)===String(id))?.name||'-'}
function professionalName(id){return db.professionals.find(x=>String(x.id)===String(id))?.name||'-'}
function insurerName(id){return db.insurers.find(x=>String(x.id)===String(id))?.name||'-'}
function scoreClass(n){return n>=75?'green':n>=50?'yellow':'red'}
function scoreLabel(n){return n>=75?'Verde':n>=50?'Amarelo':'Vermelho'}
function findByName(arr,name){const n=norm(name);return arr.find(x=>norm(x.name)===n)}
function mergeMissing(target,source,overwrite=false){for(const [k,v] of Object.entries(source)){if(k==='id')continue;if(v!==''&&v!==null&&v!==undefined&&(overwrite||target[k]===''||target[k]===null||target[k]===undefined||target[k]===0))target[k]=v}return target}

function renderSelects(){
  const hs=db.hospitals.map(x=>`<option value="${x.id}">${safe(x.name)}</option>`).join('');
  const ps=db.professionals.map(x=>`<option value="${x.id}">${safe(x.name)} — ${safe(x.category)}</option>`).join('');
  const docs=db.professionals.filter(x=>x.category==='Médico').map(x=>`<option value="${x.id}">${safe(x.name)}</option>`).join('');
  const ins=db.insurers.map(x=>`<option value="${x.id}">${safe(x.name)}</option>`).join('');
  ['professionalHospital','visitHospital','procedureHospital','farolHospital','forecastHospital'].forEach(id=>{if($(id))$(id).innerHTML='<option value="">Selecione</option>'+hs});
  ['visitProfessional'].forEach(id=>{if($(id))$(id).innerHTML='<option value="">Selecione</option>'+ps});
  if($('procedureDoctor'))$('procedureDoctor').innerHTML='<option value="">Selecione</option>'+docs;if($('procedureSecondDoctor'))$('procedureSecondDoctor').innerHTML='<option value="">Selecione</option>'+docs;
  ['hospitalInsurer','procedureInsurer'].forEach(id=>{if($(id))$(id).innerHTML='<option value="">Selecione</option>'+ins});
  configureReportEntities();
}

function setDefaults(){
  $('visitDate').value=$('visitDate').value||nowISO();$('calendarMonth').value=$('calendarMonth').value||monthISO();
  $('farolMonth').value=$('farolMonth').value||monthISO();$('forecastMonth').value=$('forecastMonth').value||monthISO();
  setProcedureDefaults();
}
function setProcedureDefaults(){
  if(!$('procedureId').value)$('procedureNumber').value=String(Math.max(0,...db.procedures.map(x=>+x.number||0))+1).padStart(4,'0');
  $('procedureDate').value=$('procedureDate').value||nowISO();if($('procedureSource')&&!$('procedureSource').value)$('procedureSource').value='Manual';
}

function upsert(arr,item){
  const i=arr.findIndex(x=>String(x.id)===String(item.id));
  if(i>=0)arr[i]=item;else arr.push(item);save();renderAll()
}
function removeFrom(arr,id,label){
  if(confirm(`Excluir ${label}?`)){const i=arr.findIndex(x=>String(x.id)===String(id));if(i>=0)arr.splice(i,1);save();renderAll()}
}

$('professionalForm').onsubmit=e=>{
  e.preventDefault();upsert(db.professionals,{id:$('professionalId').value||uid(),name:$('professionalName').value.trim(),category:$('professionalCategory').value,cpf:$('professionalCpf').value.trim(),register:$('professionalRegister').value.trim(),specialty:$('professionalSpecialty').value.trim(),hospitalId:$('professionalHospital').value,phone:$('professionalPhone').value.trim(),email:$('professionalEmail').value.trim(),birth:$('professionalBirth').value,tavi:+$('professionalTavi').value||0,mitral:+$('professionalMitral').value||0,tricuspid:+$('professionalTricuspid').value||0,history:$('professionalHistory').value.trim(),source:'Manual'});resetForm('professionalForm','professionalId')
}
function editProfessional(id){const x=db.professionals.find(v=>String(v.id)===String(id));if(!x)return;$('professionalId').value=x.id;$('professionalName').value=x.name||'';$('professionalCategory').value=x.category||'Médico';$('professionalCpf').value=x.cpf||'';$('professionalRegister').value=x.register||'';$('professionalSpecialty').value=x.specialty||'';$('professionalHospital').value=x.hospitalId||'';$('professionalPhone').value=x.phone||'';$('professionalEmail').value=x.email||'';$('professionalBirth').value=x.birth||'';$('professionalTavi').value=x.tavi||0;$('professionalMitral').value=x.mitral||0;$('professionalTricuspid').value=x.tricuspid||0;$('professionalHistory').value=x.history||'';go('profissionais')}

$('hospitalForm').onsubmit=e=>{
  e.preventDefault();upsert(db.hospitals,{id:$('hospitalId').value||uid(),name:$('hospitalName').value.trim(),cnpj:$('hospitalCnpj').value.trim(),chief:$('hospitalChief').value.trim(),network:$('hospitalNetwork').value.trim(),city:$('hospitalCity').value.trim(),state:$('hospitalState').value.trim(),region:$('hospitalRegion').value.trim(),insurerId:$('hospitalInsurer').value,serviceStatus:$('hospitalServiceStatus').value.trim(),taviMarket:$('hospitalTaviMarket').value.trim(),stentMarket:$('hospitalStentMarket').value.trim(),farol:+$('hospitalFarol').value||0,recommendedAction:$('hospitalAction').value.trim(),source:'Manual'});resetForm('hospitalForm','hospitalId')
}
function editHospital(id){const x=db.hospitals.find(v=>String(v.id)===String(id));if(!x)return;$('hospitalId').value=x.id;$('hospitalName').value=x.name||'';$('hospitalCnpj').value=x.cnpj||'';$('hospitalChief').value=x.chief||'';$('hospitalNetwork').value=x.network||'';$('hospitalCity').value=x.city||'';$('hospitalState').value=x.state||'RJ';$('hospitalRegion').value=x.region||'';$('hospitalInsurer').value=x.insurerId||'';$('hospitalServiceStatus').value=x.serviceStatus||'';$('hospitalTaviMarket').value=x.taviMarket||'';$('hospitalStentMarket').value=x.stentMarket||'';$('hospitalFarol').value=x.farol||0;$('hospitalAction').value=x.recommendedAction||'';go('hospitais')}

$('insurerForm').onsubmit=e=>{
  e.preventDefault();upsert(db.insurers,{id:$('insurerId').value||uid(),name:$('insurerName').value.trim(),legalName:$('insurerLegalName').value.trim(),cnpj:$('insurerCnpj').value.trim(),ans:$('insurerAns').value.trim(),contact:$('insurerContact').value.trim(),role:$('insurerRole').value.trim(),phone:$('insurerPhone').value.trim(),email:$('insurerEmail').value.trim(),portal:$('insurerPortal').value.trim(),dso:+$('insurerDso').value||0,farol:+$('insurerFarol').value||0,status:$('insurerStatus').value,notes:$('insurerNotes').value.trim(),source:'Manual'});resetForm('insurerForm','insurerId')
}
function editInsurer(id){const x=db.insurers.find(v=>String(v.id)===String(id));if(!x)return;$('insurerId').value=x.id;$('insurerName').value=x.name||'';$('insurerLegalName').value=x.legalName||'';$('insurerCnpj').value=x.cnpj||'';$('insurerAns').value=x.ans||'';$('insurerContact').value=x.contact||'';$('insurerRole').value=x.role||'';$('insurerPhone').value=x.phone||'';$('insurerEmail').value=x.email||'';$('insurerPortal').value=x.portal||'';$('insurerDso').value=x.dso||0;$('insurerFarol').value=x.farol||0;$('insurerStatus').value=x.status||'Ativo';$('insurerNotes').value=x.notes||'';go('convenios')}


const INTERMEDIATE_VALVE_SIZES=[21.5,24.5,27.5,30.5];
const XL_VALVE_SIZES=[29,30,32,34];
function classifyValveSize(value){
  const size=Number(String(value||'').replace(',','.'));
  if(!size)return '';
  if(INTERMEDIATE_VALVE_SIZES.some(x=>Math.abs(x-size)<0.01))return 'Intermediário';
  if(XL_VALVE_SIZES.some(x=>Math.abs(x-size)<0.01))return 'XL';
  return 'Normal';
}
function updateValveClassification(){
  if($('procedureValveSizeCategory')){
    $('procedureValveSizeCategory').value=classifyValveSize($('procedureValveSize')?.value);
  }
}
function inferValveExpansion(brand,model){
  const text=norm(`${brand||''} ${model||''}`);
  if(/MYVAL|SAPIEN|INOVARE|NAVITORBALAO/.test(text))return 'Balão expansiva';
  if(/EVOLUT|COREVALVE|ACURATE|NAVITOR|PORTICO|VITAFLOW|VENUS|HYDRA|ALLEGRA/.test(text))return 'Auto expansível';
  return '';
}
function extractValveSize(value){
  const match=String(value||'').replace(',','.').match(/(\d{2}(?:\.5)?)/);
  return match?Number(match[1]):0;
}

$('procedureForm').onsubmit=e=>{
  e.preventDefault();upsert(db.procedures,{id:$('procedureId').value||uid(),number:$('procedureNumber').value,patient:$('procedurePatient').value.trim(),doctorId:$('procedureDoctor').value,hospitalId:$('procedureHospital').value,insurerId:$('procedureInsurer').value,date:$('procedureDate').value,time:$('procedureTime').value,position:$('procedurePosition').value,proctor:$('procedureProctor').value.trim(),kit:$('procedureKit').value.trim(),sos:$('procedureSos').value,status:$('procedureStatus').value,notes:$('procedureNotes').value.trim(),
    city:$('procedureCity')?.value.trim()||'',secondDoctorId:$('procedureSecondDoctor')?.value||'',
    age:+($('procedureAge')?.value||0),accountExecutive:$('procedureAccountExecutive')?.value.trim()||'',
    clinicalType:$('procedureType')?.value.trim()||'',diagnosis:$('procedureDiagnosis')?.value.trim()||'',
    access:$('procedureAccess')?.value.trim()||'',accessType:$('procedureAccessType')?.value.trim()||'',
    guidewire:$('procedureGuidewire')?.value.trim()||'',preBalloon:$('procedurePreBalloon')?.value.trim()||'',
    prosthesisSize:$('procedureProsthesisSize')?.value.trim()||'',postDilation:$('procedurePostDilation')?.value.trim()||'',
    complication:$('procedureComplication')?.value.trim()||'',mammothSize:$('procedureMammothSize')?.value.trim()||'',
    report:$('procedureReport')?.value.trim()||'',crimper:$('procedureCrimper')?.value.trim()||'',
    source:$('procedureSource')?.value.trim()||'Manual',valveBrand:$('procedureValveBrand')?.value.trim()||'',valveModel:$('procedureValveModel')?.value.trim()||'',valveExpansion:$('procedureValveExpansion')?.value||'',valveSize:+($('procedureValveSize')?.value||0),valveSizeCategory:classifyValveSize($('procedureValveSize')?.value),valveProcedureFamily:$('procedureValveProcedureFamily')?.value||'',valveGeneration:$('procedureValveGeneration')?.value.trim()||'',valveNotes:$('procedureValveNotes')?.value.trim()||''});resetForm('procedureForm','procedureId');setProcedureDefaults()
}
function editProcedure(id){const x=db.procedures.find(v=>String(v.id)===String(id));if(!x)return;$('procedureId').value=x.id;$('procedureNumber').value=x.number||'';$('procedurePatient').value=x.patient||'';$('procedureDoctor').value=x.doctorId||'';$('procedureHospital').value=x.hospitalId||'';$('procedureInsurer').value=x.insurerId||'';$('procedureDate').value=x.date||'';$('procedureTime').value=x.time||'';$('procedurePosition').value=x.position||'Aórtica';$('procedureProctor').value=x.proctor||'';$('procedureKit').value=x.kit||'';$('procedureSos').value=x.sos||'Não';$('procedureStatus').value=x.status||'Em planejamento';$('procedureNotes').value=x.notes||'';
  if($('procedureCity'))$('procedureCity').value=x.city||'';
  if($('procedureSecondDoctor'))$('procedureSecondDoctor').value=x.secondDoctorId||'';
  if($('procedureAge'))$('procedureAge').value=x.age||'';
  if($('procedureAccountExecutive'))$('procedureAccountExecutive').value=x.accountExecutive||'';
  if($('procedureType'))$('procedureType').value=x.clinicalType||'';
  if($('procedureDiagnosis'))$('procedureDiagnosis').value=x.diagnosis||'';
  if($('procedureAccess'))$('procedureAccess').value=x.access||'';
  if($('procedureAccessType'))$('procedureAccessType').value=x.accessType||'';
  if($('procedureGuidewire'))$('procedureGuidewire').value=x.guidewire||'';
  if($('procedurePreBalloon'))$('procedurePreBalloon').value=x.preBalloon||'';
  if($('procedureProsthesisSize'))$('procedureProsthesisSize').value=x.prosthesisSize||'';
  if($('procedurePostDilation'))$('procedurePostDilation').value=x.postDilation||'';
  if($('procedureComplication'))$('procedureComplication').value=x.complication||'';
  if($('procedureMammothSize'))$('procedureMammothSize').value=x.mammothSize||'';
  if($('procedureReport'))$('procedureReport').value=x.report||'';
  if($('procedureCrimper'))$('procedureCrimper').value=x.crimper||'';
  if($('procedureSource'))$('procedureSource').value=x.source||'Manual';if($('procedureValveBrand'))$('procedureValveBrand').value=x.valveBrand||'';if($('procedureValveModel'))$('procedureValveModel').value=x.valveModel||'';if($('procedureValveExpansion'))$('procedureValveExpansion').value=x.valveExpansion||'';if($('procedureValveSize'))$('procedureValveSize').value=x.valveSize||extractValveSize(x.prosthesisSize||x.kit);if($('procedureValveSizeCategory'))$('procedureValveSizeCategory').value=x.valveSizeCategory||classifyValveSize(x.valveSize||extractValveSize(x.prosthesisSize||x.kit));if($('procedureValveProcedureFamily'))$('procedureValveProcedureFamily').value=x.valveProcedureFamily||'TAVI nativa';if($('procedureValveGeneration'))$('procedureValveGeneration').value=x.valveGeneration||'';if($('procedureValveNotes'))$('procedureValveNotes').value=x.valveNotes||'';go('procedimentos')}

$('visitForm').onsubmit=e=>{
  e.preventDefault();upsert(db.visits,{id:$('visitId').value||uid(),hospitalId:$('visitHospital').value,professionalId:$('visitProfessional').value,date:$('visitDate').value,status:$('visitStatus').value,objective:$('visitObjective').value.trim(),result:$('visitResult').value.trim()});resetForm('visitForm','visitId');$('visitDate').value=nowISO()
}
function editVisit(id){const x=db.visits.find(v=>String(v.id)===String(id));if(!x)return;$('visitId').value=x.id;$('visitHospital').value=x.hospitalId||'';$('visitProfessional').value=x.professionalId||'';$('visitDate').value=x.date||'';$('visitStatus').value=x.status||'Planejada';$('visitObjective').value=x.objective||'';$('visitResult').value=x.result||'';go('visitas')}

function calcFarol(x){const dso=Math.max(0,100-Math.min(100,(+x.dso||0)*1.5));return Math.round((+x.payment*.2)+(dso*.15)+(+x.volume*.15)+(+x.profit*.2)+((100-(+x.risk))*.15)+(+x.potential*.15))}
$('farolForm').onsubmit=e=>{
  e.preventDefault();const x={id:$('farolId').value||uid(),hospitalId:$('farolHospital').value,month:$('farolMonth').value,payment:+$('farolPayment').value||0,dso:+$('farolDso').value||0,volume:+$('farolVolume').value||0,profit:+$('farolProfit').value||0,risk:+$('farolRisk').value||0,potential:+$('farolPotential').value||0,plan:$('farolPlan').value.trim()};x.score=calcFarol(x);upsert(db.farol,x);resetForm('farolForm','farolId');$('farolMonth').value=monthISO()
}
function editFarol(id){const x=db.farol.find(v=>String(v.id)===String(id));if(!x)return;$('farolId').value=x.id;$('farolHospital').value=x.hospitalId||'';$('farolMonth').value=x.month||'';$('farolPayment').value=x.payment||0;$('farolDso').value=x.dso||0;$('farolVolume').value=x.volume||0;$('farolProfit').value=x.profit||0;$('farolRisk').value=x.risk||0;$('farolPotential').value=x.potential||0;$('farolPlan').value=x.plan||'';go('farol')}

$('forecastForm').onsubmit=e=>{
  e.preventDefault();const x={id:$('forecastId').value||uid(),hospitalId:$('forecastHospital').value,month:$('forecastMonth').value,line:$('forecastLine').value,goal:+$('forecastGoal').value||0,confirmed:+$('forecastConfirmed').value||0,probable:+$('forecastProbable').value||0,possible:+$('forecastPossible').value||0,ticket:+$('forecastTicket').value||0,actions:$('forecastActions').value.trim()};x.weighted=x.confirmed+x.probable*.7+x.possible*.3;x.revenue=x.weighted*x.ticket;upsert(db.forecasts,x);resetForm('forecastForm','forecastId');$('forecastMonth').value=monthISO()
}
function editForecast(id){const x=db.forecasts.find(v=>String(v.id)===String(id));if(!x)return;$('forecastId').value=x.id;$('forecastHospital').value=x.hospitalId||'';$('forecastMonth').value=x.month||'';$('forecastLine').value=x.line||'TAVI';$('forecastGoal').value=x.goal||0;$('forecastConfirmed').value=x.confirmed||0;$('forecastProbable').value=x.probable||0;$('forecastPossible').value=x.possible||0;$('forecastTicket').value=x.ticket||0;$('forecastActions').value=x.actions||'';go('forecast')}

function renderProfessionals(){
  const q=norm($('professionalSearch')?.value);const rows=db.professionals.filter(x=>!q||norm([x.name,x.register,x.category,hospitalName(x.hospitalId)].join(' ')).includes(q));
  $('professionalTable').innerHTML=rows.map(x=>`<tr><td><b>${safe(x.name)}</b><br><small>${safe(x.specialty||'')}</small></td><td>${safe(x.category)}</td><td>${safe(x.cpf||'-')}</td><td>${safe(x.register||'-')}</td><td>${safe(hospitalName(x.hospitalId))}</td><td>${safe(x.phone||x.email||'-')}</td><td><button class="btn secondary small" onclick="openReport('professional-one','${x.id}')">PDF</button> <button class="btn secondary small" onclick="editProfessional('${x.id}')">Editar</button> <button class="btn danger small" onclick="removeFrom(db.professionals,'${x.id}','profissional')">Excluir</button></td></tr>`).join('')
}
function renderHospitals(){
  const q=norm($('hospitalSearch')?.value);const rows=db.hospitals.filter(x=>!q||norm([x.name,x.city,x.network,x.chief].join(' ')).includes(q));
  $('hospitalTable').innerHTML=rows.map(x=>`<tr><td><b>${safe(x.name)}</b><br><small>${safe(x.serviceStatus||'')}</small></td><td>${safe(x.city||'-')}/${safe(x.state||'')}</td><td>${safe(x.chief||'-')}</td><td>${safe(x.network||'-')}</td><td>TAVI: ${safe(x.taviMarket||'-')}<br>Stent: ${safe(x.stentMarket||'-')}</td><td><span class="badge ${scoreClass(+x.farol||0)}">${+x.farol||0}</span></td><td><button class="btn secondary small" onclick="openReport('hospital-one','${x.id}')">PDF</button> <button class="btn secondary small" onclick="editHospital('${x.id}')">Editar</button> <button class="btn danger small" onclick="removeFrom(db.hospitals,'${x.id}','hospital')">Excluir</button></td></tr>`).join('')
}
function renderInsurers(){
  $('insurerTable').innerHTML=db.insurers.map(x=>`<tr><td><b>${safe(x.name)}</b><br><small>${safe(x.ans||'')}</small></td><td>${safe(x.contact||'-')}<br><small>${safe(x.phone||x.email||'')}</small></td><td>${x.portal?`<a href="${safe(x.portal)}" target="_blank" style="color:var(--gold2)">Abrir portal</a>`:'-'}</td><td>${+x.dso||0} dias</td><td><span class="badge ${scoreClass(+x.farol||0)}">${+x.farol||0}</span></td><td>${safe(x.status||'-')}</td><td><button class="btn secondary small" onclick="openReport('insurer-one','${x.id}')">PDF</button> <button class="btn secondary small" onclick="editInsurer('${x.id}')">Editar</button> <button class="btn danger small" onclick="removeFrom(db.insurers,'${x.id}','convênio')">Excluir</button></td></tr>`).join('')
}
function renderProcedures(){
  $('procedureTable').innerHTML=[...db.procedures].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).map(x=>`<tr><td>${safe(x.number)}</td><td>${safe(x.patient)}</td><td>${fmtDate(x.date)} ${safe(x.time||'')}</td><td>${safe(professionalName(x.doctorId))}</td><td>${safe(hospitalName(x.hospitalId))}</td><td>${safe(x.position)}</td><td>${safe(x.status)}</td><td><button class="btn secondary small" onclick="openReport('procedure-one','${x.id}')">PDF</button> <button class="btn secondary small" onclick="editProcedure('${x.id}')">Editar</button> <button class="btn danger small" onclick="removeFrom(db.procedures,'${x.id}','procedimento')">Excluir</button></td></tr>`).join('')
}
function renderVisits(){
  $('visitTable').innerHTML=[...db.visits].sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<tr><td>${fmtDate(x.date)}</td><td>${safe(hospitalName(x.hospitalId))}</td><td>${safe(professionalName(x.professionalId))}</td><td>${safe(x.status)}</td><td>${safe(x.objective||'-')}</td><td><button class="btn secondary small" onclick="editVisit('${x.id}')">Editar</button> <button class="btn danger small" onclick="removeFrom(db.visits,'${x.id}','visita')">Excluir</button></td></tr>`).join('')
}
function renderFarol(){
  $('farolTable').innerHTML=[...db.farol].sort((a,b)=>(b.score||0)-(a.score||0)).map(x=>`<tr><td>${safe(hospitalName(x.hospitalId))}</td><td>${safe(x.month||'-')}</td><td><b>${x.score||calcFarol(x)}</b></td><td><span class="badge ${scoreClass(x.score||0)}">${scoreLabel(x.score||0)}</span></td><td>${x.dso||0} dias</td><td>${safe(x.plan||'-')}</td><td><button class="btn secondary small" onclick="editFarol('${x.id}')">Editar</button> <button class="btn danger small" onclick="removeFrom(db.farol,'${x.id}','avaliação')">Excluir</button></td></tr>`).join('')
}
function renderForecast(){
  const goal=db.forecasts.reduce((s,x)=>s+(+x.goal||0),0),weighted=db.forecasts.reduce((s,x)=>s+(+x.weighted||0),0),revenue=db.forecasts.reduce((s,x)=>s+(+x.revenue||0),0);
  $('forecastKpis').innerHTML=`<div class="kpi"><small>Meta</small><strong>${goal}</strong><em>Unidades</em></div><div class="kpi"><small>Ponderado</small><strong>${weighted.toFixed(1)}</strong><em>Projeção</em></div><div class="kpi"><small>Gap</small><strong>${Math.max(0,goal-weighted).toFixed(1)}</strong><em>A recuperar</em></div><div class="kpi"><small>Receita</small><strong style="font-size:18px">${revenue.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong><em>Projetada</em></div>`;
  $('forecastTable').innerHTML=db.forecasts.map(x=>`<tr><td>${safe(hospitalName(x.hospitalId))}</td><td>${safe(x.month)}</td><td>${safe(x.line)}</td><td>${x.goal}</td><td>${x.confirmed}</td><td>${(+x.weighted||0).toFixed(1)}</td><td>${(+x.revenue||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td><td><button class="btn secondary small" onclick="editForecast('${x.id}')">Editar</button> <button class="btn danger small" onclick="removeFrom(db.forecasts,'${x.id}','forecast')">Excluir</button></td></tr>`).join('')
}

function daysUntil(s){return Math.ceil((new Date(s+'T12:00:00')-new Date(nowISO()+'T12:00:00'))/86400000)}
function renderDashboard(){
  $('kpiProfessionals').textContent=db.professionals.length;$('kpiHospitals').textContent=db.hospitals.length;$('kpiInsurers').textContent=db.insurers.length;$('kpiProcedures').textContent=db.procedures.length;
  const upcoming=db.procedures.filter(x=>{const d=daysUntil(x.date);return d>=0&&d<=7&&x.status!=='Cancelado'}).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  $('kpiUpcoming').textContent=upcoming.length;
  const critical=db.hospitals.filter(x=>(+x.farol||0)<50).length+db.procedures.filter(x=>{const d=daysUntil(x.date);return d>=0&&d<=3&&x.status==='Em planejamento'}).length;
  $('kpiAlerts').textContent=critical;
  $('dashboardAgenda').innerHTML=upcoming.length?upcoming.slice(0,6).map(x=>`<div class="list-row"><div class="list-icon">${daysUntil(x.date)===0?'H':daysUntil(x.date)}</div><div><b>${safe(x.time||'--:--')} · ${safe(x.patient)}</b><span>${fmtDate(x.date)} · ${safe(hospitalName(x.hospitalId))} · ${safe(x.position)}</span></div><b>${safe(x.status)}</b></div>`).join(''):'<div class="empty">Nenhum procedimento nos próximos 7 dias.</div>';
  const counts={};db.procedures.filter(x=>x.status!=='Cancelado'&&['Aórtica','Valve-in-Valve'].includes(x.position)).forEach(x=>{if(x.doctorId)counts[x.doctorId]=(counts[x.doctorId]||0)+1});
  const rank=Object.entries(counts).map(([id,total])=>({name:professionalName(id),total})).sort((a,b)=>b.total-a.total).slice(0,10),max=Math.max(1,...rank.map(x=>x.total));
  $('doctorRanking').innerHTML=rank.length?`<div class="chart">${rank.map((x,i)=>`<div class="chart-row"><div class="chart-rank">${i+1}</div><div class="chart-name">${safe(x.name)}</div><div class="chart-bar"><i style="width:${x.total/max*100}%"></i></div><div class="chart-value">${x.total}</div></div>`).join('')}</div>`:'<div class="empty">O ranking aparecerá após vincular médicos aos procedimentos TAVI.</div>';
  const fp=[...db.hospitals].sort((a,b)=>(+a.farol||0)-(+b.farol||0)).slice(0,5);
  $('farolPriority').innerHTML=fp.length?fp.map((x,i)=>`<div class="list-row"><div class="list-icon">${i+1}</div><div><b>${safe(x.name)}</b><span>${safe(x.city||'')} · ${safe(x.recommendedAction||'Sem ação cadastrada')}</span></div><span class="badge ${scoreClass(+x.farol||0)}">${+x.farol||0}</span></div>`).join(''):'<div class="empty">Importe a Base FAROL ou cadastre hospitais.</div>';
  renderAssistant()
}
function renderAssistant(){
  const items=[];const today=nowISO();
  db.hospitals.filter(h=>(+h.farol||0)<50).slice(0,3).forEach(h=>items.push(`<div class="notice"><b>Prioridade FAROL:</b> ${safe(h.name)} está com score ${+h.farol||0}. ${safe(h.recommendedAction||'Planeje uma visita e atualize o potencial.')}</div>`));
  db.procedures.filter(p=>{const d=daysUntil(p.date);return d>=0&&d<=3&&p.status==='Em planejamento'}).slice(0,3).forEach(p=>items.push(`<div class="notice"><b>Procedimento próximo:</b> ${safe(p.patient)} em ${safe(hospitalName(p.hospitalId))} ainda está em planejamento.</div>`));
  const stale=db.hospitals.filter(h=>{const last=[...db.visits].filter(v=>v.hospitalId===h.id&&v.status==='Realizada').sort((a,b)=>b.date.localeCompare(a.date))[0];return !last||daysBetween(last.date,today)>20}).slice(0,3);
  stale.forEach(h=>items.push(`<div class="notice"><b>Relacionamento:</b> ${safe(h.name)} está sem visita realizada há mais de 20 dias ou sem histórico cadastrado.</div>`));
  $('assistantInsights').innerHTML=items.length?items.join(''):'<div class="notice"><b>Operação estável.</b> Continue atualizando visitas, agenda, FAROL e forecast.</div>'
}
function daysBetween(a,b){return Math.round(Math.abs(new Date(a+'T12:00:00')-new Date(b+'T12:00:00'))/86400000)}

function renderCalendar(){
  const ym=$('calendarMonth').value||monthISO(),[y,m]=ym.split('-').map(Number),first=new Date(y,m-1,1),last=new Date(y,m,0),names=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  let out=names.map(n=>`<div style="text-align:center;color:var(--gold2);font-size:10px;font-weight:900">${n}</div>`).join('');
  for(let i=0;i<first.getDay();i++)out+='<div></div>';
  for(let d=1;d<=last.getDate();d++){const ds=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,items=db.procedures.filter(x=>x.date===ds);out+=`<div class="calendar-day"><b>${d}</b>${items.map(x=>`<div class="cal-event">${safe(x.time||'')} · ${safe(x.patient)}<br>${safe(hospitalName(x.hospitalId))}</div>`).join('')}</div>`}
  $('calendar').innerHTML=out
}
function weeklyReport(){
  const start=nowISO(),end=new Date();end.setDate(end.getDate()+6);const items=db.procedures.filter(x=>x.date>=start&&x.date<=end.toISOString().slice(0,10)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  $('weeklyOutput').style.display='block';$('weeklyOutput').innerHTML=`<div class="report">${reportCover('Rotina Semanal — 7 dias','Agenda operacional')}${items.length?`<table class="report-table"><thead><tr><th>Data</th><th>Horário</th><th>Paciente</th><th>Hospital</th><th>Médico</th><th>Posição</th><th>Status</th></tr></thead><tbody>${items.map(x=>`<tr><td>${fmtDate(x.date)}</td><td>${safe(x.time)}</td><td>${safe(x.patient)}</td><td>${safe(hospitalName(x.hospitalId))}</td><td>${safe(professionalName(x.doctorId))}</td><td>${safe(x.position)}</td><td>${safe(x.status)}</td></tr>`).join('')}</tbody></table>`:'<p>Sem procedimentos no período.</p>'}<div class="actions no-print"><button class="btn" onclick="window.print()">Salvar como PDF</button></div></div>`;setTimeout(()=>window.print(),150)
}
function renderVisitSuggestions(){
  const rows=db.hospitals.map(h=>{const last=[...db.visits].filter(v=>v.hospitalId===h.id&&v.status==='Realizada').sort((a,b)=>b.date.localeCompare(a.date))[0];const days=last?daysBetween(last.date,nowISO()):999;const priority=(100-(+h.farol||0))+Math.min(days,60);return{h,days,priority}}).sort((a,b)=>b.priority-a.priority).slice(0,8);
  $('visitSuggestions').innerHTML=rows.length?rows.map((x,i)=>`<div class="list-row"><div class="list-icon">${i+1}</div><div><b>${safe(x.h.name)}</b><span>${x.days===999?'Sem visita registrada':`${x.days} dias desde a última visita`} · FAROL ${+x.h.farol||0}</span></div><button class="btn secondary small" onclick="prefillVisit('${x.h.id}')">Planejar</button></div>`).join(''):'<div class="empty">Cadastre hospitais para gerar sugestões.</div>'
}
function prefillVisit(id){$('visitHospital').value=id;$('visitDate').value=nowISO();$('visitStatus').value='Planejada';$('visitObjective').value='Atualizar relacionamento, pipeline, market share e próximas oportunidades.';window.scrollTo({top:0,behavior:'smooth'})}


const REPORT_TEMPLATE_KEY='goldenStructuralReportTemplatesV1';
const REPORT_FIELDS={
  procedures:[
    ['number','Caso'],['date','Data'],['time','Horário'],['patient','Paciente'],['age','Idade'],
    ['city','Cidade'],['hospital','Hospital'],['doctor','1º operador'],['secondDoctor','2º operador'],
    ['proctor','Proctor'],['accountExecutive','Executivo'],['insurer','Convênio'],['position','Posição'],
    ['clinicalType','Tipo/anatomia'],['diagnosis','Diagnóstico'],['access','Acesso'],
    ['accessType','Tipo de acesso'],['guidewire','Fio-guia'],['preBalloon','Balão pré'],
    ['valve','Marca/modelo'],['size','Tamanho'],['sizeCategory','Categoria'],['expansion','Expansão'],
    ['procedureFamily','Família'],['postDilation','Pós-dilatação'],['mammoth','Mammoth'],
    ['complication','Complicação'],['status','Status'],['source','Origem']
  ],
  professionals:[
    ['name','Nome'],['category','Categoria'],['cpf','CPF'],['register','Registro'],
    ['specialty','Especialidade/função'],['hospital','Hospital'],['phone','Telefone'],
    ['email','E-mail'],['tavi','TAVI'],['mitral','Mitral'],['tricuspid','Tricúspide'],['history','Histórico']
  ],
  hospitals:[
    ['name','Hospital'],['cnpj','CNPJ'],['city','Cidade'],['state','Estado'],['network','Rede'],
    ['chief','Chefe do serviço'],['insurer','Convênio'],['serviceStatus','Status do serviço'],
    ['taviMarket','Market Share TAVI'],['stentMarket','Market Share Stent'],['farol','FAROL'],
    ['recommendedAction','Ação recomendada']
  ],
  insurers:[
    ['name','Convênio'],['legalName','Razão social'],['cnpj','CNPJ'],['ans','ANS'],
    ['contact','Contato'],['role','Cargo/setor'],['phone','Telefone'],['email','E-mail'],
    ['portal','Portal'],['dso','DSO'],['farol','FAROL'],['status','Status'],['notes','Observações']
  ]
};
const REPORT_DEFAULTS={
  procedures:['number','date','patient','hospital','doctor','insurer','position','valve','size','sizeCategory','expansion','status'],
  professionals:['name','category','register','specialty','hospital','phone','tavi'],
  hospitals:['name','city','state','network','chief','insurer','taviMarket','farol'],
  insurers:['name','ans','contact','phone','email','dso','farol','status']
};
function currentReportCollection(){
  const type=$('reportType')?.value||'';
  if(type.startsWith('procedure'))return'procedures';
  if(type.startsWith('professional'))return'professionals';
  if(type.startsWith('hospital'))return'hospitals';
  if(type.startsWith('insurer'))return'insurers';
  return'procedures';
}
function configureReportBuilder(){
  configureReportEntities();
  const type=$('reportType').value;
  const isList=type.endsWith('-all');
  $('reportBuilderOptions').style.display=isList?'block':'none';
  if(isList)renderReportFieldSelector();
}
function renderReportFieldSelector(){
  const collection=currentReportCollection();
  const defaults=REPORT_DEFAULTS[collection]||[];
  $('reportFieldSelector').innerHTML=(REPORT_FIELDS[collection]||[]).map(([key,label])=>`
    <label class="check"><input class="report-field-check" type="checkbox" value="${key}" ${defaults.includes(key)?'checked':''}> ${safe(label)}</label>
  `).join('');
}
function selectAllReportFields(value){
  document.querySelectorAll('.report-field-check').forEach(x=>x.checked=value);
}
function selectedReportFields(){
  return [...document.querySelectorAll('.report-field-check:checked')].map(x=>x.value);
}
function saveReportTemplate(){
  const name=$('reportTemplateName').value.trim();
  if(!name)return alert('Informe o nome do modelo.');
  const templates=JSON.parse(localStorage.getItem(REPORT_TEMPLATE_KEY)||'{}');
  templates[name]={
    collection:currentReportCollection(),fields:selectedReportFields(),
    sort:$('reportSort').value,group:$('reportGroup').value,
    orientation:$('reportOrientation').value,summary:$('reportShowSummary').checked,
    totals:$('reportShowTotals').checked,sensitive:$('reportShowSensitive').checked,
    compact:$('reportCompact').checked
  };
  localStorage.setItem(REPORT_TEMPLATE_KEY,JSON.stringify(templates));
  renderReportTemplates();$('reportTemplateSelect').value=name;alert('Modelo salvo.');
}
function renderReportTemplates(){
  if(!$('reportTemplateSelect'))return;
  const templates=JSON.parse(localStorage.getItem(REPORT_TEMPLATE_KEY)||'{}');
  $('reportTemplateSelect').innerHTML='<option value="">Selecione</option>'+Object.keys(templates).map(x=>`<option>${safe(x)}</option>`).join('');
}
function loadReportTemplate(){
  const name=$('reportTemplateSelect').value;
  const template=JSON.parse(localStorage.getItem(REPORT_TEMPLATE_KEY)||'{}')[name];
  if(!template)return;
  document.querySelectorAll('.report-field-check').forEach(x=>x.checked=template.fields.includes(x.value));
  $('reportSort').value=template.sort;$('reportGroup').value=template.group;
  $('reportOrientation').value=template.orientation;$('reportShowSummary').checked=template.summary;
  $('reportShowTotals').checked=template.totals;$('reportShowSensitive').checked=template.sensitive;
  $('reportCompact').checked=template.compact;
}
function reportFieldLabel(collection,key){
  return (REPORT_FIELDS[collection]||[]).find(x=>x[0]===key)?.[1]||key;
}
function procedureFieldValue(x,key){
  const size=Number(x.valveSize||extractValveSize(x.prosthesisSize||x.kit))||0;
  const values={
    number:x.number,date:fmtDate(x.date),time:x.time,patient:x.patient,age:x.age||'',
    city:x.city,hospital:hospitalName(x.hospitalId),doctor:professionalName(x.doctorId),
    secondDoctor:professionalName(x.secondDoctorId),proctor:x.proctor,accountExecutive:x.accountExecutive,
    insurer:insurerName(x.insurerId),position:x.position,clinicalType:x.clinicalType,diagnosis:x.diagnosis,
    access:x.access,accessType:x.accessType,guidewire:x.guidewire,preBalloon:x.preBalloon,
    valve:[x.valveBrand,x.valveModel].filter(Boolean).join(' '),size:size?`${String(size).replace('.',',')} mm`:(x.prosthesisSize||x.kit),
    sizeCategory:x.valveSizeCategory||classifyValveSize(size),expansion:x.valveExpansion||inferValveExpansion(x.valveBrand,x.valveModel),
    procedureFamily:x.valveProcedureFamily,postDilation:x.postDilation,mammoth:x.mammothSize,
    complication:x.complication,status:x.status,source:x.source
  };return values[key]??'';
}
function professionalFieldValue(x,key){const v={name:x.name,category:x.category,cpf:x.cpf,register:x.register,specialty:x.specialty,hospital:hospitalName(x.hospitalId),phone:x.phone,email:x.email,tavi:x.tavi||0,mitral:x.mitral||0,tricuspid:x.tricuspid||0,history:x.history};return v[key]??''}
function hospitalFieldValue(x,key){const v={...x,insurer:insurerName(x.insurerId)};return v[key]??''}
function insurerFieldValue(x,key){return x[key]??''}
function genericFieldValue(collection,x,key){
  if(collection==='procedures')return procedureFieldValue(x,key);
  if(collection==='professionals')return professionalFieldValue(x,key);
  if(collection==='hospitals')return hospitalFieldValue(x,key);
  return insurerFieldValue(x,key);
}
function genericSortValue(collection,x,key){
  if(key==='name')return norm(genericFieldValue(collection,x,collection==='procedures'?'patient':'name'));
  if(key==='date')return collection==='procedures'?x.date||'':'';
  if(key==='hospital')return norm(collection==='hospitals'?x.name:hospitalName(x.hospitalId));
  if(key==='doctor')return norm(professionalName(x.doctorId));
  if(key==='insurer')return norm(collection==='insurers'?x.name:insurerName(x.insurerId));
  if(key==='city')return norm(x.city||'');
  if(key==='size')return Number(x.valveSize||extractValveSize(x.prosthesisSize||x.kit))||0;
  if(key==='expansion')return norm(x.valveExpansion||inferValveExpansion(x.valveBrand,x.valveModel));
  return'';
}
function genericGroupValue(collection,x,key){
  if(!key)return'';
  if(key==='hospital')return collection==='hospitals'?x.name:hospitalName(x.hospitalId);
  if(key==='doctor')return professionalName(x.doctorId);
  if(key==='insurer')return collection==='insurers'?x.name:insurerName(x.insurerId);
  if(key==='city')return x.city||'Não informado';
  if(key==='category')return collection==='procedures'?(x.valveSizeCategory||classifyValveSize(x.valveSize||extractValveSize(x.prosthesisSize||x.kit))||'Não informado'):(x.category||'Não informado');
  if(key==='expansion')return x.valveExpansion||inferValveExpansion(x.valveBrand,x.valveModel)||'Não informado';
  return'Não informado';
}
function reportSummaryHtml(collection,items){
  if(!$('reportShowSummary').checked)return'';
  let cards=[['Registros',items.length]];
  if(collection==='procedures'){
    const bev=items.filter(x=>(x.valveExpansion||inferValveExpansion(x.valveBrand,x.valveModel))==='Balão expansiva').length;
    const sev=items.filter(x=>(x.valveExpansion||inferValveExpansion(x.valveBrand,x.valveModel))==='Auto expansível').length;
    const xl=items.filter(x=>(x.valveSizeCategory||classifyValveSize(x.valveSize||extractValveSize(x.prosthesisSize||x.kit)))==='XL').length;
    cards.push(['Balão expansiva',bev],['Auto expansível',sev],['Tamanhos XL',xl]);
  }else if(collection==='professionals'){
    cards.push(['Médicos',items.filter(x=>x.category==='Médico').length],['Enfermagem',items.filter(x=>x.category==='Enfermagem').length],['Hospitais',new Set(items.map(x=>x.hospitalId).filter(Boolean)).size]);
  }else if(collection==='hospitals'){
    cards.push(['FAROL verde',items.filter(x=>(+x.farol||0)>=75).length],['FAROL amarelo',items.filter(x=>(+x.farol||0)>=50&&(+x.farol||0)<75).length],['FAROL vermelho',items.filter(x=>(+x.farol||0)<50).length]);
  }else{
    cards.push(['Ativos',items.filter(x=>x.status==='Ativo').length],['DSO ≤ 30',items.filter(x=>(+x.dso||0)<=30).length],['FAROL verde',items.filter(x=>(+x.farol||0)>=75).length]);
  }
  return `<div class="report-summary">${cards.map(([a,b])=>`<div><b>${b}</b><span>${safe(a)}</span></div>`).join('')}</div>`;
}
function customizableListReport(collection,items,title){
  const fields=selectedReportFields();
  if(!fields.length)return'<div class="empty">Selecione ao menos um campo para o relatório.</div>';
  const sort=$('reportSort').value,group=$('reportGroup').value;
  items=[...items].sort((a,b)=>{const av=genericSortValue(collection,a,sort),bv=genericSortValue(collection,b,sort);return av>bv?1:av<bv?-1:0});
  const groups=new Map();
  if(group)items.forEach(x=>{const g=genericGroupValue(collection,x,group);if(!groups.has(g))groups.set(g,[]);groups.get(g).push(x)});
  else groups.set('',items);
  document.body.classList.remove('report-landscape','report-portrait','report-compact');
  document.body.classList.add($('reportOrientation').value==='portrait'?'report-portrait':'report-landscape');
  if($('reportCompact').checked)document.body.classList.add('report-compact');
  let body='';
  groups.forEach((rows,label)=>{
    if(label)body+=`<tr class="report-group-row"><td colspan="${fields.length}">${safe(label)} — ${rows.length} registro(s)</td></tr>`;
    body+=rows.map(x=>`<tr>${fields.map(key=>`<td>${safe(genericFieldValue(collection,x,key)||'-')}</td>`).join('')}</tr>`).join('');
  });
  return `<article class="report">${reportCover(title,`${items.length} registros • relatório personalizado`)}
    ${reportSummaryHtml(collection,items)}
    <table class="report-table"><thead><tr>${fields.map(key=>`<th>${safe(reportFieldLabel(collection,key))}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>
  </article>`;
}

function configureReportEntities(){
  if(!$('reportType'))return;const type=$('reportType').value,select=$('reportEntity');let rows=[];
  if(type.startsWith('professional'))rows=db.professionals;if(type.startsWith('hospital'))rows=db.hospitals;if(type.startsWith('insurer'))rows=db.insurers;if(type.startsWith('procedure'))rows=db.procedures.map(p=>({id:p.id,name:`${p.number||'-'} — ${p.patient||'Paciente'} — ${fmtDate(p.date)}`}));
  const one=type.endsWith('-one');select.disabled=!one;select.innerHTML=one?rows.map(x=>`<option value="${x.id}">${safe(x.name)}</option>`).join(''):'<option>Relatório consolidado</option>'
}
$('reportType').onchange=configureReportBuilder;
function reportCover(title,subtitle){return `<div class="report-cover"><img src="${document.querySelector('.brand img').src}"><h1>${safe(title)}</h1><p>${safe(subtitle)}</p><p>Golden Structural Platform™ • ${new Date().toLocaleString('pt-BR')}</p></div>`}
function reportFields(rows){return `<div class="report-grid">${rows.map(([a,b])=>`<div class="report-field"><b>${safe(a)}</b>${safe(b||'-')}</div>`).join('')}</div>`}
function filteredProcedures(){const p=$('reportPeriod').value,now=new Date();return db.procedures.filter(x=>{if(p==='all')return true;const d=new Date(x.date+'T12:00:00');if(p==='year')return d.getFullYear()===now.getFullYear();if(p==='month')return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();return true})}
function professionalReport(x,breakPage=false){const items=filteredProcedures().filter(p=>p.doctorId===x.id);return `<article class="report ${breakPage?'report-page-break':''}">${reportCover(`Relatório Profissional — ${x.name}`,`${x.category} • ${x.register||'Sem registro'}`)}${reportFields([['Nome',x.name],['Categoria',x.category],['CPF',x.cpf],['Registro',x.register],['Especialidade',x.specialty],['Hospital',hospitalName(x.hospitalId)],['Telefone',x.phone],['E-mail',x.email],['TAVI informado',String(x.tavi||0)],['TAVI no registro',String(items.filter(p=>['Aórtica','Valve-in-Valve'].includes(p.position)).length)]])}<h2>Histórico</h2><p>${safe(x.history||'Sem histórico cadastrado.')}</p><h2>Procedimentos vinculados</h2>${procedureReportTable(items)}</article>`}
function hospitalReport(x,breakPage=false){const items=filteredProcedures().filter(p=>p.hospitalId===x.id),pros=db.professionals.filter(p=>p.hospitalId===x.id);return `<article class="report ${breakPage?'report-page-break':''}">${reportCover(`Relatório Hospitalar — ${x.name}`,`${x.city||''}/${x.state||''}`)}${reportFields([['Hospital',x.name],['CNPJ',x.cnpj],['Chefe',x.chief],['Rede',x.network],['Região',x.region],['Convênio principal',insurerName(x.insurerId)],['Status',x.serviceStatus],['Market Share TAVI',x.taviMarket],['Market Share Stent',x.stentMarket],['FAROL',String(x.farol||0)]])}<h2>Heart Team</h2><table class="report-table"><thead><tr><th>Nome</th><th>Categoria</th><th>Registro</th><th>Contato</th></tr></thead><tbody>${pros.map(p=>`<tr><td>${safe(p.name)}</td><td>${safe(p.category)}</td><td>${safe(p.register||'-')}</td><td>${safe(p.phone||p.email||'-')}</td></tr>`).join('')||'<tr><td colspan="4">Sem profissionais vinculados.</td></tr>'}</tbody></table><h2>Procedimentos</h2>${procedureReportTable(items)}<h2>Ação recomendada</h2><p>${safe(x.recommendedAction||'-')}</p></article>`}

function procedureReport(x,breakPage=false){
  if(!x)return '';
  const technicalRows=[
    ['Posição',x.position],['Tipo / anatomia',x.clinicalType],['Diagnóstico',x.diagnosis],
    ['Acesso',x.access],['Tipo de acesso',x.accessType],['Fio-guia',x.guidewire],
    ['Balão pré',x.preBalloon],['Prótese / tamanho',x.prosthesisSize||x.kit],
    ['Pós-dilatação',x.postDilation],['Mammoth',x.mammothSize],
    ['Report',x.report],['Crimper / responsável',x.crimper],['Fabricante / marca',x.valveBrand],['Modelo da válvula',x.valveModel],['Tipo de expansão',x.valveExpansion],['Tamanho nominal',x.valveSize?`${x.valveSize} mm`:x.prosthesisSize],['Categoria do tamanho',x.valveSizeCategory||classifyValveSize(x.valveSize||extractValveSize(x.prosthesisSize||x.kit))],['Família do procedimento',x.valveProcedureFamily],['Plataforma / geração',x.valveGeneration],['Observação da válvula',x.valveNotes]
  ];
  return `<article class="report ${breakPage?'report-page-break':''}">
    ${reportCover(`Relatório do Procedimento — Caso ${x.number||'-'}`,`${fmtDate(x.date)} ${safe(x.time||'')} • ${hospitalName(x.hospitalId)}`)}
    <h2>Identificação</h2>
    ${reportFields([
      ['Paciente',x.patient],['Idade',x.age?String(x.age):'-'],['Data',fmtDate(x.date)],['Horário',x.time],
      ['Hospital',hospitalName(x.hospitalId)],['Cidade',x.city],['Convênio',insurerName(x.insurerId)],['Status',x.status]
    ])}
    <h2>Equipe</h2>
    ${reportFields([
      ['1º operador',professionalName(x.doctorId)],['2º operador',professionalName(x.secondDoctorId)],['Proctor',x.proctor],
      ['Executivo de contas',x.accountExecutive],['Origem do registro',x.source]
    ])}
    <h2>Dados técnicos</h2>
    ${reportFields(technicalRows)}
    <h2>Complicações e observações</h2>
    <div class="report-note"><b>Complicação / observação clínica</b><br>${safe(x.complication||'Nenhuma complicação registrada.').replaceAll('\n','<br>')}</div>
    <div class="report-note" style="margin-top:8px"><b>Descrição / conclusão</b><br>${safe(x.notes||'Sem observações adicionais.').replaceAll('\n','<br>')}</div>
    <div style="margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
      <div style="border-top:1px solid #666;padding-top:6px;text-align:center;font-size:9px">Responsável pelo registro</div>
      <div style="border-top:1px solid #666;padding-top:6px;text-align:center;font-size:9px">Data de emissão</div>
    </div>
  </article>`;
}

function insurerReport(x,breakPage=false){const hospitals=db.hospitals.filter(h=>h.insurerId===x.id),items=filteredProcedures().filter(p=>p.insurerId===x.id);return `<article class="report ${breakPage?'report-page-break':''}">${reportCover(`Relatório de Convênio — ${x.name}`,`${x.status||''} • FAROL ${x.farol||0}`)}${reportFields([['Nome',x.name],['CNPJ',x.cnpj],['ANS',x.ans],['Contato',x.contact],['Cargo/Setor',x.role],['Telefone',x.phone],['E-mail',x.email],['Portal',x.portal],['DSO',`${x.dso||0} dias`],['FAROL',String(x.farol||0)]])}<h2>Hospitais vinculados</h2><p>${hospitals.map(h=>safe(h.name)).join(', ')||'Nenhum hospital vinculado.'}</p><h2>Procedimentos</h2>${procedureReportTable(items)}<h2>Regras e observações</h2><p>${safe(x.notes||'-')}</p></article>`}
function procedureReportTable(items){return items.length?`<table class="report-table"><thead><tr><th>Data</th><th>Paciente</th><th>Hospital</th><th>Médico</th><th>Posição</th><th>Prótese</th><th>Status</th></tr></thead><tbody>${items.map(p=>`<tr><td>${fmtDate(p.date)}</td><td>${safe(p.patient)}</td><td>${safe(hospitalName(p.hospitalId))}</td><td>${safe(professionalName(p.doctorId))}</td><td>${safe(p.position)}</td><td>${safe(p.prosthesisSize||p.kit||'-')}</td><td>${safe(p.status)}</td></tr>`).join('')}</tbody></table>`:'<p>Nenhum procedimento encontrado.</p>'}

function valveBarReport(rows){
  const max=Math.max(1,...rows.map(x=>x[1]));
  return `<div class="valve-report-bars">${rows.map(([label,value])=>`
    <div class="valve-report-row"><span>${safe(label)}</span>
      <div class="valve-report-bar"><span style="width:${Math.max(2,value/max*100)}%"></span></div>
      <b>${value}</b>
    </div>`).join('')}</div>`;
}
function valveAnalyticsReport(){
  const procedures=filteredProcedures().filter(p=>['Aórtica','Valve-in-Valve'].includes(p.position)||p.valveSize||p.prosthesisSize);
  const normalized=procedures.map(p=>{
    const size=Number(p.valveSize||extractValveSize(p.prosthesisSize||p.kit))||0;
    const category=p.valveSizeCategory||classifyValveSize(size)||'Não informado';
    const expansion=p.valveExpansion||inferValveExpansion(p.valveBrand,p.valveModel)||'Não informado';
    return {...p,_size:size,_category:category,_expansion:expansion};
  });
  const byCategory={Normal:0,Intermediário:0,XL:0,'Não informado':0};
  const byExpansion={'Balão expansiva':0,'Auto expansível':0,'Mecânica expansível':0,Cirúrgica:0,Outro:0,'Não informado':0};
  const bySize={};
  normalized.forEach(p=>{
    byCategory[p._category]=(byCategory[p._category]||0)+1;
    byExpansion[p._expansion]=(byExpansion[p._expansion]||0)+1;
    const key=p._size?`${String(p._size).replace('.',',')} mm`:'Não informado';
    bySize[key]=(bySize[key]||0)+1;
  });
  const sizeRows=Object.entries(bySize).sort((a,b)=>{
    const av=parseFloat(a[0].replace(',','.'))||999;
    const bv=parseFloat(b[0].replace(',','.'))||999;
    return av-bv;
  });
  return `<article class="report">
    ${reportCover('Valve Intelligence™ — Relatório de tamanhos e plataformas',`${normalized.length} procedimentos analisados`)}
    <h2>Resumo executivo</h2>
    <div class="valve-summary-grid">
      <div class="valve-summary-card"><b>${byCategory.Normal||0}</b><span>Tamanhos normais</span></div>
      <div class="valve-summary-card"><b>${byCategory.Intermediário||0}</b><span>Tamanhos intermediários</span></div>
      <div class="valve-summary-card"><b>${byCategory.XL||0}</b><span>Tamanhos XL</span></div>
    </div>
    <h2>Distribuição por categoria de tamanho</h2>
    ${valveBarReport(Object.entries(byCategory).filter(x=>x[1]>0))}
    <h2>Distribuição por tipo de expansão</h2>
    ${valveBarReport(Object.entries(byExpansion).filter(x=>x[1]>0))}
    <h2>Distribuição por tamanho nominal</h2>
    ${valveBarReport(sizeRows)}
    <h2>Detalhamento dos procedimentos</h2>
    <table class="report-table">
      <thead><tr><th>Data</th><th>Paciente</th><th>Hospital</th><th>Médico</th><th>Válvula</th><th>Tamanho</th><th>Categoria</th><th>Expansão</th></tr></thead>
      <tbody>${normalized.map(p=>`<tr>
        <td>${fmtDate(p.date)}</td><td>${safe(p.patient)}</td><td>${safe(hospitalName(p.hospitalId))}</td>
        <td>${safe(professionalName(p.doctorId))}</td><td>${safe([p.valveBrand,p.valveModel].filter(Boolean).join(' ')||'-')}</td>
        <td>${p._size?`${String(p._size).replace('.',',')} mm`:'-'}</td><td>${safe(p._category)}</td><td>${safe(p._expansion)}</td>
      </tr>`).join('')}</tbody>
    </table>
    <div class="report-note" style="margin-top:14px">
      A classificação é analítica e configurável. Tamanhos intermediários considerados nesta versão:
      21,5 / 24,5 / 27,5 / 30,5 mm. Tamanhos XL: 29 / 30 / 32 / 34 mm.
    </div>
  </article>`;
}


function professionalListReport(items){
  return `<article class="report">${reportCover('Lista Geral de Profissionais',`${items.length} registros`)}
  <table class="report-table"><thead><tr><th>#</th><th>Nome</th><th>Categoria</th><th>CPF</th><th>Registro</th><th>Especialidade</th><th>Hospital</th><th>Contato</th><th>TAVI</th></tr></thead>
  <tbody>${items.map((x,i)=>`<tr><td>${i+1}</td><td>${safe(x.name)}</td><td>${safe(x.category)}</td><td>${safe(x.cpf||'-')}</td><td>${safe(x.register||'-')}</td><td>${safe(x.specialty||'-')}</td><td>${safe(hospitalName(x.hospitalId))}</td><td>${safe(x.phone||x.email||'-')}</td><td>${+x.tavi||0}</td></tr>`).join('')}</tbody></table></article>`;
}
function hospitalListReport(items){
  return `<article class="report">${reportCover('Lista Geral de Hospitais',`${items.length} registros`)}
  <table class="report-table"><thead><tr><th>#</th><th>Hospital</th><th>Cidade/UF</th><th>Rede</th><th>Chefe</th><th>Convênio</th><th>Market Share TAVI</th><th>FAROL</th></tr></thead>
  <tbody>${items.map((x,i)=>`<tr><td>${i+1}</td><td>${safe(x.name)}</td><td>${safe((x.city||'-')+'/'+(x.state||'-'))}</td><td>${safe(x.network||'-')}</td><td>${safe(x.chief||'-')}</td><td>${safe(insurerName(x.insurerId))}</td><td>${safe(x.taviMarket||'-')}</td><td>${+x.farol||0}</td></tr>`).join('')}</tbody></table></article>`;
}
function insurerListReport(items){
  return `<article class="report">${reportCover('Lista Geral de Convênios e Operadoras',`${items.length} registros`)}
  <table class="report-table"><thead><tr><th>#</th><th>Convênio</th><th>ANS</th><th>Contato</th><th>Telefone</th><th>E-mail</th><th>Portal</th><th>DSO</th><th>FAROL</th><th>Status</th></tr></thead>
  <tbody>${items.map((x,i)=>`<tr><td>${i+1}</td><td>${safe(x.name)}</td><td>${safe(x.ans||'-')}</td><td>${safe(x.contact||'-')}</td><td>${safe(x.phone||'-')}</td><td>${safe(x.email||'-')}</td><td>${safe(x.portal||'-')}</td><td>${+x.dso||0} dias</td><td>${+x.farol||0}</td><td>${safe(x.status||'-')}</td></tr>`).join('')}</tbody></table></article>`;
}
function procedureListReport(items){
  return `<article class="report">${reportCover('Lista Geral de Procedimentos',`${items.length} registros`)}
  <table class="report-table"><thead><tr><th>#</th><th>Caso</th><th>Data</th><th>Paciente</th><th>Hospital</th><th>Médico</th><th>Convênio</th><th>Posição</th><th>Válvula</th><th>Tamanho</th><th>Categoria</th><th>Expansão</th><th>Status</th></tr></thead>
  <tbody>${items.map((x,i)=>{const size=Number(x.valveSize||extractValveSize(x.prosthesisSize||x.kit))||0;const category=x.valveSizeCategory||classifyValveSize(size)||'-';const expansion=x.valveExpansion||inferValveExpansion(x.valveBrand,x.valveModel)||'-';return `<tr><td>${i+1}</td><td>${safe(x.number||'-')}</td><td>${fmtDate(x.date)}</td><td>${safe(x.patient)}</td><td>${safe(hospitalName(x.hospitalId))}</td><td>${safe(professionalName(x.doctorId))}</td><td>${safe(insurerName(x.insurerId))}</td><td>${safe(x.position||'-')}</td><td>${safe([x.valveBrand,x.valveModel].filter(Boolean).join(' ')||'-')}</td><td>${size?`${String(size).replace('.',',')} mm`:safe(x.prosthesisSize||x.kit||'-')}</td><td>${safe(category)}</td><td>${safe(expansion)}</td><td>${safe(x.status||'-')}</td></tr>`;}).join('')}</tbody></table></article>`;
}

function generateReport(){
  const t=$('reportType').value,id=$('reportEntity').value;let out='';
  if(t==='professional-one')out=professionalReport(db.professionals.find(x=>x.id===id));
  if(t==='professionals-all')out=customizableListReport('professionals',db.professionals,'Lista Geral de Profissionais');
  if(t==='hospital-one')out=hospitalReport(db.hospitals.find(x=>x.id===id));
  if(t==='hospitals-all')out=customizableListReport('hospitals',db.hospitals,'Lista Geral de Hospitais');
  if(t==='insurer-one')out=insurerReport(db.insurers.find(x=>x.id===id));
  if(t==='insurers-all')out=customizableListReport('insurers',db.insurers,'Lista Geral de Convênios e Operadoras');if(t==='procedure-one')out=procedureReport(db.procedures.find(x=>x.id===id));if(t==='procedures-all')out=customizableListReport('procedures',filteredProcedures(),'Lista Geral de Procedimentos');if(t==='valve-analytics')out=valveAnalyticsReport();
  $('reportPreview').innerHTML=out||'<div class="empty">Nenhum registro encontrado.</div>'
}
function openReport(type,id=''){go('relatorios');$('reportType').value=type;configureReportEntities();if(id)$('reportEntity').value=id;generateReport()}

function mapLegacy(raw){
  const result={professionals:[],hospitals:[],insurers:[],procedures:[],visits:[],farol:[],forecasts:[],mix:[],materials:[]};
  const hospitalMap=new Map();
  (raw.hospitais||raw.hospitals||[]).forEach(x=>{const h={id:x.id||uid(),name:x.nome||x.name||'',cnpj:x.cnpj||'',chief:x.chefe||x.serviceChief||'',network:x.rede||x.network||'',city:x.cidade||x.city||'',state:x.uf||x.state||'RJ',region:x.regiao||x.region||'',insurerId:x.convenio||x.insurerId||'',serviceStatus:x.statusServico||x.serviceStatus||'',taviMarket:x.taviMarket||'',stentMarket:x.stentMarket||'',farol:+(x.farol||x.farolScore||0),recommendedAction:x.acao||x.recommendedAction||'',source:'Migração'};if(h.name){result.hospitals.push(h);hospitalMap.set(norm(h.name),h.id)}});
  (raw.medicos||raw.doctors||[]).forEach(x=>{const hospitalId=x.hospital||x.hospitalId||hospitalMap.get(norm(x.prestador||''))||'';result.professionals.push({id:x.id||uid(),name:x.nome||x.name||'',category:'Médico',cpf:x.cpf||'',register:x.crm?`CRM ${x.crm}${x.uf?'/'+x.uf:''}`:x.register||'',specialty:x.esp||x.specialty||'',hospitalId,phone:x.tel||x.phone||'',email:x.email||'',birth:x.nasc||x.birthDate||'',tavi:+(x.tavi||0),mitral:+(x.mitral||0),tricuspid:+(x.tricuspide||0),history:x.historico||'',source:'Migração'})});
  (raw.profissionais||raw.professionals||[]).forEach(x=>result.professionals.push({id:x.id||uid(),name:x.nome||x.name||'',category:x.categoria||x.category||'Profissional',cpf:x.cpf||'',register:x.registro||x.register||'',specialty:x.funcao||x.specialty||'',hospitalId:x.hospital||x.hospitalId||'',phone:x.telefone||x.phone||'',email:x.email||'',birth:x.nascimento||x.birth||'',tavi:+(x.tavi||0),mitral:+(x.mitral||0),tricuspid:+(x.tricuspide||x.tricuspid||0),history:x.historico||x.history||'',source:'Migração'}));
  (raw.convenios||raw.insurers||[]).forEach(x=>result.insurers.push({id:x.id||uid(),name:x.nome||x.name||'',legalName:x.razao||x.legalName||'',cnpj:x.cnpj||'',ans:x.ans||'',contact:x.contato||x.contact||'',role:x.setor||x.role||'',phone:x.telefone||x.phone||'',email:x.email||'',portal:x.portal||'',dso:+(x.prazo||x.dso||0),farol:+(x.farol||0),status:x.status||'Ativo',notes:x.observacoes||x.notes||'',source:'Migração'}));
  (raw.procedimentos||raw.procedures||[]).forEach(x=>result.procedures.push({id:x.id||uid(),number:x.numero||x.caseNumber||'',patient:x.paciente||x.patientName||x.nome||'',doctorId:x.medico||x.doctorId||'',hospitalId:x.hospital||x.hospitalId||'',insurerId:x.convenio||x.insurerId||'',date:x.data||String(x.dateTime||'').slice(0,10),time:x.hora||String(x.dateTime||'').slice(11,16),position:x.posicao||x.position||'Aórtica',proctor:x.proctor||'',kit:x.kit||x.kitMyval||'',sos:x.sos===true?'Sim':x.sos||'Não',status:x.status||'Em planejamento',notes:x.descricao||x.conclusao||x.notes||''}));
  result.visits=raw.visitas||raw.visits||[];result.farol=raw.farol||[];result.forecasts=raw.forecasts||[];result.mix=raw.mix||[];result.materials=raw.materiais||raw.materials||[];
  return result
}
function mergeCollection(target,source,matcher){
  let created=0,updated=0,ignored=0;
  source.forEach(s=>{if(!s.name&&matcher!=='id'){ignored++;return}const existing=matcher==='name'?findByName(target,s.name):target.find(x=>String(x.id)===String(s.id));if(existing){mergeMissing(existing,s,false);updated++}else{target.push({...s,id:s.id||uid()});created++}});
  return{created,updated,ignored}
}
function migrateLegacy(force=false){
  if(db.meta.legacyMigrated&&!force){updateMigrationStatus();return}
  let totals={created:0,updated:0,ignored:0},found=0;
  LEGACY_KEYS.forEach(key=>{const raw=localStorage.getItem(key);if(!raw)return;try{const mapped=mapLegacy(JSON.parse(raw));found++;for(const name of ['professionals','hospitals','insurers']){const r=mergeCollection(db[name],mapped[name],'name');totals.created+=r.created;totals.updated+=r.updated;totals.ignored+=r.ignored}for(const name of ['procedures','visits','farol','forecasts','mix','materials']){const r=mergeCollection(db[name],mapped[name],'id');totals.created+=r.created;totals.updated+=r.updated;totals.ignored+=r.ignored}}catch(e){console.error('Migration error',key,e)}});
  db.meta.legacyMigrated=true;db.migrationLog.push({date:new Date().toISOString(),type:'Migração legada',found,...totals});save();renderAll();updateMigrationStatus();logData(`Migração concluída: ${found} base(s), ${totals.created} novos e ${totals.updated} complementados.`)
}

function personNorm(value){
  return norm(String(value||'').replace(/^\s*(DR\.?|DRA\.?|DRª)\s*/i,''));
}
function findProfessionalLoose(name){
  const wanted=personNorm(name);
  return db.professionals.find(p=>personNorm(p.name)===wanted);
}
function validProfessionalName(name){
  const n=norm(name);
  return name && !['NA','SEMPROCTOR','XXX','NAO'].includes(n);
}
function ensureHospitalFromClinical(record){
  if(!record.hospital)return null;
  let hospital=findByName(db.hospitals,record.hospital);
  if(!hospital){
    hospital={id:uid(),name:record.hospital,cnpj:'',chief:'',network:'',city:record.city||'',
      state:record.state||'RJ',region:'',insurerId:'',serviceStatus:'',taviMarket:'',
      stentMarket:'',farol:50,recommendedAction:'',source:'Planilha de procedimentos 2026'};
    db.hospitals.push(hospital);
  }else{
    mergeMissing(hospital,{city:record.city||'',state:record.state||''},false);
  }
  return hospital;
}
function ensureInsurerFromClinical(record){
  if(!record.insurer)return null;
  let insurer=findByName(db.insurers,record.insurer);
  if(!insurer){
    insurer={id:uid(),name:record.insurer,legalName:'',cnpj:'',ans:'',contact:'',role:'',
      phone:'',email:'',portal:'',dso:30,farol:50,status:'Ativo',
      notes:'Importado da planilha de procedimentos.',source:'Planilha de procedimentos 2026'};
    db.insurers.push(insurer);
  }
  return insurer;
}
function ensureProfessionalFromClinical(name,hospitalId,category='Médico'){
  if(!validProfessionalName(name))return null;
  let professional=findProfessionalLoose(name);
  if(!professional){
    professional={id:uid(),name:name.trim(),category,cpf:'',register:'',specialty:'',
      hospitalId:hospitalId||'',phone:'',email:'',birth:'',tavi:0,mitral:0,tricuspid:0,
      history:'Importado da planilha de controle de procedimentos.',source:'Planilha de procedimentos 2026'};
    db.professionals.push(professional);
  }else if(!professional.hospitalId&&hospitalId){
    professional.hospitalId=hospitalId;
  }
  return professional;
}
function clinicalProcedureKey(p){
  return [norm(p.patient),p.date||'',norm(hospitalName(p.hospitalId))].join('|');
}
function importClinicalSeed(){
  const seed=window.CLINICAL_PROCEDURE_SEED;
  if(!seed)return alert('Base clínica não carregada.');
  const existingKeys=new Set(db.procedures.map(clinicalProcedureKey));
  let created=0,updated=0,ignored=0,newHospitals=0,newProfessionals=0,newInsurers=0;
  seed.procedures.forEach((record,index)=>{
    const beforeH=db.hospitals.length,beforeP=db.professionals.length,beforeI=db.insurers.length;
    const hospital=ensureHospitalFromClinical(record);
    const insurer=ensureInsurerFromClinical(record);
    const doctor1=ensureProfessionalFromClinical(record.doctor1,hospital?.id||'','Médico');
    const doctor2=ensureProfessionalFromClinical(record.doctor2,hospital?.id||'','Médico');
    const proctor=ensureProfessionalFromClinical(record.proctor,'','Médico');
    newHospitals+=db.hospitals.length-beforeH;newProfessionals+=db.professionals.length-beforeP;newInsurers+=db.insurers.length-beforeI;

    const procedure={
      id:uid(),number:String(db.procedures.length+created+1).padStart(4,'0'),
      patient:record.patient||'Paciente não informado',doctorId:doctor1?.id||'',
      secondDoctorId:doctor2?.id||'',hospitalId:hospital?.id||'',insurerId:insurer?.id||'',
      date:record.date||'',time:record.time||'',position:record.position||'Aórtica',
      proctor:proctor?.name||record.proctor||'',kit:record.prosthesisSize||'',sos:'Não',
      status:record.status||'Realizado',
      notes:[record.sourceSheet?`Origem: ${record.sourceSheet}`:'',record.complication?`Complicação/obs: ${record.complication}`:''].filter(Boolean).join('\n'),
      city:record.city||'',age:+record.age||0,accountExecutive:record.accountExecutive||'',
      clinicalType:record.type||'',diagnosis:record.diagnosis||'',access:record.access||'',
      accessType:record.accessType||'',guidewire:record.guidewire||'',preBalloon:record.preBalloon||'',
      prosthesisSize:record.prosthesisSize||'',postDilation:record.postDilation||'',
      complication:record.complication||'',mammothSize:record.mammothSize||'',
      report:record.report||'',crimper:record.crimper||'',source:'Planilha de procedimentos 2026',valveBrand:'',valveModel:'',valveExpansion:inferValveExpansion('',record.prosthesisSize||''),valveSize:extractValveSize(record.prosthesisSize||''),valveSizeCategory:classifyValveSize(extractValveSize(record.prosthesisSize||'')),valveProcedureFamily:(record.position||'').toUpperCase().includes('VIV')?'Valve-in-Valve':'TAVI nativa',valveGeneration:'',valveNotes:''
    };
    const key=[norm(procedure.patient),procedure.date||'',norm(record.hospital)].join('|');
    if(existingKeys.has(key)){
      const existing=db.procedures.find(p=>clinicalProcedureKey(p)===key);
      if(existing){mergeMissing(existing,procedure,false);updated++}else{ignored++}
    }else{
      db.procedures.push(procedure);existingKeys.add(key);created++;
    }
  });
  db.meta.clinicalImported=true;
  db.meta.clinicalImportAt=new Date().toISOString();
  db.migrationLog.push({date:new Date().toISOString(),type:'Base clínica 2022–2026',created,updated,ignored,newHospitals,newProfessionals,newInsurers});
  save();renderAll();updateClinicalSeedStatus();
  logData(`Base clínica integrada: ${created} procedimentos novos, ${updated} complementados, ${newHospitals} hospitais, ${newProfessionals} profissionais e ${newInsurers} convênios criados.`);
}
function previewClinicalSeed(){
  const meta=window.CLINICAL_PROCEDURE_SEED?.metadata;
  if(!meta)return logData('Base clínica indisponível.');
  logData(`Prévia clínica: ${meta.historicalCount} procedimentos realizados + ${meta.pendingCount} pendentes = ${meta.totalCount} registros pertinentes.`);
}
function updateClinicalSeedStatus(){
  const meta=window.CLINICAL_PROCEDURE_SEED?.metadata||{};
  if(!$('clinicalSeedStatus'))return;
  $('clinicalSeedStatus').innerHTML=db.meta.clinicalImported
    ? `<b>Base clínica incorporada.</b><br>Procedimentos na plataforma: ${db.procedures.length} · Última importação: ${new Date(db.meta.clinicalImportAt).toLocaleString('pt-BR')}`
    : `<b>Base pronta para integração.</b><br>${meta.historicalCount||0} realizados · ${meta.pendingCount||0} pendentes · ${meta.totalCount||0} registros selecionados.`;
}

function importFarolSeed(){
  const seed=window.FAROL_SEED;if(!seed)return alert('Base FAROL não carregada.');
  let totals={created:0,updated:0};
  seed.hospitals.forEach(s=>{let x=findByName(db.hospitals,s.name);if(x){mergeMissing(x,{...s,farol:x.farol||50},false);totals.updated++}else{db.hospitals.push({id:uid(),...s,farol:50,source:'Base FAROL'});totals.created++}});
  seed.doctors.forEach(s=>{let x=findByName(db.professionals,s.name);const hospital=findByName(db.hospitals,s.provider);const mapped={id:uid(),name:s.name,category:'Médico',cpf:'',register:'',specialty:s.specialty||'',hospitalId:hospital?.id||'',phone:s.phone||'',email:'',birth:'',tavi:0,mitral:0,tricuspid:0,history:`Prestador/equipe: ${s.provider||'-'}. Contato institucional: ${s.providerContact||'-'}.`,source:'Base FAROL'};if(x){mergeMissing(x,mapped,false);totals.updated++}else{db.professionals.push(mapped);totals.created++}});
  seed.operators.forEach(s=>{let x=findByName(db.insurers,s.name),c=s.contacts?.[0]||{},mapped={id:uid(),name:s.name,legalName:'',cnpj:'',ans:'',contact:c.name||'',role:c.role||'',phone:c.phone||s.supportPhone||'',email:c.email||s.supportEmail||'',portal:s.portal||'',dso:30,farol:50,status:'Ativo',notes:[s.notes,s.purpose,s.portalNotes].filter(Boolean).join('\n'),contacts:s.contacts||[],source:'Base FAROL'};if(x){mergeMissing(x,mapped,false);totals.updated++}else{db.insurers.push(mapped);totals.created++}});
  db.meta.farolImported=true;db.migrationLog.push({date:new Date().toISOString(),type:'Base FAROL',...totals});save();renderAll();updateSeedStatus();logData(`Base FAROL: ${totals.created} novos e ${totals.updated} complementados.`)
}
function previewFarol(){const s=window.FAROL_SEED;logData(`Prévia FAROL: ${s.hospitals.length} hospitais, ${s.doctors.length} médicos e ${s.operators.length} convênios/operadoras.`)}
function updateMigrationStatus(){$('migrationStatus').innerHTML=db.meta.legacyMigrated?`<b>Migração automática executada.</b><br>Profissionais: ${db.professionals.length} · Hospitais: ${db.hospitals.length} · Procedimentos: ${db.procedures.length}`:'Nenhuma migração executada.'}
function updateSeedStatus(){$('seedStatus').innerHTML=db.meta.farolImported?`<b>Base FAROL incorporada.</b><br>Hospitais: ${db.hospitals.length} · Profissionais: ${db.professionals.length} · Convênios: ${db.insurers.length}`:`Base disponível: ${window.FAROL_SEED?.hospitals?.length||0} hospitais, ${window.FAROL_SEED?.doctors?.length||0} médicos e ${window.FAROL_SEED?.operators?.length||0} operadoras.`}
function logData(msg){$('dataLog').innerHTML=`<div class="notice">${safe(msg)}</div>`}
function exportBackup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.download=`golden_structural_enterprise_backup_${nowISO()}.json`;a.click()}
$('backupInput').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const raw=JSON.parse(r.result);const mapped=raw.version===8?raw:mapLegacy(raw);if(raw.version===8)db=raw;else{for(const n of ['professionals','hospitals','insurers'])mergeCollection(db[n],mapped[n],'name');for(const n of ['procedures','visits','farol','forecasts','mix','materials'])mergeCollection(db[n],mapped[n],'id')}save();renderAll();logData('Backup importado e consolidado com sucesso.')}catch(err){alert('Arquivo inválido.')}};r.readAsText(f)}
function validateDatabase(){const issues=[];db.professionals.filter(x=>!x.name).forEach(()=>issues.push('Profissional sem nome'));db.hospitals.filter(x=>!x.name).forEach(()=>issues.push('Hospital sem nome'));db.procedures.filter(x=>!x.patient).forEach(()=>issues.push('Procedimento sem paciente'));logData(issues.length?`Foram encontrados ${issues.length} problema(s): ${issues.slice(0,5).join('; ')}`:'Integridade verificada: nenhuma inconsistência básica encontrada.')}
function resetEnterprise(){if(confirm('Apagar toda a base Enterprise? Faça backup antes.')){localStorage.removeItem(ENTERPRISE_KEY);db=blankDb();save();location.reload()}}

function renderAll(){renderReportTemplates();
  renderSelects();setDefaults();renderProfessionals();renderHospitals();renderInsurers();renderProcedures();renderVisits();renderFarol();renderForecast();renderDashboard();renderCalendar();renderVisitSuggestions();updateMigrationStatus();updateSeedStatus();updateClinicalSeedStatus()
}
migrateLegacy(false);renderAll();configureReportBuilder();
