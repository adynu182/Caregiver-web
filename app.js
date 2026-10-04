import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,collection,query,where,orderBy,limit,onSnapshot,addDoc,deleteDoc,doc,writeBatch,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const PASIEN="Mamah"; // ganti dengan nama pasien
const firebaseConfig={
 apiKey:"AIzaSyBvjk2NRrxJ1T-FuMYEG3iVAhEIi37xgYk",
 authDomain:"jajankuy-web.firebaseapp.com",
 projectId:"jajankuy-web",
 storageBucket:"jajankuy-web.firebasestorage.app",
 messagingSenderId:"439643042694",
 appId:"1:439643042694:web:3808fd644307f9205ff207",
 measurementId:"G-D9V1H4H67B"
};

const H=36e5,D=24*H,$=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const p2=n=>String(n).padStart(2,"0"),tm=t=>p2(new Date(t).getHours())+".00";
const dl=t=>new Date(t).toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short"});
const day0=t=>{const d=new Date(t);d.setHours(0,0,0,0);return+d};
const now=()=>Math.floor(Date.now()/H)*H;
let db=null,me=localStorage.getItem("cg_name")||"",shifts=[],msgs=[],slots=new Map(),gp=[],sel=0,cmap=new Map(),tsel=day0(Date.now());
const PAL=["#2f6fed","#d97706","#8e44ad","#0f8b8d","#d6336c","#8d6e3f","#4b4bd1","#6b8e23","#0b7fc0","#5c7a99","#b7791f","#a0386b"];
const key=n=>encodeURIComponent(n.trim().toLowerCase());
const col=n=>cmap.get(key(n))||"#7a8a89"; // warna hanya di tab Tim, dihitung di browser
const NAMES=["Adi","Indri","Rani","Rendra","Teja","Tia"];
if(!NAMES.includes(me)){me="";localStorage.removeItem("cg_name")} // nama lama di luar daftar diminta pilih ulang
$("#ni").innerHTML='<option value="">Pilih nama...</option>'+NAMES.map(n=>`<option>${n}</option>`).join("");
const days=[...Array(14)].map((_,i)=>day0(Date.now())+i*D);

if(firebaseConfig.apiKey.startsWith("ISI")) $("#setup").hidden=false;
else db=getFirestore(initializeApp(firebaseConfig));

function toast(t){const e=$("#toast");e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,3500)}
function need(){if(!db){toast("Isi firebaseConfig dulu");return false}if(!me){$("#nm").showModal();return false}return true}

const cnt=t=>new Set((slots.get(t)||[]).map(x=>key(x.name))).size; // jumlah penjaga berbeda di jam t
function gaps(){const g=[],n=now();let c=null;
 for(let t=n;t<n+14*D;t+=H){if(slots.has(t))c=null;else if(c)c.end=t+H;else{c={start:t,end:t+H};g.push(c)}}return g}

