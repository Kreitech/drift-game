'use strict';
/* ============================================================
   PAINTING — organic shapes, the astronaut, the pod, pictograms,
   kinder eggs, inventory art
   ============================================================ */
const px=d=>(mouse.x-W/2)*d, py=d=>(mouse.y-H/2)*d;   // parallax offsets
function hitSpot(s,x,y){ return Math.hypot(x-s.x,y-s.y) <= s.r; }
function hintGlow(x,y,t){
  const p=(t*.7)%1;
  ctx.strokeStyle=`rgba(160,235,190,${(.5*(1-p)).toFixed(3)})`;
  ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(x,y,14+p*26,0,TAU); ctx.stroke();
}
// organic blob: closed bezier loop around (x,y), wobbling with time
function blobPath(x,y,r,seed,t,amp,squish){
  squish = squish||1; amp = amp===undefined?.12:amp;
  const N=8; ctx.beginPath();
  const pts=[];
  for(let i=0;i<N;i++){
    const a=i/N*TAU;
    const rr=r*(1+Math.sin(t*.9+seed+i*2.1)*amp+ (hsh(seed+i)-.5)*amp*1.6);
    pts.push([x+Math.cos(a)*rr, y+Math.sin(a)*rr*squish]);
  }
  ctx.moveTo((pts[0][0]+pts[N-1][0])/2,(pts[0][1]+pts[N-1][1])/2);
  for(let i=0;i<N;i++){
    const p=pts[i], n=pts[(i+1)%N];
    ctx.quadraticCurveTo(p[0],p[1],(p[0]+n[0])/2,(p[1]+n[1])/2);
  }
  ctx.closePath();
}
function blob(x,y,r,seed,t,fill,amp,squish){ blobPath(x,y,r,seed,t,amp,squish); ctx.fillStyle=fill; ctx.fill(); }

// horizon ridge with hand-drawn roughness, filled to bottom
function ridge(baseY,amp,seed,fill){
  ctx.beginPath(); ctx.moveTo(-20,H+20);
  for(let x=-20;x<=W+20;x+=16){
    const y=baseY + (rough(x*.013+seed,seed)-.5)*amp*2 + (rough(x*.004+seed*2,seed+9)-.5)*amp*3;
    ctx.lineTo(x,y);
  }
  ctx.lineTo(W+20,H+20); ctx.closePath();
  ctx.fillStyle=fill; ctx.fill();
}
function skyGrad(stops){
  const g=ctx.createLinearGradient(0,0,0,H);
  stops.forEach(s=>g.addColorStop(s[0],s[1]));
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
}
function glow(x,y,r,color,a){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,color.replace('A',a)); g.addColorStop(1,color.replace('A','0'));
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill();
}
// breathing plant: curved stem + bulb head, sways and inflates
function breathPlant(x,y,h,seed,t,stemC,bulbC){
  const sway=Math.sin(t*.6+seed)*h*.06, br=1+Math.sin(t*1.1+seed*2)*.08;
  const tipX=x+sway, tipY=y-h;
  ctx.strokeStyle=stemC; ctx.lineWidth=2+h*.03; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x,y);
  ctx.bezierCurveTo(x-h*.1,y-h*.45, tipX+h*.12,y-h*.6, tipX,tipY);
  ctx.stroke();
  blob(tipX,tipY-h*.07*br, h*.13*br, seed*3, t, bulbC, .2);
  ctx.fillStyle='rgba(255,255,255,.25)';
  ctx.beginPath(); ctx.arc(tipX-h*.04,tipY-h*.1*br,h*.03,0,TAU); ctx.fill();
}
// blinking light dot (slow pulse, occasionally off)
function blinker(x,y,r,seed,t,color){
  const cyc=hsh(seed)*3+2, ph=(t+seed*7)%cyc;
  const on = ph < cyc*.8 ? .4+Math.sin(t*2+seed)*.3 : 0;
  if(on>0){ glow(x,y,r*4,color,(on*.5).toFixed(3)); ctx.fillStyle=color.replace('A',on.toFixed(3));
    ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); }
}

/* ---------- particle drift (spores / dust / embers) ---------- */
function makeDrift(n,color,size,speed){
  const ps=[];
  for(let i=0;i<n;i++) ps.push({x:hsh(i*3)*W, y:hsh(i*5)*H, s:size*(0.5+hsh(i*7)), ph:hsh(i*11)*TAU, v:speed*(0.5+hsh(i*13))});
  return {ps,color,
    draw(t,wind){
      for(const p of ps){
        p.x += Math.sin(t*.3+p.ph)*.15 + (wind||0.12)*p.v;
        p.y -= p.v*.25;
        if(p.y<-10){p.y=H+10;p.x=hsh(p.ph*99+t)*W;}
        if(p.x>W+10)p.x=-10; if(p.x<-10)p.x=W+10;
        const a=.25+Math.sin(t*1.3+p.ph)*.2;
        ctx.fillStyle=this.color.replace('A',a.toFixed(3));
        ctx.beginPath(); ctx.arc(p.x,p.y,p.s,0,TAU); ctx.fill();
      }
    }};
}
/* ---------- burst particles for interactions ---------- */
const bursts=[];
function burst(x,y,color,n,spd){
  for(let i=0;i<(n||10);i++){
    const a=Math.random()*TAU, v=(spd||60)*(.4+Math.random()*.8);
    bursts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,life:1,color,r:2+Math.random()*3});
  }
}
function drawBursts(dt){
  for(let i=bursts.length-1;i>=0;i--){
    const b=bursts[i];
    b.x+=b.vx*dt; b.y+=b.vy*dt; b.vy+=80*dt; b.life-=dt*1.4;
    if(b.life<=0){bursts.splice(i,1);continue;}
    ctx.fillStyle=b.color.replace('A',(b.life*.8).toFixed(3));
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r*b.life,0,TAU); ctx.fill();
  }
}

