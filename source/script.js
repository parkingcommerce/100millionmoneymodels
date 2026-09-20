/* SugarCube integration — Commodore Crossroads (matches the current website chrome) */
Config.history.maxStates = 40;
Config.saves.maxAutoSaves = 0;
Config.saves.isAllowed = function () { return false; };
Config.passages.nobr = true;
if (typeof UIBar !== 'undefined' && UIBar.destroy) { UIBar.destroy(); }

Object.defineProperty(window, 's', { configurable: true, get: function () { return State.variables; } });
var clockTimer = null;

/* Embedded PNGs (build-time) work in Twine Test/Play; relative paths fallback for GitHub Pages. */
setup.asset = function (rel) {
  if (/^(https?:|data:)/i.test(rel)) return rel;
  if (setup.images && setup.images[rel]) return setup.images[rel];
  var href = document.location.href.split('#')[0].split('?')[0];
  if (href.indexOf('/') >= 0) {
    var dir = href.slice(0, href.lastIndexOf('/') + 1);
    return dir + String(rel).replace(/^\//, '');
  }
  return rel;
};

setup.ending = function () {
  var s = State.variables;
  if (s.integrity <= -8) return { name: 'THE FALLEN COMMODORE', text: 'You secured attention, but your decisions became public. The offer disappears. Your final mission is rebuilding trust.' };
  if (s.career >= 16 && s.wellness <= 0) return { name: 'THE GOLDEN HANDCUFFS', text: 'You reach the top quickly. The salary is enormous. So is the emptiness in your calendar where your life used to be.' };
  if (s.integrity >= 15 && s.wellness >= 8 && s.career >= 8) return { name: 'SECRET ENDING: VANDERBILT LEGEND', text: 'You balance ambition, honesty, and humanity. You do not find a perfect future—you build a responsible one.' };
  if (s.offer === 'founder') return { name: 'THE UNEXPECTED FOUNDER', text: 'You reject the script and build your own organization. It is terrifying, unstable, and completely yours.' };
  if (s.offer === 'purpose') return { name: 'THE PURPOSEFUL COMMODORE', text: 'Your beginning is modest, but your work matches your values. Success grows more slowly—and more honestly.' };
  if (s.career >= 13) return { name: 'THE RISING STAR', text: 'Your ambition carries you into a powerful career. Whether it becomes freedom or another maze depends on what you do next.' };
  return { name: 'THE CROSSROADS ENDING', text: 'You graduate without every answer. For the first time, uncertainty feels less like failure and more like possibility.' };
};

setup.resetGame = function () {
  var v = State.variables;
  v.career = 0; v.integrity = 0; v.wellness = 0; v.days = 30;
  v.path = 'Undecided'; v.resume = 'none'; v.prepared = false;
  v.friend = false; v.favor = false; v.offer = 'none';
  v.startTime = Date.now(); v.elapsedFinal = null;
};

function beep() {
  try {
    var a = new (window.AudioContext || window.webkitAudioContext)();
    var o = a.createOscillator();
    var g = a.createGain();
    o.frequency.value = 520;
    g.gain.setValueAtTime(0.06, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.18);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.18);
  } catch (e) {}
}

function updateHUD() {
  var s = State.variables;
  var hud = document.getElementById('hud');
  if (!hud) return;
  var stats = [
    { name: 'Days', value: Math.max(0, s.days), max: 30, image: setup.asset('assets/images/days-clock.png'), alt: 'Vanderbilt clock', className: '' },
    { name: 'Career', value: s.career, max: 20, image: setup.asset('assets/images/career-chancellor.png'), alt: 'Vanderbilt chancellor', className: 'icon-career' },
    { name: 'Integrity', value: s.integrity, max: 20, image: setup.asset('assets/images/integrity-tower.png'), alt: 'Kirkland Hall tower', className: 'icon-integrity' },
    { name: 'Wellness', value: s.wellness, max: 20, image: setup.asset('assets/images/wellness-vumc.png'), alt: 'VUMC mark', className: 'icon-wellness' }
  ];
  hud.innerHTML = '<div class="stat brand"><div class="stat-head"><img class="hud-icon icon-student" src="' + setup.asset('assets/images/student-alex-hormozi.png') + '" alt="Student character"><span>Student</span></div><b>' + s.path + '</b></div>' + stats.map(function (o) {
    return '<div class="stat"><div class="stat-head"><img class="hud-icon ' + o.className + '" src="' + o.image + '" alt="' + o.alt + '"><span>' + o.name + '</span></div><b>' + o.value + '</b><div class="bar"><i style="width:' + Math.max(0, Math.min(100, (o.value / o.max) * 100)) + '%"></i></div></div>';
  }).join('');
}

function updateBackBtn() {
  var b = document.getElementById('backBtn');
  if (b) b.disabled = !(State.length > 1);
}

function wrapPassageCard() {
  var $passage = $('#passages > .passage');
  if (!$passage.length) return;
  if (!$passage.closest('section.card').length) {
    $passage.wrap('<section class="card card-wrap"></section>');
  }
}

