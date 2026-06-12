'use strict';
/* ============================================================
   TITLE — the traveller adrift, before the story begins.
   shows the kinder-egg collection; after the secret is found,
   a pulsing star offers the ride directly.
   ============================================================ */
const Title={
  drift: makeDrift(36,'rgba(190,230,255,A)',1.7,6),
  _going:false,
  update(dt,t){},
  render(t){
    skyGrad([[0,'#04040f'],[.5,'#0a0c26'],[1,'#16113a']]);
    for(let i=0;i<150;i++){ const sx=hsh(i*19)*W, sy=hsh(i*29)*H;
      ctx.fillStyle=`rgba(230,238,255,${(.25+Math.sin(t*.7+i*1.3)*.2).toFixed(3)})`;
      ctx.fillRect(sx,sy,1.4,1.4); }
    // the jungle planet, waiting below
    const ppx=720+px(-.01), ppy=470+py(-.01);
    glow(ppx,ppy,260,'rgba(140,110,230,A)','.14');
    const pg=ctx.createRadialGradient(ppx-50,ppy-50,20,ppx,ppy,190);
    pg.addColorStop(0,'#3b2a6e'); pg.addColorStop(.7,'#241a4e'); pg.addColorStop(1,'#150f30');
    ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(ppx,ppy,190,0,TAU); ctx.fill();
    for(let i=0;i<7;i++)
      blob(ppx+(hsh(i*3)-.5)*260, ppy+(hsh(i*7)-.5)*260, 24+hsh(i)*30, i*9, t*.2, 'rgba(90,200,140,.12)', .15);
    ctx.strokeStyle='rgba(200,180,255,.3)'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.ellipse(ppx,ppy,265,52,-.32,0,TAU); ctx.stroke();
    ctx.strokeStyle='rgba(200,180,255,.12)'; ctx.lineWidth=12;
    ctx.beginPath(); ctx.ellipse(ppx,ppy,290,60,-.32,0,TAU); ctx.stroke();
    // the astronaut, weightless
    ctx.save();
    ctx.translate(265+Math.sin(t*.3)*16+px(.012), 320+Math.sin(t*.45)*20+py(.012));
    ctx.rotate(Math.sin(t*.2)*.2);
    drawAstronaut(0,0,t,1.5,false,false);
    ctx.restore();
    this.drift.draw(t,.08);
    // title — letters breathing one by one
    const word='DRIFT';
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
    for(let i=0;i<word.length;i++){
      const lx=W/2+(i-2)*82, ly=150+Math.sin(t*.9+i*.65)*7;
      glow(lx,ly,46,'rgba(160,220,250,A)',(.10+Math.sin(t*1.1+i)*.05).toFixed(3));
      ctx.save(); ctx.translate(lx,ly); ctx.rotate(Math.sin(t*.5+i*1.2)*.04);
      ctx.font='600 86px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle='rgba(235,245,252,.95)';
      ctx.fillText(word[i],0,0);
      ctx.restore();
    }
    ctx.restore();
    for(let i=0;i<5;i++){ const a=.3+Math.sin(t*1.4+i*.8)*.25;
      ctx.fillStyle=`rgba(170,230,200,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(W/2+(i-2)*26,222,2.2,0,TAU); ctx.fill(); }
    // start affordance: pulsing ring + play seed
    const p=(t*.6)%1, sy2=H*.74;
    ctx.strokeStyle=`rgba(190,250,215,${(.55*(1-p)).toFixed(3)})`; ctx.lineWidth=2;
    blobPath(W/2,sy2,16+p*26,13,t*2,.1); ctx.stroke();
    ctx.fillStyle='rgba(220,250,235,.92)';
    ctx.beginPath(); ctx.moveTo(W/2-6,sy2-10); ctx.quadraticCurveTo(W/2+13,sy2,W/2-6,sy2+10);
    ctx.quadraticCurveTo(W/2-2,sy2,W/2-6,sy2-10); ctx.fill();
    /* the kinder-egg collection */
    for(let i=0;i<5;i++){
      const ex=W/2+(i-2)*52, ey=H-44;
      if(Save.data.eggs[i]) drawEgg(ex,ey,14,t);
      else {
        drawEgg(ex,ey,14,t,true);
        const sp=.15+Math.sin(t*1.8+i)*.08;
        ctx.strokeStyle=`rgba(255,225,150,${sp.toFixed(3)})`; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(ex,ey,13,0,TAU); ctx.stroke();
      }
    }
    /* secret ride — only after the shooting star was caught */
    if(Save.data.secret){
      const sx2=58, sy3=56;
      const pulse=.6+Math.sin(t*1.6)*.3;
      glow(sx2,sy3,42,'rgba(255,230,160,A)',(pulse*.3).toFixed(3));
      ctx.save(); ctx.translate(sx2,sy3); ctx.rotate(t*.4); ctx.scale(pulse,pulse);
      ctx.fillStyle='rgba(255,240,200,.95)';
      for(let i=0;i<8;i++){ ctx.rotate(TAU/8); const L=i%2?8:17;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(3.5,-3.5,0,-L);
        ctx.quadraticCurveTo(-3.5,-3.5,0,0); ctx.fill(); }
      ctx.restore();
      if(Save.data.best>0){
        ctx.save(); ctx.textAlign='center'; ctx.font='600 13px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle='rgba(255,235,180,.55)';
        ctx.fillText(Math.floor(Save.data.best), sx2, sy3+34);
        ctx.restore();
      }
    }
    const vg=ctx.createRadialGradient(W/2,H*.45,H*.35,W/2,H*.5,H);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(2,2,10,.5)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  },
  onClick(x,y){
    if(this._going) return;
    if(Save.data.secret && Math.hypot(x-58,y-56)<30){
      this._going=true; Au.sfx('shimmer');
      Trans.start(0,x,y,()=>{ Title._going=false; GameState.mode='star'; StarRide.begin(); });
      return;
    }
    this._going=true;
    Au.sfx('pick');
    resetRun();
    Trans.start(0,x,y,()=>{ Title._going=false; GameState.mode='intro'; Intro.reset(); Au.startAmbient(4); });
  },
  onMove(x,y){
    if(Save.data.secret && Math.hypot(x-58,y-56)<30) return 'hot';
    return 'hot';
  }
};

/* ============================================================
   INTRO — wordless prologue: a quiet voyage, a stray spore-rock,
   a long fall, and a thought: the tower. click skips.
   ============================================================ */
const Intro={
  t:0, done:false, smoke:[], _ev:{},
  reset(){ this.t=0; this.done=false; this.smoke.length=0; this._ev={}; },
  ev(key,time,fn){ if(this.t>=time && !this._ev[key]){ this._ev[key]=1; fn(); } },
  podPos(){
    const t=this.t;
    if(t<4) return [lerp(-90,430,t/4), 185+Math.sin(t*1.2)*10, Math.sin(t*.8)*.06];
    if(t<8){ const p=(t-4)/4;
      return [lerp(430,560,p), lerp(185,440,p*p), p*p*7.2]; }
    return [560,440,7.2];
  },
  update(dt,gt){
    this.t+=dt; const t=this.t;
    this.ev('hit',4,()=>{ Au.thud(70,.3); Au.sfx('shimmer');
      burst(430,185,'rgba(255,200,120,A)',26,150); });
    this.ev('fallwind',4.4,()=>Au.splashy(.1,3.4,300,1400));
    this.ev('crash',8,()=>{ Au.thud(40,.45); Au.sfx('door');
      burst(560,470,'rgba(200,170,140,A)',34,170); Au.startAmbient(0); });
    this.ev('out',9.6,()=>{ burst(505,510,'rgba(220,230,240,A)',10,50); Au.sfx('pick'); });
    this.ev('think1',10.6,()=>{ think(ICON.broken,470,465); Au.sfx('deny'); });
    this.ev('think2',12.8,()=>{ think(ICON.signal,470,465); Au.sfx('melody'); });
    this.ev('fin',15.4,()=>this.finish());
    if(t>4.2&&t<8){ const [sx,sy]=this.podPos();
      if(Math.random()<dt*16) this.smoke.push({x:sx+(Math.random()-.5)*10,y:sy,r:3+Math.random()*4,life:1,vx:(Math.random()-.5)*22,vy:-14}); }
    if(t>=8.4 && Math.random()<dt*4)
      this.smoke.push({x:585+(Math.random()-.5)*26,y:455,r:5,life:1,vx:(Math.random()-.5)*9,vy:-26});
    for(let i=this.smoke.length-1;i>=0;i--){ const s=this.smoke[i];
      s.x+=s.vx*dt; s.y+=s.vy*dt; s.r+=14*dt; s.life-=dt*.55;
      if(s.life<=0) this.smoke.splice(i,1); }
  },
  render(gt){
    const t=this.t;
    let shx=0,shy=0;
    if(t>4&&t<8.4){ const a=Math.min((t-4)*2,1)*4;
      shx=(hsh(Math.floor(gt*47))-.5)*a; shy=(hsh(Math.floor(gt*53)+9)-.5)*a; }
    ctx.save(); ctx.translate(shx,shy);
    if(t<8){
      skyGrad([[0,'#03030c'],[.6,'#0a0c24'],[1,'#141033']]);
      for(let i=0;i<130;i++){ const sx=hsh(i*19)*W, sy=hsh(i*29)*H;
        ctx.fillStyle=`rgba(230,238,255,${(.25+Math.sin(gt*.7+i*1.3)*.2).toFixed(3)})`;
        ctx.fillRect(sx,sy,1.4,1.4); }
      const ap=clamp((t-2.5)/5.5,0,1);
      const pr=lerp(430,760,ap), pcy=H+lerp(310,180,ap), pcx=W/2+70;
      glow(pcx,pcy-pr,180,'rgba(150,120,240,A)','.18');
      const pg=ctx.createRadialGradient(pcx,pcy-pr*.4,pr*.3,pcx,pcy,pr);
      pg.addColorStop(0,'#342462'); pg.addColorStop(1,'#181040');
      ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(pcx,pcy,pr,0,TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(pcx,pcy,pr,0,TAU); ctx.clip();
      for(let i=0;i<9;i++){ const a2=-Math.PI/2+(i/9-.5)*1.7;
        const rr2=pr*lerp(.78,.97,hsh(i*3));
        blob(pcx+Math.cos(a2)*rr2, pcy+Math.sin(a2)*rr2,
             22+hsh(i*5)*34, i*7, gt*.2, 'rgba(90,200,140,.13)', .12); }
      ctx.restore();
      ctx.strokeStyle='rgba(190,170,255,.22)'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(pcx,pcy,pr+3,-Math.PI*.82,-Math.PI*.18); ctx.stroke();
      if(t>2.8&&t<4.05){ const mp=(t-2.8)/1.2;
        const mx2=lerp(W+70,432,mp), my2=lerp(-60,183,mp);
        ctx.strokeStyle='rgba(255,180,110,.35)'; ctx.lineWidth=6; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(mx2+(W+70-mx2)*.25,my2+(-60-my2)*.25); ctx.lineTo(mx2,my2); ctx.stroke();
        glow(mx2,my2,34,'rgba(255,190,120,A)','.5');
        blob(mx2,my2,11,87,gt*3,'#c07840',.2); }
      const [sx,sy,rot]=this.podPos();
      drawPod(sx,sy,gt,{rot,face:t<4});
      if(t>4&&t<4.3){ ctx.fillStyle=`rgba(255,240,210,${((1-(t-4)/.3)*.55).toFixed(3)})`; ctx.fillRect(-20,-20,W+40,H+40); }
    } else {
      skyGrad([[0,'#070718'],[.45,'#141033'],[.8,'#2a1c4e'],[1,'#3b2a5e']]);
      for(let i=0;i<80;i++){ const sx=hsh(i*7)*W, sy=hsh(i*13)*H*.5;
        ctx.fillStyle=`rgba(235,240,255,${(.3+Math.sin(gt*.8+i*1.7)*.22).toFixed(3)})`;
        ctx.fillRect(sx,sy,1.4,1.4); }
      ridge(400,26,3,'#100c28');
      SceneJungle.mushTree(140,420,46,'#181040','#241556',gt,31,.6);
      SceneJungle.mushTree(820,415,52,'#181040','#2a1860',gt,32,.6);
      ridge(470,18,7,'#1b2335');
      ridge(520,12,15,'#141a29');
      breathPlant(180,540,56,18,gt,'#3a5a48','#67b78a');
      breathPlant(840,545,48,19,gt,'#3a5a48','#5aa37c');
      ctx.fillStyle='rgba(8,6,16,.5)';
      ctx.beginPath(); ctx.ellipse(640,492,110,12,-.06,0,TAU); ctx.fill();
      ctx.save(); ctx.translate(595,470); ctx.rotate(.52);
      drawPod(0,0,gt,{grounded:true,cracked:true});
      ctx.restore();
      for(let i=0;i<3;i++){ const ep=(gt*.8+i*.4)%1;
        ctx.fillStyle=`rgba(255,170,90,${((1-ep)*.5).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(585+(hsh(i*9)-.5)*40, 470-ep*30, 1.8,0,TAU); ctx.fill(); }
      if(t>9.6){ const wp=ease(clamp((t-9.6)/1.6,0,1));
        drawAstronaut(lerp(555,470,wp), lerp(500,522,wp), gt, 1, true); }
      if(t<8.7){ ctx.fillStyle=`rgba(255,240,220,${((1-(t-8)/.7)*.7).toFixed(3)})`; ctx.fillRect(-20,-20,W+40,H+40); }
      const vg=ctx.createRadialGradient(W/2,H*.45,H*.35,W/2,H*.5,H*.95);
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(4,2,14,.55)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }
    for(const s of this.smoke){
      ctx.fillStyle=`rgba(200,180,170,${(s.life*.16).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,TAU); ctx.fill();
    }
    ctx.restore();
    const p=(gt*.7)%1;
    ctx.strokeStyle=`rgba(220,240,230,${(.3*(1-p)).toFixed(3)})`; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(W-44,H-36,5+p*12,0,TAU); ctx.stroke();
    ctx.fillStyle='rgba(220,240,230,.5)';
    ctx.beginPath(); ctx.arc(W-44,H-36,2,0,TAU); ctx.fill();
  },
  onClick(){ this.finish(); },
  onMove(){ return 'default'; },
  finish(){
    if(this.done) return; this.done=true;
    Trans.start(0,W/2,H/2,()=>{
      GameState.mode='game'; GameState.scene=0;
      SceneJungle.enter(); Au.startAmbient(0);
    });
  }
};

/* ============================================================
   CREDITS — the pod sails home; the makers take a bow.
   a shooting star crosses the sky — catch it for the secret ride.
   ============================================================ */
const kreImg=new Image(); kreImg.src='logo-kreitech.png';
const nmeImg=new Image(); nmeImg.src='logo-nullmonkey.png';
const Credits={
  t:0,
  spores: makeDrift(28,'rgba(190,230,255,A)',1.6,6),
  rings:[], shoot:null, shootCool:3,
  begin(){ this.t=0; this.rings.length=0; this.shoot=null; this.shootCool=3; },
  update(dt,gt){
    this.t+=dt;
    if(this.t<5 && Math.random()<dt*2) this.rings.push({r:10,life:1});
    for(let i=this.rings.length-1;i>=0;i--){ const r0=this.rings[i];
      r0.r+=70*dt; r0.life-=dt*.6; if(r0.life<=0) this.rings.splice(i,1); }
    /* the shooting star */
    if(!this.shoot){
      this.shootCool-=dt;
      if(this.shootCool<=0 && this.t>2){
        const fromLeft=Math.random()<.5;
        this.shoot={ x: fromLeft?-60:W+60, y: 50+Math.random()*160,
                     vx:(fromLeft?1:-1)*(300+Math.random()*120), vy:60+Math.random()*70 };
        Au.sfx('whoosh');
      }
    } else {
      this.shoot.x+=this.shoot.vx*dt; this.shoot.y+=this.shoot.vy*dt;
      if(this.shoot.x<-90||this.shoot.x>W+90||this.shoot.y>H*.6){
        this.shoot=null; this.shootCool=2.5+Math.random()*3;
      }
    }
  },
  render(gt){
    const t=this.t;
    skyGrad([[0,'#04040e'],[.5,'#0b0e26'],[1,'#13102e']]);
    for(let i=0;i<150;i++){ const sx=hsh(i*19)*W, sy=hsh(i*29)*H;
      ctx.fillStyle=`rgba(230,238,255,${(.25+Math.sin(gt*.7+i*1.3)*.2).toFixed(3)})`;
      ctx.fillRect(sx,sy,1.4,1.4); }
    this.spores.draw(gt,.08);
    if(t<6){
      const p=ease(clamp(t/6,0,1));
      const podX=lerp(600,760,p), podY=lerp(420,-90,p);
      for(const r0 of this.rings){
        ctx.strokeStyle=`rgba(190,255,225,${(r0.life*.35).toFixed(3)})`; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(podX,podY,r0.r,0,TAU); ctx.stroke(); }
      drawPod(podX,podY,gt,{scale:lerp(.95,.4,p),exhaust:1,face:true});
    }
    /* maker cards */
    this.card(t,2.4,9.0,kreImg,330,130,gt,0);
    this.card(t,9.4,16.0,nmeImg,235,235,gt,1);
    /* the people — two small explorers of this universe */
    if(t>2.6&&t<16.2){
      const a=Math.min((t-2.6)*1.5,1)*Math.min(Math.max(16.2-t,0)*1.5,1);
      ctx.save(); ctx.globalAlpha=a;
      glow(W/2,H*.82,180,'rgba(170,200,255,A)','.07');
      drawKid(W/2-160,H*.85,gt,{s:1.02,girl:false});   // Maxi, 11
      drawKid(W/2+160,H*.85,gt,{s:.84,girl:true});     // Maite, 7
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='500 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle='rgba(225,235,250,.85)';
      ctx.fillText('Máximo', W/2-160, H*.85+24+Math.sin(gt*1.1)*2);
      ctx.fillText('Maite', W/2+160, H*.85+24+Math.sin(gt*1.1+1.5)*2);
      // a little star between them
      const sp=.5+Math.sin(gt*1.8)*.3;
      ctx.fillStyle=`rgba(255,240,200,${(sp).toFixed(3)})`;
      ctx.save(); ctx.translate(W/2,H*.82); ctx.rotate(gt*.6); ctx.scale(sp,sp);
      for(let i=0;i<4;i++){ ctx.rotate(TAU/4);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(2.5,-2.5,0,-9);
        ctx.quadraticCurveTo(-2.5,-2.5,0,0); ctx.fill(); }
      ctx.restore();
      ctx.restore();
    }
    /* the shooting star — catch it */
    if(this.shoot){
      const s=this.shoot, dir=Math.atan2(s.vy,s.vx);
      for(let i=1;i<9;i++){
        const tx=s.x-Math.cos(dir)*i*13, ty=s.y-Math.sin(dir)*i*13;
        ctx.fillStyle=`rgba(255,235,180,${((1-i/9)*.5).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(tx,ty,3.4*(1-i/10),0,TAU); ctx.fill();
      }
      glow(s.x,s.y,38,'rgba(255,240,190,A)',(.5+Math.sin(gt*8)*.2).toFixed(3));
      ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(gt*2);
      ctx.fillStyle='rgba(255,250,225,.97)';
      for(let i=0;i<8;i++){ ctx.rotate(TAU/8); const L=i%2?5:11;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(2.4,-2.4,0,-L);
        ctx.quadraticCurveTo(-2.4,-2.4,0,0); ctx.fill(); }
      ctx.restore();
    }
    /* final star + replay */
    if(t>16.6){
      const fp=clamp((t-16.6)/1,0,1);
      const pulse=.5+Math.sin(t*1.4)*.35;
      ctx.save(); ctx.globalAlpha=fp;
      glow(W/2,H*.4,90,'rgba(200,255,230,A)',(pulse*.4).toFixed(3));
      ctx.translate(W/2,H*.4); ctx.rotate(t*.15); ctx.scale(pulse,pulse);
      ctx.fillStyle='rgba(230,255,245,.92)';
      for(let i=0;i<8;i++){ ctx.rotate(TAU/8); const L=i%2?13:26;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(5,-5,0,-L);
        ctx.quadraticCurveTo(-5,-5,0,0); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0,0,4.5,0,TAU); ctx.fill();
      ctx.restore();
      const ry=H*.66, rp=(gt*.6)%1;
      ctx.save(); ctx.globalAlpha=fp;
      ctx.strokeStyle=`rgba(190,250,215,${(.5*(1-rp)).toFixed(3)})`; ctx.lineWidth=2;
      blobPath(W/2,ry,16+rp*22,13,gt*2,.1); ctx.stroke();
      ctx.strokeStyle='rgba(220,250,235,.9)'; ctx.lineWidth=2.4; ctx.lineCap='round';
      ctx.beginPath(); ctx.arc(W/2,ry,9,-.6,4.2); ctx.stroke();
      const tipA=4.2, tx2=W/2+Math.cos(tipA)*9, ty2=ry+Math.sin(tipA)*9;
      ctx.fillStyle='rgba(220,250,235,.9)';
      ctx.beginPath(); ctx.moveTo(tx2+4,ty2-3); ctx.lineTo(tx2-3,ty2-5); ctx.lineTo(tx2+1,ty2+4); ctx.closePath(); ctx.fill();
      ctx.restore();
      /* the rescued cat, crowned in mischief */
      if(GameState.flags.catRescued){
        ctx.save(); ctx.globalAlpha=fp;
        drawLokiCat(W/2-165,H*.42,gt,1);
        ctx.restore();
      }
    }
    if(t<1.6){ ctx.fillStyle=`rgba(225,245,255,${(lerp(.18,0,t/1.6)).toFixed(3)})`; ctx.fillRect(0,0,W,H); }
  },
  card(t,t0,t1,img,wT,hT,gt,seed){
    if(t<t0||t>t1) return;
    const inP=clamp((t-t0)/.9,0,1), outP=clamp((t1-t)/.7,0,1);
    const sc=easeOutBack(inP)*lerp(.85,1,ease(outP));
    const alpha=Math.min(inP*2.5,1)*Math.min(outP*1.6,1);
    const cy=H*.42+Math.sin(gt*.9+seed*2)*9+(1-ease(inP))*70;
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.translate(W/2,cy); ctx.rotate(Math.sin(gt*.5+seed)*.022); ctx.scale(sc,sc);
    const R=Math.max(wT,hT)*(Math.abs(wT-hT)<2?.78:.72);
    glow(0,0,R*1.5,'rgba(180,220,255,A)','.16');
    ctx.fillStyle='rgba(246,249,252,.97)';
    blobPath(0,0,R,33+seed*7,gt*.3,.04,hT>=wT?1:hT/wT*1.5); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=2;
    blobPath(0,0,R+5,34+seed*7,gt*.32,.05,hT>=wT?1:hT/wT*1.5); ctx.stroke();
    if(img.complete && img.naturalWidth){
      const ar=img.naturalWidth/img.naturalHeight;
      let dw=wT, dh=wT/ar;
      if(dh>hT){ dh=hT; dw=hT*ar; }
      ctx.drawImage(img,-dw/2,-dh/2,dw,dh);
    }
    ctx.restore();
    for(let i=0;i<6;i++){ const a=gt*.5+i/6*TAU+seed*3;
      const ox2=W/2+Math.cos(a)*(R*sc+26), oy2=cy+Math.sin(a)*(R*sc*.62+20);
      ctx.fillStyle=`rgba(190,235,255,${(alpha*.4*(0.4+hsh(i*5))).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(ox2,oy2,1.6+hsh(i)*1.6,0,TAU); ctx.fill(); }
  },
  onClick(x,y){
    // catch the shooting star → the secret ride
    if(this.shoot && Math.hypot(x-this.shoot.x,y-this.shoot.y)<46){
      const sx=this.shoot.x, sy=this.shoot.y;
      this.shoot=null;
      Save.data.secret=true; Save.put();
      Au.sfx('unlock');
      burst(sx,sy,'rgba(255,240,190,A)',24,120);
      Trans.start(0,sx,sy,()=>{ GameState.mode='star'; StarRide.begin(); });
      return;
    }
    const t=this.t;
    if(t<2.2){ this.t=2.4; }
    else if(t<9.0){ this.t=9.4; }
    else if(t<16.6){ this.t=16.6; }
    else { GameState.mode='title'; resetRun(); }
    Au.sfx('hover');
  },
  onMove(x,y){
    if(this.shoot && Math.hypot(x-this.shoot.x,y-this.shoot.y)<46) return 'hot';
    return 'hot';
  }
};