function render(){
 slots=new Map();shifts.forEach(s=>{for(let t=s.start;t<s.end;t+=H)slots.set(t,[...(slots.get(t)||[]),s])});
 const n=now(),g=gp=gaps(),empty=g.reduce((a,x)=>a+(x.end-x.start)/H,0),tot=14*24,pct=Math.round((1-empty/tot)*100);
 let one=0;for(let t=n;t<n+14*D;t+=H)if(cnt(t)==1)one++;
 const bar=`<div class="pb"><i style="width:${(tot-empty-one)/tot*100}%"></i><i class="w" style="width:${one/tot*100}%"></i></div>`;
 $("#pt").textContent=PASIEN;$("#who").textContent=me||"Pilih nama";
 $("#sum").innerHTML=empty?`<b class="bad">${empty} jam belum ada penjaga</b>${bar}<span>${pct}% terisi untuk 14 hari ke depan. Hijau lebih dari 1 penjaga, kuning baru 1 penjaga, merah masih kosong.</span>`
  :`<b class="ok">Semua jam terisi</b>${bar}<span>14 hari ke depan aman${one?`, ${one} jam di antaranya baru dijaga 1 orang`:""}</span>`;
 $("#strip").innerHTML=days.map((d,i)=>{const{e,u,y}=dst(d,n),st=!u?"p":e?"e":y?"w":"f";
  return `<button class="dt ${st}${i==sel?" on":""}" data-i="${i}"><small>${new Date(d).toLocaleDateString("id-ID",{weekday:"short"})}</small><b>${new Date(d).getDate()}</b><span class="pl">${st=="p"?"Lewat":e?e+" kosong":y?y+" sendiri":"Penuh ✓"}</span></button>`}).join("");
 const d=days[sel];$("#dh").textContent=dl(d);let h="";
 for(let k=0;k<24;k++){const t=d+k*H,s=slots.get(t),c=cnt(t),past=t<n,my=s&&s.find(x=>x.name===me);
  h+=s?`<div class="row f${c<2?" w":""}${past?" past":""}"><time>${tm(t)}</time><div><span><b>${past?"":"✓ "}${s.map(x=>esc(x.name)+(x.name===me?" (Anda)":"")).join(", ")}</b>${c>1?`<small>${c} orang jaga bersama</small>`:past?"":`<small>Baru 1 orang jaga</small>`}</span>${past?"":my?`<button data-del="${my.id}">Batalkan</button>`:`<button data-join="${t}">Ikut jaga</button>`}</div></div>`
   :`<button class="row e${past?" past":""}" data-fill="${t}" ${past?"disabled":""}><time>${tm(t)}</time><div><b>${past?"Sudah lewat":"⚠ Belum ada penjaga"}</b>${past?"":`<span class="pill">Ambil</span>`}</div></button>`}
 $("#tl").innerHTML=h;
 $("#gaps").innerHTML=g.length?g.slice(0,8).map((x,i)=>{const u=x.start<n+2*D;
  return `<div class="gap${u?" urg":""}"><div><b>${dl(x.start)}, ${tm(x.start)} sampai ${tm(x.end)}</b><small>${(x.end-x.start)/H} jam${u?", segera, kurang dari 2 hari lagi":""}</small></div><button data-g="${i}">Ambil</button></div>`}).join("")
  +(g.length>8?`<p class="mut">Masih ada ${g.length-8} bagian kosong lain di tanggal berikutnya.</p>`:""):`<p class="mut">Semua jam sudah ada penjaganya. Terima kasih!</p>`;
 rteam();
}

const dst=(d,n)=>{let e=0,u=0,y=0;for(let k=0;k<24;k++){const t=d+k*H;if(t>=n){u++;const c=cnt(t);if(!c)e++;else if(c==1)y++}}return{e,u,y}};
function who(d){const m=new Map();shifts.forEach(s=>{if(s.start<d+D&&s.end>d){const a=Math.max(s.start,d),b=Math.min(s.end,d+D);m.set(s.name,[...(m.get(s.name)||[]),[a,b]])}});return[...m].sort((x,y)=>x[0].localeCompare(y[0]))}
function mg(r){r.sort((a,b)=>a[0]-b[0]);const o=[];r.forEach(x=>{const l=o[o.length-1];if(l&&x[0]<=l[1])l[1]=Math.max(l[1],x[1]);else o.push([...x])});return o}
const ini=n=>esc((n.trim()[0]||"?").toUpperCase());
const rem=ms=>{const m=Math.max(0,Math.ceil(ms/6e4)),h=Math.floor(m/60),r=m%60;return[h&&h+" jam",(r||!h)&&r+" menit"].filter(Boolean).join(" ")};
const fin=e=>{const T=day0(Date.now());if(e<=T+D)return e==T+D?"24.00":tm(e);if(e<=T+2*D)return"besok "+(e==T+2*D?"24.00":tm(e));return dl(e)+", "+tm(e)};
// kartu "Sedang jaga sekarang" di paling atas tab Tim
function rnow(){
 const n=now(),m=new Map();
 shifts.forEach(s=>{if(s.start<=n&&s.end>n){const k=key(s.name),o=m.get(k);if(!o||s.end>o.end)m.set(k,{name:s.name,end:s.end})}});
 m.forEach((o,k)=>{for(let go=true;go;){go=false;shifts.forEach(s=>{if(key(s.name)==k&&s.start<=o.end&&s.end>o.end){o.end=s.end;go=true}})}}); // sambung jaga berurutan, mis. 22.00-24.00 lalu 00.00-06.00
 const L=[...m.values()].sort((a,b)=>a.name.localeCompare(b.name)),c=L.length,st=c?c>1?"f":"w":"e";
 let nx=0;shifts.forEach(s=>{if(s.start>n&&(!nx||s.start<nx))nx=s.start});
 const nn=[...new Set(shifts.filter(s=>s.start==nx).map(s=>s.name))].sort();
 $("#now").className="now "+st;$("#nst").className="nst "+st;$("#nst").textContent=c?c+" penjaga":"Kosong";
 $("#nl").innerHTML=c?L.map(o=>`<div class="wr"><span class="av" style="background:${col(o.name)}">${ini(o.name)}</span><div><b>${esc(o.name)}${o.name===me?" (Anda)":""}</b><small>sampai ${fin(o.end)}, sisa <span data-end="${o.end}">${rem(o.end-Date.now())}</span></small></div></div>`).join("")
  :`<p class="bad"><b>Belum ada yang jaga sekarang</b></p>`+(nx?`<p class="mut">Berikutnya: ${nn.map(esc).join(", ")} mulai ${day0(nx)==day0(Date.now())?"":dl(nx)+", "}${tm(nx)}</p>`:`<p class="mut">Belum ada jadwal berikutnya.</p>`)}