function afterPassage(name) {
  startClock();
  if (name === 'graduation') {
    var card = document.querySelector('#stage .card, #stage .card-wrap');
    if (card) renderLeaderboardOptin(card);
  }
}

$(document).on(':storyready', function () {
  var logo = document.getElementById('vuLogo');
  if (logo) logo.src = setup.asset('assets/images/vanderbilt-star.png');
  updateHUD();
  initFeatures();
  var bb = document.getElementById('backBtn');
  if (bb) bb.addEventListener('click', openBackModal);
  updateBackBtn();
});

$(document).on(':passagestart', function () {
  if (State.length > 1) beep();
  wrapPassageCard();
  updateHUD();
  updateBackBtn();
});

$(document).on(':passagedisplay', function () {
  wrapPassageCard();
  updateHUD();
  updateBackBtn();
  afterPassage(passage());
  var stage = document.getElementById('stage');
  if (stage) stage.scrollTop = 0;
});

/* ===================== Community features (feedback, leaderboard, resources) ===================== */
/* Backend config: leave EMPTY for safe demo mode. Fill in after Supabase setup (see BACKEND_SETUP.md).
   The anon key is a PUBLIC browser key and is only safe when Row Level Security is enabled per BACKEND_SETUP.md.
   Never place service-role or other secret keys here. */
const BACKEND={url:'',anonKey:''};
const BACKEND_READY=!!(BACKEND.url&&BACKEND.anonKey);
const SCORE_MIN=-80,SCORE_MAX=100;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function scoreValue(){return s.career+s.integrity+s.wellness}

/* --- client-side moderation (best-effort; human moderation is authoritative) --- */
const BLOCKED=[/\bf+u+c+k+/i,/\bs+h+i+t+e?\b/i,/\bb+i+t+c+h+/i,/\basshole+/i,/\bc+u+n+t+/i,/\bb+a+s+t+a+r+d+/i,/\bp+i+s+s+e?d?\b/i,/\bd+a+m+n+\b/i,/\bdickhead\b/i,/\bn+i+g+g+/i,/\bf+a+g+g?o?t?/i,/\br+e+t+a+r+d+/i,/\bk+i+k+e+\b/i,/\bc+h+i+n+k+\b/i,/\btr+a+nn+y+/i,/\bkill (you|yourself|u|urself|them|him|her)\b/i,/\bkys\b/i,/\bi('?m| am| will| gonna| going to)? ?(kill|hurt|murder|stab|shoot|find) (you|u|him|her|them)\b/i,/\bshoot (up|you|them|it)\b/i,/\bgo (kill|die)\b/i,/\brape\b/i,/\bbomb (the|you|them|it)\b/i];
function moderateText(text,opt){var maxLen=(opt&&opt.maxLen)||280;var t=(text||'').trim();
 if(!t)return{ok:false,reason:'Please enter some text.'};
 if(t.length<3)return{ok:false,reason:'Please write a little more.'};
 if(t.length>maxLen)return{ok:false,reason:'Too long ('+t.length+'/'+maxLen+' characters).'};
 if(/[\w.+-]+@[\w-]+\.[\w.-]+/.test(t))return{ok:false,reason:'Please remove email addresses.'};
 if(/(?:\+?\d[\s().-]?){10,}/.test(t))return{ok:false,reason:'Please remove phone numbers.'};
 if(/\b\d{3}-?\d{2}-?\d{4}\b/.test(t))return{ok:false,reason:'Please remove ID or SSN-like numbers.'};
 if(/\b(student\s?id|vunet(?:\s?id)?|social security|ssn|passport)\b/i.test(t))return{ok:false,reason:'Please remove personal identifiers.'};
 for(var i=0;i<BLOCKED.length;i++){if(BLOCKED[i].test(t))return{ok:false,reason:'Please remove offensive, threatening, or harassing language.'}}
 return{ok:true,clean:t}}
function validName(name){var t=(name||'').trim();
 if(!t)return{ok:false,reason:'Enter a display name (or choose anonymous).'};
 if(t.length>24)return{ok:false,reason:'Display name is too long (max 24).'};
 if(!/^[\w .\-]{1,24}$/.test(t))return{ok:false,reason:'Use letters, numbers, spaces, . or - only.'};
 for(var i=0;i<BLOCKED.length;i++){if(BLOCKED[i].test(t))return{ok:false,reason:'Please choose a different display name.'}}
 return{ok:true,clean:t}}

function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function throttleOk(k,ms){return (Date.now()-(+lsGet(k)||0))>=ms}
function markThrottle(k){lsSet(k,Date.now())}
function hashStr(str){var h=0;for(var i=0;i<str.length;i++){h=(h*31+str.charCodeAt(i))|0}return String(h)}

async function api(path,opt){opt=opt||{};if(!BACKEND_READY)throw new Error('demo');
 var headers={'apikey':BACKEND.anonKey,'Authorization':'Bearer '+(opt.token||BACKEND.anonKey),'Content-Type':'application/json'};
 if(opt.method&&opt.method!=='GET')headers['Prefer']='return=representation';
 var res=await fetch(BACKEND.url+'/rest/v1/'+path,{method:opt.method||'GET',headers:headers,body:opt.body?JSON.stringify(opt.body):undefined});
 if(!res.ok)throw new Error('HTTP '+res.status);
 return res.status===204?null:res.json()}

const RESOURCES=[
 {id:'hJbwyN4ZoCg',title:'"Secrets to Optimal Client Service," With Jim Donovan',creator:'University of Virginia School of Law',type:'Lecture',desc:'A candid conversation on trust, communication, and delivering excellent professional service.'},
 {id:'H14bBuluwB8',title:'Grit: The Power of Passion and Perseverance',creator:'Angela Lee Duckworth · TED',type:'TED Talk',desc:'Why sustained passion and perseverance—more than talent—predict long-term achievement.'},
 {id:'8GQZuzIdeQQ',title:'How to make hard choices',creator:'Ruth Chang · TED',type:'TED Talk',desc:'A useful framework for deciding when no option is clearly better than another.'},
 {id:'iCvmsMzlF7o',title:'The Power of Vulnerability',creator:'Brené Brown · TED',type:'TED Talk',desc:'On courage, connection, and how embracing vulnerability builds resilience.'},
 {id:'Ks-_Mh1QhMc',title:'Your Body Language May Shape Who You Are',creator:'Amy Cuddy · TED',type:'TED Talk',desc:'How posture and presence can influence confidence before interviews and high-stakes moments.'},
 {id:'rrkrvAUbU9Y',title:'The puzzle of motivation',creator:'Dan Pink · TED',type:'TED Talk',desc:'What really motivates us—autonomy, mastery, and purpose over simple rewards.'},
 {id:'arj7oStGLkU',title:'Inside the Mind of a Master Procrastinator',creator:'Tim Urban · TED',type:'TED Talk',desc:'An honest, funny look at procrastination and managing deadlines in school and work.'},
 {id:'8KkKuTCFvzI',title:'What Makes a Good Life? Lessons from the Longest Study on Happiness',creator:'Robert Waldinger · TED',type:'TED Talk',desc:'Findings from a decades-long study on what truly sustains wellbeing over a lifetime.'},
 {id:'iKHTawgyKWQ',title:'Why you will fail to have a great career',creator:'Larry Smith · TEDxUW',type:'TEDx Talk',desc:'A provocative talk on the excuses that keep people from pursuing meaningful work.'},
 {id:'fLJsdqxnZb0',title:'The happy secret to better work',creator:'Shawn Achor · TED',type:'TED Talk',desc:'How a positive mindset improves performance, productivity, and resilience.'},
 {id:'qp0HIF3SfI4',title:'How Great Leaders Inspire Action',creator:'Simon Sinek · TED',type:'TED Talk',desc:'The “Start With Why” idea and how purpose drives leadership and influence.'}
];

function selectTab(tab){var tabs=[].slice.call(document.querySelectorAll('.tab'));tabs.forEach(function(t){var on=t===tab;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1});document.querySelectorAll('.tabpanel').forEach(function(p){p.classList.toggle('active',p.id===tab.getAttribute('aria-controls'))})}
function initTabs(){var tabs=[].slice.call(document.querySelectorAll('.tab'));tabs.forEach(function(tab){tab.addEventListener('click',function(){selectTab(tab)});tab.addEventListener('keydown',function(e){var i=tabs.indexOf(tab);if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();var n=tabs[(i+1)%tabs.length];selectTab(n);n.focus()}if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();var pr=tabs[(i-1+tabs.length)%tabs.length];selectTab(pr);pr.focus()}})})}

