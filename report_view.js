/* UNSENSORY RESEARCH LAB · SENSORY DE-FREQ
   วาดบัตรผู้รับบริการ + ใบตรวจ จากข้อมูลจริงของเครื่อง PC (engine/intake_api.py → report())
   ใช้ร่วม 2 ที่: แฟ้มคัดกรองบน iPad (intake.html) และหน้าใบตรวจบนมือถือ (report.html)
   กติกา: ค่าไหนเป็น null = ไม่ได้วัด → เขียนว่า "ไม่ได้วัด" เสมอ ไม่เดา ไม่เติมเลขตัวอย่าง */
(function(){
const SETS={baseline:{name:"BASELINE",th:"ตั้งศูนย์"},boost:{name:"BOOST",th:"ปลุกพลัง"},relax:{name:"RELAX",th:"ปล่อยวาง"}};
const COLOUR={baseline:"ฟ้า",boost:"ชมพูแดง",relax:"ฟ้าอมเขียว"};
const ROUTINE={relax:"เสียงต่ำช้าๆ 10 นาทีก่อนนอน",boost:"เดินกลางแดดอ่อน 10 นาที",baseline:"มองจุดเดียวนิ่งๆ 1 นาที"};
const SOUND={relax:"เสียงต่ำ ช้า ยาว",boost:"จังหวะที่เร็วขึ้นทีละนิด",baseline:"เสียงเรียบ นิ่ง"};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const NA=`<span class="na">ไม่ได้วัด</span>`;
const thDate=iso=>{const d=iso?new Date(iso):new Date();return d.toLocaleDateString("th-TH",{day:"2-digit",month:"2-digit",year:"numeric"})};

function qrSvg(text,px){
  if(typeof qrcode!=="function"||!text)return "";
  const q=qrcode(0,"M");q.addData(text);q.make();const n=q.getModuleCount();let r="";
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(q.isDark(y,x))r+=`M${x},${y}h1v1h-1z`;
  return `<svg width="${px}" height="${px}" viewBox="-2 -2 ${n+4} ${n+4}" shape-rendering="crispEdges" style="background:#fff;display:block"><path d="${r}" fill="#121212"/></svg>`}

function barcode(txt){let x=0,r="",h=0;for(const ch of txt+"UNSENSORY"){h=(h*31+ch.charCodeAt(0))>>>0;for(let k=0;k<4;k++){const w=1+((h>>(k*3))&3),g=1+((h>>(k*3+2))&1);r+=`<rect x="${x}" y="0" width="${w}" height="34" fill="#121212"/>`;x+=w+g}}return `<svg class="barcode" viewBox="0 0 ${x} 34" preserveAspectRatio="none">${r}</svg>`}

/* ── ลายพิมพ์จากค่าจริง ── */
function brainPrint(v){ // ความนิ่งของสมองตลอดรอบ → วงลายนิ้วมือ
  const n=v.length;let d="";
  for(let k=0;k<9;k++){const pts=[],R0=4+k*4.2;
    for(let a=0;a<=72;a++){const t=a/72*Math.PI*2,c=v[(a+k*5)%n],c2=v[(a*3+k)%n];
      const r=R0*(1+.22*(c-.5)+.08*(c2-.5)*Math.sin(t*3+k));pts.push(`${(50+Math.cos(t)*r*1.15).toFixed(1)},${(50+Math.sin(t)*r).toFixed(1)}`)}
    d+=`<polyline points="${pts.join(" ")}" fill="none" stroke="#121212" stroke-width="1.5" stroke-dasharray="${k%3===1?"5 3":"none"}"/>`}
  return `<svg viewBox="0 0 100 100">${d}</svg>`}
function heartPrint(ibi){ // ระยะห่างระหว่างการเต้นแต่ละครั้ง (ms) → 7 แถวคลื่นชีพจร
  let d="",j=0;
  for(let k=0;k<7;k++){const y0=10+k*13,pts=[`0,${y0}`];let x=0;
    while(x<100){const w=Math.max(6,Math.min(30,ibi[j%ibi.length]/1000*20));j++;
      pts.push(`${(x+w*.15).toFixed(1)},${(y0-6).toFixed(1)}`,`${(x+w*.3).toFixed(1)},${(y0+3).toFixed(1)}`,`${Math.min(100,x+w).toFixed(1)},${y0}`);x+=w}
    d+=`<polyline points="${pts.join(" ")}" fill="none" stroke="#121212" stroke-width="1.3" stroke-linejoin="round"/>`}
  return `<svg viewBox="0 0 100 100">${d}</svg>`}
function blinkPrint(ts,dur){ // จังหวะกระพริบตาตลอดรอบ → ขีดบนเส้นเวลา 5 แถว
  const D=Math.max(dur||0,ts[ts.length-1]||1,60),row=D/5;let d="";
  for(let r=0;r<5;r++)d+=`<line x1="0" x2="100" y1="${14+r*18}" y2="${14+r*18}" stroke="#BDBFC2" stroke-width=".6"/>`;
  ts.forEach((t,i)=>{const r=Math.min(4,Math.floor(t/row)),x=(t-r*row)/row*98+1;d+=`<rect x="${x.toFixed(1)}" y="${(14+r*18-6).toFixed(1)}" width="1.6" height="${8+(i%3)*2}" fill="#121212"/>`});
  return `<svg viewBox="0 0 100 100">${d}</svg>`}
function prints(m,waiting){
  const P=(m&&m.prints)||{},box=(svg,label)=>`<div>${svg||(waiting?`${label}<br>รอเก็บ`:`${label}<br>ไม่ได้วัด`)}</div>`;
  return `<div class="prints">${box(P.brain&&P.brain.length>8?brainPrint(P.brain):"","ลายสมอง")}${box(P.heart&&P.heart.length>8?heartPrint(P.heart):"","ลายหัวใจ")}${box(P.blink&&P.blink.length?blinkPrint(P.blink,m.duration_s):"","ลายกระพริบ")}</div>`}

/* ── กราฟความนิ่ง (ช่วงที่วัดไม่ได้ = เว้นเส้น) ── */
function calmGraph(c){
  if(!c||c.filter(v=>v!=null).length<5)return `<div class="mug" style="display:grid;place-items:center">${NA}</div>`;
  const n=c.length,segs=[];let cur=[];
  c.forEach((v,k)=>{if(v==null){if(cur.length)segs.push(cur);cur=[]}else cur.push(`${(k/(n-1)*100).toFixed(1)},${(100-v*90-5).toFixed(1)}`)});if(cur.length)segs.push(cur);
  return `<div class="mug"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${segs.map(s=>`<polyline points="${s.join(" ")}" fill="none" stroke="#121212" stroke-width="1.4" vector-effect="non-scaling-stroke"/>`).join("")}</svg><div class="ticks">${[100,80,60,40,20,0].map(v=>`<span>${v}</span>`).join("")}</div></div>`}

function card(D,o){o=o||{};const S=D.set?SETS[D.set]:null,m=D.measured,waiting=D.status!=="done";
  return `<div class="lanyard"><div class="strap"></div><div class="hook"></div><div class="card"><div class="slot"></div>
   <div class="foil"></div><div class="lockup">UNSENSORY RESEARCH LAB</div><div class="big" style="margin-top:6px">SENSORY<br>DE-FREQ</div><div class="th">PATIENT PASS · บัตรผู้รับบริการ</div>
   <dl><dt>ชื่อ</dt><dd>${esc(D.nick)}</dd><dt>HN</dt><dd style="font:500 16px var(--m);color:var(--ink);padding-top:6px">${esc(D.hn||"—")}</dd><dt>เตียง / รอบ</dt><dd>${D.bed} · ${esc((D.round||"").slice(2))}</dd><dt>เซ็ต</dt><dd${S?"":` style="color:var(--pencil)"`}>${S?S.name:"รอสรุปรอบ"}</dd></dl>
   ${prints(m,waiting)}
   ${barcode(D.code||"")}<div class="cardfoot"><span>${esc(D.code)}</span><span>${waiting?"ลายพิมพ์จะถูกเก็บระหว่างนอน":"เก็บลายพิมพ์แล้ว "+thDate(D.date)}</span></div></div></div>`}

function record(D,o){o=o||{};const S=SETS[D.set]||{name:"—",th:""},m=D.measured||{},b=D.before||{},p=D.post||null;
  const mono=v=>`<dd style="font:500 13px var(--m);color:var(--ink);padding-top:5px;text-align:right">${v}</dd>`,
        val=(ok,v)=>ok?mono(v):`<dd style="padding-top:5px;text-align:right">${NA}</dd>`;
  const d=p&&b.stress&&p.stress?b.stress-p.stress:null,
        overall=d==null?`<span class="na">รอบันทึกหลังจบรอบ</span>`:d>0?`คลายลง ${d} ระดับ`:d<0?`ตื่นตัวขึ้น ${-d} ระดับ`:"นิ่งเท่าเดิม";
  return `<div class="rec">
   <div class="lockup">UNSENSORY RESEARCH LAB</div><div class="num" style="margin-top:4px">SENSORY DE-FREQ · ${esc(D.code)} · ใบตรวจ</div><div class="big" style="margin-top:6px">NEURO-SENSORY<br>RECORD</div>
   <div class="grid"><dl><dt>ชื่อ</dt><dd>${esc(D.nick)}</dd><dt>HN</dt><dd style="font:500 13px var(--m);color:var(--ink);padding-top:5px">${esc(D.hn||"—")}</dd><dt>อายุ</dt><dd>${esc(D.age)}</dd><dt>เซ็ต</dt><dd>${S.name}</dd><dt>อาการที่มา</dt><dd style="font-size:15px">${esc((D.came_for||[]).join(", ")||"กำลังดี")}</dd></dl>
    ${calmGraph(m.calm)}</div>
   <div class="kicker" style="margin-top:4px;text-align:right">ความนิ่งของสมองตลอดรอบ (%)</div>
   <h5>สัญญาณชีพ · วัดจริงระหว่างรอบ</h5>
   <dl style="grid-template-columns:1fr auto"><dt>ชีพจรเฉลี่ย / ต่ำสุด / สูงสุด</dt>${val(m.bpm,m.bpm&&`${m.bpm.avg} / ${m.bpm.min} / ${m.bpm.max} bpm`)}
    <dt>คลื่นอัลฟาประจำตัว</dt>${val(m.alpha_hz,`${m.alpha_hz} Hz`)}
    <dt>นิ่งพร้อมเพื่อนร่วมรอบ</dt>${val(m.synced!=null,`${m.synced} ครั้ง`)}
    <dt>กระพริบตา</dt>${val(m.blinks!=null,`${m.blinks} ครั้ง`)}
    <dt>HRV (RMSSD)</dt>${val(m.hrv_rmssd,`${m.hrv_rmssd} ms`)}</dl>
   <h5>ลายพิมพ์</h5>${prints(m,false)}
   <div class="cardfoot"><span>สมอง</span><span>หัวใจ</span><span>กระพริบตา</span></div>
   <div class="rx"><h6>ใบสั่งยา</h6>
    <div class="row2"><b>MOOD THERAPY</b><span>${p&&p.word?esc(p.word):`<span class="na">ไม่ได้บันทึก</span>`}</span></div>
    <div class="row2"><b>SOUND THERAPY</b><span>${m.alpha_hz?`อัลฟา ${m.alpha_hz} Hz`:SOUND[D.set]||"—"}</span></div>
    <div class="row2"><b>COLOUR THERAPY</b><span>${COLOUR[D.set]||"—"}</span></div>
    <div class="row2"><b>ROUTINE</b><span style="font-size:14px;text-align:right;max-width:200px">${ROUTINE[D.set]||"—"}</span></div>
    <div class="row2"><b>OVERALL DIAGNOSIS</b><span>${overall}</span></div>
    <div class="claim">ไม่ใช่ยา ไม่ใช่การวินิจฉัย เป็นส่วนหนึ่งของงานศิลปะ</div></div>
   <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px"><span class="stamp ok" style="font-size:15px">ตรวจแล้ว ${thDate(D.date)}</span>${o.url?qrSvg(o.url,64):""}</div>
   ${barcode(D.code||"")}
   <div class="disc">ตัวเลขในใบนี้เป็นค่าที่วัดได้จริงเท่านั้น ค่าที่ไม่ได้วัดจะเขียนว่า "ไม่ได้วัด" · ไม่ใช่เครื่องมือแพทย์ · ขอลบข้อมูลได้ภายใน 30 วันที่บูธหรือผ่านทีมงาน</div>
  </div>`}

window.RV={SETS,card,record,qrSvg,barcode,esc,thDate};
})();