/* ============================================================
   THE ASTRONAUT — breathing cycle, visor blink, head tilt
   ============================================================ */
function drawAstronaut(x,y,t,scale,flip,shadow){
  const s=scale||1, fl=flip?-1:1;
  const breath=Math.sin(t*1.05);            // slow breathing cycle
  const chest=1+breath*.035;
  const bob=breath*1.6*s;
  const tilt=Math.sin(t*.21)*.06;           // dreamy head sway
  const bk=(t*.43)%1, blink = bk>.93 ? clamp((bk-.93)/.035*(bk<.965?1:-1)+(bk<.965?0:2),0,1) : 0;

  ctx.save(); ctx.translate(x,y+bob); ctx.scale(fl*s,s);
  if(shadow!==false){
    ctx.fillStyle='rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(0,2,20,5,0,0,TAU); ctx.fill();
  }
  // legs
  ctx.strokeStyle='#b8c8d6'; ctx.lineWidth=7; ctx.lineCap='round';
  const step=Math.sin(t*.5)*.5;
  ctx.beginPath(); ctx.moveTo(-6,-16); ctx.quadraticCurveTo(-8-step,-8,-8,-1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6,-16);  ctx.quadraticCurveTo(8+step,-8,8,-1);  ctx.stroke();
  ctx.fillStyle='#93a8b8';
  ctx.beginPath(); ctx.ellipse(-8,-1,5,3,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8,-1,5,3,0,0,TAU); ctx.fill();
  // torso (breathes)
  ctx.save(); ctx.scale(chest,1);
  const tg=ctx.createLinearGradient(-14,-44,14,-10);
  tg.addColorStop(0,'#e8f0f6'); tg.addColorStop(1,'#a9bccb');
  ctx.fillStyle=tg;
  blobPath(0,-27,15,4.2,t*.3,.06,1.25); ctx.fill();
  ctx.restore();
  // chest light
  const pulse=.5+Math.sin(t*1.05)*.4;
  glow(-3,-28,9,'rgba(140,230,180,A)',(pulse*.5).toFixed(3));
  ctx.fillStyle=`rgba(160,240,195,${(.4+pulse*.5).toFixed(3)})`;
  ctx.beginPath(); ctx.arc(-3,-28,2.6,0,TAU); ctx.fill();
  // arms
  ctx.strokeStyle='#c4d3df'; ctx.lineWidth=6;
  const armSw=Math.sin(t*.55+1)*2;
  ctx.beginPath(); ctx.moveTo(-13,-34); ctx.quadraticCurveTo(-19,-26+armSw,-16,-18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13,-34); ctx.quadraticCurveTo(19,-26-armSw,16,-18); ctx.stroke();
  // backpack
  ctx.fillStyle='#8fa3b2';
  ctx.beginPath(); ctx.roundRect(-19,-42,8,18,4); ctx.fill();
  // helmet (tilts)
  ctx.save(); ctx.translate(0,-47); ctx.rotate(tilt);
  const hg=ctx.createRadialGradient(-4,-4,2,0,0,15);
  hg.addColorStop(0,'#f6fbff'); hg.addColorStop(1,'#b9cbd9');
  ctx.fillStyle=hg;
  ctx.beginPath(); ctx.ellipse(0,0,13.5,14.5,0,0,TAU); ctx.fill();
  // visor
  const vg=ctx.createLinearGradient(-8,-8,8,8);
  vg.addColorStop(0,'#2b3f52'); vg.addColorStop(1,'#0d1722');
  ctx.fillStyle=vg;
  ctx.beginPath(); ctx.ellipse(1.5,0,9,10.5,0,0,TAU); ctx.fill();
  // eyes inside visor (blink)
  if(blink<.9){
    ctx.fillStyle='#cfe8e0';
    const eh=2.6*(1-blink);
    ctx.beginPath(); ctx.ellipse(-1.5,-1,1.7,eh,0,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4.5,-1,1.7,eh,0,0,TAU); ctx.fill();
  }
  // visor glints
  ctx.fillStyle='rgba(255,255,255,.35)';
  ctx.beginPath(); ctx.ellipse(-3,-5,3.5,1.6,-.5,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.15)';
  ctx.beginPath(); ctx.ellipse(5,4,2,1,-.5,0,TAU); ctx.fill();
  // antenna
  ctx.strokeStyle='#9fb2c0'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(-9,-10); ctx.quadraticCurveTo(-13,-16,-12,-20); ctx.stroke();
  blinker(-12,-21,1.6,3.7,t,'rgba(255,170,120,A)');
  ctx.restore();
  // the rescued cat rides on top of the backpack
  if(GameState.mode==='game' && GameState.flags.catPicked) drawCat(-16,-44,t,.6,true);
  ctx.restore();
}

/* ============================================================
   TELEPATHY — glowing thought-aura + wavy psychic stream
   ============================================================ */