function wireReports(scope){(scope||document).querySelectorAll('.report-btn[data-table]').forEach(function(b){b.onclick=function(){reportItem(b.dataset.table,b.dataset.id,b)}})}
async function reportItem(table,id,btn){var reason=prompt('Report this item. Briefly, why? (harassment, personal info, spam, hate, threat, etc.)');if(reason===null)return;var m=(reason||'').slice(0,200);
 if(!BACKEND_READY){btn.textContent='Reported';btn.disabled=true;return}
 try{await api('reports',{method:'POST',body:{target_table:table,target_id:id,reason:m}});btn.textContent='Reported';btn.disabled=true}catch(e){btn.textContent='Report failed'}}

function fmtDate(iso){try{return new Date(iso).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}catch(e){return ''}}
function wireReacts(scope){(scope||document).querySelectorAll('.react-btn[data-id]').forEach(function(b){b.onclick=function(){reactItem(b.dataset.id,b)}})}
async function reactItem(id,btn){
 if(!BACKEND_READY){var row=SHAME_DEMO.filter(function(r){return r.id===id})[0];if(row)row.reactions=(Number(row.reactions)||0)+1;var rc=btn.querySelector('.rc');if(rc)rc.textContent=String((parseInt(rc.textContent||'0',10)||0)+1);btn.disabled=true;return}
 if(!throttleOk('react_'+id,4000))return;
 try{await api('rpc/react_feedback',{method:'POST',body:{p_id:id}});markThrottle('react_'+id);var rc=btn.querySelector('.rc');if(rc)rc.textContent=String((parseInt(rc.textContent||'0',10)||0)+1);btn.disabled=true}catch(e){}}
