/* ================= CONFIG (single OTP webhook) ================= */
const CONFIG = {
  otp_url: "https://hook.us2.make.com/3xkd93ngw7a56h74tt79hhw755ycp8o6", // both request + verify

  review_webhook_url: "https://hook.us2.make.com/reviews",
  agent_webhook_url:  "https://hook.us2.make.com/agent",
  upload_webhook_url: "https://hook.us2.make.com/upload",

  bookingUrl: "https://cal.com/your-org/your-calendar?embed=1",
  defaultResults: "https://docs.google.com/spreadsheets/d/your-sheet-id/preview"
};

/* ================= LocalStorage keys ================= */
const LS = {
  email:"portal.accountEmail",
  cid:"portal.contactId",
  results:"portal.resultsSheetUrl",
  resultsCsv:"portal.resultsCsvUrl",
  reviewPage:"portal.reviewPageUrl",
  draft:"portal.onboardingDraft",
  agentThread:"portal.agent.threadId",
  agentMsgs:"portal.agent.messages",
  uiTools:"portal.ui.toolsCollapsed",
  uiSupport:"portal.ui.supportCollapsed",
  uiSettings:"portal.ui.settingsCollapsed"
};

/* ================= Safe binder ================= */
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

/* ================= INIT (scoped to #mtbRoot) ================= */
function initMyToolbox(){
  const root = document.getElementById("mtbRoot");
  if (!root) return;
  root.style.display = ""; // show widget

  const $  = s => root.querySelector(s);
  const $$ = s => [...root.querySelectorAll(s)];

  /* Core refs */
  const modal=$("#mtbModal"), overlay=$("#mtbOverlay"), fab=$("#mtbFab"), closeBtn=$("#mtbClose");
  const sidebar=root.querySelector(".mtb-sidebar"), sbToggle=$("#sbToggle"), crumbs=$("#crumbs");
  const isMobile=()=>matchMedia("(max-width:900px)").matches;
  const sbCloseMobile = document.querySelector("#mtbRoot #sbCloseMobile");

  /* Open/Close */
  function openPortal(){
    if(!modal.hidden){ closePortal(); return; }
    modal.hidden=false; document.body.style.overflow="hidden";
    const shouldOpen=!isMobile(); sidebar?.setAttribute("data-open", String(shouldOpen)); sbToggle?.setAttribute("aria-expanded", String(shouldOpen));
    hydrate();
    if(!localStorage.getItem(LS.cid)) openMini();
  }
  function closePortal(){ modal.hidden=true; document.body.style.overflow=""; }
  on(fab,"click",openPortal);
  on(closeBtn,"click",closePortal);
  on(overlay,"click",e=>{ if(e.target===overlay) closePortal(); });
  on(document,"keydown",e=>{ if(e.key==="Escape" && !modal.hidden){ if(!mini.hidden) closeMini(); else closePortal(); } });

  /* Sidebar toggle */
  on(sbToggle,"click",()=>{
    const open=sidebar?.getAttribute("data-open")==="true";
    sidebar?.setAttribute("data-open", String(!open));
    sbToggle?.setAttribute("aria-expanded", String(!open));
  });
  on(sbCloseMobile, "click", () => {
  const sidebar = document.querySelector("#mtbRoot .mtb-sidebar");
  const sbToggle = document.querySelector("#mtbRoot #sbToggle");
  if (!sidebar) return;
  sidebar.setAttribute("data-open", "false");
  if (sbToggle) sbToggle.setAttribute("aria-expanded", "false");
});

  /* Collapsibles */
  function wireCollapse(btnSel,paneSel,key){
    const btn=$(btnSel), pane=$(paneSel); if(!btn||!pane) return;
    const collapsed = localStorage.getItem(key)==="true";
    if(collapsed){ pane.style.display="none"; btn.setAttribute("aria-expanded","false"); btn.querySelector(".chevron")?.classList.add("fa-rotate-180"); }
    on(btn,"click",()=>{
      const open=btn.getAttribute("aria-expanded")==="true";
      btn.setAttribute("aria-expanded", String(!open));
      pane.style.display = open ? "none" : "flex";
      btn.querySelector(".chevron")?.classList.toggle("fa-rotate-180", !open);
      localStorage.setItem(key, String(!open));
    });
  }
  wireCollapse("#toolsToggle","#toolsNav",LS.uiTools);
  wireCollapse("#supportToggle","#supportNav",LS.uiSupport);
  wireCollapse("#settingsToggle","#settingsNav",LS.uiSettings);

  /* Navigation */
  function switchSection(id){
    $$(".sec").forEach(s=>s.classList.remove("active"));
    $$(".sb-item").forEach(n=>n.classList.remove("active"));
    $("#"+id)?.classList.add("active");
    root.querySelector(`.sb-item[data-target="${id}"]`)?.classList.add("active");
    const map={ "quick-links":"My Toolbox / Tools / Quick Links","results":"My Toolbox / Tools / Results","reviews":"My Toolbox / Tools / Reviews","uploads":"My Toolbox / Tools / Uploads","ai-agent":"My Toolbox / Support / Ask AI Agent","book-session":"My Toolbox / Support / Book A Session","tickets":"My Toolbox / Support / Tickets","getting-started":"My Toolbox / Settings / Getting Started","sync-data":"My Toolbox / Settings / Sync Data" };
    if(crumbs) crumbs.textContent = map[id]||`My Toolbox / ${id}`;
    if(isMobile()){ sidebar?.setAttribute("data-open","false"); sbToggle?.setAttribute("aria-expanded","false"); }
  }
  $$(".sb-item").forEach(b=> on(b,"click",()=> switchSection(b.dataset.target)));
  $$(".card.ql").forEach(c=> on(c,"click",()=> switchSection(c.dataset.target)));

  /* Hydrate */
  function hydrate(){
    const resIframe=$("#results iframe"); if(resIframe) resIframe.src = localStorage.getItem(LS.results) || CONFIG.defaultResults;
    const bookIframe=$("#book-session iframe"); if(bookIframe) bookIframe.src = localStorage.getItem("portal.scheduleUrl") || CONFIG.bookingUrl;
    const cidLabel=$("#cidLabel"); if(cidLabel) cidLabel.textContent = localStorage.getItem(LS.cid) || "—";
    $("#callUs")?.setAttribute("href","tel:+15551234567");
    $("#whatsApp")?.setAttribute("href","https://wa.me/15551234567");
    renderChatFromMemory();
  }

  /* Results */
  on($("#refResults"),"click",()=>{
    const ifr=$("#results iframe"); if(!ifr) return;
    const base=localStorage.getItem(LS.results)||CONFIG.defaultResults;
    ifr.src = base + (base.includes("?")?"&":"?") + "t=" + Date.now();
  });
  on($("#dlResults"),"click",()=>{
    const csv=localStorage.getItem(LS.resultsCsv)||localStorage.getItem(LS.results)||CONFIG.defaultResults;
    window.open(csv,"_blank","noopener");
  });

  /* Reviews */
  on($("#viewReview"),"click",()=>{
    const url=localStorage.getItem(LS.reviewPage); if(url) window.open(url,"_blank","noopener");
  });
  on($("#reviewsForm"),"submit",async e=>{
    e.preventDefault();
    const f=e.currentTarget; if(!f.checkValidity()){f.reportValidity(); return;}
    const payload=Object.fromEntries(new FormData(f).entries());
    payload.contactId=localStorage.getItem(LS.cid)||"";
    const status=$("#reviewsStatus"); if(status) status.textContent="Sending…";
    try{
      const r=await fetch(CONFIG.review_webhook_url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!r.ok) throw 0;
      if(status) status.textContent="Invite sent ✓"; f.reset(); setTimeout(()=>{if(status) status.textContent="";},2000);
    }catch{ if(status) status.textContent="Failed. Try again."; }
  });

  /* Uploads */
  on($("#uploadForm"),"submit",async e=>{
    e.preventDefault();
    const title=$("#uploadTitle")?.value?.trim(); const files=$("#uploadFiles")?.files; const status=$("#uploadStatus");
    if(!title || !files || !files.length){ e.currentTarget.reportValidity(); return; }
    if(status) status.textContent="Uploading…";
    const form=new FormData(); form.append("title",title); [...files].forEach(f=>form.append("files",f));
    const cid=localStorage.getItem(LS.cid); if(cid) form.append("contactId",cid);
    try{
      const r=await fetch(CONFIG.upload_webhook_url,{method:"POST",body:form});
      if(!r.ok) throw 0;
      if(status) status.textContent="Uploaded ✓"; e.currentTarget.reset(); setTimeout(()=>{if(status) status.textContent="";},2000);
    }catch{ if(status) status.textContent="Upload failed."; }
  });

  /* AI Chat */
  const chatLog=$("#chatLog"), chatText=$("#chatText"), chatForm=$("#chatForm"), chatSend=$("#chatSend"), chatReset=$("#chatReset");
  const nowTime=()=>new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const esc=s=>s.replace(/[&<>]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[m]));
  function addMsg(text,role="assistant"){ if(!chatLog) return; const el=document.createElement("div"); el.className=`msg ${role==='user'?'user':'bot'}`; el.innerHTML=`<div>${esc(text)}</div><span class="time">${nowTime()}</span>`; chatLog.appendChild(el); chatLog.scrollTop=chatLog.scrollHeight; }
  function getMsgs(){ try{return JSON.parse(localStorage.getItem(LS.agentMsgs)||"[]")}catch{return[]} }
  function saveMsgs(arr){ localStorage.setItem(LS.agentMsgs, JSON.stringify(arr.slice(-50))); }
  function renderChatFromMemory(){ if(!chatLog) return; chatLog.innerHTML=""; getMsgs().forEach(m=>addMsg(m.text,m.role)); chatLog.scrollTop=chatLog.scrollHeight; }
  on(chatText,"input",()=>{ if(!chatText) return; chatText.style.height='auto'; const lh=parseFloat(getComputedStyle(chatText).lineHeight)||22; const max=lh*5; chatText.style.height=Math.min(chatText.scrollHeight,max)+'px'; chatText.style.overflowY=(chatText.scrollHeight>max)?'auto':'hidden';});
  on(chatText,"keydown",e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); chatForm?.requestSubmit(); }});
  on(chatForm,"submit",async e=>{
    e.preventDefault(); if(!chatText) return; const text=chatText.value.trim(); if(!text) return;
    const msgs=getMsgs(); addMsg(text,"user"); msgs.push({role:'user',text,ts:Date.now()}); saveMsgs(msgs);
    chatText.value=""; chatText.style.height='auto'; if(chatSend) chatSend.disabled=true;
    const threadId=localStorage.getItem(LS.agentThread)||null;
    try{
      const r=await fetch(CONFIG.agent_webhook_url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({threadId,message:text})});
      if(!r.ok) throw 0;
      const data=await r.json(); if(data.threadId) localStorage.setItem(LS.agentThread,data.threadId);
      const reply=data.reply||"(no reply)"; addMsg(reply,"assistant"); msgs.push({role:'assistant',text:reply,ts:Date.now()}); saveMsgs(msgs);
    }catch{ addMsg("The agent endpoint didn’t respond. Try again?","assistant"); }
    finally{ if(chatSend) chatSend.disabled=false; }
  });
  on(chatReset,"click",()=>{ localStorage.removeItem(LS.agentThread); localStorage.removeItem(LS.agentMsgs); renderChatFromMemory(); });

  /* Tickets */
  on($("#ticketForm"),"submit", e=>{
    e.preventDefault(); const f=e.currentTarget, status=$("#ticketStatus");
    if(!f.checkValidity()){f.reportValidity();return;}
    if(status) status.textContent="Ticket received ✓"; f.reset(); setTimeout(()=>{if(status) status.textContent=""},2000);
  });

  /* Mini Modal (OTP) — single webhook with route */
  const mini=$("#miniModal"), miniClose=$("#miniClose");
  const stageEmail=$("#otpStageEmail"), stageCode=$("#otpStageCode"), stageSync=$("#otpStageSync");
  const syncEmail=$("#syncEmail"), sendOtpBtn=$("#sendOtpBtn"), otpEmailMsg=$("#otpEmailMsg");
  const otpInputs=$("#otpInputs"), verifyOtpBtn=$("#verifyOtpBtn"), resendOtpBtn=$("#resendOtpBtn"), resendTimer=$("#resendTimer"), otpCodeMsg=$("#otpCodeMsg");
  const syncBar=$("#syncBar"), syncPct=$("#syncPct"), syncMsg=$("#syncMsg");
  let OTP={ id:null, email:null, timer:null };

  function setProg(x){ if(syncBar) syncBar.style.width=x+"%"; if(syncPct) syncPct.textContent=x+"%"; }

  function openMini(){
  // bail if modal root missing
  if (!mini) return;

  // try to auto-grab email or fallback to LS
  const domGrab = document.querySelector('.flex-auto .items-center .hl-text-sm-regular')?.textContent?.trim() || "";
  const lsEmail = localStorage.getItem(LS.email) || "";
  if (syncEmail) {
    syncEmail.value = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(domGrab) ? domGrab : lsEmail;
  }

  // stage visibility (with guards)
  show(stageEmail, true);
  show(stageCode,  false);
  show(stageSync,  false);

  // clear messages safely
  setText(otpEmailMsg, "");
  setText(otpCodeMsg, "");
  setText(syncMsg, "");
  setProg(0);

  // reveal modal
  mini.hidden = false;
}
  function closeMini(){ mini.hidden=true; clearInterval(OTP.timer); OTP.timer=null; }
  on(miniClose,"click",closeMini);

  function startResendCooldown(sec){
    if(!resendOtpBtn||!resendTimer) return;
    clearInterval(OTP.timer); resendOtpBtn.disabled=true;
    let remain=sec; resendTimer.textContent=remain;
    OTP.timer=setInterval(()=>{ remain--; resendTimer.textContent=remain; if(remain<=0){ clearInterval(OTP.timer); resendOtpBtn.disabled=false; } },1000);
  }
  function focusOtp(){ const first=otpInputs?.querySelector("input"); first && first.focus(); }
  on(otpInputs,"input", e=>{
    const el=e.target; if(el && el.tagName==="INPUT"){ el.value=el.value.replace(/\D/g,"").slice(0,1); if(el.value && el.nextElementSibling) el.nextElementSibling.focus(); }
  });
  on(otpInputs,"keydown", e=>{
    const el=e.target; if(!(el && el.tagName==="INPUT")) return;
    if(e.key==="Backspace" && !el.value && el.previousElementSibling) el.previousElementSibling.focus();
    if(e.key==="Enter"){ verifyOtpBtn?.click(); }
  });

  async function requestOtp(){
    const email=syncEmail?.value.trim();
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ otpEmailMsg.textContent="Enter a valid email."; return; }
    sendOtpBtn.disabled=true; otpEmailMsg.textContent="Sending code…";
    try{
      const res=await fetch(CONFIG.otp_url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({route:"request", email})});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      if(!data.otp_id) throw new Error("No otp_id returned");
      OTP.id=data.otp_id; OTP.email=email; localStorage.setItem(LS.email,email);
      $("#otpEmailEcho").textContent=email;
      stageEmail.classList.add("hidden"); stageCode.classList.remove("hidden");
      startResendCooldown(30);
      otpCodeMsg.textContent="We sent a 6-digit code to your email.";
      focusOtp();
    }catch(err){ otpEmailMsg.textContent="Failed to send code. " + (err?.message||""); }
    finally{ sendOtpBtn.disabled=false; }
  }
  async function verifyOtp(){
    const code = otpInputs ? [...otpInputs.querySelectorAll("input")].map(i=>i.value).join("") : "";
    if(code.length!==6){ otpCodeMsg.textContent="Enter the 6-digit code."; return; }
    verifyOtpBtn.disabled=true; otpCodeMsg.textContent="Verifying…";
    try{
      const res=await fetch(CONFIG.otp_url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({route:"verify", otp_id:OTP.id, code})});
      if(!res.ok){ const txt=await res.text().catch(()=> ""); throw new Error(`HTTP ${res.status} ${txt.slice(0,120)}`); }
      const data=await res.json();
      const required=["contactId","results_embed_src_url","results_direct_download_csv","review_page"];
      const missing=required.filter(k=>!data[k]);
      if(missing.length) throw new Error("Missing keys: " + missing.join(", "));

      // Progress → finalize
      stageCode.classList.add("hidden"); stageSync.classList.remove("hidden");
      let p=0; setProg(0); syncMsg.textContent="";
      const t=setInterval(()=>{ p=Math.min(100,p+8); setProg(p); if(p>=100){ clearInterval(t); finalizeSync(data); } },80);
    }catch(err){
      verifyOtpBtn.disabled=false;
      otpCodeMsg.textContent = /invalid_otp|expired/i.test(err?.message||"")
        ? "Invalid or expired code. Try again or resend."
        : "Verification failed. " + (err?.message||"");
    }
  }
  function resendOtp(){ if(OTP.email){ if(syncEmail) syncEmail.value=OTP.email; requestOtp(); } }

  function finalizeSync(data){
    if(data.contactId) localStorage.setItem(LS.cid,data.contactId);
    if(data.results_embed_src_url) localStorage.setItem(LS.results,data.results_embed_src_url);
    if(data.results_direct_download_csv) localStorage.setItem(LS.resultsCsv,data.results_direct_download_csv);
    if(data.review_page) localStorage.setItem(LS.reviewPage,data.review_page);

    $("#cidLabel").textContent = localStorage.getItem(LS.cid)||"—";
    $("#results iframe").src = localStorage.getItem(LS.results)||CONFIG.defaultResults;

    syncMsg.textContent="Sync complete.";
    setTimeout(closeMini, 600);
  }

  on($("#openSync"),"click",openMini);
  on($("#resyncBtn"),"click",openMini);
  on($("#miniClose"),"click",closeMini);
  on($("#sendOtpBtn"),"click",requestOtp);
  on($("#verifyOtpBtn"),"click",verifyOtp);
  on($("#resendOtpBtn"),"click",resendOtp);

  /* Details modal */
  const detailsModal=$("#detailsModal"), detailsClose=$("#detailsClose"), openDetailsBtn=$("#openDetailsBtn");
  on(openDetailsBtn,"click",()=>{ buildDetails(); detailsModal.hidden=false; });
  on(detailsClose,"click",()=> detailsModal.hidden=true);
  function buildDetails(){
    const rows=[["Account Email",localStorage.getItem(LS.email)||"—"],["contactId",localStorage.getItem(LS.cid)||"—"],["Results Embed",localStorage.getItem(LS.results)||"—"],["Results CSV",localStorage.getItem(LS.resultsCsv)||"—"],["Review Page",localStorage.getItem(LS.reviewPage)||"—"]];
    $("#detailsTable").innerHTML=`<table style="width:100%;border-collapse:collapse">
      ${rows.map(([k,v])=>`<tr><th style="text-align:left;padding:6px;border-bottom:1px solid var(--border)">${k}</th><td style="padding:6px;border-bottom:1px solid var(--border)">${linkify(v)}</td></tr>`).join("")}
    </table>`;
  }
  function linkify(v){ if(!v || v==='—') return '—'; try{ const u=new URL(v); return `<a href="${u}" target="_blank" rel="noopener">${u.hostname}</a>`;}catch{return v;} }

  /* Onboarding form */
  const obForm=$("#obForm"), obSave=$("#obSave"), obStatus=$("#obStatus");
  const serialize=f=>Object.fromEntries(new FormData(f).entries());
  function obHydrate(){ if(!obForm) return; try{const d=JSON.parse(localStorage.getItem(LS.draft)||"null"); if(!d) return; Object.entries(d).forEach(([k,v])=>{ if(obForm.elements[k]) obForm.elements[k].value=v; }); }catch{} }
  obHydrate();
  on(obForm,"input", ()=> localStorage.setItem(LS.draft, JSON.stringify(serialize(obForm))));
  on(obSave,"click", ()=>{ if(!obForm) return; localStorage.setItem(LS.draft, JSON.stringify(serialize(obForm))); if(obStatus){ obStatus.textContent="Draft saved ✓"; setTimeout(()=>obStatus.textContent="",1500);} });
  on(obForm,"submit", e=>{ e.preventDefault(); if(!obForm.checkValidity()){obForm.reportValidity();return;} if(obStatus) obStatus.textContent="Submitted ✓"; localStorage.removeItem(LS.draft); setTimeout(()=>{ if(obStatus) obStatus.textContent=""; },1500); });

  /* Initial hydrate + auto mini modal */
  hydrate();
  if(!localStorage.getItem(LS.cid)) openMini();
}

/* Run init when DOM is ready */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMyToolbox);
} else {
  initMyToolbox();
}
