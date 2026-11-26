/* UNSENSORY RESEARCH LAB · SENSORY DE-FREQ
   วาดบัตรผู้รับบริการ + ใบตรวจ จากข้อมูลจริงของเครื่อง PC (engine/intake_api.py → report())
   ใช้ร่วม 2 ที่: แฟ้มคัดกรองบน iPad (intake.html) และหน้าใบตรวจบนมือถือ (report.html)
   กติกา (25 พ.ย. ตามผู้ใช้): ค่าไหนเป็น null = ไม่ได้วัด → "ซ่อนแถว/ช่องนั้นไปเลย" ไม่เขียน "ไม่ได้วัด" ไม่ปล่อยโล่ง
         ห้ามเดา ห้ามเติมเลขตัวอย่าง · กราฟหลัก: มีคลื่นสมอง = ความนิ่งของสมอง · ไม่มี = จังหวะหัวใจ (ป้ายบอกตามจริง) */
(function(){
const SETS={baseline:{name:"BASELINE",th:"ตั้งศูนย์"},boost:{name:"BOOST",th:"ปลุกพลัง"},relax:{name:"RELAX",th:"ปล่อยวาง"}};
const COLOUR={baseline:"ฟ้า",boost:"ชมพูแดง",relax:"ฟ้าอมเขียว"};
const ROUTINE={relax:"เสียงต่ำช้าๆ 10 นาทีก่อนนอน",boost:"เดินกลางแดดอ่อน 10 นาที",baseline:"มองจุดเดียวนิ่งๆ 1 นาที"};
const SOUND={relax:"เสียงต่ำ ช้า ยาว",boost:"จังหวะที่เร็วขึ้นทีละนิด",baseline:"เสียงเรียบ นิ่ง"};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const thDate=iso=>{const d=iso?new Date(iso):new Date();return d.toLocaleDateString("th-TH",{day:"2-digit",month:"2-digit",year:"numeric"})};

function qrSvg(text,px){
  if(typeof qrcode!=="function"||!text)return "";
  const q=qrcode(0,"M");q.addData(text);q.make();const n=q.getModuleCount();let r="";
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(q.isDark(y,x))r+=`M${x},${y}h1v1h-1z`;
  return `<svg width="${px}" height="${px}" viewBox="-2 -2 ${n+4} ${n+4}" shape-rendering="crispEdges" style="background:#fff;display:block"><path d="${r}" fill="#121212"/></svg>`}

function barcode(txt){let x=0,r="",h=0;for(const ch of txt+"UNSENSORY"){h=(h*31+ch.charCodeAt(0))>>>0;for(let k=0;k<4;k++){const w=1+((h>>(k*3))&3),g=1+((h>>(k*3+2))&1);r+=`<rect x="${x}" y="0" width="${w}" height="34" fill="#121212"/>`;x+=w+g}}return `<svg class="barcode" viewBox="0 0 ${x} 34" preserveAspectRatio="none">${r}</svg>`}

/* ── ลายพิมพ์จากค่าจริง ── */
function smooth(v,k){const n=v.length;return v.map((_,i)=>{let a=0;for(let j=-k;j<=k;j++)a+=v[(i+j+n)%n];return a/(2*k+1)})}
function stats(v){const n=v.length,m=v.reduce((a,b)=>a+b,0)/n;return [m,Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/n)||1e-3]}
function brainPrint(v0){ // ความนิ่งของสมองตลอดรอบ → วงลายนิ้วมือ · แต่ละวง = ช่วงเวลาหนึ่งของรอบ · รูปทรง/มุม/ความรี มาจากค่าของคนนั้นเอง
  const raw=v0.filter(x=>x!=null);if(raw.length<6)return "";
  const v=smooth(raw,2),n=v.length,[mean,sd]=stats(v),[,sdr]=stats(raw),
        sq=.85+mean*.45,rot=(mean*11+sdr*17)%Math.PI,lobes=2+Math.round(sdr*10)%4;
  let d="";
  for(let k=0;k<9;k++){const pts=[],R0=4.5+k*4.1,off=Math.floor(k*n/9);
    for(let a=0;a<=120;a++){const t=a/120*Math.PI*2,i=(off+Math.floor(a/120*n))%n,
        r=R0+1.8*Math.tanh((v[i]-mean)/sd)+1.1*Math.sin(t*lobes+k*.7+mean*6)+.35*Math.sin(t*(lobes*3+1)+k),tt=t+rot;
      pts.push(`${(50+Math.cos(tt)*r*sq).toFixed(1)},${(50+Math.sin(tt)*r).toFixed(1)}`)}
    const seg=v.slice(off,off+Math.ceil(n/9)),sm=seg.reduce((a,b)=>a+b,0)/(seg.length||1);
    d+=`<polyline points="${pts.join(" ")}" fill="none" stroke="#121212" stroke-width="${sm>=mean?1.6:1}" stroke-dasharray="${sm<mean-sd*.5?"4 3":"none"}"/>`}
  return `<svg viewBox="0 0 100 100">${d}</svg>`}
function heartPrint(ibi0){ // ระยะห่างระหว่างการเต้นแต่ละครั้ง (ms) → 7 แถว · แต่ละแถว = ช่วงหนึ่งของรอบ · ระยะห่างยอด = จังหวะของคนนั้น · เส้นฐานลอยตามช่วงช้า/เร็ว
  const raw=ibi0.filter(x=>x>250&&x<2000);if(raw.length<8)return "";
  const v=smooth(raw,2),n=v.length,[mean,sd]=stats(v),[,sdr]=stats(raw),w0=Math.max(7,Math.min(24,(mean-350)/1000*30)),
        peak=3+Math.min(5,sdr/mean*18);           // จังหวะแปรผันมาก = ยอดสูง
  let d="";
  for(let k=0;k<7;k++){const y0=10+k*13,off=Math.floor(k*n/7),pts=[];let x=0,j=off;
    while(x<100){const z=Math.tanh((v[j%n]-mean)/sd),w=Math.max(5,w0*(1+.5*z)),y=y0+2.6*z;j++;
      if(!pts.length)pts.push(`0,${y.toFixed(1)}`);
      pts.push(`${(x+w*.15).toFixed(1)},${(y-peak).toFixed(1)}`,`${(x+w*.3).toFixed(1)},${(y+peak*.4).toFixed(1)}`,`${Math.min(100,x+w).toFixed(1)},${y.toFixed(1)}`);x+=w}
    d+=`<polyline points="${pts.join(" ")}" fill="none" stroke="#121212" stroke-width="1.3" stroke-linejoin="round"/>`}
  return `<svg viewBox="0 0 100 100">${d}</svg>`}
function blinkPrint(ts,dur){ // จังหวะกระพริบตาตลอดรอบ → ขีดบนเส้นเวลา 5 แถว
  const D=Math.max(dur||0,ts[ts.length-1]||1,60),row=D/5;let d="";
  for(let r=0;r<5;r++)d+=`<line x1="0" x2="100" y1="${14+r*18}" y2="${14+r*18}" stroke="#BDBFC2" stroke-width=".6"/>`;
  ts.forEach((t,i)=>{const r=Math.min(4,Math.floor(t/row)),x=(t-r*row)/row*98+1;d+=`<rect x="${x.toFixed(1)}" y="${(14+r*18-6).toFixed(1)}" width="1.6" height="${8+(i%3)*2}" fill="#121212"/>`});
  return `<svg viewBox="0 0 100 100">${d}</svg>`}
// ลายพิมพ์: ระหว่างรอนอน = กรอบ "รอเก็บ" ครบ 3 ช่อง · จบรอบแล้ว = แสดงเฉพาะลายที่วัดได้จริง (ไม่มีช่องว่าง)
function printList(m,waiting){
  const P=(m&&m.prints)||{},L=[];
  if(waiting)return [["","ลายสมอง"],["","ลายหัวใจ"],["","ลายกระพริบ"]].map(([_,l])=>[`<div>${l}<br>รอเก็บ</div>`,l]);
  if(P.brain&&P.brain.length>8)L.push([`<div>${brainPrint(P.brain)}</div>`,"สมอง"]);
  if(P.heart&&P.heart.length>8)L.push([`<div>${heartPrint(P.heart)}</div>`,m.heart_src==="signal"?"สัญญาณ":"หัวใจ"]);
  if(P.blink&&P.blink.length)L.push([`<div>${blinkPrint(P.blink,m.duration_s)}</div>`,"กระพริบตา"]);
  return L}
function prints(m,waiting,withFoot){
  const L=printList(m,waiting);if(!L.length)return "";
  const cols=`style="grid-template-columns:repeat(${L.length},minmax(0,${L.length<3?"32%":"1fr"}));justify-content:center"`;
  return `<div class="prints" ${cols}>${L.map(x=>x[0]).join("")}</div>`+(withFoot?`<div class="cardfoot" ${cols.replace("grid-template-columns","display:grid;grid-template-columns")}>${L.map(x=>`<span style="text-align:center">${x[1]}</span>`).join("")}</div>`:"")}

/* ── คลิปภาพ+เสียง 15 วิ จากรอบของคนนี้ (ช่วงที่เลือกจากกราฟของเขาเอง · engine/clip_pick.py) ──
   ไม่มี clip = ไม่แสดงหัวข้อนี้ · ยังไม่มี url = กำลังอัป · เกินวันหมดอายุ = บอกว่าหมดอายุ (cloud ลบแล้ว) */
function clipBox(c){
  if(!c||(!c.url&&!c.file))return "";        // รอบที่กดหยุด/ยังไม่ได้ตัดคลิป = ไม่มีไฟล์ → ไม่แสดงหัวข้อคลิปเลย
  const today=new Date().toISOString().slice(0,10),exp=c.expires||"";
  const ok=typeof c.url==="string"&&/^https:\/\//.test(c.url)&&!(exp&&exp<today);
  const body=ok
    ?`<video src="${esc(c.url)}" controls playsinline preload="metadata" style="width:min(240px,70vw);aspect-ratio:1;border-radius:50%;object-fit:cover;background:#000;display:block;margin:6px auto 0"></video>`
    :`<div style="width:min(240px,70vw);aspect-ratio:1;border-radius:50%;border:1px dashed #BDBFC2;display:grid;place-items:center;margin:6px auto 0;text-align:center;padding:24px;box-sizing:border-box"><span class="na">${exp&&exp<today?"คลิปหมดอายุแล้ว<br>(เก็บไว้ 14 วัน)":"กำลังเตรียมคลิป<br>ลองเปิดใหม่อีกสักครู่"}</span></div>`;
  const name=`SENSORY-DEFREQ-${(c.url||"").split("/").slice(-2,-1)[0]||"clip"}.mp4`.replace(/[^A-Za-z0-9._-]/g,"");
  const save=ok?`<a href="${esc(c.url)}?download=${esc(name)}" data-clip="${esc(c.url)}" data-name="${esc(name)}" onclick="return RV.saveClip(this,event)"
     style="display:block;width:max-content;margin:10px auto 0;background:#121212;color:#F4F4F2;text-decoration:none;padding:10px 20px;border-radius:2px;font:700 14px var(--h,system-ui)">บันทึกคลิป ↓</a>`:"";
  return `<h5>คลิปจากรอบของคุณ · 15 วินาที</h5>${body}${save}
   <div class="kicker" style="text-align:center;margin-top:6px">${esc(c.why||"")}</div>
   ${ok&&exp?`<div class="disc" style="text-align:center;margin-top:2px">ภาพและเสียงที่สร้างจากร่างกายในรอบนี้ (ไม่มีภาพใบหน้า) · ดูได้ถึง ${thDate(exp)}</div>`:""}`}

/* ── กราฟหลัก: ความนิ่งของสมอง (ช่วงที่วัดไม่ได้ = เว้นเส้น) · ไม่มีคลื่นสมอง → จังหวะหัวใจจากค่าจริง ── */
function hasCalm(c){return !!(c&&c.filter(v=>v!=null).length>=5)}
function heartGraph(ibi){ // ชีพจรทีละครั้งตลอดรอบ (bpm = 60000/ibi) เกลี่ยเบาๆ 5 ครั้ง
  const b=ibi.filter(v=>v>300&&v<2000).map(v=>60000/v);if(b.length<8)return "";
  const sm=b.map((_,i)=>{const w=b.slice(Math.max(0,i-2),i+3);return w.reduce((a,c)=>a+c,0)/w.length});
  const lo=Math.floor(Math.min(...sm)/5)*5-5,hi=Math.ceil(Math.max(...sm)/5)*5+5,n=sm.length;
  const pts=sm.map((v,k)=>`${(k/(n-1)*100).toFixed(1)},${(100-(v-lo)/(hi-lo)*90-5).toFixed(1)}`).join(" ");
  const tk=[0,1,2,3,4,5].map(i=>Math.round(hi-(hi-lo)*i/5));
  return `<div class="mug"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#121212" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg><div class="ticks">${tk.map(v=>`<span>${v}</span>`).join("")}</div></div>`}
function mainGraph(m){
  if(hasCalm(m.calm))return [calmGraph(m.calm),"ความนิ่งของสมองตลอดรอบ (%)"];
  const P=m.prints||{},h=P.heart&&P.heart.length>8?heartGraph(P.heart):"";
  return h?[h,m.heart_src==="signal"?"สัญญาณที่ได้รับตลอดรอบ (ครั้ง/นาที)":"จังหวะหัวใจตลอดรอบ (ครั้ง/นาที)"]:["",""]}
function calmGraph(c){
  const n=c.length,segs=[];let cur=[];
  c.forEach((v,k)=>{if(v==null){if(cur.length)segs.push(cur);cur=[]}else cur.push(`${(k/(n-1)*100).toFixed(1)},${(100-v*90-5).toFixed(1)}`)});if(cur.length)segs.push(cur);
  return `<div class="mug"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${segs.map(s=>`<polyline points="${s.join(" ")}" fill="none" stroke="#121212" stroke-width="1.4" vector-effect="non-scaling-stroke"/>`).join("")}</svg><div class="ticks">${[100,80,60,40,20,0].map(v=>`<span>${v}</span>`).join("")}</div></div>`}

function card(D,o){o=o||{};const S=D.set?SETS[D.set]:null,m=D.measured,waiting=!/^(done|aborted)$/.test(D.status);
  return `<div class="lanyard"><div class="strap"></div><div class="hook"></div><div class="card"><div class="slot"></div>
   <div class="foil"></div><div class="lockup">UNSENSORY RESEARCH LAB</div><div class="big" style="margin-top:6px">SENSORY<br>DE-FREQ</div><div class="th">PATIENT PASS · บัตรผู้รับบริการ</div>
   <dl><dt>ชื่อ</dt><dd>${esc(D.nick)}</dd><dt>HN</dt><dd style="font:500 16px var(--m);color:var(--ink);padding-top:6px">${esc(D.hn||"—")}</dd><dt>เตียง / รอบ</dt><dd>${D.bed} · ${esc((D.round||"").slice(2))}</dd><dt>เซ็ต</dt><dd${S?"":` style="color:var(--pencil)"`}>${S?S.name:"รอสรุปรอบ"}</dd></dl>
   ${prints(m,waiting,false)}
   ${barcode(D.code||"")}<div class="cardfoot"><span>${esc(D.code)}</span><span>${waiting?"ลายพิมพ์จะถูกเก็บระหว่างนอน":"เก็บลายพิมพ์แล้ว "+thDate(D.date)}</span></div></div></div>`}

function record(D,o){o=o||{};const S=SETS[D.set]||{name:"—",th:""},m=D.measured||{},b=D.before||{},p=D.post||null;
  const mono=v=>`<dd style="font:500 13px var(--m);color:var(--ink);padding-top:5px;text-align:right">${v}</dd>`,
        row=(ok,label,v)=>ok?`<dt>${label}</dt>${mono(v)}`:"";          // ไม่ได้วัด = ไม่แสดงแถวนั้น
  const d=p&&b.stress&&p.stress?b.stress-p.stress:null,mins=m.duration_s?Math.round(m.duration_s/60):0,
        overall=d!=null?(d>0?`คลายลง ${d} ระดับ`:d<0?`ตื่นตัวขึ้น ${-d} ระดับ`:"นิ่งเท่าเดิม"):mins?`พักครบ ${mins} นาที`:"";
  const sig=m.heart_src==="signal";   // เซนเซอร์หัวใจเตียงนี้ใช้ไม่ได้ → เรียกกว้างๆ ว่าสัญญาณที่ได้รับ (ไม่อ้างว่าเป็นหัวใจ)
  const vit=[row(m.bpm,sig?"สัญญาณที่ได้รับ เฉลี่ย / ต่ำสุด / สูงสุด":"ชีพจรเฉลี่ย / ต่ำสุด / สูงสุด",m.bpm&&`${m.bpm.avg} / ${m.bpm.min} / ${m.bpm.max} ${sig?"ครั้ง/นาที":"bpm"}`),
        row(m.alpha_hz,"คลื่นอัลฟาประจำตัว",`${m.alpha_hz} Hz`),row(m.synced!=null&&m.synced>0,"นิ่งพร้อมเพื่อนร่วมรอบ",`${m.synced} ครั้ง`),
        row(m.blinks!=null,"กระพริบตา",`${m.blinks} ครั้ง`),row(m.hrv_rmssd&&!sig,"HRV (RMSSD)",`${m.hrv_rmssd} ms`)].join("");
  const [graph,gLabel]=mainGraph(m),pr=prints(m,false,true);
  return `<div class="rec">
   <div class="lockup">UNSENSORY RESEARCH LAB</div><div class="num" style="margin-top:4px">SENSORY DE-FREQ · ${esc(D.code)} · ใบตรวจ</div><div class="big" style="margin-top:6px">NEURO-SENSORY<br>RECORD</div>
   <div class="grid"><dl><dt>ชื่อ</dt><dd>${esc(D.nick)}</dd><dt>HN</dt><dd style="font:500 13px var(--m);color:var(--ink);padding-top:5px">${esc(D.hn||"—")}</dd><dt>อายุ</dt><dd>${esc(D.age)}</dd><dt>เซ็ต</dt><dd>${S.name}</dd><dt>อาการที่มา</dt><dd style="font-size:15px">${esc((D.came_for||[]).join(", ")||"กำลังดี")}</dd></dl>
    ${graph}</div>
   ${gLabel?`<div class="kicker" style="margin-top:4px;text-align:right">${gLabel}</div>`:""}
   ${vit?`<h5>${sig?"สัญญาณที่วัดได้ระหว่างรอบ":"สัญญาณชีพ · วัดจริงระหว่างรอบ"}</h5><dl style="grid-template-columns:1fr auto">${vit}</dl>`:""}
   ${clipBox(m.clip)}
   ${pr?`<h5>ลายพิมพ์</h5>${pr}`:""}
   <div class="rx"><h6>ใบสั่งยา</h6>
    ${p&&p.word?`<div class="row2"><b>MOOD THERAPY</b><span>${esc(p.word)}</span></div>`:""}
    <div class="row2"><b>SOUND THERAPY</b><span>${m.alpha_hz?`อัลฟา ${m.alpha_hz} Hz`:SOUND[D.set]||"—"}</span></div>
    <div class="row2"><b>COLOUR THERAPY</b><span>${COLOUR[D.set]||"—"}</span></div>
    <div class="row2"><b>ROUTINE</b><span style="font-size:14px;text-align:right;max-width:200px">${ROUTINE[D.set]||"—"}</span></div>
    ${overall?`<div class="row2"><b>OVERALL DIAGNOSIS</b><span>${overall}</span></div>`:""}
    <div class="claim">ไม่ใช่ยา ไม่ใช่การวินิจฉัย เป็นส่วนหนึ่งของงานศิลปะ</div></div>
   <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px"><span class="stamp ok" style="font-size:15px">ตรวจแล้ว ${thDate(D.date)}</span>${o.url?qrSvg(o.url,64):""}</div>
   ${barcode(D.code||"")}
   <div class="disc">ใบนี้แสดงเฉพาะค่าที่วัดได้จริงในรอบของคุณ · ไม่ใช่เครื่องมือแพทย์ · ขอลบข้อมูลได้ภายใน 30 วันที่บูธหรือผ่านทีมงาน</div>
  </div>`}

/* บันทึกคลิป: มือถือที่แชร์ไฟล์ได้ → เปิดเมนูแชร์ (บันทึกลงรูปภาพ/ส่ง IG ได้) · ที่เหลือ → ดาวน์โหลดไฟล์ mp4 ตรงๆ */
async function saveClip(a,ev){
  if(!(navigator.share&&navigator.canShare))return true;
  ev.preventDefault();const old=a.textContent;a.textContent="กำลังเตรียมคลิป…";
  try{const blob=await (await fetch(a.dataset.clip)).blob(),f=new File([blob],a.dataset.name,{type:"video/mp4"});
    if(navigator.canShare({files:[f]}))await navigator.share({files:[f],title:"SENSORY DE-FREQ"});else location.href=a.href}
  catch(e){if(e&&e.name!=="AbortError")location.href=a.href}
  finally{a.textContent=old}
  return false}

window.RV={SETS,card,record,qrSvg,barcode,esc,thDate,saveClip};
})();