function shameItem(r){return '<div class="item"><div>'+esc(r.body)+'</div><div class="meta"><span class="who">'+(r.display_name?esc(r.display_name):'Anonymous Commodore')+' · '+esc(fmtDate(r.created_at))+'</span><span class="item-actions"><button class="react-btn" data-id="'+esc(r.id)+'" aria-label="React">▲ <span class="rc">'+(Number(r.reactions)||0)+'</span></button><button class="report-btn" data-table="feedback" data-id="'+esc(r.id)+'">Report</button></span></div></div>'}
var shameView='recent';
var SHAME_DEMO=[
 {id:'s1',display_name:'AnchorAda',body:'The dining halls close the second you finally leave lab.',created_at:'2026-09-16T18:00:00Z',reactions:12},
 {id:'s2',display_name:'GoldRush22',body:'Career Center appointments vanish faster than internship spots.',created_at:'2026-09-15T16:20:00Z',reactions:9},
 {id:'s3',display_name:'CommodoreK',body:'The squirrels have tenure. Students do not.',created_at:'2026-09-14T12:10:00Z',reactions:21},
 {id:'s4',display_name:'DoreDreamer',body:'West End traffic during graduation week is a boss battle.',created_at:'2026-09-13T21:05:00Z',reactions:7},
 {id:'s5',display_name:'VandyVoyager',body:'Rand wifi drops right when you hit submit.',created_at:'2026-09-12T09:40:00Z',reactions:16}
];
async function renderShamePanel(){var el=document.getElementById('panel-shame');if(!el)return;
 var head='<p class="panel-title">Hall of Shame</p><div class="seg"><button data-v="recent" aria-pressed="'+(shameView==='recent')+'">Recent</button><button data-v="reacted" aria-pressed="'+(shameView==='reacted')+'">Most Reacted</button></div>';
 var empty='<div class="item"><em>The Hall of Shame is empty—for now.</em></div>';
 function wire(){el.querySelectorAll('.seg button').forEach(function(b){b.onclick=function(){shameView=b.dataset.v;renderShamePanel()}});wireReports(el);wireReacts(el)}
 if(!BACKEND_READY){var rows=SHAME_DEMO.slice();if(shameView==='reacted')rows.sort(function(a,b){return (b.reactions||0)-(a.reactions||0)});else rows.sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at)});
  el.innerHTML=head+rows.map(shameItem).join('')+'<p class="note">Recent shows newest first. Most Reacted sorts by ▲ count.</p>';wire();return}
 el.innerHTML=head+'<div class="note">Loading…</div>';
 try{var order=shameView==='reacted'?'reactions.desc,created_at.desc':'created_at.desc';var rows=await api('feedback?status=eq.approved&order='+order+'&limit=50');
  el.innerHTML=head+(rows.length?rows.map(shameItem).join(''):empty)+'<p class="note">Moderated player ideas for improving Vanderbilt. Only approved responses are shown.</p>';wire()}
 catch(e){el.innerHTML=head+'<div class="item err">Could not load the Hall of Shame right now.</div>';wire()}}

var lbView='top';
var LB_DEMO=[
 {id:'l1',display_name:'AnchorAda',score:34,path:'Medicine & Research',doing_now:'NIH research fellow'},
 {id:'l2',display_name:'GoldRush22',score:31,path:'Finance & Consulting',doing_now:'Analyst in Nashville'},
 {id:'l3',display_name:'CommodoreK',score:28,path:'Law',doing_now:'Public-interest law clerk'},
 {id:'l4',display_name:'DoreDreamer',score:24,path:'Medicine & Research',doing_now:'Gap-year EMT'},
 {id:'l5',display_name:'VandyVoyager',score:19,path:'Finance & Consulting',doing_now:'Founder, campus startup'}
];
async function renderRankingsPanel(){var el=document.getElementById('panel-rankings');if(!el)return;
 var head='<p class="panel-title">Game Rankings</p><div class="seg"><button data-v="top" aria-pressed="'+(lbView==='top')+'">Top</button><button data-v="recent" aria-pressed="'+(lbView==='recent')+'">Recent</button></div>';
 var foot='<p class="note">Game scores only — rank · name · score · career path · what they’re doing now. Ranked by score; time is a tie-breaker.</p>';
 var empty='<div class="item"><em>No game rankings yet. Finish the game to add yours.</em></div>';
 function wire(){el.querySelectorAll('.seg button').forEach(function(b){b.onclick=function(){lbView=b.dataset.v;renderRankingsPanel()}});var d=document.getElementById('delReq');if(d)d.onclick=requestDeletionFlow;wireReports(el)}
 if(!BACKEND_READY){var rows=LB_DEMO.slice();if(lbView==='recent')rows.reverse();
  el.innerHTML=head+rows.map(function(r,i){return lbRow(r,lbView==='top'?i+1:null)}).join('')+'<p class="note">Top ranks by score. Recent shows newest first.</p>'+foot;wire();return}
 el.innerHTML=head+'<div class="note">Loading…</div>';
 try{var order=lbView==='top'?'score.desc,elapsed_ms.asc':'created_at.desc';var rows2=await api('leaderboard_public?status=eq.approved&order='+order+'&limit=25');
  el.innerHTML=head+(rows2.length?rows2.map(function(r,i){return lbRow(r,lbView==='top'?i+1:null)}).join(''):empty)+foot+'<button class="report-btn" id="delReq">Request deletion of my entry</button>';wire()}
 catch(e){el.innerHTML=head+'<div class="item err">Could not load rankings right now.</div>'+foot;wire()}}
