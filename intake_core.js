/* UNSENSORY · SENSORY DE-FREQ — คำถามคัดกรอง + ผลคัดกรอง + ความเหมาะของเซ็ต (ใช้ร่วม iPad intake.html และมือถือ self.html)
   แก้คำถาม/กติกาคัดกรองที่ไฟล์นี้ที่เดียว
   ความปลอดภัย: stop = ร่วมนอนไม่ได้ (เสี่ยงจริง) · warn = ร่วมได้ ทีมปรับให้ / คุยก่อน (note = สิ่งที่ทีมต้องทำ)
   ไม่เก็บคำตอบเรื่องสุขภาพ: ส่งออกแค่ผล ok/warn/stop + note ที่เป็น "สิ่งที่ทีมต้องทำ" */
(function(){
const SAFETY=[
 {k:"seizure",t:"เคยมีอาการชัก หรือไวต่อแสงกะพริบ",s:"รวมถึงโรคลมชักที่คุมได้แล้ว",lvl:"stop",note:"ร่วมนอนในห้องไม่ได้ (มีแสงกะพริบ) · ชวนดูจากด้านนอก"},
 {k:"implant",t:"มีเครื่องกระตุ้นหัวใจ หรืออุปกรณ์ฝังในร่างกาย",s:"เช่น pacemaker, ประสาทหูเทียม",lvl:"stop",note:"ห้ามติดขั้วไฟฟ้า · ชวนดูจากด้านนอก"},
 {k:"pregnant",t:"ตั้งครรภ์อยู่",lvl:"stop",note:"ร่วมนอนไม่ได้ (ตั้งครรภ์) · ชวนดูจากด้านนอก"},
 {k:"migraine",t:"เป็นไมเกรน เวียนหัวง่าย หรือเมารถง่าย",lvl:"warn",note:"ลดแสงกะพริบ · ไม่แนะนำ BOOST"},
 {k:"skin",t:"ผิวแพ้ง่าย หรือแพ้เทปกาว",lvl:"warn",note:"ใช้แค่เซนเซอร์หัวใจที่นิ้ว ไม่แปะขั้วที่หน้าผาก"},
 {k:"space",t:"กลัวที่แคบ หรือกลัวความมืด",lvl:"warn",note:"คุยก่อนเริ่ม: พาดูเตียงก่อน · เปิดไฟสลัว · บอกว่าลุกออกได้ทุกเมื่อ"},
 {k:"alcohol",t:"ดื่มแอลกอฮอล์ภายใน 6 ชั่วโมงนี้",lvl:"warn",note:"ค่าสมองอาจเพี้ยน · ระบุในรายงาน"},
 {k:"sound",t:"ไวต่อเสียงดัง",lvl:"warn",note:"ลดเสียงหูฟังของเตียงนี้"}];
const MOOD=["งานถาโถม","นอนไม่พอ","ตื่นเต้นกับบางอย่าง","ใจลอย","เบื่อๆ","อยากหนีไปทะเล","กำลังดี","คิดเยอะ"];
const WEATHER=[["sun","แดดจ้า"],["cloud","เมฆครึ้ม"],["drizzle","ฝนพรำ"],["storm","พายุ"],["fog","หมอกลง"]];
const WANT=[["rest","ได้พัก"],["energy","ได้พลัง"],["self","ได้อยู่กับตัวเอง"]];
const CONSENT=[["sensor","<b>ติดเซนเซอร์</b> ขั้วที่หน้าผากและเซนเซอร์ที่นิ้ว ถอดออกได้ทุกเมื่อ · จำเป็น"],
 ["data","<b>เก็บข้อมูลเพื่อทำรายงาน</b> เก็บ 30 วัน ไม่ขาย ไม่แชร์ ขอลบได้ · รายงานมีคลิปภาพและเสียง 15 วินาทีจากรอบของคุณ (ไม่มีภาพใบหน้า ดูได้ 14 วัน) · จำเป็น"],
 ["photo","ถ่ายรูปบรรยากาศได้ · ไม่บังคับ"]];
const blank=()=>({step:0,nick:"",age:"",consent:{sensor:false,data:false,photo:false},safety:{},energy:0,stress:0,busy:0,sleepy:0,sleep:"",caffeine:"",mood:[],weather:"",want:"",post:{energy:0,stress:0,busy:0,word:""}});

function triage(p){if(p._tri&&!Object.keys(p.safety).length)return {lvl:p._tri,notes:p._notes||[]};const on=SAFETY.filter(q=>p.safety[q.k]);if(on.some(q=>q.lvl==="stop"))return {lvl:"stop",notes:on.map(q=>q.note)};
  if(SAFETY.some(q=>p.safety[q.k]===undefined))return {lvl:null,notes:[]};return {lvl:on.length?"warn":"ok",notes:on.map(q=>q.note)}}
function fit(p){ // คะแนนความเหมาะของแต่ละเซ็ต (0–100) จากเช็กอิน + คำตอบชวนคุย
  if(p._fit&&!p.sleep)return p._fit;
  if(!p.energy||!p.stress)return null;
  const s={baseline:2,boost:0,relax:0},mood=m=>p.mood.includes(m)?1:0;
  s.relax+=p.stress*1.0+p.busy*.7+(p.sleep==="≤4"||p.sleep==="5-6"?1:0)+({storm:1.6,drizzle:1}[p.weather]||0)+(p.want==="rest"?2.2:0)+.7*(mood("งานถาโถม")+mood("นอนไม่พอ")+mood("คิดเยอะ"));
  s.boost+=(5-p.energy)*.9+(p.stress<=3?p.sleepy*.5:0)+({cloud:1,fog:1.2}[p.weather]||0)+(p.want==="energy"?2.2:0)+.7*(mood("เบื่อๆ")+mood("ใจลอย"))-p.stress*.3;
  s.baseline+=(p.want==="self"?2.2:0)+(p.weather==="sun"?1:0)+.7*(mood("กำลังดี")+mood("ตื่นเต้นกับบางอย่าง"))+(Math.abs(p.energy-3)<=1&&p.stress<=3?1.4:0);
  const e=Object.fromEntries(Object.entries(s).map(([k,v])=>[k,Math.exp(Math.max(0,v)*.3)])),t=e.baseline+e.boost+e.relax;
  return Object.fromEntries(Object.entries(e).map(([k,v])=>[k,Math.round(v/t*100)]))}
// ข้อมูลที่ส่งเข้าระบบ (เหมือนกันทั้ง iPad และมือถือ) · ไม่มีคำตอบความปลอดภัยรายข้อ
function payload(p){const tr=triage(p);return {nick:p.nick,age:p.age,consent:p.consent,triage:tr.lvl,notes:tr.notes,fit:fit(p),
  checkin:{energy:p.energy,stress:p.stress,busy:p.busy,sleepy:p.sleepy},gimmick:{mood:p.mood,weather:p.weather,want:p.want}}}
window.IC={SAFETY,MOOD,WEATHER,WANT,CONSENT,blank,triage,fit,payload};
})();
