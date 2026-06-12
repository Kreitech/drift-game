'use strict';
/* ============================================================
   THE STAR RIDE — secret endless level.
   ride the pod up through the meteor field, follow the cursor,
   survive. score climbs; milestones unlock new skies, stardust,
   and new ship forms — kept forever in the save.
   ============================================================ */
const StarRide={
  ship:{x:W/2,y:H-150}, meteors:[], dust:[], toasts:[], stars:[],
  score:0, runT:0, over:false, deadT:0, spawnAcc:0, shake:0, nearSeen:new Set(),
  /* milestone ladder — index into Save.data.mile */
  TIERS:[
    {at:250,  kind:'palette', name:'ember sky'},
    {at:600,  kind:'stars',   name:'starfall'},
    {at:1100, kind:'dust',    name:'stardust'},
    {at:1700, kind:'ship',    name:'dart'},
    {at:2600, kind:'palette', name:'emerald sky'},
    {at:3800, kind:'ship',    name:'manta'}
  ],
  begin(){
    // full run reset — score, level, ship, meteors, speed, spawners, sky
    this.score=0; this.runT=0; this.over=false; this.deadT=0;
    this.spawnAcc=0; this.shake=0; this.runMax=0;
    this.meteors.length=0; this.dust.length=0; this.toasts.length=0;
    this.nearSeen.clear();
    this.ship.x=W/2; this.ship.y=H-150;
    this.stars=[];
    for(let i=0;i<160;i++) this.stars.push({x:Math.random()*W,y:Math.random()*H,s:.6+Math.random()*1.6,v:.3+Math.random()*1.2});
    Au.startAmbient('star');
  },
  level(){ // milestones reached THIS run — every ride starts from the first ship & sky
    let l=0;
    for(let i=0;i<this.TIERS.length;i++) if(this.score>=this.TIERS[i].at) l=i+1;
    return l;
  },
  hasKind(kind,nth){ // is the nth occurrence of `kind` unlocked?
    let seen=0;
    const l=this.level();
    for(let i=0;i<l;i++) if(this.TIERS[i].kind===kind){ seen++; if(seen>=(nth||1)) return true; }
    return false;
  },
  speed(){ return Math.min(190+this.runT*13, 560); },
  update(dt,gt){
    if(this.over){
      this.deadT+=dt;
      this.shake=Math.max(0,this.shake-dt*8);
      for(let i=this.meteors.length-1;i>=0;i--){ const m=this.meteors[i];
        m.y+=m.vy*dt*.3; if(m.y>H+80) this.meteors.splice(i,1); }
      return;
    }
    this.runT+=dt;
    this.score+=dt*(18+this.runT*1.4);
    this.shake=Math.max(0,this.shake-dt*8);
    /* milestones crossing live (per run); lifetime record kept for the pips */
    const now=this.level();
    if(now>(this.runMax||0)){
      this.runMax=now;
      Au.sfx('unlock');
      this.toasts.push({tier:this.TIERS[now-1],life:2.6});
      if(now>(Save.data.mile||0)){ Save.data.mile=now; Save.put(); }
    }
    /* score milestone ticks */
    if(Math.floor(this.score/500)>Math.floor((this.score-dt*40)/500)) Au.sfx('tick');
    /* steering — the pod chases the cursor */
    const tx=clamp(mouse.x,40,W-40), ty=clamp(mouse.y,H*.3,H-60);
    this.ship.x+=(tx-this.ship.x)*Math.min(1,dt*7);
    this.ship.y+=(ty-this.ship.y)*Math.min(1,dt*5);
    /* starfield scroll */
    const sp=this.speed();
    for(const s of this.stars){ s.y+=s.v*sp*dt*.5; if(s.y>H+4){ s.y=-4; s.x=Math.random()*W; } }
    /* stardust trail */
    if(this.hasKind('dust')){
      if(Math.random()<dt*30) this.dust.push({x:this.ship.x+(Math.random()-.5)*16,y:this.ship.y+26,life:1,r:1.4+Math.random()*2});
    }
    for(let i=this.dust.length-1;i>=0;i--){ const d=this.dust[i];
      d.y+=sp*dt*.55; d.life-=dt*1.4; if(d.life<=0) this.dust.splice(i,1); }
    /* meteors */
    this.spawnAcc+=dt*(.9+this.runT*.05);
    while(this.spawnAcc>1){
      this.spawnAcc-=1;
      const r=12+Math.random()*24;
      this.meteors.push({ id:Math.random(), x:30+Math.random()*(W-60), y:-60,
        r, vy:(.65+Math.random()*.7), vx:(Math.random()-.5)*60,
        rot:Math.random()*TAU, vr:(Math.random()-.5)*2.4, seed:Math.floor(Math.random()*999) });
    }
    for(let i=this.meteors.length-1;i>=0;i--){
      const m=this.meteors[i];
      m.y+=m.vy*sp*dt; m.x+=m.vx*dt; m.rot+=m.vr*dt;
      if(m.y>H+70){ this.meteors.splice(i,1); this.score+=12; continue; }
      const d=Math.hypot(m.x-this.ship.x,m.y-this.ship.y);
      if(d < m.r*.78+15){ this.die(); return; }
      if(d < m.r+46 && !this.nearSeen.has(m.id)){
        this.nearSeen.add(m.id); this.score+=8; Au.sfx('whoosh');
        burst((m.x+this.ship.x)/2,(m.y+this.ship.y)/2,'rgba(255,235,180,A)',4,40);
      }
    }
    for(let i=this.toasts.length-1;i>=0;i--){ this.toasts[i].life-=dt; if(this.toasts[i].life<=0) this.toasts.splice(i,1); }
  },
  die(){
    this.over=true; this.deadT=0; this.shake=1;
    Au.sfx('boom');
    burst(this.ship.x,this.ship.y,'rgba(255,200,120,A)',34,170);
    burst(this.ship.x,this.ship.y,'rgba(255,240,210,A)',16,90);
    const sc=Math.floor(this.score);
    if(sc>Save.data.best){ Save.data.best=sc; Save.put(); }
  },
  palette(){
    // unlockable skies; subtle hue breathing within each
    if(this.hasKind('palette',2)) return [[0,'#04140e'],[.5,'#0a2c22'],[1,'#11403a']];   // emerald
    if(this.hasKind('palette',1)) return [[0,'#160810'],[.5,'#33121f'],[1,'#4a1c24']];   // ember
    return [[0,'#05051a'],[.5,'#0d0d33'],[1,'#161048']];                                  // dusk navy
  },
  shipForm(){ return this.hasKind('ship',2)?2 : this.hasKind('ship',1)?1 : 0; },
  render(gt){
    const sp=this.speed();
    let shx=0,shy=0;
    if(this.shake>0){ shx=(hsh(Math.floor(gt*60))-.5)*10*this.shake; shy=(hsh(Math.floor(gt*55)+5)-.5)*10*this.shake; }
    ctx.save(); ctx.translate(shx,shy);
    skyGrad(this.palette());
    /* nebula breath */
    for(let i=0;i<3;i++)
      blob(W*.2+i*W*.3, H*.3+Math.sin(gt*.2+i*2)*60, 130+i*40, i*9, gt*.1,
           `hsla(${(gt*4+i*60)%360},65%,55%,.025)`, .15);
    /* stars — denser once 'starfall' is unlocked */
    const starN=this.hasKind('stars')?this.stars.length:55;
    for(let i=0;i<starN;i++){ const s=this.stars[i];
      const stretch=1+sp*.004*s.v;
      ctx.fillStyle=`rgba(230,238,255,${(.3+s.v*.25).toFixed(3)})`;
      ctx.fillRect(s.x,s.y,s.s,s.s*stretch*2);
    }
    /* stardust */
    for(const d of this.dust){
      ctx.fillStyle=`rgba(200,235,255,${(d.life*.6).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(d.x,d.y,d.r*d.life,0,TAU); ctx.fill();
    }
    /* meteors */
    for(const m of this.meteors) this.meteor(m,gt);
    /* the ship */
    if(!this.over) this.drawShip(this.ship.x,this.ship.y,gt);
    ctx.restore();
    /* score */
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='700 38px "Segoe UI", system-ui, sans-serif';
    glow(W/2,46,70,'rgba(255,240,190,A)','.12');
    ctx.fillStyle='rgba(255,245,225,.92)';
    ctx.fillText(Math.floor(this.score), W/2, 44);
    if(Save.data.best>0 && !this.over){
      ctx.font='500 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle='rgba(255,235,190,.4)';
      ctx.fillText('✦ '+Math.floor(Math.max(Save.data.best,this.score)), W/2, 76);
    }
    ctx.restore();
    /* milestone toasts */
    let ti=0;
    for(const tst of this.toasts){
      const a=Math.min(tst.life,1)*Math.min((2.6-tst.life)*3,1);
      const ty=H*.28-ti*54-(2.6-tst.life)*12;
      ctx.save(); ctx.globalAlpha=a;
      glow(W/2,ty,60,'rgba(255,235,170,A)','.25');
      ctx.strokeStyle='rgba(255,240,200,.8)'; ctx.lineWidth=1.5;
      blobPath(W/2,ty,30,17,gt,.08,.6); ctx.stroke();
      this.tierIcon(tst.tier,W/2,ty,gt);
      ctx.restore(); ti++;
    }
    /* game over veil */
    if(this.over && this.deadT>.5){
      const a=Math.min((this.deadT-.5)*1.5,1);
      ctx.fillStyle=`rgba(4,4,14,${(a*.62).toFixed(3)})`; ctx.fillRect(0,0,W,H);
      ctx.save(); ctx.globalAlpha=a;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='700 64px "Segoe UI", system-ui, sans-serif';
      glow(W/2,H*.34,120,'rgba(255,240,190,A)','.18');
      ctx.fillStyle='rgba(255,245,225,.95)';
      ctx.fillText(Math.floor(this.score), W/2, H*.34);
      ctx.font='500 18px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle='rgba(255,235,190,.55)';
      ctx.fillText('✦ '+Save.data.best, W/2, H*.34+52);
      // milestone pips
      for(let i=0;i<this.TIERS.length;i++){
        const px2=W/2+(i-(this.TIERS.length-1)/2)*30, py2=H*.34+92;
        const got=(Save.data.mile||0)>i;
        ctx.fillStyle=got?'rgba(255,225,140,.9)':'rgba(255,255,255,.15)';
        ctx.beginPath(); ctx.arc(px2,py2,got?5:3.6,0,TAU); ctx.fill();
      }
      // replay ring
      const rp=(gt*.6)%1, ry=H*.62;
      ctx.strokeStyle=`rgba(190,250,215,${(.5*(1-rp)).toFixed(3)})`; ctx.lineWidth=2;
      blobPath(W/2,ry,16+rp*22,13,gt*2,.1); ctx.stroke();
      ctx.strokeStyle='rgba(220,250,235,.9)'; ctx.lineWidth=2.4; ctx.lineCap='round';
      ctx.beginPath(); ctx.arc(W/2,ry,9,-.6,4.2); ctx.stroke();
      const tipA=4.2, tx2=W/2+Math.cos(tipA)*9, ty2=ry+Math.sin(tipA)*9;
      ctx.fillStyle='rgba(220,250,235,.9)';
      ctx.beginPath(); ctx.moveTo(tx2+4,ty2-3); ctx.lineTo(tx2-3,ty2-5); ctx.lineTo(tx2+1,ty2+4); ctx.closePath(); ctx.fill();
      // home — little planet, lower left of replay
      const hx=W/2-110, hy=ry;
      ctx.strokeStyle='rgba(200,220,250,.7)'; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.arc(hx,hy,11,0,TAU); ctx.stroke();
      ctx.fillStyle='rgba(160,200,250,.5)';
      ctx.beginPath(); ctx.arc(hx,hy,7,0,TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx,hy,15,4,-.4,0,TAU); ctx.stroke();
      ctx.restore();
    }
  },
  tierIcon(tier,x,y,gt){
    if(tier.kind==='palette'){
      const cols=tier.name==='ember sky'?['#4a1c24','#a85a40']:['#0a2c22','#3aa884'];
      ctx.fillStyle=cols[0]; ctx.beginPath(); ctx.arc(x,y,11,Math.PI/2,Math.PI*1.5); ctx.fill();
      ctx.fillStyle=cols[1]; ctx.beginPath(); ctx.arc(x,y,11,-Math.PI/2,Math.PI/2); ctx.fill();
    } else if(tier.kind==='stars'){
      for(let i=0;i<5;i++){ ctx.fillStyle='rgba(255,250,225,.9)';
        ctx.beginPath(); ctx.arc(x+(hsh(i*3)-.5)*26,y+(hsh(i*7)-.5)*22,1.4+hsh(i)*1.4,0,TAU); ctx.fill(); }
    } else if(tier.kind==='dust'){
      for(let i=0;i<4;i++){ ctx.fillStyle=`rgba(200,235,255,${(.9-i*.2).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(x,y-8+i*6,3-i*.5,0,TAU); ctx.fill(); }
    } else { // ship silhouette
      ctx.fillStyle='rgba(255,240,200,.9)';
      ctx.beginPath(); ctx.moveTo(x,y-11); ctx.lineTo(x+8,y+9); ctx.lineTo(x,y+4); ctx.lineTo(x-8,y+9); ctx.closePath(); ctx.fill();
    }
  },
  meteor(m,gt){
    ctx.save(); ctx.translate(m.x,m.y); ctx.rotate(m.rot);
    // faint motion smear
    ctx.fillStyle='rgba(255,180,120,.07)';
    ctx.beginPath(); ctx.ellipse(0,-m.r*1.5,m.r*.5,m.r*1.4,0,0,TAU); ctx.fill();
    const g=ctx.createRadialGradient(-m.r*.3,-m.r*.3,m.r*.1,0,0,m.r*1.05);
    g.addColorStop(0,'#7a5a44'); g.addColorStop(1,'#33221a');
    ctx.fillStyle=g;
    blobPath(0,0,m.r,m.seed,gt*.3,.1); ctx.fill();
    // craters
    ctx.fillStyle='rgba(0,0,0,.3)';
    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.arc((hsh(m.seed+i)-.5)*m.r,(hsh(m.seed+i*3)-.5)*m.r,m.r*(.14+hsh(m.seed+i*7)*.12),0,TAU); ctx.fill();
    }
    // hot rim from below
    ctx.strokeStyle='rgba(255,170,110,.25)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,0,m.r*.92,.4,2.2); ctx.stroke();
    ctx.restore();
  },
  drawShip(x,y,gt){
    const form=this.shipForm();
    const tilt=clamp((mouse.x-x)*.004,-.5,.5);
    if(form===0){
      ctx.save(); ctx.translate(x,y); ctx.rotate(tilt);
      drawPod(0,0,gt,{scale:.72,exhaust:1,face:true});
      ctx.restore();
    } else if(form===1){ // the dart
      ctx.save(); ctx.translate(x,y); ctx.rotate(tilt);
      glow(0,0,52,'rgba(150,220,255,A)','.2');
      const g=ctx.createLinearGradient(0,-26,0,22);
      g.addColorStop(0,'#e8f4ff'); g.addColorStop(1,'#5d83ab');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.moveTo(0,-26);
      ctx.bezierCurveTo(13,-6,15,8,18,20);
      ctx.quadraticCurveTo(0,10,-18,20);
      ctx.bezierCurveTo(-15,8,-13,-6,0,-26); ctx.fill();
      ctx.fillStyle='#1d2c3e';
      ctx.beginPath(); ctx.ellipse(0,-6,5,7,0,0,TAU); ctx.fill();
      ctx.fillStyle='rgba(160,240,195,.9)';
      ctx.beginPath(); ctx.arc(0,-8,1.8,0,TAU); ctx.fill();
      for(let i=0;i<3;i++){ const p=(gt*2+i*.33)%1;
        ctx.fillStyle=`rgba(150,220,255,${((1-p)*.6).toFixed(3)})`;
        ctx.beginPath(); ctx.arc((hsh(i+Math.floor(gt*4))-.5)*10, 22+p*26, 2.6*(1-p),0,TAU); ctx.fill(); }
      ctx.restore();
    } else { // the manta
      ctx.save(); ctx.translate(x,y); ctx.rotate(tilt);
      glow(0,0,60,'rgba(190,160,255,A)','.22');
      const flap=Math.sin(gt*5)*.12;
      const g=ctx.createLinearGradient(-30,0,30,0);
      g.addColorStop(0,'#6a4a9e'); g.addColorStop(.5,'#b9a0f0'); g.addColorStop(1,'#6a4a9e');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.moveTo(0,-18);
      ctx.bezierCurveTo(26,-10+flap*40,40,6+flap*60,34,14+flap*40);
      ctx.quadraticCurveTo(10,6,0,16);
      ctx.quadraticCurveTo(-10,6,-34,14-flap*40);
      ctx.bezierCurveTo(-40,6-flap*60,-26,-10-flap*40,0,-18); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.arc(-3,-6,2,0,TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(3,-6,2,0,TAU); ctx.fill();
      // glowing wingtips
      blinker(-34,14-flap*40,2,3,gt*3,'rgba(220,190,255,A)');
      blinker(34,14+flap*40,2,4,gt*3,'rgba(220,190,255,A)');
      for(let i=0;i<3;i++){ const p=(gt*2+i*.33)%1;
        ctx.fillStyle=`rgba(200,170,255,${((1-p)*.5).toFixed(3)})`;
        ctx.beginPath(); ctx.arc((hsh(i+Math.floor(gt*4))-.5)*12, 18+p*28, 2.6*(1-p),0,TAU); ctx.fill(); }
      ctx.restore();
    }
  },
  onClick(x,y){
    if(!this.over || this.deadT<.6) return;
    if(Math.hypot(x-(W/2-110),y-H*.62)<26){
      Au.sfx('hover');
      Trans.start(0,x,y,()=>{ GameState.mode='title'; resetRun(); Au.startAmbient(4); });
      return;
    }
    Au.sfx('pick');
    this.begin();
  },
  onMove(){ return this.over&&this.deadT>.6 ? 'hot' : 'default'; }
};