function lbRow(r,rank){return '<div class="lb-row"><div class="lb-rank">'+(rank?('#'+rank):'•')+'</div><div class="lb-main"><div class="lb-name">'+esc(r.display_name)+'</div><div class="lb-sub">'+esc(r.path||'—')+(r.doing_now?' · '+esc(r.doing_now):'')+'</div></div><div class="lb-score">'+Number(r.score)+'</div><button class="report-btn" data-table="leaderboard" data-id="'+esc(r.id)+'">Report</button></div>'}
async function requestDeletionFlow(){var token=prompt('Paste the deletion code you saved when you joined the leaderboard:');if(!token)return;
 if(!BACKEND_READY){alert('Entry deletion is not available right now.');return}
 try{await api('rpc/request_leaderboard_deletion',{method:'POST',body:{p_token:token.trim()}});alert('If that code is valid, your entry has been removed.')}catch(e){alert('Could not process the request right now.')}}

function renderResourcesPanel(){var el=document.getElementById('panel-resources');if(!el)return;
 el.innerHTML='<p class="panel-title">Resources</p><p class="note">Talks on careers, decisions, resilience &amp; growth. Tap to play here, or open on YouTube.</p><div class="res-list">'+RESOURCES.map(resRow).join('')+'</div>';
 el.querySelectorAll('.res-row').forEach(function(b){b.addEventListener('click',function(){openResourceModal(b.dataset.id,b.dataset.title)})})}
function resRow(r){var thumb='https://i.ytimg.com/vi/'+encodeURIComponent(r.id)+'/mqdefault.jpg';
 return '<button class="res-row" type="button" data-id="'+esc(r.id)+'" data-title="'+esc(r.title)+'"><img class="res-thumb" src="'+thumb+'" alt="" loading="lazy"><span class="res-info"><span class="res-title">'+esc(r.title)+'</span><span class="res-creator">'+esc(r.creator)+'</span></span></button>'}
