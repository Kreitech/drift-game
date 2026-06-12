'use strict';
/* ============================================================
   SCENE 2 — THE MACHINE WOMB
   three sleeping gears must return to the heart-mechanism;
   when the train turns, the iris door dilates (to the marsh)
   ============================================================ */
function drawGear(x,y,r,rot,tone){
  const teeth=Math.max(7,Math.round(r/4.5));
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
  const g=ctx.createRadialGradient(-r*.3,-r*.3,r*.1,0,0,r*1.1);
  if(tone==='warm'){ g.addColorStop(0,'#d8a85e'); g.addColorStop(1,'#7a5526'); }
  else { g.addColorStop(0,'#b8c2cc'); g.addColorStop(1,'#566270'); }
  ctx.fillStyle=g;
  for(let i=0;i<teeth;i++){ ctx.save(); ctx.rotate(i/teeth*TAU);
    ctx.beginPath(); ctx.roundRect(-r*.11,-r-r*.18,r*.22,r*.28,r*.05); ctx.fill(); ctx.restore(); }
  ctx.beginPath(); ctx.arc(0,0,r,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(20,12,6,.45)';
  for(let i=0;i<4;i++){ ctx.save(); ctx.rotate(i/4*TAU+.4);
    ctx.beginPath(); ctx.ellipse(0,r*.55,r*.16,r*.3,0,0,TAU); ctx.fill(); ctx.restore(); }
  ctx.beginPath(); ctx.arc(0,0,r*.3,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(255,235,200,.25)';
  ctx.beginPath(); ctx.arc(-r*.25,-r*.3,r*.16,0,TAU); ctx.fill();
  ctx.restore();
}
const SceneGears={
  ax:250, ay:525, EGG:2,
  dust: makeDrift(26,'rgba(255,200,140,A)',1.4,5),
  gears:[
    {ox:150,oy:300,r:40, sx:506,sy:318, placed:false, anim:0, dir:1},
    {ox:760,oy:170,r:32, sx:592,sy:336, placed:false, anim:0, dir:-1},
    {ox:120,oy:478,r:26, sx:540,sy:392, placed:false, anim:0, dir:1}
  ],
  doorOpen:0, steam:[], pipeGlow:[0,0,0,0,0,0],
  PIPE_NOTES:[392,440,494,587,659,784],   // a little pentatonic organ
  reset(){ this.gears.forEach(g=>{g.placed=false;g.anim=0;}); this.doorOpen=0;
    this.steam.length=0; this.pipeGlow=[0,0,0,0,0,0]; },
  enter(){},
  allPlaced(){ return this.gears.every(g=>g.placed&&g.anim>=1); },
  update(dt,t){
    for(const g of this.gears) if(g.placed&&g.anim<1){
      g.anim=Math.min(1,g.anim+dt*1.4);
      if(g.anim>=1){ Au.sfx('gear');
        burst(g.sx,g.sy,'rgba(255,200,120,A)',14,70);
        if(this.allPlaced()){ setTimeout(()=>{Au.sfx('power');},400); } } }
    if(this.allPlaced()) this.doorOpen=Math.min(1,this.doorOpen+dt*.5);
    this.pipeGlow=this.pipeGlow.map(v=>Math.max(0,v-dt*1.3));
    if(Math.random()<dt*2.2) this.steam.push({x:(Math.random()<.5?340:660)+(Math.random()-.5)*30,y:560,r:6,life:1,vx:(Math.random()-.5)*8});
    for(let i=this.steam.length-1;i>=0;i--){ const s=this.steam[i];
      s.y-=24*dt; s.r+=16*dt; s.x+=s.vx*dt; s.life-=dt*.5;
      if(s.life<=0) this.steam.splice(i,1); }
  },
  render(t){
    const open=ease(this.doorOpen), spin=this.allPlaced();
    skyGrad([[0,'#170b0c'],[.5,'#2b1414'],[1,'#1a0c10']]);
    ctx.save(); ctx.translate(px(-.015),0);
    for(let i=0;i<7;i++){
      const rx=480+ (i-3)*135;
      ctx.strokeStyle=`rgba(120,70,55,${(0.16-Math.abs(i-3)*.02).toFixed(3)})`;
      ctx.lineWidth=26;
      ctx.beginPath(); ctx.moveTo(rx-180,H+40);
      ctx.quadraticCurveTo(rx,(i%2?40:80),rx+180,H+40); ctx.stroke();
    }
    ctx.restore();
    // pipe organ stack — breathing tubes, left wall
    ctx.save(); ctx.translate(px(-.006),0);
    for(let i=0;i<6;i++){
      const ph=Math.sin(t*.8+i*.9)*4;
      const x0=58+i*26, h0=200+i*26+ph, hue=18+i*7;
      const g=ctx.createLinearGradient(x0,0,x0+20,0);
      g.addColorStop(0,`hsl(${hue},32%,26%)`); g.addColorStop(.5,`hsl(${hue},36%,38%)`); g.addColorStop(1,`hsl(${hue},30%,18%)`);
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.roundRect(x0,90-ph,20,h0,10); ctx.fill();
      blob(x0+10,86-ph,12,60+i,t,'hsl('+hue+',40%,30%)',.12,.7);
      blinker(x0+10,110-ph,2,70+i,t,'rgba(255,180,110,A)');
      // a played pipe sings with light
      if(this.pipeGlow[i]>0){
        glow(x0+10,150,42,'rgba(255,225,160,A)',(this.pipeGlow[i]*.4).toFixed(3));
        ctx.fillStyle=`rgba(255,235,190,${(this.pipeGlow[i]*.25).toFixed(3)})`;
        ctx.beginPath(); ctx.roundRect(x0,90-ph,20,h0,10); ctx.fill();
      }
    }
    ctx.restore();
    for(let i=0;i<4;i++){
      const cx0=240+i*180, sag=Math.sin(t*.5+i)*6;
      ctx.strokeStyle='rgba(60,38,30,.9)'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(cx0-80,-5);
      ctx.quadraticCurveTo(cx0,120+sag,cx0+80,-5); ctx.stroke();
      blinker(cx0,118+sag,2.6,80+i,t,i%2?'rgba(255,150,100,A)':'rgba(150,220,255,A)');
    }
    ridge(520,8,21,'#241218');
    ridge(556,6,23,'#160a0e');
    // hidden egg — resting in a floor seam
    if(!Save.data.eggs[2]) drawEgg(672,548,13,t);
    for(let i=0;i<6;i++){ ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(60+i*160,530); ctx.quadraticCurveTo(60+i*160+80,538,60+i*160+150,532); ctx.stroke(); }

    /* the heart-mechanism plate */
    const hx=556,hy=326;
    blob(hx,hy,128,90,t*.15,'#33171c',.04);
    blob(hx,hy,112,91,t*.18,'#451f22',.04);
    glow(hx,hy,150,'rgba(255,150,80,A)',spin?(.16+Math.sin(t*2)*.06).toFixed(3):'.05');
    drawGear(hx+10,hy-62,30,spin?t*.8:Math.sin(t*1.2)*.05,'cool');
    this.gears.forEach((g,i)=>{
      if(!(g.placed&&g.anim>=1)){
        ctx.setLineDash([5,7]); ctx.lineDashOffset=-t*12;
        ctx.strokeStyle=`rgba(255,210,150,${(.25+Math.sin(t*2+i)*.1).toFixed(3)})`;
        ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(g.sx,g.sy,g.r,0,TAU); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle='rgba(0,0,0,.3)';
        ctx.beginPath(); ctx.arc(g.sx,g.sy,g.r*.3,0,TAU); ctx.fill();
      }
      if(g.placed){
        const p=ease(g.anim);
        const gx=lerp(g.ox,g.sx,p), gy=lerp(g.oy,g.sy,p)-Math.sin(p*Math.PI)*60;
        drawGear(gx,gy,g.r,(spin? t*1.6*60/g.r*g.dir : p*3),'warm');
      } else {
        const nudge=Math.sin(t*1.1+i*2)*2;
        glow(g.ox,g.oy,g.r*1.8,'rgba(255,190,110,A)','.08');
        drawGear(g.ox,g.oy+nudge,g.r,Math.sin(t*.6+i)*.1,'warm');
      }
    });
    if(spin){
      ctx.strokeStyle=`rgba(255,210,140,${(.3+Math.sin(t*4)*.15).toFixed(3)})`;
      ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(hx+10,hy-62);
      [0,1,2].forEach(i=>ctx.lineTo(this.gears[i].sx,this.gears[i].sy));
      ctx.lineTo(820,330); ctx.stroke();
    }

    this.iris(836,330,78,open,t);

    for(const s of this.steam){
      ctx.fillStyle=`rgba(210,170,150,${(s.life*.13).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,TAU); ctx.fill();
    }

    drawAstronaut(this.ax,this.ay,t);
    this.dust.draw(t,.06);

    const vg=ctx.createRadialGradient(W/2,H*.45,H*.3,W/2,H*.5,H);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(8,2,4,.6)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

    if(GameState.idle>9){
      const g=this.gears.find(g2=>!g2.placed);
      if(g) hintGlow(g.ox,g.oy,t);
      else if(this.allPlaced()) hintGlow(836,330,t);
    }
  },
  iris(x,y,r,open,t){
    blob(x,y,r*1.45,95,t*.2,'#3b1c20',.05);
    blob(x,y,r*1.22,96,t*.22,'#532a2a',.05);
    ctx.save();
    ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.clip();
    if(open>0){
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,'#9fe8c8'); g.addColorStop(.6,'#2e7a5e'); g.addColorStop(1,'#143828');
      ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
      for(let i=0;i<8;i++){ const a=t*.4+i;
        ctx.fillStyle='rgba(220,255,235,.5)';
        ctx.beginPath(); ctx.arc(x+Math.cos(a)*r*.5*hsh(i),y+Math.sin(a*1.3)*r*.5,2,0,TAU); ctx.fill(); }
    } else { ctx.fillStyle='#0c0608'; ctx.fillRect(x-r,y-r,r*2,r*2); }
    const blades=8, openness=lerp(.04,1,open);
    ctx.fillStyle='#6e4434';
    for(let i=0;i<blades;i++){
      const a=i/blades*TAU+open*1.2+Math.sin(t*.5)*.02;
      ctx.save(); ctx.translate(x+Math.cos(a)*r*openness, y+Math.sin(a)*r*openness);
      ctx.rotate(a+2.2);
      ctx.beginPath(); ctx.moveTo(0,0);
      ctx.quadraticCurveTo(r*.9,-r*.18,r*1.25,r*.45);
      ctx.quadraticCurveTo(r*.5,r*.42,0,0); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(r*.9,-r*.18,r*1.25,r*.45); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    ctx.strokeStyle='rgba(190,130,90,.5)'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.arc(x,y,r+2,0,TAU); ctx.stroke();
    blinker(x,y-r-16,2.6,99,t, open>0?'rgba(150,255,190,A)':'rgba(255,120,90,A)');
  },
  onClick(x,y){
    if(!Save.data.eggs[2] && Math.hypot(x-672,y-548)<17){ collectEgg(2,672,548); return; }
    for(const g of this.gears){
      if(!g.placed && Math.hypot(x-g.ox,y-g.oy)<g.r+16){
        g.placed=true; Au.sfx('pick');
        burst(g.ox,g.oy,'rgba(255,210,140,A)',10,60);
        return;
      }
    }
    if(Math.hypot(x-836,y-330)<95){
      if(this.allPlaced()){ Au.sfx('door'); Trans.start(3,836,330); }
      else { Au.sfx('deny'); think(ICON.gear,this.ax,this.ay-60); }
      return;
    }
    /* the organ pipes are playable */
    for(let i=0;i<6;i++){
      if(Math.abs(x-(68+i*26))<13 && y>80 && y<330){
        this.pipeGlow[i]=1;
        Au.blip(this.PIPE_NOTES[i],.09,1.1,'triangle',5);
        return;
      }
    }
  },
  onMove(x,y){
    if(!Save.data.eggs[2] && Math.hypot(x-672,y-548)<17) return 'hot';
    for(const g of this.gears) if(!g.placed&&Math.hypot(x-g.ox,y-g.oy)<g.r+16) return 'grab';
    if(Math.hypot(x-836,y-330)<95) return 'hot';
    if(x>52 && x<212 && y>80 && y<330) return 'hot';
    return 'default';
  }
};

/* ============================================================
   SCENE 3 — THE GEYSER MARSH  (new)
   three vents breathe under a dusk sky. cap the two outer ones
   with fallen capstones and all the pressure gathers in the
   middle — then ride the lily-platform up to the summit.
   ============================================================ */
const SceneGeyser={
  ax:330, ay:525, EGG:3,
  spores: makeDrift(24,'rgba(255,220,180,A)',1.6,6),
  GEYSERS:[{x:240,y:470},{x:470,y:488},{x:700,y:458}],   // 0 & 2 cappable, 1 is the ride
  STONES:[{x:120,y:520},{x:845,y:532}],
  bubbles:[], frogHop:0, frogAt:0, launchT:-1, eruptPh:[0,1.1,2.2],
  reedPop:[0,0,0], moonWink:0,
  hotspots:[],
  reset(){ this.bubbles.length=0; this.frogHop=0; this.launchT=-1;
    this.reedPop=[0,0,0]; this.moonWink=0; this.enter(); },
  enter(){
    const F=GameState.flags;
    this.hotspots=[
      {x:912,y:516,r:16, active:()=>!Save.data.eggs[3],
        click:()=>collectEgg(3,912,516)},
      // fallen capstones
      ...this.STONES.map((s,i)=>({x:s.x,y:s.y,r:30, active:()=>!GameState.has('stone'+i)&&!F.stonesUsed[i],
        click:()=>{
          GameState.give('stone'+i,c=>ItemArt.stone(c));
          Au.sfx('pick'); burst(s.x,s.y,'rgba(200,210,220,A)',12,70);
        }})),
      // outer geysers take a capstone
      {x:240,y:450,r:46, active:()=>true, click:()=>this.tryCap(0)},
      {x:700,y:438,r:46, active:()=>true, click:()=>this.tryCap(1)},
      // the middle geyser / lily platform
      {x:470,y:470,r:52, active:()=>true,
        click:()=>{
          if(this.launchT>=0) return;
          if(F.capped[0]&&F.capped[1]){
            this.launchT=0; F.launched=true; Au.sfx('launch');
            burst(470,470,'rgba(180,230,255,A)',26,120);
          } else { Au.sfx('deny'); think(ICON.stone,this.ax,this.ay-60); } }},
      // the frog-thing (just for joy)
      {x:565,y:533,r:30, active:()=>true,
        click:()=>{ this.frogHop=1; Au.sfx('croak');
          burst(565,520,'rgba(160,230,170,A)',6,40); }}
    ];
  },
  tryCap(i){
    const F=GameState.flags;
    if(F.capped[i]){ Au.sfx('hover'); return; }
    const sel=GameState.selected;
    if(sel==='stone0'||sel==='stone1'){
      F.stonesUsed[sel==='stone0'?0:1]=true;
      GameState.take(sel); F.capped[i]=true;
      Au.sfx('cap'); burst(this.GEYSERS[i===0?0:2].x,this.GEYSERS[i===0?0:2].y-20,'rgba(220,225,230,A)',16,80);
      if(F.capped[0]&&F.capped[1]) setTimeout(()=>Au.sfx('geyser'),500);
    } else { Au.sfx('deny'); think(ICON.stone,this.ax,this.ay-60); }
  },
  update(dt,t){
    const F=GameState.flags;
    this.frogHop=Math.max(0,this.frogHop-dt*1.6);
    if(Math.random()<dt*.25){ this.frogHop=1; if(Math.random()<.4) Au.sfx('croak'); }
    // pool bubbles
    if(Math.random()<dt*5){
      const pool=[{x:560,y:548},{x:160,y:556},{x:790,y:550}][Math.floor(Math.random()*3)];
      this.bubbles.push({x:pool.x+(Math.random()-.5)*60,y:pool.y,r:1.5+Math.random()*2.5,life:1});
    }
    for(let i=this.bubbles.length-1;i>=0;i--){ const b=this.bubbles[i];
      b.y-=14*dt; b.life-=dt*.9; if(b.life<=0) this.bubbles.splice(i,1); }
    this.reedPop=this.reedPop.map(v=>Math.max(0,v-dt*1.2));
    this.moonWink=Math.max(0,this.moonWink-dt*.8);
    // launch ride
    if(this.launchT>=0){
      this.launchT+=dt;
      if(this.launchT>1.5){ this.launchT=-1; Trans.start(4,470,140); }
    }
  },
  eruption(i,t){ // 0..1 strength of geyser i right now
    const F=GameState.flags;
    if(i!==1 && F.capped[i===0?0:1]) return 0;
    if(i===1 && F.capped[0]&&F.capped[1]) return 1;
    const ph=(t*.45+this.eruptPh[i])%3;
    return ph<1.1 ? Math.sin(ph/1.1*Math.PI) : 0;
  },
  render(t){
    const F=GameState.flags;
    const ready=F.capped[0]&&F.capped[1];
    /* dusk sky */
    skyGrad([[0,'#1a1038'],[.4,'#3a2050'],[.7,'#7a3a55'],[1,'#c06a52']]);
    // sinking sun haze
    glow(480,420,260,'rgba(255,170,110,A)','.16');
    for(let i=0;i<60;i++){ const sx=hsh(i*7)*W, sy=hsh(i*13)*H*.4;
      ctx.fillStyle=`rgba(255,235,225,${(.18+Math.sin(t*.7+i)*.12).toFixed(3)})`;
      ctx.fillRect(sx,sy,1.3,1.3); }
    // slim crescent
    const cmx=820+px(-.012), cmy=95+py(-.012);
    ctx.fillStyle='#f2e3c8';
    ctx.beginPath(); ctx.arc(cmx,cmy,26,0,TAU); ctx.fill();
    ctx.fillStyle='#3a2050';
    ctx.beginPath(); ctx.arc(cmx-9,cmy-4,24,0,TAU); ctx.fill();
    if(this.moonWink>0){ // the crescent winks back
      glow(cmx,cmy,60,'rgba(255,240,210,A)',(this.moonWink*.3).toFixed(3));
      for(let i=0;i<5;i++){ const a=i/5*TAU+t;
        ctx.fillStyle=`rgba(255,245,220,${(this.moonWink*.7).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cmx+Math.cos(a)*(34+this.moonWink*8), cmy+Math.sin(a)*(34+this.moonWink*8), 1.6,0,TAU);
        ctx.fill(); }
    }
    /* distant crags */
    ctx.save(); ctx.translate(px(-.02),0);
    ridge(380,46,81,'#241540');
    ctx.restore();
    ctx.save(); ctx.translate(px(-.009),0);
    ridge(440,30,83,'#2c1a44');
    SceneJungle.mushTree(90,455,40,'#231538','#3c2658',t,84,.6);
    SceneJungle.mushTree(880,450,46,'#231538','#43295e',t,85,.6);
    ctx.restore();
    /* marsh ground */
    ridge(486,16,87,'#27203a');
    ridge(526,12,89,'#1b1730');
    /* pools */
    [[160,556,80],[560,548,95],[790,550,70]].forEach((p,i)=>{
      const sh=1+Math.sin(t*1.6+i)*.03;
      const g=ctx.createLinearGradient(0,p[1]-10,0,p[1]+10);
      g.addColorStop(0,'rgba(255,160,120,.30)'); g.addColorStop(1,'rgba(90,60,140,.35)');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.ellipse(p[0],p[1],p[2]*sh,12*sh,0,0,TAU); ctx.fill();
    });
    for(const b of this.bubbles){
      ctx.strokeStyle=`rgba(255,220,200,${(b.life*.5).toFixed(3)})`; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,TAU); ctx.stroke();
    }
    /* hidden egg — among the right reeds */
    if(!Save.data.eggs[3]) drawEgg(912,516,14,t);
    /* reeds (rustle when brushed) */
    this.reeds(80,540,t,5,91,this.reedPop[0]);
    this.reeds(360,548,t,4,93,this.reedPop[1]);
    this.reeds(905,535,t,6,95,this.reedPop[2]);
    /* geysers */
    this.GEYSERS.forEach((g,i)=>this.geyser(g.x,g.y,t,i));
    /* capstones lying about */
    this.STONES.forEach((s,i)=>{
      if(!GameState.has('stone'+i)&&!F.stonesUsed[i]) this.stoneProp(s.x,s.y,t,i);
    });
    /* the frog-thing on its pool */
    this.frog(565,533,t);
    /* astronaut — rides the lily up at launch */
    if(this.launchT>=0){
      const p=ease(clamp(this.launchT/1.5,0,1));
      const ly=lerp(470,90,p);
      // rising column beneath
      this.column(470,488,Math.max(1,(488-ly)/180),t,1);
      this.lily(470,ly+18,t);
      drawAstronaut(470,ly+8,t,1,false,false);
      burstlessTrail(470,ly+30,t);
    } else {
      if(ready) this.lily(470,470,t);
      drawAstronaut(this.ax,this.ay,t);
    }
    this.spores.draw(t,.12);
    /* dusk vignette */
    const vg=ctx.createRadialGradient(W/2,H*.45,H*.35,W/2,H*.5,H);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(16,6,20,.5)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

    if(GameState.idle>9 && this.launchT<0){
      const carrying=GameState.has('stone0')||GameState.has('stone1');
      if(!carrying && !F.capped[0] && !this.stoneGone(0)) hintGlow(this.STONES[0].x,this.STONES[0].y,t);
      else if(!carrying && !F.capped[1] && !this.stoneGone(1)) hintGlow(this.STONES[1].x,this.STONES[1].y,t);
      else if(carrying && !F.capped[0]) hintGlow(240,450,t);
      else if(carrying && !F.capped[1]) hintGlow(700,438,t);
      else if(ready) hintGlow(470,470,t);
    }
  },
  stoneGone(i){ return GameState.has('stone'+i)||GameState.flags.stonesUsed[i]; },
  reeds(x,y,t,n,seed,pop){
    pop=pop||0;
    for(let i=0;i<n;i++){
      const rx=x+(i-n/2)*9+hsh(seed+i)*6, h=34+hsh(seed+i*3)*30;
      const sway=Math.sin(t*.8+seed+i)*4 + pop*Math.sin(t*15+i*2)*7;
      ctx.strokeStyle='#3c4a36'; ctx.lineWidth=2; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(rx,y);
      ctx.quadraticCurveTo(rx+sway*.4,y-h*.6,rx+sway,y-h); ctx.stroke();
      ctx.fillStyle='#6e5a3c';
      ctx.beginPath(); ctx.ellipse(rx+sway,y-h-4,3,7,sway*.04,0,TAU); ctx.fill();
    }
  },
  geyser(x,y,t,i){
    const F=GameState.flags;
    const capIdx=i===0?0:(i===2?1:-1);
    // mound
    blob(x,y+16,44,100+i*3,t*.2,'#352a48',.06,.55);
    blob(x,y+10,30,101+i*3,t*.25,'#443659',.05,.6);
    // vent
    ctx.fillStyle='#120c1c';
    ctx.beginPath(); ctx.ellipse(x,y-2,14,6,0,0,TAU); ctx.fill();
    const e=this.eruption(i===0?0:(i===1?1:2),t);
    if(capIdx>=0 && F.capped[capIdx]){
      // seated capstone with thin steam
      this.stoneProp(x,y-8,t,capIdx+4);
      for(let k=0;k<2;k++){ const p=(t*.9+k*.5)%1;
        ctx.fillStyle=`rgba(230,220,230,${((1-p)*.14).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x+(k-0.5)*14+Math.sin(t+k)*3,y-14-p*26,3+p*5,0,TAU); ctx.fill(); }
    } else if(e>0){
      const big = i===1 && F.capped[0]&&F.capped[1];
      this.column(x,y,big?1.6:e,t,i);
    }
  },
  column(x,y,strength,t,seed){
    const h=120*strength, w=11*strength;
    const g=ctx.createLinearGradient(0,y,0,y-h);
    g.addColorStop(0,'rgba(180,225,255,.45)'); g.addColorStop(1,'rgba(180,225,255,0)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.moveTo(x-w*.5,y);
    ctx.bezierCurveTo(x-w,y-h*.4,x-w*.7+Math.sin(t*7+seed)*4,y-h*.8,x,y-h);
    ctx.bezierCurveTo(x+w*.7+Math.sin(t*6+seed)*4,y-h*.8,x+w,y-h*.4,x+w*.5,y);
    ctx.closePath(); ctx.fill();
    for(let k=0;k<6;k++){ const p=(t*1.8+k*.17)%1;
      ctx.fillStyle=`rgba(220,240,255,${((1-p)*.5*strength).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x+Math.sin(t*4+k*2)*w*.8, y-p*h, 2.4*(1-p*.5),0,TAU); ctx.fill(); }
    glow(x,y-h*.5,h*.5,'rgba(170,220,255,A)',(.1*strength).toFixed(3));
  },
  lily(x,y,t){
    const bob=Math.sin(t*1.4)*3;
    ctx.save(); ctx.translate(x,y+bob);
    ctx.fillStyle='#3f7a52';
    ctx.beginPath(); ctx.ellipse(0,0,40,12,0,0,TAU); ctx.fill();
    ctx.fillStyle='#54995f';
    ctx.beginPath(); ctx.ellipse(0,-2,34,9,0,0,TAU); ctx.fill();
    ctx.fillStyle='#3f7a52';
    ctx.beginPath(); ctx.moveTo(8,-6); ctx.lineTo(26,-10); ctx.lineTo(20,-2); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,235,250,.85)';
    ctx.beginPath(); ctx.arc(-18,-6,4,0,TAU); ctx.fill();
    ctx.restore();
  },
  stoneProp(x,y,t,seed){
    const g=ctx.createLinearGradient(x-16,y-14,x+16,y+8);
    g.addColorStop(0,'#a8b2bc'); g.addColorStop(1,'#5a636e');
    ctx.fillStyle=g;
    blobPath(x,y,16,110+seed,t*.1,.07,.72); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.25)';
    ctx.beginPath(); ctx.ellipse(x-5,y-6,5,2.6,-.4,0,TAU); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.arc(x+5,y+3,3,0,TAU); ctx.fill();
  },
  frog(x,y,t){
    const hop=ease(this.frogHop>0? Math.sin(this.frogHop*Math.PI):0);
    const fy=y-hop*26;
    ctx.save(); ctx.translate(x,fy);
    ctx.fillStyle='rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(0,y-fy+4,14,4,0,0,TAU); ctx.fill();
    blob(0,-6,15,120,t*.6,'#5d9c63',.07,.72);
    blob(0,-12,10,121,t*.7,'#74b878',.08,.8);
    // eyes on stalks
    [[-8,-20],[8,-21]].forEach((e,i)=>{
      ctx.fillStyle='#74b878';
      ctx.beginPath(); ctx.arc(e[0],e[1],4.4,0,TAU); ctx.fill();
      ctx.fillStyle='#1d2412';
      ctx.beginPath(); ctx.arc(e[0]+1,e[1]-1,1.8,0,TAU); ctx.fill();
    });
    // throat pulse
    const th=1+Math.sin(t*4)*.18;
    ctx.fillStyle='#a8d8a0';
    ctx.beginPath(); ctx.ellipse(0,-2,5*th,3.6*th,0,0,TAU); ctx.fill();
    ctx.restore();
  },
  onClick(x,y){
    if(this.launchT>=0) return;
    for(const s of this.hotspots) if(s.active()&&hitSpot(s,x,y)){ s.click(); return; }
    /* optional toys */
    const reedSpots=[[80,525],[360,533],[905,520]];
    for(let i=0;i<3;i++){
      if(Math.hypot(x-reedSpots[i][0],y-reedSpots[i][1])<32){
        this.reedPop[i]=1; Au.sfx('squeak');
        burst(reedSpots[i][0],reedSpots[i][1]-24,'rgba(220,190,140,A)',6,45);
        return;
      }
    }
    if(Math.hypot(x-820,y-95)<32){ this.moonWink=1; Au.sfx('chime'); return; }
  },
  onMove(x,y){
    if(this.launchT>=0) return 'default';
    for(const s of this.hotspots) if(s.active()&&hitSpot(s,x,y)) return 'hot';
    const reedSpots=[[80,525],[360,533],[905,520]];
    for(const r of reedSpots) if(Math.hypot(x-r[0],y-r[1])<32) return 'hot';
    if(Math.hypot(x-820,y-95)<32) return 'hot';
    return 'default';
  }
};
// tiny upward sparkle trail used during the lily launch
function burstlessTrail(x,y,t){
  for(let i=0;i<4;i++){ const p=(t*2+i*.25)%1;
    ctx.fillStyle=`rgba(200,235,255,${((1-p)*.6).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x+(hsh(i*7+Math.floor(t*4))-.5)*24, y+p*60, 2.2*(1-p),0,TAU); ctx.fill(); }
}

/* ============================================================
   SCENE 4 — THE SUMMIT
   dig out the mirror shard → mount it on the gnarled pedestal →
   turn it until the low star's light feeds the panel →
   the tower sings, and someone hears
   ============================================================ */
const SceneSummit={
  ax:280, ay:525, EGG:4,
  drift: makeDrift(20,'rgba(200,220,255,A)',1.5,10),
  sunX:120, sunY:115,
  mirX:455, mirY:400,
  panX:762, panY:248,
  angle: 2.4, dragging:false,
  powerT:0, podY:-160, podPhase:0, astroLift:0, bloom:0, endPulse:0,
  rings:[], starFlare:0, pebbleW:[0,0],
  PEBBLES:[[250,542],[690,548]],
  reset(){ this.angle=2.4; this.dragging=false; this.powerT=0; this.podY=-160;
           this.podPhase=0; this.astroLift=0; this.bloom=0; this.endPulse=0; this.rings.length=0;
           this.starFlare=0; this.pebbleW=[0,0]; },
  enter(){},
  update(dt,t){
    const F=GameState.flags;
    this.starFlare=Math.max(0,this.starFlare-dt*1.2);
    this.pebbleW=this.pebbleW.map(v=>Math.max(0,v-dt*1.6));
    if(F.powered){
      this.powerT+=dt;
      if(this.powerT>1.2 && Math.random()<dt*2.5) this.rings.push({r:8,life:1});
      for(let i=this.rings.length-1;i>=0;i--){ const r0=this.rings[i];
        r0.r+=90*dt; r0.life-=dt*.5; if(r0.life<=0) this.rings.splice(i,1); }
      if(this.powerT>4 && this.podPhase===0){ this.podPhase=1; Au.sfx('shimmer'); }
      if(this.podPhase===1){ this.podY=Math.min(this.podY+70*dt,295);
        if(this.podY>=295){ this.podPhase=2; Au.sfx('end'); } }
      if(this.podPhase===2){ this.astroLift=Math.min(this.astroLift+dt*.28,1);
        if(this.astroLift>=1) this.podPhase=3; }
      if(this.podPhase===3){ this.podY-=55*dt; this.bloom=Math.min(this.bloom+dt*.25,1);
        if(this.podY<-180 && !F.ended){ F.ended=true;
          if(F.catPicked) F.catRescued=true;   // the cat made it home too
        } }
      if(F.ended){ this.endPulse+=dt;
        if(this.endPulse>1.6 && GameState.mode==='game'){
          GameState.mode='credits'; Credits.begin();
        } }
    } else if(F.mirrorMounted){
      if(this.beamHitsPanel()){
        F.powered=true; Au.sfx('power');
        burst(this.panX,this.panY,'rgba(160,230,255,A)',26,110);
        this.dragging=false;
      }
    }
  },
  beamEnd(){
    const inc=Math.atan2(this.mirY-this.sunY,this.mirX-this.sunX);
    const ref=2*this.angle-inc+Math.PI;
    return [this.mirX+Math.cos(ref)*900, this.mirY+Math.sin(ref)*900];
  },
  beamHitsPanel(){
    const [ex,ey]=this.beamEnd();
    const dx=ex-this.mirX, dy=ey-this.mirY;
    const t2=((this.panX-this.mirX)*dx+(this.panY-this.mirY)*dy)/(dx*dx+dy*dy);
    if(t2<=0) return false;
    const cx2=this.mirX+t2*dx, cy2=this.mirY+t2*dy;
    return Math.abs(cx2-this.panX)<46 && Math.abs(cy2-this.panY)<32;
  },
  render(t){
    const F=GameState.flags;
    skyGrad([[0,'#03030c'],[.4,'#0a0d2c'],[.75,'#14224a'],[1,'#1c3050']]);
    for(let i=0;i<120;i++){ const sx=hsh(i*17)*W, sy=hsh(i*23)*H*.7;
      ctx.fillStyle=`rgba(225,235,255,${(.25+Math.sin(t*.7+i)*.2).toFixed(3)})`;
      ctx.fillRect(sx,sy,1.3,1.3); }
    for(let i=0;i<3;i++){
      ctx.fillStyle=`hsla(${150+i*30},70%,60%,.04)`;
      ctx.beginPath(); ctx.moveTo(-20,80+i*40);
      for(let x=0;x<=W;x+=40) ctx.lineTo(x,80+i*40+Math.sin(x*.008+t*.3+i*2)*30);
      for(let x=W;x>=0;x-=40) ctx.lineTo(x,200+i*40+Math.sin(x*.008+t*.25+i)*30);
      ctx.closePath(); ctx.fill();
    }
    const sg=(1+Math.sin(t*1.3)*.06)*(1+this.starFlare*.3);
    glow(this.sunX,this.sunY,150*sg,'rgba(255,235,170,A)',(.3+this.starFlare*.2).toFixed(3));
    glow(this.sunX,this.sunY,60*sg,'rgba(255,240,190,A)','.5');
    ctx.fillStyle='#fff3cf';
    blobPath(this.sunX,this.sunY,26*sg,77,t*.8,.06); ctx.fill();
    for(let i=0;i<10;i++){ const a=i/10*TAU+t*.1;
      ctx.strokeStyle=`rgba(255,240,180,${(.25+Math.sin(t*2+i)*.15).toFixed(3)})`;
      ctx.lineWidth=2; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(this.sunX+Math.cos(a)*34,this.sunY+Math.sin(a)*34);
      ctx.lineTo(this.sunX+Math.cos(a)*(46+Math.sin(t*3+i)*5),this.sunY+Math.sin(a)*(46+Math.sin(t*3+i)*5)); ctx.stroke(); }

    ctx.save(); ctx.translate(px(-.02),0);
    ridge(360,60,31,'#0b1024');
    ctx.restore();
    ctx.save(); ctx.translate(px(-.009),0);
    ridge(430,40,33,'#101831');
    breathPlant(680,440,40,14,t,'#27405c','#4f7ba0');
    breathPlant(60,445,52,15,t,'#27405c','#5d8cb4');
    ctx.restore();
    ridge(490,22,35,'#16203a');
    ridge(532,14,37,'#0e1526');
    // hidden egg — half-buried in frost lichen
    if(!Save.data.eggs[4]) drawEgg(608,524,13,t);
    for(let i=0;i<9;i++) blob(50+i*110+hsh(i*8)*50, 515+hsh(i*5)*60, 18+hsh(i*3)*14, i*6, t*.3, 'rgba(120,170,220,.10)', .15, .5);
    // frost pebbles that wiggle when nudged
    this.PEBBLES.forEach((p,i)=>{
      const w=this.pebbleW[i];
      ctx.save(); ctx.translate(p[0],p[1]); ctx.rotate(w>0?Math.sin(t*18)*.25*w:0);
      const g2=ctx.createLinearGradient(-10,-8,10,6);
      g2.addColorStop(0,'#3a4c6e'); g2.addColorStop(1,'#1d2840');
      ctx.fillStyle=g2;
      blobPath(0,0,10,160+i*3,t*.1,.08,.7); ctx.fill();
      ctx.fillStyle='rgba(190,220,250,.25)';
      ctx.beginPath(); ctx.ellipse(-3,-4,3.4,1.8,-.4,0,TAU); ctx.fill();
      ctx.restore();
    });

    this.tower(800,505,t);
    this.pedestal(this.mirX,this.mirY,t);
    if(!F.hasShard && !F.mirrorMounted) this.shardProp(150,505,t);

    if(F.mirrorMounted && !F.powered){
      this.beam(this.sunX,this.sunY,this.mirX,this.mirY,.16,t);
      const [ex,ey]=this.beamEnd();
      this.beam(this.mirX,this.mirY,ex,ey,.3,t);
    }
    if(F.powered && this.podPhase<3){
      this.beam(this.sunX,this.sunY,this.mirX,this.mirY,.25,t);
      this.beam(this.mirX,this.mirY,this.panX,this.panY,.45,t);
    }

    if(this.podPhase>0) this.pod(640,this.podY,t);

    if(this.astroLift<1){
      const lx=lerp(this.ax,640,ease(this.astroLift));
      const ly=lerp(this.ay,this.podY+60,ease(this.astroLift));
      if(this.astroLift>0){
        glow(lx,ly-25,50,'rgba(180,255,220,A)','.25');
        drawAstronaut(lx,ly,t,1-this.astroLift*.35);
      } else drawAstronaut(this.ax,this.ay,t);
    }

    this.drift.draw(t,.14);

    const vg=ctx.createRadialGradient(W/2,H*.4,H*.3,W/2,H*.5,H);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(2,4,12,.55)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

    if(this.bloom>0){
      ctx.fillStyle=`rgba(225,245,255,${(this.bloom*.18+Math.sin(t)*.02).toFixed(3)})`;
      ctx.fillRect(0,0,W,H);
    }

    if(GameState.idle>9 && !F.powered){
      if(!F.hasShard && !F.mirrorMounted) hintGlow(150,500,t);
      else hintGlow(this.mirX,this.mirY,t);
    }
  },
  beam(x0,y0,x1,y1,alpha,t){
    const g=ctx.createLinearGradient(x0,y0,x1,y1);
    g.addColorStop(0,`rgba(255,240,180,${alpha})`);
    g.addColorStop(1,`rgba(255,240,180,${alpha*.4})`);
    ctx.strokeStyle=g; ctx.lineCap='round';
    ctx.lineWidth=5+Math.sin(t*6)*1.5;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
    ctx.strokeStyle=`rgba(255,255,230,${alpha*.8})`; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
    for(let i=0;i<4;i++){ const p=((t*.5+i*.25)%1);
      ctx.fillStyle=`rgba(255,250,220,${(alpha*1.5*(1-p)).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(lerp(x0,x1,p),lerp(y0,y1,p),2.2,0,TAU); ctx.fill(); }
  },
  tower(x,y,t){
    const F=GameState.flags, on=F.powered;
    const sway=Math.sin(t*.3)*3;
    ctx.fillStyle='#222c40';
    ctx.beginPath(); ctx.moveTo(x-44,y);
    ctx.bezierCurveTo(x-30,y-120,x-22+sway,y-210,x-13+sway,y-290);
    ctx.lineTo(x+13+sway,y-290);
    ctx.bezierCurveTo(x+24,y-200,x+34,y-110,x+46,y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(150,190,230,.12)'; ctx.lineWidth=2;
    for(let i=1;i<7;i++){ const yy=y-i*42, w=44-i*4.6;
      ctx.beginPath(); ctx.moveTo(x-w,yy); ctx.quadraticCurveTo(x+sway*i/7,yy+6,x+w,yy); ctx.stroke(); }
    for(let i=0;i<3;i++) blinker(x-6+hsh(i*4)*14, y-70-i*65, 2.6, 40+i, t, on?'rgba(150,255,200,A)':'rgba(120,170,255,A)');
    ctx.save(); ctx.translate(this.panX,this.panY); ctx.rotate(-.45+Math.sin(t*.4)*.02);
    const pg=ctx.createLinearGradient(-50,-30,50,30);
    if(on){ pg.addColorStop(0,'#7ec8ea'); pg.addColorStop(1,'#2a6f9e'); }
    else { pg.addColorStop(0,'#27415c'); pg.addColorStop(1,'#15273c'); }
    ctx.fillStyle=pg;
    ctx.beginPath(); ctx.moveTo(-56,0);
    ctx.quadraticCurveTo(0,-40,56,0); ctx.quadraticCurveTo(0,38,-56,0); ctx.fill();
    ctx.strokeStyle=on?'rgba(220,250,255,.6)':'rgba(130,180,230,.3)'; ctx.lineWidth=1.2;
    for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(-50,i*1);
      ctx.quadraticCurveTo(0,i*14,-0+50,i*1); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-56,0); ctx.lineTo(56,0); ctx.stroke();
    ctx.restore();
    if(on) glow(this.panX,this.panY,75,'rgba(140,220,255,A)',(.3+Math.sin(t*3)*.12).toFixed(3));
    ctx.strokeStyle='#2c3a52'; ctx.lineWidth=6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(this.panX+30,this.panY+18); ctx.quadraticCurveTo(x-10,y-260,x+sway,y-250); ctx.stroke();
    ctx.strokeStyle='#41536e'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(x+sway,y-288); ctx.quadraticCurveTo(x+sway+4,y-330,x+sway,y-358); ctx.stroke();
    const aX=x+sway, aY=y-362;
    if(on){
      glow(aX,aY,40,'rgba(255,140,150,A)',(.5+Math.sin(t*5)*.3).toFixed(3));
      ctx.fillStyle=`rgba(255,170,180,${(.7+Math.sin(t*5)*.3).toFixed(3)})`;
    } else ctx.fillStyle='rgba(120,140,170,.8)';
    ctx.beginPath(); ctx.arc(aX,aY,5,0,TAU); ctx.fill();
    for(const r0 of this.rings){
      ctx.strokeStyle=`rgba(255,190,200,${(r0.life*.5).toFixed(3)})`; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(aX,aY,r0.r,0,TAU); ctx.stroke();
    }
  },
  pedestal(x,y,t){
    const F=GameState.flags;
    blob(x,y+58,34,61,t*.2,'#1d2840',.07,.5);
    ctx.strokeStyle='#2c3a55'; ctx.lineWidth=10; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x-4,y+58); ctx.bezierCurveTo(x-12,y+30,x+10,y+22,x,y+2); ctx.stroke();
    ctx.strokeStyle='#3a4c6e'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(x-2,y+56); ctx.bezierCurveTo(x-9,y+32,x+8,y+24,x,y+6); ctx.stroke();
    blinker(x-10,y+34,1.8,44,t,'rgba(150,210,255,A)');
    if(F.mirrorMounted){
      glow(x,y,46,'rgba(190,225,255,A)','.18');
      ctx.save(); ctx.translate(x,y); ctx.rotate(this.angle);
      const mg=ctx.createLinearGradient(-6,-34,8,34);
      mg.addColorStop(0,'#eaf6ff'); mg.addColorStop(.5,'#a9cdef'); mg.addColorStop(1,'#5d83ab');
      ctx.fillStyle=mg;
      ctx.beginPath(); ctx.moveTo(-3,-36); ctx.quadraticCurveTo(9,-10,4,34);
      ctx.lineTo(-7,30); ctx.quadraticCurveTo(-10,-8,-3,-36); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.75)';
      ctx.beginPath(); ctx.moveTo(-2,-30); ctx.lineTo(2,-26); ctx.lineTo(-3,18); ctx.lineTo(-6,14); ctx.closePath(); ctx.fill();
      ctx.restore();
      if(!F.powered){
        const aa=.25+Math.sin(t*2)*.15;
        ctx.strokeStyle=`rgba(190,230,255,${aa.toFixed(3)})`; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(x,y,46,this.angle+.4,this.angle+1.6); ctx.stroke();
        ctx.beginPath(); ctx.arc(x,y,46,this.angle+Math.PI+.4,this.angle+Math.PI+1.6); ctx.stroke();
      }
    } else {
      ctx.setLineDash([4,6]); ctx.lineDashOffset=-t*10;
      ctx.strokeStyle=`rgba(170,210,255,${(.3+Math.sin(t*2)*.15).toFixed(3)})`;
      ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x-4,y-32); ctx.quadraticCurveTo(x+8,y-6,x+3,y+30);
      ctx.lineTo(x-8,y+26); ctx.quadraticCurveTo(x-11,y-8,x-4,y-32); ctx.closePath(); ctx.stroke();
      ctx.setLineDash([]);
    }
  },
  shardProp(x,y,t){
    glow(x,y-8,36,'rgba(180,220,255,A)',(.14+Math.sin(t*1.6)*.06).toFixed(3));
    const sg=ctx.createLinearGradient(x-12,y-28,x+12,y+6);
    sg.addColorStop(0,'#e8f4ff'); sg.addColorStop(1,'#6d93ba');
    ctx.fillStyle=sg;
    ctx.beginPath(); ctx.moveTo(x-10,y+4); ctx.lineTo(x-4,y-30); ctx.lineTo(x+10,y-20); ctx.lineTo(x+12,y+4); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.6)';
    ctx.beginPath(); ctx.moveTo(x-5,y-24); ctx.lineTo(x-1,y-22); ctx.lineTo(x-2,y+2); ctx.lineTo(x-6,y+2); ctx.closePath(); ctx.fill();
    blob(x,y+6,18,66,t*.3,'#1a2438',.08,.4);
  },
  onClick(x,y){
    const F=GameState.flags;
    if(F.ended||this.podPhase>0) return;
    if(!Save.data.eggs[4] && Math.hypot(x-608,y-524)<17){ collectEgg(4,608,524); return; }
    if(!F.hasShard && !F.mirrorMounted && Math.hypot(x-150,y-495)<36){
      F.hasShard=true; GameState.give('shard',c=>ItemArt.shard(c));
      Au.sfx('pick'); burst(150,495,'rgba(190,225,255,A)',14,80); return;
    }
    if(Math.hypot(x-this.mirX,y-this.mirY)<55){
      if(!F.mirrorMounted){
        if(GameState.selected==='shard'){
          F.mirrorMounted=true; GameState.take('shard');
          Au.sfx('shimmer'); burst(this.mirX,this.mirY,'rgba(200,235,255,A)',18,80);
        } else { Au.sfx('deny'); think(ICON.shard,this.ax,this.ay-60); }
      } else if(!F.powered){ this.dragging=true; Au.sfx('hover'); }
      return;
    }
    if(Math.hypot(x-this.panX,y-this.panY)<60 && !F.powered){
      Au.sfx('deny'); think(ICON.sun,this.ax,this.ay-60); return;
    }
    /* optional toys */
    if(Math.hypot(x-this.sunX,y-this.sunY)<46){
      this.starFlare=1; Au.sfx('chime');
      burst(this.sunX,this.sunY,'rgba(255,240,180,A)',14,90); return;
    }
    for(let i=0;i<2;i++){
      if(Math.hypot(x-this.PEBBLES[i][0],y-this.PEBBLES[i][1])<22){
        this.pebbleW[i]=1; Au.thud(180,.08); return;
      }
    }
  },
  onMove(x,y){
    const F=GameState.flags;
    if(this.dragging && F.mirrorMounted && !F.powered){
      this.angle=Math.atan2(y-this.mirY,x-this.mirX)+Math.PI/2;
      return 'grabbing';
    }
    if(F.ended||this.podPhase>0) return 'default';
    if(!Save.data.eggs[4] && Math.hypot(x-608,y-524)<17) return 'hot';
    if(!F.hasShard && !F.mirrorMounted && Math.hypot(x-150,y-495)<36) return 'hot';
    if(Math.hypot(x-this.mirX,y-this.mirY)<55) return F.mirrorMounted&&!F.powered?'rotate':'hot';
    if(Math.hypot(x-this.panX,y-this.panY)<60&&!F.powered) return 'hot';
    if(Math.hypot(x-this.sunX,y-this.sunY)<46) return 'hot';
    for(const p of this.PEBBLES) if(Math.hypot(x-p[0],y-p[1])<22) return 'hot';
    return 'default';
  },
  onUp(){ this.dragging=false; },
  pod(x,y,t){
    drawPod(x,y,t,{
      beam: this.podPhase===2, beamLen: 560-y,
      exhaust: this.podPhase===3 ? 1 : (this.podPhase===1 ? -.4 : 0)
    });
  }
};