function rteam(){
 const n=now(),T=day0(Date.now()),st=T-((new Date(T).getDay()+6)%7)*D,names=new Map();
 NAMES.forEach(nm=>names.set(key(nm),{name:nm,h:0,nx:0,on:false}));
 
 shifts.forEach(s=>{const k=key(s.name);if(!names.has(k))names.set(k,{name:s.name,h:0,nx:0,on:false});
  if(s.end>n){const o=names.get(k),a=Math.max(s.start,n);o.h+=(s.end-a)/H;if(s.start<=n)o.on=true;if(!o.nx||a<o.nx)o.nx=a}});
 const L=[...names.values()].sort((a,b)=>a.name.localeCompare(b.name));
 L.forEach((o,i)=>cmap.set(key(o.name),PAL[i%PAL.length]));
 rnow();
 $("#cgn").textContent="("+L.length+")";
 $("#chips").innerHTML=L.length?L.map(o=>`<span class="chip"><i style="background:${col(o.name)}"></i>${esc(o.name)}${o.name===me?" (Anda)":""}</span>`).join(""):`<p class="mut">Belum ada caregiver yang punya jadwal. Ambil jadwal pertama!</p>`;
 $("#cgl").innerHTML=L.map(o=>`<div class="cg"><span class="av" style="background:${col(o.name)}">${ini(o.name)}</span><div><b>${esc(o.name)}</b><small>${o.on?"Sedang jaga sekarang":o.nx?"Berikutnya: "+dl(o.nx)+", "+tm(o.nx):"Belum ada jadwal"}</small>${o.h?`<small>${o.h} jam terjadwal ke depan</small>`:""}</div></div>`).join("");
 let c=["Sen","Sel","Rab","Kam","Jum","Sab","Min"].map(x=>`<span>${x}</span>`).join("");
 for(let i=0;i<35;i++){const d=st+i*D,w=who(d),{e,u,y}=dst(d,n),dt=new Date(d),mk=dt.getDate()==1||i==0;
  c+=`<button class="cc ${u?(e?"e":y?"w":"f"):"p"}${d==T?" t":""}${d==tsel?" on":""}" data-d="${d}"><b>${dt.getDate()}${mk?" "+dt.toLocaleDateString("id-ID",{month:"short"}):""}</b><span class="dots">${w.slice(0,8).map(x=>`<i style="background:${col(x[0])}"></i>`).join("")}${w.length>8?`<em>+${w.length-8}</em>`:""}</span></button>`}
 $("#cal").innerHTML=c;
 const w=who(tsel),{e,u,y}=dst(tsel,n);
 $("#dd").innerHTML=`<h2>${new Date(tsel).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"})}</h2>`
  +(u?(e?`<p class="bad"><b>${e} jam belum ada penjaga</b></p>`:"")+(y?`<p class="warn"><b>${y} jam baru dijaga 1 orang</b></p>`:"")+(e||y?"":`<p class="ok"><b>Semua jam dijaga lebih dari 1 orang</b></p>`):"")
  +(w.length?w.map(([nm,r])=>`<div class="wr"><span class="av" style="background:${col(nm)}">${ini(nm)}</span><div><b>${esc(nm)}${nm===me?" (Anda)":""}</b><small>${mg(r).map(([a,b])=>tm(a)+" sampai "+(b==tsel+D?"24.00":tm(b))).join(", ")}</small></div></div>`).join(""):`<p class="mut">Belum ada yang jaga di tanggal ini.</p>`);
}
function rmsg(){const el=$("#msgs"),bot=el.scrollHeight-el.scrollTop-el.clientHeight<90||!el.clientHeight;
 el.innerHTML=[...msgs].reverse().map(m=>{const mine=m.name===me,t=m.ts?m.ts.toDate():new Date();
  return `<div class="m${mine?" me":""}">${mine?"":`<small>${esc(m.name)}</small>`}<p>${esc(m.text)}</p><time>${t.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</time></div>`}).join("")
  ||`<p class="mut">Belum ada pesan. Mulai dengan serah terima shift.</p>`;
 if(bot)el.scrollTop=1e9}