function drawAura(x,y,t,prog,color){
  const a=Math.sin(Math.min(prog*3,1)*Math.PI*.5);  // soft ease-in
  for(let i=0;i<3;i++){
    const p=(t*.9+i/3)%1;
    ctx.strokeStyle=color.replace('A',(a*.5*(1-p)).toFixed(3));
    ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.arc(x,y,11+p*26,0,TAU); ctx.stroke();
  }
  glow(x,y,34,color,(a*.28).toFixed(3));
  // little thought-sparks orbiting the helmet
  for(let i=0;i<4;i++){
    const an=t*2.2+i/4*TAU;
    ctx.fillStyle=color.replace('A',(a*.7).toFixed(3));
    ctx.beginPath();
    ctx.arc(x+Math.cos(an)*(17+Math.sin(t*3+i)*3), y+Math.sin(an)*13, 1.5,0,TAU);
    ctx.fill();
  }
}
function drawTeleBeam(x0,y0,x1,y1,t,a,color){
  const segs=22, dx=x1-x0, dy=y1-y0, L=Math.hypot(dx,dy)||1;
  ctx.lineCap='round';
  for(let w=0;w<2;w++){
    ctx.strokeStyle=color.replace('A',(a*(w?.5:.2)).toFixed(3));
    ctx.lineWidth=w?1.6:4.5;
    ctx.beginPath();
    for(let i=0;i<=segs;i++){
      const u=i/segs;
      const n=Math.sin(u*9-t*6+w*1.3)*10*Math.sin(u*Math.PI);
      const bx=lerp(x0,x1,u)-dy/L*n, by=lerp(y0,y1,u)+dx/L*n;
      i?ctx.lineTo(bx,by):ctx.moveTo(bx,by);
    }
    ctx.stroke();
  }
}

/* ============================================================
   THE CAT — small space cat: idle swish, blink, ear twitch
   ============================================================ */
function drawCat(x,y,t,s,carried){
  s=s||1;
  const bob=carried?Math.sin(t*1.05)*.8:Math.sin(t*1.3)*1.4;
  const bk=(t*.37+.55)%1, blink=bk>.92;
  ctx.save(); ctx.translate(x,y+bob); ctx.scale(s,s);
  if(!carried){
    ctx.fillStyle='rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(0,1,13,3.4,0,0,TAU); ctx.fill();
  }
  // tail — slow happy swish
  const swish=Math.sin(t*1.7);
  ctx.strokeStyle='#3c4870'; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(8,-6);
  ctx.quadraticCurveTo(17,-4, 16+swish*3.5, -20+Math.abs(swish)*4); ctx.stroke();
  // body (sitting)
  blob(0,-9,11,140,t*.5,'#46527a',.06,1.05);
  ctx.fillStyle='#5d6b96';
  ctx.beginPath(); ctx.ellipse(0,-6,5,6.5,0,0,TAU); ctx.fill();
  // front paws
  ctx.fillStyle='#3c4870';
  ctx.beginPath(); ctx.ellipse(-4,0,3,1.8,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4,0,3,1.8,0,0,TAU); ctx.fill();
  // head
  blob(0,-21,8,141,t*.6,'#505d88',.05);
  // ears — the right one twitches now and then
  const twk=hsh(Math.floor(t*.7))>.72 ? Math.sin(t*22)*.18 : 0;
  ctx.fillStyle='#505d88';
  ctx.beginPath(); ctx.moveTo(-8,-24); ctx.lineTo(-6,-32); ctx.lineTo(-1.5,-26); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.translate(4.5,-27); ctx.rotate(twk);
  ctx.beginPath(); ctx.moveTo(-2.5,1); ctx.lineTo(1.5,-6); ctx.lineTo(4,2); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle='rgba(255,170,190,.5)';
  ctx.beginPath(); ctx.moveTo(-6.4,-25.5); ctx.lineTo(-5.6,-29.5); ctx.lineTo(-3.4,-26.2); ctx.closePath(); ctx.fill();
  // eyes — mint slits
  if(!blink){
    ctx.fillStyle='#aef0cf';
    ctx.beginPath(); ctx.ellipse(-3.4,-21,1.9,2.5,0,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3.4,-21,1.9,2.5,0,0,TAU); ctx.fill();
    ctx.fillStyle='#16241c';
    ctx.fillRect(-3.9,-23,1,4); ctx.fillRect(2.9,-23,1,4);
  } else {
    ctx.strokeStyle='#2c3654'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(-5,-21); ctx.lineTo(-2,-21); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2,-21); ctx.lineTo(5,-21); ctx.stroke();
  }
  // nose + whiskers
  ctx.fillStyle='#e8a0b4';
  ctx.beginPath(); ctx.moveTo(-1.2,-18.5); ctx.lineTo(1.2,-18.5); ctx.lineTo(0,-16.8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(220,230,250,.4)'; ctx.lineWidth=.8;
  [[-1],[1]].forEach(([d])=>{ for(let i=0;i<3;i++){
    ctx.beginPath(); ctx.moveTo(d*4,-18+i); ctx.lineTo(d*11,-19.5+i*1.8); ctx.stroke(); }});
  ctx.restore();
}

/* ============================================================
   THE KIDS — Maxi (11) & Maite (7), children of this universe
   ============================================================ */