function openResourceModal(id,title){var ov=document.createElement('div');ov.className='mod-overlay';
 ov.innerHTML='<div class="mod-card"><button class="mod-close" aria-label="Close">×</button><h3 style="font-size:1.05rem;margin:0 0 8px">'+esc(title)+'</h3><div class="res-embed"><iframe src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?rel=0&modestbranding=1&autoplay=1" title="'+esc(title)+'" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div><a class="vu-btn gold" href="https://www.youtube.com/watch?v='+encodeURIComponent(id)+'" target="_blank" rel="noopener noreferrer nofollow">Open on YouTube ↗</a></div>';
 document.body.appendChild(ov);function close(){ov.remove()}
 ov.addEventListener('click',function(e){if(e.target===ov)close()});ov.querySelector('.mod-close').onclick=close;
 document.addEventListener('keydown',function k(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',k)}})}

function fmtClock(t){var m=Math.floor(t/60),sec=t%60;return (m<10?'0':'')+m+':'+(sec<10?'0':'')+sec}
function startClock(){
 if(clockTimer){clearInterval(clockTimer);clockTimer=null}
 var el=document.querySelector('#stage .clock');if(!el)return;
 var parts=(el.textContent||'').trim().split(':').map(function(n){return parseInt(n,10)||0});
 var total=parts.length===2?parts[0]*60+parts[1]:parts[0];
 if(!(total>0))return;
 el.setAttribute('aria-live','polite');el.classList.remove('pulse','clock-done');
 el.textContent=fmtClock(total);
 clockTimer=setInterval(function(){
  total--;
  if(total<=0){el.textContent=fmtClock(0);el.classList.add('pulse','clock-done');clearInterval(clockTimer);clockTimer=null;return}
  el.textContent=fmtClock(total)
 },1000);
}

function renderLeaderboardOptin(card){if(card.querySelector('.lb-optin'))return;
 var score=scoreValue();if(State.variables.elapsedFinal==null)State.variables.elapsedFinal=Date.now()-State.variables.startTime;var secs=Math.max(0,Math.round(State.variables.elapsedFinal/1000));
 var div=document.createElement('div');div.className='lb-optin';
 div.innerHTML='<h3>Join the Game Rankings <span class="note" style="font-weight:400;display:inline">(optional)</span></h3>'+
  '<p class="note">Participation is optional and requires your consent. We never collect emails, student IDs, exact locations, or legal names. You can keep playing without joining.</p>'+
  '<div class="field"><label>Your score (auto)</label><div class="lb-score">'+score+' <span class="note" style="display:inline">Career '+s.career+' · Integrity '+s.integrity+' · Wellness '+s.wellness+' · Path: '+esc(s.path)+' · Time '+secs+'s</span></div></div>'+
  '<div class="field"><label for="lbName">Display name<span class="counter" id="lbNameCount">0/24</span></label><input type="text" id="lbName" maxlength="24" placeholder="e.g., AnchorDown24"></div>'+
  '<div class="field"><label for="lbDoing">What are you doing now?<span class="counter" id="lbDoingCount">0/140</span></label><textarea id="lbDoing" maxlength="140" rows="2" placeholder="e.g., Exploring nonprofit fellowships"></textarea></div>'+
  '<label class="consent"><input type="checkbox" id="lbConsent"><span>I consent to publicly display my display name, score, career path, and answer after moderation. I understand no email, ID, or legal name is collected.</span></label>'+
  '<button class="vu-btn" id="lbSubmit" type="button" disabled>Submit to Game Rankings</button>'+
  '<div class="form-msg" id="lbMsg" hidden></div>';
 card.appendChild(div);
 var name=div.querySelector('#lbName'),doing=div.querySelector('#lbDoing'),consent=div.querySelector('#lbConsent'),btn=div.querySelector('#lbSubmit'),msg=div.querySelector('#lbMsg');
 name.addEventListener('input',function(){div.querySelector('#lbNameCount').textContent=name.value.length+'/24'});
 doing.addEventListener('input',function(){div.querySelector('#lbDoingCount').textContent=doing.value.length+'/140'});
 consent.addEventListener('change',function(){btn.disabled=!consent.checked});
 btn.addEventListener('click',async function(){msg.hidden=false;msg.className='form-msg';
  var v=validName(name.value);if(!v.ok){msg.className='form-msg err';msg.textContent=v.reason;return}
  var doingClean='';if(doing.value.trim()){var dm=moderateText(doing.value,{maxLen:140});if(!dm.ok){msg.className='form-msg err';msg.textContent=dm.reason;return}doingClean=dm.clean}
  if(!(score>=SCORE_MIN&&score<=SCORE_MAX)){msg.className='form-msg err';msg.textContent='Score failed integrity validation.';return}
  if(!throttleOk('lb_last',60000)){msg.className='form-msg err';msg.textContent='Please wait a moment before submitting again.';return}
  var token=Math.random().toString(36).slice(2)+Date.now().toString(36);
  if(!BACKEND_READY){msg.className='form-msg err';msg.innerHTML='Not stored: the secure backend is not configured yet (missing BACKEND.url and BACKEND.anonKey — see BACKEND_SETUP.md). Your entry passed validation but was not saved.';return}
  btn.disabled=true;
  try{await api('leaderboard',{method:'POST',body:{display_name:v.clean,score:score,path:s.path,doing_now:doingClean,elapsed_ms:State.variables.elapsedFinal,delete_token:token,status:'pending'}});markThrottle('lb_last');lsSet('lb_delete_token',token);
   msg.className='form-msg ok';msg.innerHTML='Submitted for moderation. <strong>Save this deletion code</strong> to remove your entry later: <code>'+esc(token)+'</code>';renderRankingsPanel()}
  catch(e){msg.className='form-msg err';msg.textContent='Submission failed. Please try again later.';btn.disabled=false}
 });
}

var adminToken=null;
async function authLogin(email,password){var res=await fetch(BACKEND.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'apikey':BACKEND.anonKey,'Content-Type':'application/json'},body:JSON.stringify({email:email,password:password})});if(!res.ok)throw new Error('login');return (await res.json()).access_token}
function initModeration(){var panel=document.getElementById('modPanel');
 if(location.hash!=='#moderation'){if(panel)panel.remove();return}
 if(panel)return;
 panel=document.createElement('div');panel.id='modPanel';panel.className='mod-overlay';
 panel.innerHTML='<div class="mod-card"><button class="mod-close" id="modClose" aria-label="Close moderation">×</button><h3>Moderation Queue</h3><div id="modBody"></div></div>';
 document.body.appendChild(panel);
 document.getElementById('modClose').onclick=function(){location.hash='';panel.remove()};
 var body=document.getElementById('modBody');
 if(!BACKEND_READY){body.innerHTML='<p class="note">Backend not configured. Connect Supabase and sign in as an administrator to moderate submissions. See BACKEND_SETUP.md.</p>';return}
 body.innerHTML='<p class="note">Sign in with an administrator account. Credentials are used only to obtain a session token and are never stored or committed.</p><div class="field"><label for="modEmail">Admin email</label><input type="text" id="modEmail" autocomplete="username"></div><div class="field"><label for="modPass">Password</label><input type="password" id="modPass" autocomplete="current-password"></div><button class="vu-btn" id="modLogin" type="button">Sign in</button><div class="form-msg" id="modMsg" hidden></div>';
 document.getElementById('modLogin').onclick=async function(){var msg=document.getElementById('modMsg');msg.hidden=false;msg.className='form-msg';msg.textContent='Signing in…';try{adminToken=await authLogin(document.getElementById('modEmail').value.trim(),document.getElementById('modPass').value);loadQueue()}catch(e){msg.className='form-msg err';msg.textContent='Sign-in failed. Check credentials and admin privileges.'}};
}
async function loadQueue(){var body=document.getElementById('modBody');body.innerHTML='<p class="note">Loading moderation queue…</p>';
 try{var fb=await api('feedback?status=eq.pending&order=created_at.asc&limit=100',{token:adminToken});var lb=await api('leaderboard?status=eq.pending&order=created_at.asc&limit=100',{token:adminToken});
  body.innerHTML='<h4>Feedback ('+fb.length+' pending)</h4>'+(fb.map(function(r){return modItem('feedback',r,(r.display_name?('['+r.display_name+'] '):'[Anonymous] ')+r.body)}).join('')||'<p class="note">None.</p>')+'<h4>Leaderboard ('+lb.length+' pending)</h4>'+(lb.map(function(r){return modItem('leaderboard',r,r.display_name+' — score '+r.score+(r.doing_now?' — '+r.doing_now:''))}).join('')||'<p class="note">None.</p>');
  body.querySelectorAll('[data-act]').forEach(function(b){b.onclick=function(){setStatus(b.dataset.table,b.dataset.id,b.dataset.act)}})}
 catch(e){body.innerHTML='<p class="form-msg err">Could not load the queue. Ensure your account has admin privileges (profiles.is_admin = true).</p>'}}
function modItem(table,r,text){return '<div class="item"><div>'+esc(text)+'</div><div class="meta"><span>'+esc(table)+'</span><span><button class="vu-btn gold" data-table="'+table+'" data-id="'+esc(r.id)+'" data-act="approved">Approve</button> <button class="vu-btn ghost" data-table="'+table+'" data-id="'+esc(r.id)+'" data-act="rejected">Reject</button></span></div></div>'}
async function setStatus(table,id,status){try{await api(table+'?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{status:status},token:adminToken});loadQueue()}catch(e){alert('Update failed.')}}

function galleryPaths(){return [setup.asset('assets/images/gallery-1.png'),setup.asset('assets/images/gallery-2.png'),setup.asset('assets/images/gallery-3.png')];}
function initGallery(el){if(!el||el.dataset.init)return;el.dataset.init='1';el.classList.add('gallery');
 var slides=galleryPaths();var i=0;var img=document.createElement('img');img.className='gal-img';img.alt='Commodore Crossroads gallery';img.src=slides[0];el.appendChild(img);
 if(slides.length<2)return;
 setInterval(function(){i=(i+1)%slides.length;img.style.opacity='0';setTimeout(function(){img.src=slides[i];img.style.opacity='1'},260)},3500)}
function galleryPhotos(){return [
 {src:setup.asset('assets/images/gallery-1.png'),cap:'Downtown crew'},
 {src:setup.asset('assets/images/integrity-tower.png'),cap:'Kirkland Hall'},
 {src:setup.asset('assets/images/wellness-vumc.png'),cap:'VUMC'},
 {src:setup.asset('assets/images/career-chancellor.png'),cap:'Leadership'},
 {src:setup.asset('assets/images/gallery-2.png'),cap:'On the road'},
 {src:setup.asset('assets/images/gallery-3.png'),cap:'GTA 6'},
 {src:setup.asset('assets/images/vanderbilt-star.png'),cap:'Commodore star'}
];}
function renderGallery(){var el=document.getElementById('galleryCard');if(!el)return;
 var photos=galleryPhotos();
 el.innerHTML='<p class="panel-title">Gallery</p><div class="gallery" id="galCarousel"></div><div class="gal-grid">'+photos.map(function(p,i){return '<button class="gal-thumb" type="button" data-i="'+i+'" aria-label="View '+esc(p.cap)+'"><img src="'+esc(p.src)+'" alt="'+esc(p.cap)+'" loading="lazy"></button>'}).join('')+'</div><button class="vu-btn gold" id="upBtn" type="button">Upload Your Favorite Vanderbilt Picture</button><div id="upWrap" hidden></div>';
 initGallery(el.querySelector('#galCarousel'));
 el.querySelectorAll('.gal-thumb').forEach(function(b){b.onclick=function(){openImageModal(photos[+b.dataset.i])}});
 el.querySelector('#upBtn').onclick=function(){toggleUpload(el.querySelector('#upWrap'))}}
function openImageModal(p){var ov=document.createElement('div');ov.className='mod-overlay';ov.innerHTML='<div class="mod-card"><button class="mod-close" aria-label="Close">×</button><img src="'+esc(p.src)+'" alt="'+esc(p.cap)+'"><p class="note" style="text-align:center;margin:8px 0 0">'+esc(p.cap)+'</p></div>';document.body.appendChild(ov);function close(){ov.remove()}ov.addEventListener('click',function(e){if(e.target===ov)close()});ov.querySelector('.mod-close').onclick=close}
function toggleUpload(w){if(!w)return;
 if(w.dataset.open){w.dataset.open='';w.hidden=true;w.innerHTML='';return}
 w.dataset.open='1';w.hidden=false;
 w.innerHTML='<div class="up-form"><p class="note">Uploads are moderated and are <strong>not published automatically</strong>. Until secure storage is configured, nothing is uploaded or stored — your image stays in your browser only.</p><input type="file" id="upFile" accept="image/png,image/jpeg,image/webp,image/gif"><div id="upPreview" class="up-preview" hidden></div><label class="consent"><input type="checkbox" id="upOwn"> I confirm I own this image or have permission to share it, and it contains no private information.</label><button class="vu-btn" id="upSubmit" type="button" disabled>Submit for moderation</button><div class="form-msg" id="upMsg" hidden></div></div>';
 var file=w.querySelector('#upFile'),prev=w.querySelector('#upPreview'),own=w.querySelector('#upOwn'),sub=w.querySelector('#upSubmit'),msg=w.querySelector('#upMsg');var okFile=false;
 function updSub(){sub.disabled=!(okFile&&own.checked)}
 file.addEventListener('change',function(){msg.hidden=true;prev.hidden=true;prev.innerHTML='';okFile=false;updSub();
  var f=file.files&&file.files[0];if(!f)return;
  if(['image/png','image/jpeg','image/webp','image/gif'].indexOf(f.type)<0){msg.hidden=false;msg.className='form-msg err';msg.textContent='Unsupported format. Use PNG, JPG, WEBP, or GIF.';return}
  if(f.size>5*1024*1024){msg.hidden=false;msg.className='form-msg err';msg.textContent='File too large (max 5 MB).';return}
  var url=URL.createObjectURL(f);prev.hidden=false;prev.innerHTML='<img src="'+url+'" alt="Preview of your image">';okFile=true;updSub()});
 own.addEventListener('change',updSub);
 sub.addEventListener('click',function(){if(!(okFile&&own.checked))return;msg.hidden=false;msg.className='form-msg err';msg.innerHTML='Not stored: secure image storage is not configured yet (see BACKEND_SETUP.md). Your image passed format &amp; size checks but was not uploaded.';sub.disabled=true})}

function initSectionTabs(){var tabs=[].slice.call(document.querySelectorAll('.sec-tab'));if(!tabs.length)return;
 function show(id){document.querySelectorAll('.app-grid .col').forEach(function(c){c.classList.toggle('active',c.id===id)});tabs.forEach(function(t){t.setAttribute('aria-selected',t.dataset.sec===id?'true':'false')})}
 tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.sec)})});show('secGame')}