function tab(t){["jadwal","tim","chat"].forEach(x=>{$("#v-"+x).hidden=x!==t;$("#t-"+x).classList.toggle("on",x===t)});if(t=="chat")$("#msgs").scrollTop=1e9}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>tab(b.dataset.t));

// sheet
const opts=[...Array(24)].map((_,h)=>`<option value="${h}">${p2(h)}.00</option>`).join("");
$("#fs").innerHTML=$("#fe").innerHTML=opts;
$("#ps").innerHTML=[["Pagi",6,12],["Siang",12,18],["Malam",18,0],["Dini hari",0,6]].map(([n,a,b])=>`<button data-a="${a}" data-b="${b}">${n} ${p2(a)}-${p2(b)}</button>`).join("");
$("#ps").onclick=e=>{const b=e.target.closest("button");if(b){$("#fs").value=b.dataset.a;$("#fe").value=b.dataset.b}};
function openSheet(s,e){if(!need())return;const d=new Date(s);
 $("#fd").value=`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
 $("#fs").value=d.getHours();$("#fe").value=new Date(e).getHours();$("#fr").value="o";$("#er").textContent="";$("#sh").showModal()}
const ext=t=>{let e=t+H;while(e<t+12*H&&!slots.has(e))e+=H;return e};
const extJ=t=>{let e=t+H;while(e<t+6*H&&!(slots.get(e)||[]).some(x=>x.name===me))e+=H;return e};
$("#fc").onclick=()=>$("#sh").close();

$("#fv").onclick=async()=>{
 const v=$("#fd").value,er=m=>$("#er").textContent=m;if(!v)return er("Pilih tanggal dulu.");
 const d0=+new Date(v+"T00:00:00"),start=d0+$("#fs").value*H;let end=d0+$("#fe").value*H;if(end<=start)end+=D;
 const [cnt,step]={o:[1,0],d:[7,D],w:[4,7*D]}[$("#fr").value],items=[];let skip=0;
 for(let i=0;i<cnt;i++){const s=start+i*step,e=end+i*step;if(e<=Date.now())continue;
  let c=false;for(let t=s;t<e;t+=H)if((slots.get(t)||[]).some(x=>x.name===me)){c=true;break}c?skip++:items.push([s,e])}
 if(!items.length)return er("Anda sudah punya jadwal di jam itu, atau jamnya sudah lewat. Pilih jam lain.");
 try{const b=writeBatch(db);items.forEach(([s,e])=>b.set(doc(collection(db,"shifts")),{name:me,start:s,end:e,at:serverTimestamp()}));await b.commit();
  $("#sh").close();toast(`Jadwal tersimpan: ${items.length} shift${skip?`, ${skip} dilewati karena Anda sudah punya jadwal di jam itu`:""}`)}
 catch(e){er("Gagal menyimpan: "+e.code)}};

// events
$("#v-jadwal").onclick=e=>{const b=e.target.closest("button");if(!b)return;const k=b.dataset;
 if(k.i!=null){sel=+k.i;render()}
 else if(k.fill)openSheet(+k.fill,ext(+k.fill))
 else if(k.join)openSheet(+k.join,extJ(+k.join))
 else if(k.g!=null){const x=gp[+k.g];openSheet(x.start,Math.min(x.end,x.start+12*H))}
 else if(k.del){const s=shifts.find(x=>x.id===k.del);
  if(s&&confirm(`Batalkan jaga ${dl(s.start)}, ${tm(s.start)} sampai ${tm(s.end)}? Jam ini akan jadi kosong.`))
   deleteDoc(doc(db,"shifts",k.del)).then(()=>toast("Jadwal dibatalkan. Bagikan jam kosongnya ke grup WhatsApp.")).catch(e=>toast("Gagal membatalkan: "+e.code))}};
$("#fab").onclick=()=>{let d=day0(Date.now())+18*H;if(d<Date.now())d+=D;openSheet(d,d+6*H)};
$("#wa").onclick=()=>{const g=gaps();if(!g.length)return toast("Semua jam sudah terisi");
 open("https://wa.me/?text="+encodeURIComponent(`Jadwal jaga ${PASIEN} yang belum ada penjaga:\n`+g.slice(0,15).map(x=>`• ${dl(x.start)}, ${tm(x.start)} sampai ${tm(x.end)}`).join("\n")+`\n\nIsi di sini: ${location.href}`))};

// nama
const guide=()=>{localStorage.setItem("cg_guide","1");$("#gd").showModal()};$("#hp").onclick=guide;$("#gx").onclick=()=>$("#gd").close();
$("#who").onclick=()=>{$("#ni").value=me;$("#nm").showModal()};
$("#nm").addEventListener("cancel",e=>{if(!me)e.preventDefault()});
$("#nb").onclick=()=>{const v=$("#ni").value.trim();if(!v)return;me=v;localStorage.setItem("cg_name",v);$("#nm").close();render();rmsg();if(!localStorage.cg_guide)guide()};

// chat
async function send(){const i=$("#mi"),t=i.value.trim();if(!t||!need())return;i.value="";
 try{await addDoc(collection(db,"messages"),{name:me,text:t,ts:serverTimestamp()})}catch(e){i.value=t;toast("Pesan gagal terkirim: "+e.code)}}
$("#ms").onclick=send;$("#mi").onkeydown=e=>{if(e.key=="Enter")send()};

// realtime Firestore
if(db){
 onSnapshot(query(collection(db,"shifts"),where("end",">",day0(Date.now())-7*D)),s=>{shifts=s.docs.map(d=>({id:d.id,...d.data()}));render()},e=>toast("Gagal memuat jadwal: "+e.code));
 onSnapshot(query(collection(db,"messages"),orderBy("ts","desc"),limit(100)),s=>{msgs=s.docs.map(d=>({id:d.id,...d.data({serverTimestamps:"estimate"})}));rmsg()},e=>toast("Gagal memuat chat: "+e.code));
}
const root=document.documentElement,mq=matchMedia("(prefers-color-scheme:dark)"),dark=()=>root.dataset.theme?root.dataset.theme=="dark":mq.matches;
function theme(){const d=dark(),b=$("#th");b.textContent=d?"☀️":"🌙";b.setAttribute("aria-label",d?"Ganti ke tema terang":"Ganti ke tema gelap")}
$("#th").onclick=()=>{const t=dark()?"light":"dark";root.dataset.theme=t;try{localStorage.setItem("cg_theme",t)}catch(e){}theme()};
mq.onchange=theme;theme();
$("#v-tim").onclick=e=>{const b=e.target.closest("[data-d]");if(b){tsel=+b.dataset.d;rteam()}};
render();rmsg();setInterval(render,60000);
// jam realtime di tab Tim: update tiap detik, dan segarkan daftar penjaga persis saat jam berganti
let hr=now();
function tick(){const d=new Date();
 $("#clk").textContent=d.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
 $("#cdt").textContent=d.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 if(now()!==hr){hr=now();render();return}
 document.querySelectorAll("[data-end]").forEach(e=>e.textContent=rem(+e.dataset.end-d.getTime()))}
setInterval(tick,1000);tick();
if(!me)$("#nm").showModal();else if(!localStorage.cg_guide)guide();