function drawKid(x,y,t,o){
  const s=o.s||1, girl=!!o.girl;
  const bob=Math.sin(t*1.25+(girl?1.7:0))*1.6;
  const bk=(t*.41+(girl?.3:0))%1, blink=bk>.93;
  const wave=Math.sin(t*.6+(girl?2.5:0))>.55;   // arm raises now and then
  ctx.save(); ctx.translate(x,y+bob); ctx.scale(s,s);
  ctx.fillStyle='rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(0,2,15,4,0,0,TAU); ctx.fill();
  const suit=girl?'#c293c0':'#7d99c2', suitD=girl?'#9c6f9c':'#5e7aa3';
  // legs + boots
  ctx.strokeStyle=suitD; ctx.lineWidth=6; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-5,-14); ctx.lineTo(-5,-2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5,-14); ctx.lineTo(5,-2); ctx.stroke();
  ctx.fillStyle=suitD;
  ctx.beginPath(); ctx.ellipse(-5,-1,4.5,2.6,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(5,-1,4.5,2.6,0,0,TAU); ctx.fill();
  // little suit (breathes)
  ctx.fillStyle=suit;
  blobPath(0,-24,12,girl?7.7:6.6,t*.3,.05,1.15); ctx.fill();
  glow(0,-26,8,'rgba(160,240,195,A)','.3');
  ctx.fillStyle='rgba(160,240,195,.8)';
  ctx.beginPath(); ctx.arc(0,-26,2,0,TAU); ctx.fill();
  // arms — one waves hello
  ctx.strokeStyle=suit; ctx.lineWidth=5;
  ctx.beginPath(); ctx.moveTo(-10,-30); ctx.quadraticCurveTo(-14,-22,-12,-15); ctx.stroke();
  if(wave){
    const wa=Math.sin(t*9)*3;
    ctx.beginPath(); ctx.moveTo(10,-30); ctx.quadraticCurveTo(16,-38,18+wa,-46); ctx.stroke();
    ctx.fillStyle=suit;
    ctx.beginPath(); ctx.arc(18+wa,-47,3,0,TAU); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(10,-30); ctx.quadraticCurveTo(14,-22,12,-15); ctx.stroke();
  }
  // head
  ctx.fillStyle='#f2dcc4';
  ctx.beginPath(); ctx.arc(0,-46,11.5,0,TAU); ctx.fill();
  // hair
  if(girl){
    ctx.fillStyle='#7a4a2e';
    ctx.beginPath(); ctx.arc(0,-48,11.8,Math.PI*1.02,Math.PI*1.98); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-6,-54,5,3.4,-.4,0,TAU); ctx.fill();   // bangs
    // pigtails swing with the bob
    const sw=Math.sin(t*1.25+1.7)*1.4;
    blob(-14,-44+sw,4.6,151,t*.8,'#7a4a2e',.1);
    blob(14,-44-sw,4.6,152,t*.8,'#7a4a2e',.1);
    ctx.fillStyle='#ffd27a';
    ctx.beginPath(); ctx.arc(-12.4,-48+sw,1.6,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(12.4,-48-sw,1.6,0,TAU); ctx.fill();
  } else {
    ctx.fillStyle='#4a3320';
    ctx.beginPath(); ctx.arc(0,-49,11.6,Math.PI,TAU); ctx.fill();
    // messy spikes + cowlick
    for(let i=0;i<3;i++){
      ctx.beginPath(); ctx.moveTo(-7+i*6,-57);
      ctx.lineTo(-5+i*6,-63-hsh(i)*3); ctx.lineTo(-2+i*6,-57); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle='#4a3320'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.arc(4,-61,2.6,Math.PI*.8,Math.PI*1.9); ctx.stroke();
  }
  // big eyes (blink) + smile + cheeks
  if(!blink){
    ctx.fillStyle='#2b2330';
    ctx.beginPath(); ctx.ellipse(-4.2,-46,2.2,3,0,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4.2,-46,2.2,3,0,0,TAU); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.85)';
    ctx.beginPath(); ctx.arc(-3.6,-47,8/10,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(4.8,-47,8/10,0,TAU); ctx.fill();
  } else {
    ctx.strokeStyle='#2b2330'; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.moveTo(-6,-46); ctx.lineTo(-2.4,-46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2.4,-46); ctx.lineTo(6,-46); ctx.stroke();
  }
  ctx.strokeStyle='#a06a50'; ctx.lineWidth=1.4; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(0,-43,3.5,.4,Math.PI-.4); ctx.stroke();
  ctx.fillStyle='rgba(240,140,140,.35)';
  ctx.beginPath(); ctx.ellipse(-7.5,-42.5,2.2,1.4,0,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7.5,-42.5,2.2,1.4,0,0,TAU); ctx.fill();
  ctx.restore();
}

/* ============================================================
   LOKI CAT — the rescued cat, crowned with golden horns
   ============================================================ */
function drawLokiCat(x,y,t,s){
  s=s||1;
  const bob=Math.sin(t*1.1)*4;
  ctx.save(); ctx.translate(x,y+bob); ctx.scale(s,s);
  glow(0,-20,70,'rgba(255,220,140,A)','.16');
  const gold='#e8c155', goldD='#a8842c';
  // face first, helmet worn on top
  blob(0,-3,16,150,t*.4,'#505d88',.04);
  // ears peeking under the rim
  ctx.fillStyle='#505d88';
  ctx.beginPath(); ctx.moveTo(-16,-12); ctx.lineTo(-19,-20); ctx.lineTo(-10,-15); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(16,-12); ctx.lineTo(19,-20); ctx.lineTo(10,-15); ctx.closePath(); ctx.fill();
  // golden horns rising from the cap
  [[-1],[1]].forEach(([d])=>{
    ctx.fillStyle=gold;
    ctx.beginPath();
    ctx.moveTo(d*12,-17);
    ctx.bezierCurveTo(d*26,-22, d*34,-42, d*26,-60);
    ctx.bezierCurveTo(d*24,-42, d*17,-29, d*6,-23);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle=goldD; ctx.lineWidth=1.2; ctx.stroke();
    ctx.fillStyle='rgba(255,255,235,.5)';
    ctx.beginPath(); ctx.ellipse(d*26,-48,1.8,6,d*.4,0,TAU); ctx.fill();
  });
  // helmet cap with rim
  ctx.fillStyle=gold;
  ctx.beginPath(); ctx.arc(0,-13,15.5,Math.PI*1.02,Math.PI*1.98); ctx.fill();
  ctx.fillStyle=goldD;
  ctx.beginPath(); ctx.roundRect(-16,-15.5,32,4,2); ctx.fill();
  ctx.fillStyle='rgba(255,255,235,.45)';
  ctx.beginPath(); ctx.ellipse(-5,-22,4,1.8,-.5,0,TAU); ctx.fill();
  // proud eyes
  const bk=(t*.37)%1, blink=bk>.93;
  if(!blink){
    ctx.fillStyle='#aef0cf';
    ctx.beginPath(); ctx.ellipse(-6,-5,3.4,4.4,0,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6,-5,3.4,4.4,0,0,TAU); ctx.fill();
    ctx.fillStyle='#16241c';
    ctx.fillRect(-6.9,-8.5,1.6,7); ctx.fillRect(5.1,-8.5,1.6,7);
  } else {
    ctx.strokeStyle='#2c3654'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(-9,-5); ctx.lineTo(-3,-5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3,-5); ctx.lineTo(9,-5); ctx.stroke();
  }
  // nose + ω mouth + whiskers
  ctx.fillStyle='#e8a0b4';
  ctx.beginPath(); ctx.moveTo(-1.8,1); ctx.lineTo(1.8,1); ctx.lineTo(0,3.6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#3c4870'; ctx.lineWidth=1.4; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(-2.5,5,2.5,.2,Math.PI-.6); ctx.stroke();
  ctx.beginPath(); ctx.arc(2.5,5,2.5,.6,Math.PI-.2); ctx.stroke();
  ctx.strokeStyle='rgba(220,230,250,.45)'; ctx.lineWidth=1;
  [[-1],[1]].forEach(([d])=>{ for(let i=0;i<3;i++){
    ctx.beginPath(); ctx.moveTo(d*7,1+i*2); ctx.lineTo(d*19,-1+i*3.4); ctx.stroke(); }});
  // sparkles of mischief
  for(let i=0;i<3;i++){
    const a=.4+Math.sin(t*2.4+i*2.1)*.4;
    ctx.fillStyle=`rgba(255,240,190,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(-26+i*26+Math.sin(t+i)*3, -64+hsh(i*5)*16, 1.6,0,TAU); ctx.fill();
  }
  ctx.restore();
}

/* ============================================================
   THE POD — brass seed-pod ship (scene 4, intro, credits, star ride)
   ============================================================ */
function drawPod(x,y,t,o){
  o=o||{};
  const wob=o.grounded?0:Math.sin(t*2)*3, s=o.scale||1;
  ctx.save(); ctx.translate(x,y+wob); ctx.rotate(o.rot||0); ctx.scale(s,s);
  if(!o.grounded) glow(0,0,70,'rgba(255,220,150,A)','.2');
  const g=ctx.createRadialGradient(-8,-10,4,0,0,34);
  g.addColorStop(0,'#e8c87e'); g.addColorStop(1,'#8a6430');
  ctx.fillStyle=g;
  blobPath(0,0,30,71,t*.5,.06,1.15); ctx.fill();
  // porthole
  ctx.fillStyle='#1d2c3e';
  ctx.beginPath(); ctx.arc(2,-4,10,0,TAU); ctx.fill();
  if(o.face){ // the traveller, visible inside
    ctx.fillStyle='#e8f0f6';
    ctx.beginPath(); ctx.arc(2,-4,6.5,0,TAU); ctx.fill();
    ctx.fillStyle='#22303f';
    ctx.beginPath(); ctx.ellipse(3,-4,4.4,5,0,0,TAU); ctx.fill();
    const bk=(t*.43)%1, open=bk>.93?0:1;
    if(open){ ctx.fillStyle='#cfe8e0';
      ctx.beginPath(); ctx.arc(1.5,-4.5,1.1,0,TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(4.5,-4.5,1.1,0,TAU); ctx.fill(); }
  }
  ctx.fillStyle='rgba(255,255,255,.4)';
  ctx.beginPath(); ctx.ellipse(-1,-8,3.5,2,-.4,0,TAU); ctx.fill();
  // fins
  ctx.fillStyle='#6e4e22';
  ctx.beginPath(); ctx.moveTo(-28,8); ctx.quadraticCurveTo(-44,18,-34,30);
  ctx.quadraticCurveTo(-26,20,-22,16); ctx.fill();
  ctx.beginPath(); ctx.moveTo(28,8); ctx.quadraticCurveTo(44,18,34,30);
  ctx.quadraticCurveTo(26,20,22,16); ctx.fill();
  if(o.cracked){ // hull fracture
    ctx.strokeStyle='#3a2510'; ctx.lineWidth=2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-22,14); ctx.lineTo(-10,4); ctx.lineTo(-16,-6); ctx.lineTo(-5,-16); ctx.stroke();
    ctx.strokeStyle='rgba(255,200,120,.5)'; ctx.lineWidth=.8;
    ctx.beginPath(); ctx.moveTo(-21,13); ctx.lineTo(-9,3); ctx.stroke();
  }
  if(o.beam){
    const bl=o.beamLen||300;
    const bg=ctx.createLinearGradient(0,24,0,24+bl);
    bg.addColorStop(0,'rgba(190,255,225,.35)'); bg.addColorStop(1,'rgba(190,255,225,0)');
    ctx.fillStyle=bg;
    ctx.beginPath(); ctx.moveTo(-12,24); ctx.lineTo(-46,24+bl); ctx.lineTo(46,24+bl); ctx.lineTo(12,24); ctx.closePath(); ctx.fill();
  }
  if(o.exhaust){
    for(let i=0;i<3;i++){ const p=(t*1.5+i*.33)%1;
      ctx.fillStyle=`rgba(255,230,170,${((1-p)*.5).toFixed(3)})`;
      ctx.beginPath(); ctx.arc((hsh(i+Math.floor(t*3))-.5)*16, 34+p*36*o.exhaust, 3*(1-p),0,TAU); ctx.fill(); }
  }
  ctx.restore();
}

/* ============================================================
   THOUGHT BUBBLE — wordless feedback pictograms
   ============================================================ */
const bubble={icon:null,until:0,x:0,y:0};
function think(icon,x,y){ bubble.icon=icon; bubble.until=GameState.t+2.4; bubble.x=x; bubble.y=y; }
const ICON={
  drop(cx,cy,s){ ctx.fillStyle='#8fd4ff';
    ctx.beginPath(); ctx.moveTo(cx,cy-s);
    ctx.bezierCurveTo(cx+s*.9,cy+s*.1,cx+s*.6,cy+s,cx,cy+s);
    ctx.bezierCurveTo(cx-s*.6,cy+s,cx-s*.9,cy+s*.1,cx,cy-s); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.5)';
    ctx.beginPath(); ctx.arc(cx-s*.25,cy+s*.2,s*.18,0,TAU); ctx.fill(); },
  gear(cx,cy,s){ ctx.fillStyle='#e0b06a'; ctx.save(); ctx.translate(cx,cy);
    for(let i=0;i<8;i++){ ctx.save(); ctx.rotate(i/8*TAU); ctx.fillRect(-s*.12,-s,s*.24,s*.35); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0,0,s*.7,0,TAU); ctx.fill();
    ctx.fillStyle='#1a2030'; ctx.beginPath(); ctx.arc(0,0,s*.28,0,TAU); ctx.fill(); ctx.restore(); },
  zzz(cx,cy,s){ ctx.strokeStyle='#cfe3ff'; ctx.lineWidth=2; ctx.lineCap='round';
    [[-s*.5,s*.4,s*.55],[s*.1,-s*.1,s*.42],[s*.55,-s*.55,s*.3]].forEach(z=>{
      const [zx,zy,zs]=z;
      ctx.beginPath(); ctx.moveTo(cx+zx-zs/2,cy+zy-zs/2); ctx.lineTo(cx+zx+zs/2,cy+zy-zs/2);
      ctx.lineTo(cx+zx-zs/2,cy+zy+zs/2); ctx.lineTo(cx+zx+zs/2,cy+zy+zs/2); ctx.stroke();}); },
  shard(cx,cy,s){ ctx.fillStyle='#bcd8f2';
    ctx.beginPath(); ctx.moveTo(cx-s*.4,cy-s); ctx.lineTo(cx+s*.5,cy-s*.5);
    ctx.lineTo(cx+s*.3,cy+s); ctx.lineTo(cx-s*.55,cy+s*.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.6)';
    ctx.beginPath(); ctx.moveTo(cx-s*.25,cy-s*.7); ctx.lineTo(cx,cy-s*.55); ctx.lineTo(cx-s*.3,cy+s*.3); ctx.closePath(); ctx.fill(); },
  sun(cx,cy,s){ ctx.fillStyle='#ffe9a0'; ctx.beginPath(); ctx.arc(cx,cy,s*.5,0,TAU); ctx.fill();
    ctx.strokeStyle='#ffe9a0'; ctx.lineWidth=2; ctx.lineCap='round';
    for(let i=0;i<8;i++){ const a=i/8*TAU;
      ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*s*.68,cy+Math.sin(a)*s*.68);
      ctx.lineTo(cx+Math.cos(a)*s*.95,cy+Math.sin(a)*s*.95); ctx.stroke(); } },
  broken(cx,cy,s){ // the wounded pod
    ctx.fillStyle='#e0b06a';
    ctx.beginPath(); ctx.ellipse(cx,cy,s*.95,s*.8,0,0,TAU); ctx.fill();
    ctx.fillStyle='#1d2c3e';
    ctx.beginPath(); ctx.arc(cx+s*.2,cy-s*.15,s*.3,0,TAU); ctx.fill();
    ctx.strokeStyle='#4a2e10'; ctx.lineWidth=1.8; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-s*.75,cy+s*.55); ctx.lineTo(cx-s*.35,cy+s*.1);
    ctx.lineTo(cx-s*.55,cy-s*.2); ctx.lineTo(cx-s*.2,cy-s*.65); ctx.stroke(); },
  signal(cx,cy,s){ // a tower calling home
    ctx.strokeStyle='#9fe8c0'; ctx.lineWidth=1.8; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx,cy+s); ctx.lineTo(cx,cy-s*.1); ctx.stroke();
    ctx.fillStyle='#9fe8c0';
    ctx.beginPath(); ctx.arc(cx,cy-s*.3,s*.16,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy-s*.3,s*.5,-2.5,-.65); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy-s*.3,s*.85,-2.4,-.75); ctx.stroke(); },
  nectar(cx,cy,s){ // glowing nectar pod
    ctx.fillStyle='#ffd27a';
    ctx.beginPath(); ctx.ellipse(cx,cy+s*.15,s*.6,s*.75,0,0,TAU); ctx.fill();
    ctx.fillStyle='rgba(255,255,235,.7)';
    ctx.beginPath(); ctx.arc(cx-s*.18,cy-s*.05,s*.2,0,TAU); ctx.fill();
    ctx.strokeStyle='#7da26a'; ctx.lineWidth=1.8; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx,cy-s*.55); ctx.quadraticCurveTo(cx+s*.3,cy-s*.9,cx+s*.15,cy-s*1.05); ctx.stroke(); },
  stone(cx,cy,s){ // capstone
    ctx.fillStyle='#9aa3ad';
    ctx.beginPath(); ctx.moveTo(cx-s*.8,cy+s*.5); ctx.lineTo(cx-s*.5,cy-s*.45);
    ctx.lineTo(cx+s*.4,cy-s*.6); ctx.lineTo(cx+s*.8,cy+s*.3); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.25)';
    ctx.beginPath(); ctx.moveTo(cx-s*.4,cy-s*.3); ctx.lineTo(cx+s*.25,cy-s*.45); ctx.lineTo(cx+s*.05,cy-s*.1); ctx.closePath(); ctx.fill(); },
  shroom(cx,cy,s){ // lampshroom wanting light
    ctx.fillStyle='#b9a6e8';
    ctx.beginPath(); ctx.ellipse(cx,cy-s*.2,s*.85,s*.5,0,Math.PI,TAU); ctx.fill();
    ctx.fillStyle='#8a7ab8';
    ctx.fillRect(cx-s*.18,cy-s*.15,s*.36,s*.75);
    glow(cx,cy-s*.3,s*1.1,'rgba(220,200,255,A)','.35'); }
};
function drawBubble(t){
  if(!bubble.icon || t>bubble.until) return;
  const age=clamp((bubble.until-t)/2.4,0,1), pop=clamp((1-age)*8,0,1);
  const a=Math.min(age*3,1)*pop>0?Math.min(age*3,1):0;
  const bx=bubble.x, by=bubble.y-70-Math.sin(t*2)*3, sc=ease(pop);
  ctx.save(); ctx.globalAlpha=a*.95; ctx.translate(bx,by); ctx.scale(sc,sc);
  ctx.fillStyle='rgba(14,20,30,.85)'; ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=1.5;
  blobPath(0,0,26,5.5,t*.5,.08); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(8,32,5,0,TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(13,44,2.5,0,TAU); ctx.fill();
  bubble.icon(0,0,13);
  ctx.restore();
}

/* ============================================================
   KINDER EGG — the hidden collectibles
   ============================================================ */
function drawEgg(x,y,h,t,dim){
  // little plastic surprise capsule: warm yellow top, orange base
  const bob=Math.sin(t*1.6+x*.05)*1.2;
  ctx.save(); ctx.translate(x,y+ (dim?0:bob)); ctx.rotate(Math.sin(t*.8+x)*.04);
  if(dim){ ctx.globalAlpha=.32; }
  else glow(0,0,h*1.6,'rgba(255,210,120,A)',(.12+Math.sin(t*2)*.05).toFixed(3));
  const w=h*.72;
  // base (orange)
  const bg=ctx.createLinearGradient(-w,0,w,0);
  bg.addColorStop(0,'#e8862e'); bg.addColorStop(.45,'#ffa53e'); bg.addColorStop(1,'#c96a1d');
  ctx.fillStyle=dim?'#3a3348':bg;
  ctx.beginPath(); ctx.moveTo(-w,.05*h);
  ctx.bezierCurveTo(-w,h*.62,w,h*.62,w,.05*h); ctx.closePath(); ctx.fill();
  // top (yellow)
  const tg=ctx.createLinearGradient(-w,0,w,0);
  tg.addColorStop(0,'#e8c63e'); tg.addColorStop(.45,'#ffe974'); tg.addColorStop(1,'#cfa42c');
  ctx.fillStyle=dim?'#494060':tg;
  ctx.beginPath(); ctx.moveTo(-w,.05*h);
  ctx.bezierCurveTo(-w,-h*.78,w,-h*.78,w,.05*h); ctx.closePath(); ctx.fill();
  // seam
  ctx.strokeStyle=dim?'rgba(255,255,255,.15)':'rgba(140,80,20,.45)'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(-w,.05*h);
  ctx.quadraticCurveTo(0,.05*h+2,w,.05*h); ctx.stroke();
  if(!dim){
    ctx.fillStyle='rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(-w*.4,-h*.32,w*.2,h*.16,-.5,0,TAU); ctx.fill();
  }
  ctx.restore();
}
// shared collect handler: scenes call this from their egg hotspot
function collectEgg(idx,x,y){
  Save.data.eggs[idx]=true; Save.put();
  Au.sfx('egg');
  burst(x,y,'rgba(255,215,110,A)',18,90);
  burst(x,y,'rgba(255,255,220,A)',8,50);
}

/* ============================================================
   INVENTORY — DOM slots, procedurally drawn icons
   ============================================================ */
const ItemArt={
  bucket(c2,full){
    const x=c2.getContext('2d'); x.clearRect(0,0,42,42);
    x.strokeStyle='#9a7d62'; x.lineWidth=2.5; x.lineCap='round';
    x.beginPath(); x.moveTo(10,16); x.quadraticCurveTo(21,4,32,16); x.stroke();
    const g=x.createLinearGradient(0,14,0,38);
    g.addColorStop(0,'#a98b6d'); g.addColorStop(1,'#6e5640');
    x.fillStyle=g;
    x.beginPath(); x.moveTo(8,16); x.lineTo(12,38); x.quadraticCurveTo(21,41,30,38); x.lineTo(34,16);
    x.quadraticCurveTo(21,20,8,16); x.fill();
    if(full){ x.fillStyle='#6fc3f0';
      x.beginPath(); x.ellipse(21,18.5,11.5,3.4,0,0,TAU); x.fill();
      x.fillStyle='rgba(255,255,255,.55)';
      x.beginPath(); x.ellipse(17,18,3,1.2,0,0,TAU); x.fill(); }
    x.fillStyle='rgba(0,0,0,.18)'; x.fillRect(13,22,2,12);
  },
  shard(c2){
    const x=c2.getContext('2d'); x.clearRect(0,0,42,42);
    const g=x.createLinearGradient(8,6,34,38);
    g.addColorStop(0,'#e8f4ff'); g.addColorStop(.5,'#9fc4e8'); g.addColorStop(1,'#5f86ad');
    x.fillStyle=g;
    x.beginPath(); x.moveTo(14,4); x.lineTo(34,14); x.lineTo(28,38); x.lineTo(8,28); x.closePath(); x.fill();
    x.fillStyle='rgba(255,255,255,.7)';
    x.beginPath(); x.moveTo(17,8); x.lineTo(24,11); x.lineTo(14,30); x.lineTo(11,24); x.closePath(); x.fill();
  },
  nectar(c2){
    const x=c2.getContext('2d'); x.clearRect(0,0,42,42);
    const g=x.createRadialGradient(17,20,2,21,24,16);
    g.addColorStop(0,'#fff3c0'); g.addColorStop(.6,'#ffce62'); g.addColorStop(1,'#c98a26');
    x.fillStyle=g;
    x.beginPath(); x.ellipse(21,25,11,13,0,0,TAU); x.fill();
    x.strokeStyle='#7da26a'; x.lineWidth=2.4; x.lineCap='round';
    x.beginPath(); x.moveTo(21,12); x.quadraticCurveTo(27,6,25,3); x.stroke();
    x.fillStyle='rgba(255,255,255,.65)';
    x.beginPath(); x.arc(17,20,3.4,0,TAU); x.fill();
  },
  stone(c2){
    const x=c2.getContext('2d'); x.clearRect(0,0,42,42);
    const g=x.createLinearGradient(8,10,34,36);
    g.addColorStop(0,'#b4bdc6'); g.addColorStop(1,'#646e79');
    x.fillStyle=g;
    x.beginPath(); x.moveTo(6,30); x.lineTo(11,12); x.lineTo(26,7); x.lineTo(36,20); x.lineTo(31,33);
    x.quadraticCurveTo(18,38,6,30); x.fill();
    x.fillStyle='rgba(255,255,255,.3)';
    x.beginPath(); x.moveTo(14,14); x.lineTo(24,10); x.lineTo(20,18); x.closePath(); x.fill();
    x.fillStyle='rgba(0,0,0,.18)';
    x.beginPath(); x.arc(24,26,4,0,TAU); x.fill();
  }
};
const Inv={
  el:document.getElementById('inv'),
  refresh(){
    this.el.innerHTML='';
    for(let i=0;i<4;i++){
      const it=GameState.inventory[i];
      const slot=document.createElement('div');
      slot.className='slot'+(it?'':' empty')+(it&&GameState.selected===it.id?' sel':'');
      if(it){
        const mini=document.createElement('canvas'); mini.width=42; mini.height=42;
        it.draw(mini); slot.appendChild(mini);
        slot.onclick=e=>{ e.stopPropagation(); Au.ensure();
          GameState.selected = GameState.selected===it.id?null:it.id;
          Au.sfx(GameState.selected?'pick':'hover'); this.refresh(); };
      }
      this.el.appendChild(slot);
    }
  }
};
// color lerp helper for hex colors
function lerpColor(a,b,t){
  const pa=[1,3,5].map(i=>parseInt(a.substr(i,2),16));
  const pb=[1,3,5].map(i=>parseInt(b.substr(i,2),16));
  return `rgb(${pa.map((v,i)=>Math.round(lerp(v,pb[i],t))).join(',')})`;
}
