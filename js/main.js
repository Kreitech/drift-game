'use strict';
/* ============================================================
   TRANSITION — living ink: a spore-cloud blooms from the door,
   swallows the world, then dilates open around the traveller
   ============================================================ */
const tcv=document.createElement('canvas'); tcv.width=W; tcv.height=H;
const tctx=tcv.getContext('2d');
function inkPath(c,x,y,r,t){
  c.beginPath(); c.arc(x,y,r,0,TAU);
  for(let i=0;i<12;i++){
    const a=i/12*TAU+hsh(i)*1.8;
    const orbit=r*(.96+Math.sin(t*2.2+i*1.7)*.06);
    const br=r*.2*(.5+hsh(i*3));
    c.moveTo(x+Math.cos(a)*orbit+br, y+Math.sin(a)*orbit);
    c.arc(x+Math.cos(a)*orbit, y+Math.sin(a)*orbit, br, 0, TAU);
  }
}
const Trans={
  active:false, phase:0, p:0, to:-1, ox:0, oy:0, cb:null,
  start(to,x,y,cb){ if(this.active) return;
    this.active=true; this.phase=0; this.p=0; this.to=to; this.ox=x; this.oy=y; this.cb=cb||null; },
  update(dt){
    if(!this.active) return;
    this.p+=dt*(this.phase===0?.85:.7);
    if(this.phase===0 && this.p>=1){
      this.phase=1; this.p=0;
      if(this.cb){ this.cb(); }
      else {
        GameState.scene=this.to;
        scenes[this.to].enter();
        Au.startAmbient(this.to);
      }
      GameState.idle=0;
      if(GameState.mode==='game'){
        const sc=scenes[GameState.scene];
        this.ox=sc.ax; this.oy=sc.ay-40;
      } else { this.ox=W/2; this.oy=H/2; }
    } else if(this.phase===1 && this.p>=1){ this.active=false; }
  },
  render(t){
    if(!this.active) return;
    const maxR=Math.hypot(W,H)*.72;
    const ig=tctx.createRadialGradient(this.ox,this.oy,20,this.ox,this.oy,maxR);
    ig.addColorStop(0,'#1a2440'); ig.addColorStop(.4,'#0e1526'); ig.addColorStop(1,'#04060c');
    if(this.phase===0){
      const r=ease(this.p)*maxR*1.25;
      tctx.clearRect(0,0,W,H);
      tctx.globalCompositeOperation='source-over';
      tctx.fillStyle=ig; inkPath(tctx,this.ox,this.oy,r,t); tctx.fill();
      ctx.drawImage(tcv,0,0);
      this.sporeRim(this.ox,this.oy,r,t,this.p);
    } else {
      const r=ease(this.p)*maxR*1.25;
      tctx.globalCompositeOperation='source-over';
      tctx.clearRect(0,0,W,H);
      tctx.fillStyle=ig; tctx.fillRect(0,0,W,H);
      tctx.globalCompositeOperation='destination-out';
      inkPath(tctx,this.ox,this.oy,r,t); tctx.fill();
      ctx.drawImage(tcv,0,0);
      this.sporeRim(this.ox,this.oy,r,t,1-this.p);
    }
  },
  sporeRim(x,y,r,t,a){
    for(let i=0;i<16;i++){
      const ang=i/16*TAU+t*.5+hsh(i*5)*3;
      const rr=r*(1+Math.sin(t*3+i)*.04);
      const sx=x+Math.cos(ang)*rr, sy=y+Math.sin(ang)*rr;
      if(sx<-20||sx>W+20||sy<-20||sy>H+20) continue;
      ctx.fillStyle=`rgba(160,235,200,${(a*.5*(0.4+hsh(i*7))).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(sx,sy,1.5+hsh(i)*2.5,0,TAU); ctx.fill();
    }
  }
};

/* ============================================================
   CUSTOM CURSOR + click ripples
   ============================================================ */
function drawCursor(t){
  if(!mouse.inside) return;
  const {x,y}=mouse;
  ctx.save();
  if(mouse.cursor==='hot'){
    const p=.5+Math.sin(t*4)*.2;
    ctx.strokeStyle='rgba(170,240,200,.9)'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.arc(x,y,9+p*3,0,TAU); ctx.stroke();
    ctx.fillStyle='rgba(190,250,215,.95)';
    for(let i=0;i<4;i++){ const a=i/4*TAU+t*1.2;
      ctx.beginPath(); ctx.arc(x+Math.cos(a)*(13+p*3),y+Math.sin(a)*(13+p*3),1.8,0,TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(x,y,2.4,0,TAU); ctx.fill();
  } else if(mouse.cursor==='grab'||mouse.cursor==='grabbing'){
    ctx.strokeStyle='rgba(255,215,150,.9)'; ctx.lineWidth=1.8;
    ctx.setLineDash(mouse.cursor==='grab'?[4,4]:[]);
    ctx.beginPath(); ctx.arc(x,y,mouse.cursor==='grab'?10:7,0,TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,225,170,.95)';
    ctx.beginPath(); ctx.arc(x,y,2.2,0,TAU); ctx.fill();
  } else if(mouse.cursor==='rotate'){
    ctx.strokeStyle='rgba(180,225,255,.95)'; ctx.lineWidth=2; ctx.lineCap='round';
    const a0=t*1.5;
    [0,Math.PI].forEach(off=>{
      ctx.beginPath(); ctx.arc(x,y,11,a0+off,a0+off+1.5); ctx.stroke();
      const tipA=a0+off+1.5;
      const tx2=x+Math.cos(tipA)*11, ty2=y+Math.sin(tipA)*11;
      ctx.beginPath(); ctx.moveTo(tx2,ty2);
      ctx.lineTo(tx2+Math.cos(tipA+2.6)*5,ty2+Math.sin(tipA+2.6)*5);
      ctx.moveTo(tx2,ty2);
      ctx.lineTo(tx2+Math.cos(tipA+4.2)*5,ty2+Math.sin(tipA+4.2)*5); ctx.stroke();
    });
    ctx.fillStyle='rgba(200,235,255,.95)';
    ctx.beginPath(); ctx.arc(x,y,2.2,0,TAU); ctx.fill();
  } else {
    glow(x,y,14,'rgba(200,240,220,A)','.25');
    ctx.fillStyle='rgba(220,245,235,.9)';
    ctx.beginPath(); ctx.arc(x,y,2.6,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(220,245,235,.25)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(x,y,7,0,TAU); ctx.stroke();
  }
  ctx.restore();
}
function drawRipples(dt){
  for(let i=ripples.length-1;i>=0;i--){
    const r=ripples[i];
    r.r+=110*dt; r.life-=dt*2.2;
    if(r.life<=0){ripples.splice(i,1);continue;}
    ctx.strokeStyle=`rgba(190,245,215,${(r.life*.7).toFixed(3)})`;
    ctx.lineWidth=2*r.life;
    blobPath(r.x,r.y,r.r,9,GameState.t*3,.1); ctx.stroke();
  }
}

/* ============================================================
   RUN RESET — fresh story without reloading the page
   ============================================================ */
const scenes=[SceneJungle,SceneCavern,SceneGears,SceneGeyser,SceneSummit];
function resetRun(){
  GameState.freshFlags();
  GameState.inventory.length=0;
  GameState.selected=null;
  GameState.scene=0;
  GameState.idle=0;
  scenes.forEach(s=>s.reset&&s.reset());
  Inv.refresh();
}

/* ============================================================
   VIEWPORT + FULLSCREEN
   ============================================================ */
const stageEl=document.getElementById('stage');
const fullscreenBtn=document.getElementById('fullscreen');
function updateViewportVars(){
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}
function isFullscreen(){
  return document.fullscreenElement===stageEl || document.body.classList.contains('pseudo-fullscreen');
}
function syncFullscreenButton(){
  fullscreenBtn.classList.toggle('on', isFullscreen());
}
async function toggleFullscreen(){
  if(isFullscreen()){
    document.body.classList.remove('pseudo-fullscreen');
    if(document.fullscreenElement) await document.exitFullscreen();
    syncFullscreenButton();
    updateViewportVars();
    return;
  }
  if(stageEl.requestFullscreen){
    try {
      await stageEl.requestFullscreen();
    } catch(e) {
      document.body.classList.add('pseudo-fullscreen');
    }
  } else {
    document.body.classList.add('pseudo-fullscreen');
  }
  syncFullscreenButton();
  updateViewportVars();
}
updateViewportVars();
window.addEventListener('resize',updateViewportVars);
window.addEventListener('orientationchange',()=>setTimeout(updateViewportVars,250));
if(window.visualViewport) window.visualViewport.addEventListener('resize',updateViewportVars);
document.addEventListener('fullscreenchange',()=>{
  if(document.fullscreenElement===stageEl) document.body.classList.remove('pseudo-fullscreen');
  syncFullscreenButton();
  updateViewportVars();
});
fullscreenBtn.addEventListener('pointerdown',e=>e.stopPropagation());
fullscreenBtn.addEventListener('click',e=>{ e.stopPropagation(); toggleFullscreen(); });

/* ============================================================
   INPUT
   ============================================================ */
function activeCtl(){
  const m=GameState.mode;
  return m==='title'?Title : m==='intro'?Intro : m==='credits'?Credits
       : m==='star'?StarRide : scenes[GameState.scene];
}
function evPos(e){
  const rect=cv.getBoundingClientRect();
  return [(e.clientX-rect.left)*(W/rect.width),(e.clientY-rect.top)*(H/rect.height)];
}
// the carried cat answers from the backpack, in any scene
function catHit(x,y){
  if(GameState.mode!=='game' || !GameState.flags.catPicked) return false;
  const sc=scenes[GameState.scene];
  return Math.hypot(x-(sc.ax-15),y-(sc.ay-58))<24;
}
function tryCatClick(x,y){
  if(!catHit(x,y)) return false;
  const sc=scenes[GameState.scene];
  Au.sfx('meow');
  burst(sc.ax-15,sc.ay-62,'rgba(255,180,210,A)',6,40);
  return true;
}
function pressAt(e, sourceEvent){
  (sourceEvent||e).preventDefault();
  Au.ensure();
  const [x,y]=evPos(e); mouse.x=x; mouse.y=y; mouse.inside=true;
  mouse.down=true;
  ripples.push({x,y,r:5,life:1});
  GameState.idle=0;
  if(Trans.active) return;
  if(tryCatClick(x,y)) return;
  activeCtl().onClick(x,y);
}
function moveAt(e){
  const [x,y]=evPos(e); mouse.x=x; mouse.y=y; mouse.inside=true;
}
function releaseInput(){
  mouse.down=false;
  const c=activeCtl(); if(c.onUp) c.onUp();
}
if(window.PointerEvent){
  let pointerId=null;
  cv.addEventListener('pointerdown',e=>{
    pointerId=e.pointerId;
    if(cv.setPointerCapture) cv.setPointerCapture(pointerId);
    pressAt(e);
  });
  cv.addEventListener('pointermove',e=>{
    if(pointerId!==null && e.pointerId!==pointerId) return;
    moveAt(e);
  });
  cv.addEventListener('pointerup',e=>{
    if(pointerId!==null && e.pointerId!==pointerId) return;
    if(cv.releasePointerCapture) cv.releasePointerCapture(e.pointerId);
    pointerId=null; releaseInput();
  });
  cv.addEventListener('pointercancel',()=>{ pointerId=null; mouse.inside=false; releaseInput(); });
  cv.addEventListener('pointerleave',()=>{ if(pointerId===null) mouse.inside=false; });
} else {
  cv.addEventListener('mousemove',moveAt);
  cv.addEventListener('mouseleave',()=>{ mouse.inside=false; releaseInput(); });
  cv.addEventListener('mousedown',pressAt);
  window.addEventListener('mouseup',releaseInput);
  cv.addEventListener('touchstart',e=>pressAt(e.touches[0],e),{passive:false});
  cv.addEventListener('touchmove',e=>{ e.preventDefault(); moveAt(e.touches[0]); },{passive:false});
  cv.addEventListener('touchend',()=>{ mouse.inside=false; releaseInput(); });
}
document.getElementById('mute').addEventListener('pointerdown',e=>e.stopPropagation());
document.getElementById('mute').addEventListener('click',e=>{
  e.stopPropagation(); Au.ensure(); Au.toggleMute(); });

/* ============================================================
   MAIN LOOP
   ============================================================ */
let last=performance.now();
function frame(now){
  const dt=clamp((now-last)/1000,0,.05); last=now;
  GameState.t+=dt;
  if(GameState.mode==='game') GameState.idle+=dt;
  const ctl=activeCtl();
  ctl.update(dt,GameState.t);
  Trans.update(dt);
  Au.tickAmbient();

  ctx.clearRect(0,0,W,H);
  ctl.render(GameState.t);
  drawBursts(dt);
  drawBubble(GameState.t);
  Trans.render(GameState.t);
  drawRipples(dt);

  // inventory belongs to gameplay only
  Inv.el.style.visibility = GameState.mode==='game' ? 'visible' : 'hidden';
  // live cursor (recomputed every frame so hovers track animation)
  mouse.cursor = Trans.active ? 'default'
               : (mouse.inside ? (catHit(mouse.x,mouse.y)?'hot':(ctl.onMove(mouse.x,mouse.y)||'default')) : 'default');
  drawCursor(GameState.t);

  requestAnimationFrame(frame);
}
Save.load();
SceneJungle.enter();
SceneCavern.enter();
SceneGeyser.enter();
Inv.refresh();
requestAnimationFrame(frame);