function openBackModal(){if(State.length<2)return;
 var ov=document.createElement('div');ov.className='mod-overlay';ov.id='backModal';
 ov.innerHTML='<div class="mod-card"><button class="mod-close" aria-label="Close">×</button>'+
  '<h3 style="margin:0 0 6px">Before You Go Back…</h3>'+
  '<p class="note" style="margin:0 0 10px">Say one <span style="font-size:2.6rem;font-weight:800;color:#7a2417;letter-spacing:.01em;line-height:1;display:inline-block;vertical-align:middle">Bad</span> thing about Vanderbilt to go back.</p>'+
  '<div class="field"><label for="bkText">One bad thing about Vanderbilt<span class="counter" id="bkCount">0/200</span></label><textarea id="bkText" maxlength="200" rows="3" placeholder="One bad thing about Vanderbilt…"></textarea></div>'+
  '<div class="res-actions" style="margin-top:10px"><button class="vu-btn" id="bkContinue" type="button" disabled>Submit &amp; Shame</button></div></div>';
 document.body.appendChild(ov);
 var text=ov.querySelector('#bkText'),cnt=ov.querySelector('#bkCount'),go=ov.querySelector('#bkContinue');
 function close(){ov.remove()}
 function unlock(){close();Engine.backward()}
 ov.querySelector('.mod-close').onclick=close;
 text.addEventListener('input',function(){cnt.textContent=text.value.length+'/200';go.disabled=text.value.trim().length<3});
 text.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!go.disabled){e.preventDefault();unlock()}});
 go.addEventListener('click',unlock);
 setTimeout(function(){text.focus()},30);}

