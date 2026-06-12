'use strict';
/* ============================================================
   SCENE GRAPH — each scene: enter/update/render/onClick/onMove
   Hotspots: {x,y,r, active(), click()}  (circle hit, list order)
   Scene order: 0 jungle → 1 cavern → 2 gears → 3 geysers → 4 summit
   Every scene hides one kinder egg (Save.data.eggs[index]).
   ============================================================ */

/* ============================================================
   SCENE 0 — NIGHT JUNGLE
   bucket → fill at weeping root → water the song-flower →
   creature falls asleep → burrow opens (down into the cavern)
   ============================================================ */
const SceneJungle={
  ax:330, ay:520, EGG:0,
  drift: makeDrift(34,'rgba(180,255,210,A)',1.8,8),
  fireflies: makeDrift(10,'rgba(255,230,140,A)',2.4,4),
  notes:[], dripY:0, growl:0, flowerBloom:0, sleepAt:0,
  tele:{mode:null,t:0},                       // telepathic bucket-filling
  pour:{active:false,t:0,splash:false},       // telekinetic watering
  fizzle:0, plantBounce:0,                    // failed-telepathy sputter / plant reaction
  planetPulse:0, popL:0, popR:0,              // toy reactions
  bug:{x:430,dir:1,scare:0},                  // tiny alien bug on patrol
  hotspots:[],
  reset(){ this.notes.length=0; this.growl=0; this.flowerBloom=0; this.sleepAt=0;
    this.tele={mode:null,t:0}; this.pour={active:false,t:0,splash:false};
    this.fizzle=0; this.plantBounce=0; this.planetPulse=0; this.popL=0; this.popR=0;
    this.bug={x:430,dir:1,scare:0}; this.enter(); },
  enter(){
    const F=GameState.flags;
    this.hotspots=[
      {x:64,y:546,r:16, active:()=>!Save.data.eggs[0],
        click:()=>collectEgg(0,64,546)},
      {x:185,y:500,r:34, active:()=>!F.hasBucket,
        click:()=>{ F.hasBucket=true; GameState.give('bucket',c=>ItemArt.bucket(c,false));
          Au.sfx('pick'); burst(185,495,'rgba(220,190,150,A)',12,70); }},
      {x:790,y:455,r:62, active:()=>true,
        click:()=>{
          if(this.tele.mode) return;          // already concentrating
          if(F.hasBucket && !F.bucketFull){
            this.tele={mode:'fill',t:0};      // the water is called, not carried
            Au.sfx('shimmer');
          } else if(F.bucketFull){ Au.sfx('drip'); }
          else { Au.sfx('deny'); think(ICON.drop,this.ax,this.ay-60); } }},
      {x:470,y:360,r:50, active:()=>true,
        click:()=>{
          if(F.watered){ Au.sfx('melody'); return; }
          if(this.pour.active) return;
          if(GameState.selected==='bucket_full'){
            this.pour={active:true,t:0,splash:false};  // the bucket floats over by thought
            GameState.selected=null; Inv.refresh();
            Au.sfx('shimmer');
          } else {
            this.fizzle=1;                    // telepathy sputters — nothing to pour
            Au.sfx('deny'); think(ICON.drop,this.ax,this.ay-60);
          } }},
      {x:700,y:495,r:60, active:()=>true,
        click:()=>{
          if(GameState.flags.asleep){ Au.sfx('snore'); }
          else { this.growl=1; Au.sfx('deny'); Au.thud(45,.22); think(ICON.zzz,this.ax,this.ay-60); } }},
      {x:880,y:455,r:48, active:()=>true,
        click:()=>{
          if(GameState.flags.asleep){ Au.sfx('door'); Trans.start(1,880,455); }
          else { this.growl=1; Au.sfx('deny'); think(ICON.zzz,this.ax,this.ay-60); } }},
      // the little cat, waiting to be rescued
      {x:392,y:518,r:26, active:()=>!F.catPicked,
        click:()=>{ F.catPicked=true; Au.sfx('meow');
          burst(392,510,'rgba(255,180,210,A)',12,60); }},
      // the ringed planet — pour it some water and see
      {x:210,y:120,r:62, active:()=>true,
        click:()=>{
          if(GameState.selected==='bucket_full' && !F.saturnFall){
            F.saturnFall=true;                // the rings overflow, forever
            Au.sfx('shimmer'); Au.sfx('water');
            burst(270,135,'rgba(170,190,255,A)',22,90);
          } else { this.planetPulse=1; Au.sfx('hover'); } }}
    ];
  },
  update(dt,t){
    const F=GameState.flags;
    this.dripY=(t*1.1)%1;
    if(this.dripY<dt*1.1 && Math.random()<.6) Au.sfx('drip');
    this.growl=Math.max(0,this.growl-dt*2);
    if(F.watered) this.flowerBloom=Math.min(1,this.flowerBloom+dt*.7);
    if(this.sleepAt && t>this.sleepAt && !F.asleep){ F.asleep=true; this.sleepAt=0;
      Au.sfx('snore'); burst(700,490,'rgba(200,220,255,A)',10,40); }
    if(F.watered && Math.random()<dt*1.6)
      this.notes.push({x:470+(Math.random()-.5)*30,y:330,vy:-22-Math.random()*14,ph:Math.random()*TAU,life:1,g:Math.random()<.5});
    for(let i=this.notes.length-1;i>=0;i--){ const n=this.notes[i];
      n.y+=n.vy*dt; n.x+=Math.sin(t*2+n.ph)*.5; n.life-=dt*.35;
      if(n.life<=0) this.notes.splice(i,1); }
    /* telepathic bucket fill */
    if(this.tele.mode==='fill'){
      this.tele.t+=dt;
      if(this.tele.t>=2.3){
        this.tele.mode=null;
        F.bucketFull=true;
        GameState.swap('bucket','bucket_full',c=>ItemArt.bucket(c,true));
        Au.sfx('fill');
        burst(this.ax,this.ay-50,'rgba(150,220,255,A)',16,70);
      }
    }
    /* telekinetic watering */
    if(this.pour.active){
      this.pour.t+=dt;
      if(this.pour.t>=1 && !this.pour.splash){ this.pour.splash=true; Au.sfx('water'); }
      if(this.pour.t>1){
        const pt=this.pour.t-1;
        this.plantBounce=Math.sin(pt*7)*Math.exp(-pt*1.8)*6;   // damped happy bounce
        if(Math.random()<dt*9) burst(470+(Math.random()-.5)*34,330+Math.random()*30,'rgba(190,255,220,A)',2,30);
      }
      if(this.pour.t>=2.4){
        this.pour={active:false,t:0,splash:false};
        this.plantBounce=0;
        F.watered=true; GameState.take('bucket_full');
        setTimeout(()=>Au.sfx('bloom'),300);
        setTimeout(()=>Au.sfx('melody'),1100);
        this.sleepAt=GameState.t+3.4;
      }
    }
    this.fizzle=Math.max(0,this.fizzle-dt*.9);
    /* toy reactions decay */
    this.planetPulse=Math.max(0,this.planetPulse-dt*1.6);
    this.popL=Math.max(0,this.popL-dt*1.2);
    this.popR=Math.max(0,this.popR-dt*1.2);
    /* the bug patrols, or flees */
    const b=this.bug;
    b.scare=Math.max(0,b.scare-dt*.7);
    b.x+=b.dir*dt*(14+b.scare*120);
    if(b.x>620){b.dir=-1;} if(b.x<360){b.dir=1;}
  },
  render(t){
    const F=GameState.flags;
    skyGrad([[0,'#070718'],[.45,'#141033'],[.8,'#2a1c4e'],[1,'#3b2a5e']]);
    for(let i=0;i<90;i++){ const sx=hsh(i*7)*W, sy=hsh(i*13)*H*.55;
      const tw=.3+Math.sin(t*.8+i*1.7)*.25;
      ctx.fillStyle=`rgba(235,240,255,${tw.toFixed(3)})`;
      ctx.fillRect(sx,sy,1.4+hsh(i)*1,1.4+hsh(i)*1); }
    // ringed sister planet (pulses when poked)
    const mpx=210+px(-.012), mpy=120+py(-.012);
    const pp2=1+this.planetPulse*.1*Math.sin(this.planetPulse*8);
    ctx.save(); ctx.translate(mpx,mpy); ctx.scale(pp2,pp2); ctx.translate(-mpx,-mpy);
    glow(mpx,mpy,120,'rgba(190,160,255,A)',(0.22+this.planetPulse*.15).toFixed(3));
    const pg=ctx.createRadialGradient(mpx-14,mpy-14,4,mpx,mpy,46);
    pg.addColorStop(0,'#cdb8ee'); pg.addColorStop(1,'#5a4490');
    ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(mpx,mpy,46,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(220,200,255,.4)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.ellipse(mpx,mpy,74,16,-.3,0,TAU); ctx.stroke();
    ctx.fillStyle='rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.arc(mpx+16,mpy+10,38,0,TAU); ctx.fill();
    ctx.restore();
    if(F.saturnFall) this.saturnWaterfall(mpx,mpy,t);

    /* parallax vegetation layers */
    ctx.save(); ctx.translate(px(-.02),0);
    ridge(390,26,3,'#100c28');
    for(let i=0;i<7;i++){ const mx2=60+i*150+hsh(i)*70, my2=395+hsh(i*3)*16;
      this.mushTree(mx2,my2,38+hsh(i*5)*30,'#181040','#241556',t,i,.5); }
    ctx.restore();

    ctx.save(); ctx.translate(px(-.008),0);
    ridge(440,22,7,'#131130');
    this.mushTree(110,455,62,'#1c1430','#33205e',t,11,.8);
    this.mushTree(590,450,52,'#1c1430','#2d1c54',t,12,.8);
    ctx.restore();

    ridge(478,16,12,'#1b2335');
    ridge(520,12,15,'#141a29');
    for(let i=0;i<8;i++) blob(80+i*120+hsh(i*9)*60, 500+hsh(i*4)*60, 24+hsh(i*2)*18, i*4, t*.4, 'rgba(60,120,90,.14)', .15, .5);

    // hidden egg — tucked behind the great mushroom's trunk
    if(!Save.data.eggs[0]) drawEgg(64,546,15,t);

    /* foreground mushroom trees (breathing; pop when clicked) */
    this.popTree(70,560,95,'#241a3c','#46307a',t,21,this.popL);
    this.popTree(950,575,110,'#241a3c','#3d2a6e',t,22,this.popR);
    breathPlant(255,545,70,2,t,'#3a5a48','#67b78a');
    breathPlant(285,550,46,5,t,'#3a5a48','#5aa37c');
    breathPlant(620,540,56,8,t,'#3a5a48','#74c694');
    blinker(70,470,2.4,1,t,'rgba(140,255,200,A)');
    blinker(950,455,2.4,2,t,'rgba(255,180,140,A)');

    this.weepingRoot(790,300,t);
    this.songFlower(470,400,t);
    if(!F.hasBucket) this.bucketProp(185,505,t);
    this.burrow(880,470,t);
    this.creature(700,505,t);

    for(const n of this.notes){
      ctx.fillStyle=`rgba(255,225,150,${(n.life*.85).toFixed(3)})`;
      ctx.save(); ctx.translate(n.x,n.y); ctx.rotate(Math.sin(t+n.ph)*.2); ctx.scale(.9,.9);
      ctx.beginPath(); ctx.ellipse(0,4,3.4,2.6,-.4,0,TAU); ctx.fill();
      ctx.fillRect(2.6,-8,1.4,12);
      if(n.g) ctx.fillRect(2.6,-8,6,1.6);
      ctx.restore();
    }

    /* the little bug on patrol */
    this.drawBug(t);
    /* the waiting cat */
    if(!F.catPicked) drawCat(392,528,t,1,false);

    drawAstronaut(this.ax,this.ay,t);
    /* telepathy overlays */
    if(this.tele.mode==='fill') this.teleFx(t);
    if(this.pour.active) this.pourFx(t);
    if(this.fizzle>0) this.fizzleFx(t);
    this.drift.draw(t,.1);
    this.fireflies.draw(t,.05);

    const vg=ctx.createRadialGradient(W/2,H*.45,H*.35,W/2,H*.5,H*.95);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(4,2,14,.55)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

    if(GameState.idle>9){
      if(!F.hasBucket) hintGlow(185,500,t);
      else if(!F.bucketFull && !F.watered) hintGlow(790,430,t);
      else if(!F.watered) hintGlow(470,360,t);
      else if(F.asleep) hintGlow(880,455,t);
    }
  },
  mushTree(x,y,r,trunkC,capC,t,seed,liveness){
    const sway=Math.sin(t*.4+seed)*r*.03*liveness;
    const br=1+Math.sin(t*.9+seed*2)*.03*liveness;
    ctx.strokeStyle=trunkC; ctx.lineWidth=r*.3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x,y);
    ctx.bezierCurveTo(x-r*.1,y-r*.7, x+sway*3,y-r*1.1, x+sway*4,y-r*1.5);
    ctx.stroke();
    blob(x+sway*4,y-r*1.55,r*br,seed,t*.5,capC,.1,.62);
    ctx.fillStyle='rgba(255,255,255,.07)';
    ctx.beginPath(); ctx.ellipse(x+sway*4-r*.3,y-r*1.7,r*.34,r*.16,-.4,0,TAU); ctx.fill();
    for(let i=0;i<4;i++){ ctx.fillStyle='rgba(255,255,255,.10)';
      ctx.beginPath(); ctx.arc(x+sway*4+(hsh(seed+i)-.5)*r*1.3, y-r*1.5+(hsh(seed+i*3)-.4)*r*.5, r*.07,0,TAU); ctx.fill(); }
  },
  weepingRoot(x,y,t){
    ctx.strokeStyle='#2e2546'; ctx.lineWidth=22; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x+90,-10); ctx.bezierCurveTo(x+70,y-160,x-30,y-110,x,y-40); ctx.stroke();
    ctx.strokeStyle='#3a2f56'; ctx.lineWidth=12;
    ctx.beginPath(); ctx.moveTo(x+82,-10); ctx.bezierCurveTo(x+66,y-150,x-22,y-104,x,y-44); ctx.stroke();
    blob(x,y-36,17,31,t,'#473a66',.12);
    blinker(x-14,y-90,2.6,4,t,'rgba(140,220,255,A)');
    blinker(x+24,y-150,2.2,5,t,'rgba(180,160,255,A)');
    const dy=ease(this.dripY)*198;
    ctx.fillStyle='rgba(150,215,255,.9)';
    ctx.beginPath(); ctx.ellipse(x,y-24+dy,3.4,5+this.dripY*3,0,0,TAU); ctx.fill();
    const pr=1+Math.sin(t*2.2)*.04;
    ctx.fillStyle='rgba(90,170,230,.5)';
    ctx.beginPath(); ctx.ellipse(x,y+180,46*pr,11*pr,0,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(170,220,255,.5)'; ctx.lineWidth=1.5;
    const rr=(t*.8)%1;
    ctx.globalAlpha=1-rr;
    ctx.beginPath(); ctx.ellipse(x,y+180,46*rr,11*rr,0,0,TAU); ctx.stroke();
    ctx.globalAlpha=1;
    glow(x,y+178,60,'rgba(120,200,255,A)','.12');
  },
  songFlower(x,y,t){
    const b=this.flowerBloom;
    blob(x,y+34,52,17,t*.3,'#22304a',.08,.45);
    const bob=Math.sin(t*.7)*4+(this.plantBounce||0);
    const h=66+b*26, tipY=y-h+bob;
    ctx.strokeStyle=lerpColor('#3d5a4a','#5d8f6e',b); ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x,y+8);
    ctx.bezierCurveTo(x-14,y-h*.4, x+12,y-h*.7, x,tipY+12); ctx.stroke();
    ctx.fillStyle=lerpColor('#34503f','#4f8463',b);
    ctx.beginPath(); ctx.moveTo(x-2,y-12);
    ctx.quadraticCurveTo(x-38,y-26-b*6,x-46,y-2);
    ctx.quadraticCurveTo(x-22,y+4,x-2,y-6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x+2,y-20);
    ctx.quadraticCurveTo(x+36,y-38-b*6,x+46,y-12);
    ctx.quadraticCurveTo(x+24,y-4,x+2,y-14); ctx.fill();
    if(b<.05){
      blob(x,tipY+6,13,23,t*.5,'#4e4258',.1,1.2);
      ctx.fillStyle='rgba(0,0,0,.2)';
      ctx.beginPath(); ctx.ellipse(x,tipY+2,5,8,0,0,TAU); ctx.fill();
    } else {
      const open=ease(b);
      glow(x,tipY,70*open,'rgba(255,215,130,A)',(0.25*open).toFixed(3));
      for(let i=0;i<6;i++){
        const a=-Math.PI/2+(i-2.5)*.5*open;
        const plen=30*open, pw=12*open;
        ctx.fillStyle=`hsla(${42+i*6},85%,${62+Math.sin(t*1.4+i)*6}%,.92)`;
        ctx.save(); ctx.translate(x,tipY+8); ctx.rotate(a+Math.sin(t*1.2+i)*.06);
        ctx.beginPath(); ctx.moveTo(0,0);
        ctx.bezierCurveTo(-pw,-plen*.5,-pw*.6,-plen,0,-plen);
        ctx.bezierCurveTo(pw*.6,-plen,pw,-plen*.5,0,0); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle='#ffefc0';
      ctx.beginPath(); ctx.arc(x,tipY+6,7*open,0,TAU); ctx.fill();
    }
  },
  bucketProp(x,y,t){
    glow(x,y,40,'rgba(255,230,170,A)','.07');
    ctx.strokeStyle='#84684c'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x-13,y-12); ctx.quadraticCurveTo(x,y-26,x+13,y-12); ctx.stroke();
    const g=ctx.createLinearGradient(0,y-14,0,y+14);
    g.addColorStop(0,'#9c8062'); g.addColorStop(1,'#5e4936');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.moveTo(x-15,y-12); ctx.lineTo(x-10,y+14);
    ctx.quadraticCurveTo(x,y+18,x+10,y+14); ctx.lineTo(x+15,y-12);
    ctx.quadraticCurveTo(x,y-7,x-15,y-12); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.2)'; ctx.fillRect(x-9,y-6,2.5,14);
    ctx.fillStyle='rgba(120,200,140,.35)';
    ctx.beginPath(); ctx.arc(x+7,y+4,3,0,TAU); ctx.fill();
  },
  burrow(x,y,t){
    const open=GameState.flags.asleep;
    blob(x,y+12,62,41,t*.2,'#241c33',.06,.7);
    blob(x,y+6,46,43,t*.25,'#161024',.05,.9);
    if(open){
      glow(x,y+4,52,'rgba(150,255,190,A)',(.25+Math.sin(t*2)*.1).toFixed(3));
      ctx.fillStyle='rgba(40,90,60,.9)';
    } else ctx.fillStyle='rgba(8,6,16,.95)';
    blobPath(x,y+6,34,44,t*.3,.07,1.1); ctx.fill();
    if(open){
      ctx.strokeStyle=`rgba(190,255,210,${(.5+Math.sin(t*3)*.25).toFixed(3)})`;
      ctx.lineWidth=2;
      ctx.beginPath();
      for(let a=0;a<TAU*2.2;a+=.2){ const r2=3+a*4.5;
        const sx=x+Math.cos(a+t)*r2, sy=y+6+Math.sin(a+t)*r2*.8;
        a===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy); }
      ctx.stroke();
    }
    blinker(x-48,y+26,2,7,t,'rgba(150,255,200,A)');
    blinker(x+44,y+20,2,8,t,'rgba(150,255,200,A)');
  },
  creature(x,y,t){
    const F=GameState.flags;
    const g=this.growl;
    if(!F.asleep){
      const cb=Math.sin(t*1.3)*4+g*Math.sin(t*30)*3;
      const puff=1+g*.25;
      ctx.save(); ctx.translate(x,y+cb*.3); ctx.scale(puff,puff);
      blob(0,-26,46,51,t*.6,'#7e5f46',.09,.78);
      blob(6,-34,34,52,t*.7,'#96755a',.1,.85);
      ctx.strokeStyle='#6b4f3a'; ctx.lineWidth=2; ctx.lineCap='round';
      for(let i=0;i<14;i++){ const a=Math.PI+i/14*Math.PI;
        const fx=Math.cos(a)*44, fy=-26+Math.sin(a)*34;
        ctx.beginPath(); ctx.moveTo(fx,fy);
        ctx.lineTo(fx+Math.cos(a)*9, fy+Math.sin(a)*9+Math.sin(t*2+i)*2); ctx.stroke(); }
      blob(-22,-62,10,53,t,'#96755a',.15,1.3);
      blob(26,-66,9,54,t,'#96755a',.15,1.3);
      const look=clamp((this.ax-x)*.02,-3,3);
      ctx.fillStyle='#f4e9d8';
      ctx.beginPath(); ctx.ellipse(-6,-44,8,9*(1-g*.5),0,0,TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(18,-46,8,9*(1-g*.5),0,0,TAU); ctx.fill();
      ctx.fillStyle='#1d1410';
      ctx.beginPath(); ctx.arc(-6+look,-44,3.4,0,TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(18+look,-46,3.4,0,TAU); ctx.fill();
      blob(7,-30,11,55,t,'#b08e6e',.08,.8);
      ctx.fillStyle='#3a2a22';
      ctx.beginPath(); ctx.ellipse(7,-33,4.5,3.2,0,0,TAU); ctx.fill();
      if(g>0){
        ctx.fillStyle='#fff';
        for(let i=0;i<3;i++){ ctx.beginPath();
          ctx.moveTo(-2+i*7,-24); ctx.lineTo(1.5+i*7,-18); ctx.lineTo(5+i*7,-24); ctx.fill(); } }
      ctx.fillStyle='#6b4f3a';
      for(let i=0;i<4;i++) blob(-30+i*19,2,8,57+i,t,'#6b4f3a',.06,.6);
      ctx.restore();
    } else {
      const breath=1+Math.sin(t*.8)*.05;
      ctx.save(); ctx.translate(x,y+4); ctx.scale(breath,1/breath*.96);
      blob(0,-16,42,51,t*.3,'#6b513d',.07,.6);
      blob(8,-20,28,52,t*.32,'#7e5f46',.07,.7);
      ctx.strokeStyle='#5b4332'; ctx.lineWidth=2; ctx.lineCap='round';
      for(let i=0;i<10;i++){ const a=Math.PI+i/10*Math.PI;
        ctx.beginPath(); ctx.moveTo(Math.cos(a)*40,-16+Math.sin(a)*24);
        ctx.lineTo(Math.cos(a)*47,-16+Math.sin(a)*28); ctx.stroke(); }
      ctx.strokeStyle='#2a1d15'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(0,-22,4,.2,Math.PI-.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(16,-23,4,.2,Math.PI-.2); ctx.stroke();
      ctx.restore();
      for(let i=0;i<3;i++){ const ph=(t*.4+i*.33)%1;
        ctx.strokeStyle=`rgba(205,225,255,${((1-ph)*.7).toFixed(3)})`;
        ctx.lineWidth=2; ctx.lineCap='round';
        const zx=x+18+ph*36+Math.sin(t+i)*4, zy=y-50-ph*44, zs=4+ph*5;
        ctx.beginPath(); ctx.moveTo(zx-zs,zy-zs); ctx.lineTo(zx+zs,zy-zs);
        ctx.lineTo(zx-zs,zy+zs); ctx.lineTo(zx+zs,zy+zs); ctx.stroke(); }
    }
  },
  /* --- telepathy / pour / fizzle overlays --- */
  teleFx(t){
    const tt=this.tele.t, prog=clamp(tt/2.3,0,1);
    const a=Math.min(tt*2,(2.3-tt)*2.5,1);
    drawAura(this.ax,this.ay-49,t,prog,'rgba(150,230,255,A)');
    drawTeleBeam(this.ax+12,this.ay-46,790,470,t,a,'rgba(150,220,255,A)');
    // droplets answer the call, flowing pool → bucket
    const dx=790-(this.ax+12), dy=470-(this.ay-46), L=Math.hypot(dx,dy);
    for(let i=0;i<6;i++){
      const u=1-((t*.55+i/6)%1);
      const n=Math.sin(u*9-t*6)*10*Math.sin(u*Math.PI);
      ctx.fillStyle=`rgba(170,225,255,${(a*.9*(.4+u*.6)).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(lerp(this.ax+12,790,u)-dy/L*n, lerp(this.ay-46,470,u)+dx/L*n, 2.6,0,TAU);
      ctx.fill();
    }
    glow(790,478,42,'rgba(150,220,255,A)',(a*.25).toFixed(3));
  },
  pourFx(t){
    const pt=this.pour.t;
    const a=Math.min(pt*3,(2.4-pt)*4,1);
    drawAura(this.ax,this.ay-49,t,clamp(pt/2.4,0,1),'rgba(190,230,255,A)');
    // the bucket glides from the traveller's side to hover above the flower
    const p=ease(clamp(pt,0,1));
    const bx=lerp(this.ax+18,470,p), by=lerp(this.ay-34,296,p)-Math.sin(p*Math.PI)*36;
    const rot=pt>1 ? -1.9*ease(clamp((pt-1)*2.5,0,1)) : 0;
    drawTeleBeam(this.ax+12,this.ay-46,bx,by,t,a*.6,'rgba(190,230,255,A)');
    this.miniBucket(bx,by+Math.sin(t*3)*2,rot,a);
    // pouring stream
    if(pt>1 && pt<2.3){
      for(let k=0;k<5;k++){
        const u=((pt-1)*1.4+k/5)%1;
        ctx.fillStyle=`rgba(150,215,255,${((1-u)*.9).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(456+u*9+Math.sin(t*8+k)*1.5, 304+u*40, 2.6,3.6,0,0,TAU);
        ctx.fill();
      }
    }
  },
  miniBucket(x,y,rot,a){
    ctx.save(); ctx.globalAlpha=a; ctx.translate(x,y); ctx.rotate(rot); ctx.scale(.8,.8);
    glow(0,0,28,'rgba(170,220,255,A)','.25');
    ctx.strokeStyle='#84684c'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-13,-12); ctx.quadraticCurveTo(0,-26,13,-12); ctx.stroke();
    const g=ctx.createLinearGradient(0,-14,0,14);
    g.addColorStop(0,'#9c8062'); g.addColorStop(1,'#5e4936');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.moveTo(-15,-12); ctx.lineTo(-10,14);
    ctx.quadraticCurveTo(0,18,10,14); ctx.lineTo(15,-12);
    ctx.quadraticCurveTo(0,-7,-15,-12); ctx.fill();
    ctx.fillStyle='#6fc3f0';
    ctx.beginPath(); ctx.ellipse(0,-9.5,12,3.4,0,0,TAU); ctx.fill();
    ctx.restore();
  },
  fizzleFx(t){
    // grey sputtering sparks — telepathy with nothing to give
    const a=this.fizzle;
    glow(this.ax,this.ay-49,24,'rgba(180,180,190,A)',(a*.18).toFixed(3));
    for(let i=0;i<5;i++){
      const u=(t*1.4+i/5)%1;
      ctx.fillStyle=`rgba(190,195,205,${(a*(1-u)*.6).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(this.ax+(hsh(i*7)-.5)*26, this.ay-52-u*16+u*u*22, 1.6,0,TAU);
      ctx.fill();
    }
  },
  /* --- saturn waterfall easter egg --- */
  saturnWaterfall(mx,my,t){
    const topX=mx+62, topY=my+10, botY=392;
    // translucent stream body, swaying
    const g=ctx.createLinearGradient(0,topY,0,botY);
    g.addColorStop(0,'rgba(140,190,255,.30)');
    g.addColorStop(.7,'rgba(165,150,255,.16)');
    g.addColorStop(1,'rgba(170,150,255,0)');
    ctx.fillStyle=g;
    const sw=Math.sin(t*1.2)*4;
    ctx.beginPath();
    ctx.moveTo(topX-5,topY);
    ctx.bezierCurveTo(topX-8+sw,topY+90, topX-14-sw,botY-90, topX-15,botY);
    ctx.lineTo(topX+15,botY);
    ctx.bezierCurveTo(topX+14+sw,botY-90, topX+8-sw,topY+90, topX+5,topY);
    ctx.closePath(); ctx.fill();
    // blue→violet droplets riding the fall
    for(let i=0;i<16;i++){
      const p=(t*.45+i/16)%1, e=p*p*.6+p*.4;
      const hue=lerp(205,265,hsh(i*5));
      ctx.fillStyle=`hsla(${hue},85%,75%,${((1-e*.55)*.8).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(topX+Math.sin(p*7+t*1.5+i)*(3+p*11), lerp(topY,botY,e), 1.8+hsh(i)*1.6,0,TAU);
      ctx.fill();
    }
    // glittering lip + soft mist where it meets the far ridge
    blinker(topX,topY-2,2,170,t,'rgba(190,220,255,A)');
    glow(topX,botY-8,30,'rgba(165,170,255,A)',(.16+Math.sin(t*2.6)*.05).toFixed(3));
    for(let i=0;i<3;i++){ const p=(t*.7+i/3)%1;
      ctx.strokeStyle=`rgba(180,190,255,${((1-p)*.3).toFixed(3)})`; ctx.lineWidth=1;
      ctx.beginPath(); ctx.ellipse(topX,botY-4,6+p*16,2+p*4,0,0,TAU); ctx.stroke(); }
  },
  /* --- toys --- */
  popTree(x,y,r,trunkC,capC,t,seed,pop){
    const sq=1+Math.sin(pop*9)*.07*pop;
    ctx.save(); ctx.translate(x,y); ctx.scale(1+pop*.04,sq); ctx.translate(-x,-y);
    this.mushTree(x,y,r,trunkC,capC,t,seed,1);
    ctx.restore();
  },
  drawBug(t){
    const b=this.bug, bx=b.x, by=552;
    ctx.save(); ctx.translate(bx,by); ctx.scale(b.dir,1);
    // three-blob body + tick-tock legs + antennae
    ctx.fillStyle='#7a9a6a';
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(-i*4,Math.sin(t*9+i)*0.6,2.4-i*.4,0,TAU); ctx.fill(); }
    ctx.strokeStyle='#5a7a4e'; ctx.lineWidth=1;
    for(let i=0;i<3;i++){ const ph=Math.sin(t*11+i*2)*2;
      ctx.beginPath(); ctx.moveTo(-i*4,1); ctx.lineTo(-i*4+ph,4); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(2,-2); ctx.lineTo(5,-5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2,-2); ctx.lineTo(5,-3); ctx.stroke();
    blinker(0,-1,0.8,180,t,'rgba(190,255,170,A)');
    ctx.restore();
  },
  onClick(x,y){
    for(const s of this.hotspots) if(s.active()&&hitSpot(s,x,y)){ s.click(); return; }
    /* optional toys — never quest-blocking */
    if(Math.hypot(x-this.bug.x,y-552)<22){
      this.bug.scare=1; this.bug.dir*=-1; Au.sfx('squeak');
      burst(this.bug.x,548,'rgba(190,255,170,A)',4,30); return;
    }
    if(Math.hypot(x-70,y-420)<55){ this.popL=1; Au.blip(660,.06,.4,'sine',8);
      burst(70,415,'rgba(150,120,220,A)',10,60); return; }
    if(Math.hypot(x-950,y-405)<60){ this.popR=1; Au.blip(587,.06,.4,'sine',8);
      burst(940,405,'rgba(150,120,220,A)',10,60); return; }
  },
  onMove(x,y){
    for(const s of this.hotspots) if(s.active()&&hitSpot(s,x,y)) return 'hot';
    if(Math.hypot(x-this.bug.x,y-552)<22) return 'hot';
    if(Math.hypot(x-70,y-420)<55 || Math.hypot(x-950,y-405)<60) return 'hot';
    return 'default';
  }
};

/* ============================================================
   SCENE 1 — THE LUMINOUS CAVERN  (new)
   the burrow drops into darkness; three lampshrooms stand dim.
   pick glowing nectar pods off the vines and feed each shroom —
   when all three burn, the wall-crack breathes open.
   ============================================================ */
const SceneCavern={
  ax:300, ay:525, EGG:1,
  worms: makeDrift(22,'rgba(140,255,230,A)',1.5,4),
  litAnim:[0,0,0], dripT:0, sparkles:[],
  crysPulse:[0,0], snail:{x:610,dir:1,hide:0},
  SHROOMS:[{x:250,y:470,r:46},{x:480,y:430,r:52},{x:705,y:465,r:42}],
  PODS:[{x:150,y:215},{x:560,y:165},{x:835,y:245}],
  hotspots:[],
  reset(){ this.litAnim=[0,0,0]; this.sparkles.length=0;
    this.crysPulse=[0,0]; this.snail={x:610,dir:1,hide:0}; this.enter(); },
  enter(){
    const F=GameState.flags;
    this.hotspots=[
      {x:104,y:514,r:16, active:()=>!Save.data.eggs[1],
        click:()=>collectEgg(1,104,514)},
      // nectar pods on vines
      ...this.PODS.map((p,i)=>({x:p.x,y:p.y,r:30, active:()=>!F.podsTaken[i],
        click:()=>{
          if(GameState.has('nectar')){ Au.sfx('deny'); think(ICON.shroom,this.ax,this.ay-60); return; }
          F.podsTaken[i]=true;
          GameState.give('nectar',c=>ItemArt.nectar(c));
          Au.sfx('pick'); burst(p.x,p.y,'rgba(255,210,110,A)',14,70);
        }})),
      // the lampshrooms
      ...this.SHROOMS.map((s,i)=>({x:s.x,y:s.y-20,r:s.r+8, active:()=>true,
        click:()=>{
          if(F.lit[i]){ Au.sfx('hover'); return; }
          if(GameState.selected==='nectar'){
            F.lit[i]=true; GameState.take('nectar');
            Au.sfx('bloom'); burst(s.x,s.y-30,'rgba(210,180,255,A)',20,90);
            if(F.lit.every(Boolean)) setTimeout(()=>Au.sfx('door'),900);
          } else { Au.sfx('deny'); think(ICON.nectar,this.ax,this.ay-60); }
        }})),
      // the wall crack — exit
      {x:885,y:430,r:50, active:()=>true,
        click:()=>{
          if(GameState.flags.lit.every(Boolean)){ Au.sfx('door'); Trans.start(2,885,430); }
          else { Au.sfx('deny'); think(ICON.nectar,this.ax,this.ay-60); } }}
    ];
  },
  update(dt,t){
    const F=GameState.flags;
    for(let i=0;i<3;i++) if(F.lit[i]) this.litAnim[i]=Math.min(1,this.litAnim[i]+dt*.8);
    this.dripT=(t*.7)%1;
    if(this.dripT<dt*.7 && Math.random()<.5) Au.sfx('drip');
    // lit shrooms exhale sparkles
    for(let i=0;i<3;i++) if(F.lit[i] && Math.random()<dt*2){
      const s=this.SHROOMS[i];
      this.sparkles.push({x:s.x+(Math.random()-.5)*s.r,y:s.y-s.r*.6,vy:-12-Math.random()*10,life:1,ph:Math.random()*TAU});
    }
    for(let i=this.sparkles.length-1;i>=0;i--){ const s=this.sparkles[i];
      s.y+=s.vy*dt; s.x+=Math.sin(t*2+s.ph)*.4; s.life-=dt*.4;
      if(s.life<=0) this.sparkles.splice(i,1); }
    /* toys */
    this.crysPulse=this.crysPulse.map(v=>Math.max(0,v-dt*1.4));
    const sn=this.snail;
    sn.hide=Math.max(0,sn.hide-dt*.45);
    if(sn.hide<=0){ sn.x+=sn.dir*dt*5; if(sn.x>660)sn.dir=-1; if(sn.x<560)sn.dir=1; }
  },
  render(t){
    const F=GameState.flags;
    const litCount=this.litAnim[0]+this.litAnim[1]+this.litAnim[2];
    const light=litCount/3;
    /* deep rock */
    skyGrad([[0,'#08060f'],[.5,lerpColor('#0d0a18','#171230',light)],[1,lerpColor('#0a0814','#141022',light)]]);
    // back wall texture — faint strata
    for(let i=0;i<6;i++){
      ctx.strokeStyle=`rgba(120,110,160,${(0.04+light*.03).toFixed(3)})`; ctx.lineWidth=14;
      ctx.beginPath(); ctx.moveTo(-10,90+i*80);
      for(let x=0;x<=W;x+=60) ctx.lineTo(x,90+i*80+Math.sin(x*.01+i*2)*18);
      ctx.stroke();
    }
    /* stalactites, parallax */
    ctx.save(); ctx.translate(px(-.015),0);
    this.stalactites(t,'#120e20',1.15,31);
    ctx.restore();
    ctx.save(); ctx.translate(px(-.007),0);
    this.stalactites(t,'#1b1530',0.85,57);
    ctx.restore();
    /* underground pool */
    const pp=1+Math.sin(t*1.8)*.03;
    ctx.fillStyle=`rgba(70,140,200,${(.22+light*.15).toFixed(3)})`;
    ctx.beginPath(); ctx.ellipse(420,556,150*pp,17*pp,0,0,TAU); ctx.fill();
    const rr=(t*.55)%1;
    ctx.strokeStyle=`rgba(150,210,255,${((1-rr)*.4).toFixed(3)})`; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.ellipse(420,556,150*rr,17*rr,0,0,TAU); ctx.stroke();
    // drip into pool
    const dy=ease(this.dripT)*330;
    ctx.fillStyle='rgba(150,215,255,.85)';
    ctx.beginPath(); ctx.ellipse(420,220+dy,3,4.6,0,0,TAU); ctx.fill();
    /* floor */
    ridge(500,18,61,'#191328');
    ridge(540,12,63,'#100c1c');
    // hidden egg — wedged beside the stalagmite before it's drawn over
    if(!Save.data.eggs[1]) drawEgg(104,514,14,t);
    // stalagmites
    this.stalagmite(85,560,70,t,64);
    this.stalagmite(620,572,52,t,65);
    this.stalagmite(930,565,84,t,66);
    /* crystal clusters (chime when touched) */
    this.crystals(180,532,t,71,this.crysPulse[0]);
    this.crystals(770,545,t,73,this.crysPulse[1]);
    /* the shy glow-snail */
    this.drawSnail(t);
    /* vines with nectar pods */
    this.PODS.forEach((p,i)=>this.vine(p.x,p.y,t,i,!F.podsTaken[i]));
    /* the lampshrooms */
    this.SHROOMS.forEach((s,i)=>this.lampshroom(s.x,s.y,s.r,t,i,this.litAnim[i]));
    /* exit crack */
    this.crack(885,430,t,F.lit.every(Boolean));
    /* sparkles */
    for(const s of this.sparkles){
      ctx.fillStyle=`rgba(225,205,255,${(s.life*.8).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(s.x,s.y,1.8*s.life+.6,0,TAU); ctx.fill();
    }
    drawAstronaut(this.ax,this.ay,t);
    this.worms.draw(t,.04);
    /* darkness — recedes as shrooms light */
    const vg=ctx.createRadialGradient(W/2,H*.5,H*lerp(.18,.42,light),W/2,H*.5,H*1.05);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,`rgba(2,1,8,${(0.82-light*.4).toFixed(3)})`);
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

    if(GameState.idle>9){
      const F2=GameState.flags;
      if(!GameState.has('nectar')){
        const pi=F2.podsTaken.findIndex((v,i)=>!v && !F2.lit.every(Boolean));
        const free=F2.podsTaken.findIndex(v=>!v);
        if(!F2.lit.every(Boolean) && free>=0) hintGlow(this.PODS[free].x,this.PODS[free].y,t);
        else if(F2.lit.every(Boolean)) hintGlow(885,430,t);
      } else {
        const si=F2.lit.findIndex(v=>!v);
        if(si>=0) hintGlow(this.SHROOMS[si].x,this.SHROOMS[si].y-20,t);
      }
    }
  },
  stalactites(t,col,sc,seed){
    ctx.fillStyle=col;
    for(let i=0;i<11;i++){
      const x=i*96+hsh(seed+i)*60-20, len=(50+hsh(seed+i*3)*110)*sc;
      const w=(16+hsh(seed+i*7)*22)*sc;
      ctx.beginPath(); ctx.moveTo(x-w,-5);
      ctx.quadraticCurveTo(x-w*.3,len*.55, x+Math.sin(t*.3+i)*2, len);
      ctx.quadraticCurveTo(x+w*.3,len*.55, x+w,-5); ctx.closePath(); ctx.fill();
      if(hsh(seed+i*11)>.6) blinker(x,len+6,1.8,seed+i,t,'rgba(140,230,255,A)');
    }
  },
  stalagmite(x,y,h,t,seed){
    ctx.fillStyle='#1f1834';
    ctx.beginPath(); ctx.moveTo(x-h*.42,y);
    ctx.quadraticCurveTo(x-h*.1,y-h*.5,x+Math.sin(t*.2+seed)*1.5,y-h);
    ctx.quadraticCurveTo(x+h*.12,y-h*.5,x+h*.42,y); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.05)';
    ctx.beginPath(); ctx.moveTo(x-h*.1,y); ctx.quadraticCurveTo(x-h*.04,y-h*.5,x,y-h*.92);
    ctx.lineTo(x+h*.05,y-h*.5); ctx.closePath(); ctx.fill();
  },
  crystals(x,y,t,seed,pulse){
    pulse=pulse||0;
    if(pulse>0) glow(x,y-14,40,'rgba(170,230,255,A)',(pulse*.35).toFixed(3));
    for(let i=0;i<4;i++){
      const a=-.9+i*.55+hsh(seed+i)*.2, len=14+hsh(seed+i*3)*20;
      const tx=x+Math.cos(a-Math.PI/2)*len, ty=y+Math.sin(a-Math.PI/2)*len;
      const sp=.3+Math.sin(t*1.5+seed+i*2)*.25+pulse*.5;
      ctx.fillStyle=`rgba(150,220,255,${Math.min(.25+sp*.3,1).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(x-5,y); ctx.lineTo(tx,ty); ctx.lineTo(x+5,y); ctx.closePath(); ctx.fill();
      ctx.fillStyle=`rgba(235,250,255,${Math.min(sp*.5,1).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(tx,ty,1.6+pulse,0,TAU); ctx.fill();
    }
  },
  drawSnail(t){
    const sn=this.snail, hid=ease(clamp(sn.hide*1.4,0,1));
    ctx.save(); ctx.translate(sn.x,538); ctx.scale(sn.dir,1);
    // shell — a soft glowing spiral
    blob(0,-7,8,175,t*.4,'#5a4a7e',.06);
    ctx.strokeStyle='rgba(190,170,255,.5)'; ctx.lineWidth=1.4;
    ctx.beginPath();
    for(let a=0;a<TAU*1.8;a+=.3){ const r2=1+a*1.6;
      const px2=Math.cos(a+t*.2)*r2, py2=-7+Math.sin(a+t*.2)*r2*.85;
      a===0?ctx.moveTo(px2,py2):ctx.lineTo(px2,py2); }
    ctx.stroke();
    blinker(0,-7,1.4,176,t,'rgba(200,180,255,A)');
    // body slides out unless hiding
    if(hid<1){
      ctx.save(); ctx.globalAlpha=1-hid; ctx.translate(hid*-8,0);
      ctx.fillStyle='#8a78b8';
      ctx.beginPath(); ctx.ellipse(8,-2,8,3.4,0,0,TAU); ctx.fill();
      // eye stalks
      ctx.strokeStyle='#8a78b8'; ctx.lineWidth=1.6; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(13,-4); ctx.lineTo(15,-10+Math.sin(t*2)*1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(15,-4); ctx.lineTo(18,-9+Math.cos(t*2.3)*1); ctx.stroke();
      ctx.fillStyle='#1d2412';
      ctx.beginPath(); ctx.arc(15,-10.5+Math.sin(t*2)*1,1.1,0,TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(18,-9.5+Math.cos(t*2.3)*1,1.1,0,TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },
  vine(x,y,t,i,hasPod){
    const sway=Math.sin(t*.5+i*2)*6;
    ctx.strokeStyle='#2c3a2e'; ctx.lineWidth=3.5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x-sway,-5);
    ctx.bezierCurveTo(x-sway*.5,y*.4, x+sway,y*.7, x+sway*.6,y-18); ctx.stroke();
    // leaf pair
    ctx.fillStyle='#33502f';
    ctx.beginPath(); ctx.ellipse(x+sway*.6-8,y-26,9,4,-.6,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x+sway*.6+8,y-30,9,4,.6,0,TAU); ctx.fill();
    if(hasPod){
      const pb=1+Math.sin(t*1.4+i)*.07;
      glow(x+sway*.6,y,34,'rgba(255,210,110,A)',(.25+Math.sin(t*2+i)*.08).toFixed(3));
      const g=ctx.createRadialGradient(x+sway*.6-4,y-5,2,x+sway*.6,y,14*pb);
      g.addColorStop(0,'#fff3c0'); g.addColorStop(.6,'#ffce62'); g.addColorStop(1,'#b87d20');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.ellipse(x+sway*.6,y,10*pb,13*pb,0,0,TAU); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.6)';
      ctx.beginPath(); ctx.arc(x+sway*.6-3,y-4,2.6,0,TAU); ctx.fill();
    }
  },
  lampshroom(x,y,r,t,i,lit){
    const br=1+Math.sin(t*.9+i*2)*.04;
    // stem
    ctx.fillStyle=lerpColor('#241d38','#4a3c6e',lit);
    ctx.beginPath(); ctx.moveTo(x-r*.22,y+26);
    ctx.bezierCurveTo(x-r*.3,y-r*.4,x+r*.26,y-r*.4,x+r*.2,y+26); ctx.closePath(); ctx.fill();
    // gills under cap
    if(lit>0) glow(x,y-r*.55,r*2.2*lit,'rgba(205,170,255,A)',(.3*lit).toFixed(3));
    // cap
    const capC = lerpColor('#3a3052','#b9a0f0',lit);
    blob(x,y-r*.6,r*br,80+i*3,t*.4,capC,.08,.62);
    ctx.fillStyle=`rgba(255,255,255,${(.08+lit*.25).toFixed(3)})`;
    ctx.beginPath(); ctx.ellipse(x-r*.3,y-r*.75,r*.3,r*.13,-.4,0,TAU); ctx.fill();
    // freckles that ignite
    for(let k=0;k<5;k++){
      const fx=x+(hsh(i*9+k)-.5)*r*1.3, fy=y-r*.6+(hsh(i*7+k)-.45)*r*.5;
      ctx.fillStyle=lit>0?`rgba(255,245,255,${(lit*(.4+Math.sin(t*3+k)*.3)).toFixed(3)})`:'rgba(255,255,255,.08)';
      ctx.beginPath(); ctx.arc(fx,fy,r*.06,0,TAU); ctx.fill();
    }
    if(lit>0){ // soft inner lantern
      ctx.fillStyle=`rgba(225,200,255,${(lit*.25+Math.sin(t*2+i)*.06*lit).toFixed(3)})`;
      blobPath(x,y-r*.6,r*.55,90+i,t*.6,.1,.6); ctx.fill();
    }
  },
  crack(x,y,t,open){
    // jagged fissure in the right wall
    blob(x,y,66,95,t*.15,'#120d20',.05,1.4);
    ctx.fillStyle=open?'rgba(60,120,85,.95)':'rgba(5,4,10,.95)';
    ctx.beginPath();
    ctx.moveTo(x-12,y-58); ctx.lineTo(x+14,y-30) ; ctx.lineTo(x+2,y-8);
    ctx.lineTo(x+18,y+22); ctx.lineTo(x-2,y+58); ctx.lineTo(x-14,y+24);
    ctx.lineTo(x-4,y-6); ctx.lineTo(x-20,y-28); ctx.closePath(); ctx.fill();
    if(open){
      glow(x,y,60,'rgba(150,255,190,A)',(.3+Math.sin(t*2.4)*.12).toFixed(3));
      // beckoning motes slipping through
      for(let i=0;i<5;i++){ const p=(t*.5+i*.2)%1;
        ctx.fillStyle=`rgba(190,255,215,${((1-p)*.6).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x+(hsh(i*3)-.5)*22, y+40-p*90, 1.8,0,TAU); ctx.fill(); }
    }
    blinker(x-34,y+58,2,97,t,'rgba(150,255,200,A)');
  },
  onClick(x,y){
    for(const s of this.hotspots) if(s.active()&&hitSpot(s,x,y)){ s.click(); return; }
    /* optional toys */
    if(Math.hypot(x-180,y-525)<28){ this.crysPulse[0]=1; Au.sfx('chime');
      burst(180,518,'rgba(200,240,255,A)',8,50); return; }
    if(Math.hypot(x-770,y-538)<28){ this.crysPulse[1]=1; Au.sfx('chime');
      burst(770,531,'rgba(200,240,255,A)',8,50); return; }
    if(Math.hypot(x-this.snail.x,y-534)<22){
      if(this.snail.hide<=0){ this.snail.hide=2; Au.sfx('squeak'); }
      return; }
  },
  onMove(x,y){
    for(const s of this.hotspots) if(s.active()&&hitSpot(s,x,y)) return 'hot';
    if(Math.hypot(x-180,y-525)<28 || Math.hypot(x-770,y-538)<28) return 'hot';
    if(Math.hypot(x-this.snail.x,y-534)<22) return 'hot';
    return 'default';
  }
};