var IMMERSION_VIDEO='BQrxsyGTztM';
function initSound(){var btn=document.getElementById('soundBtn');if(!btn)return;
 var host=document.createElement('div');host.id='bgAudioHost';host.setAttribute('aria-hidden','true');
 host.style.cssText='position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none';
 document.body.appendChild(host);
 var label=btn.querySelector('.sfx-label');var on=false;
 btn.addEventListener('click',function(){on=!on;
  if(on){
   host.innerHTML='<iframe id="bgAudioFrame" width="200" height="120" src="https://www.youtube.com/embed/'+IMMERSION_VIDEO+'?autoplay=1&loop=1&playlist='+IMMERSION_VIDEO+'&controls=0&modestbranding=1&playsinline=1&rel=0" title="Immersion Sounds Experience" allow="autoplay" frameborder="0"></iframe>';
   btn.classList.add('on');btn.setAttribute('aria-pressed','true');if(label)label.textContent='Immersion Sounds: On';
  }else{
   host.innerHTML='';
   btn.classList.remove('on');btn.setAttribute('aria-pressed','false');if(label)label.textContent='Join Immersion Sounds';
  }
 });
}
function initFeatures(){initTabs();renderShamePanel();renderRankingsPanel();renderResourcesPanel();renderGallery();initSectionTabs();initSound();initModeration()}
window.addEventListener('hashchange',initModeration);
