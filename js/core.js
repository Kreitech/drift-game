'use strict';
/* ============================================================
   DRIFT — core: constants, utils, save data, game state, audio
   ============================================================ */
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const W = 960, H = 600;
const TAU = Math.PI * 2;

/* ---------- utils ---------- */
const lerp = (a,b,t)=>a+(b-a)*t;
const clamp = (v,a,b)=>v<a?a:v>b?b:v;
const ease = t=>t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
function easeOutBack(p){ const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2); }
// deterministic hash noise — stable per-frame procedural detail
const hsh = n=>{ const s = Math.sin(n*127.1+311.7)*43758.5453; return s-Math.floor(s); };
const rough = (x,seed)=>hsh(Math.floor(x)+seed)*(1-(x-Math.floor(x)))+hsh(Math.floor(x)+1+seed)*(x-Math.floor(x));

/* ---------- persistent save (eggs, secret level, scores) ---------- */
const Save = {
  data: { eggs:[false,false,false,false,false], secret:false, best:0, mile:0 },
  load(){
    try {
      const raw = localStorage.getItem('drift_save');
      if(raw) Object.assign(this.data, JSON.parse(raw));
    } catch(e){}
  },
  put(){ try { localStorage.setItem('drift_save', JSON.stringify(this.data)); } catch(e){} },
  eggCount(){ return this.data.eggs.filter(Boolean).length; }
};

/* ---------- GameState ---------- */
const GameState = {
  mode: 'title',        // title | intro | game | credits | star
  scene: 0,             // 0 jungle | 1 cavern | 2 gears | 3 geysers | 4 summit
  inventory: [],        // [{id, draw}]
  selected: null,       // item id
  flags: {},
  t: 0,
  idle: 0,              // seconds since last interaction → hints
  freshFlags(){
    this.flags = { hasBucket:false, bucketFull:false, watered:false, asleep:false,
                   podsTaken:[false,false,false], lit:[false,false,false],
                   capped:[false,false], stonesUsed:[false,false], launched:false,
                   hasShard:false, mirrorMounted:false, powered:false, ended:false,
                   catPicked:false, catRescued:false, saturnFall:false };
  },
  has(id){ return this.inventory.some(i=>i.id===id); },
  give(id, draw){ this.inventory.push({id, draw}); Inv.refresh(); },
  take(id){ this.inventory = this.inventory.filter(i=>i.id!==id);
            if(this.selected===id) this.selected=null; Inv.refresh(); },
  swap(id, id2, draw){ const i = this.inventory.findIndex(x=>x.id===id);
            if(i>=0){ this.inventory[i]={id:id2,draw}; if(this.selected===id) this.selected=null; Inv.refresh(); } }
};
GameState.freshFlags();

/* ---------- mouse / custom cursor ---------- */
const mouse = { x:W/2, y:H/2, inside:false, down:false, cursor:'default' };
const ripples = []; // click feedback rings

/* ============================================================
   AUDIO — all generative, Web Audio only
   ============================================================ */
const Au = {
  ctx:null, master:null, ambGain:null, ambNodes:[], muted:false, scheduled:0, chirpKey:'jungle',
  ensure(){
    if(this.ctx) { if(this.ctx.state==='suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = .8;
    this.master.connect(this.ctx.destination);
    this.ambGain = this.ctx.createGain(); this.ambGain.gain.value = 0;
    this.ambGain.connect(this.master);
    this.noiseBuf = this.makeNoise();
    this.startAmbient(GameState.mode==='game' ? GameState.scene : 4);
  },
  makeNoise(){
    const len = this.ctx.sampleRate*2, b = this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const d = b.getChannelData(0); let l=0;
    for(let i=0;i<len;i++){ l = l*.96 + (Math.random()*2-1)*.04; d[i]=l*8; } // brownish
    return b;
  },
  toggleMute(){ this.muted=!this.muted;
    if(this.master) this.master.gain.linearRampToValueAtTime(this.muted?0:.8,(this.ctx?this.ctx.currentTime:0)+.2);
    document.getElementById('mute').classList.toggle('off',this.muted); },
  stopAmbient(){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    this.ambGain.gain.cancelScheduledValues(t);
    this.ambGain.gain.setValueAtTime(this.ambGain.gain.value,t);
    this.ambGain.gain.linearRampToValueAtTime(0,t+1.2);
    const old = this.ambNodes; this.ambNodes=[];
    setTimeout(()=>old.forEach(n=>{try{n.stop?n.stop():n.disconnect();}catch(e){}}),1400);
  },
  pad(freq, type, detune, filtF, lfoF, lfoAmt, g){
    const c=this.ctx, o=c.createOscillator(), o2=c.createOscillator(),
          f=c.createBiquadFilter(), gn=c.createGain(),
          lfo=c.createOscillator(), lg=c.createGain();
    o.type=o2.type=type; o.frequency.value=freq; o2.frequency.value=freq; o2.detune.value=detune;
    f.type='lowpass'; f.frequency.value=filtF; f.Q.value=1.2;
    lfo.frequency.value=lfoF; lg.gain.value=lfoAmt;
    lfo.connect(lg); lg.connect(f.frequency);
    gn.gain.value=g;
    o.connect(f); o2.connect(f); f.connect(gn); gn.connect(this.ambGain);
    o.start(); o2.start(); lfo.start();
    this.ambNodes.push(o,o2,lfo);
    return gn;
  },
  wind(filtF, q, g, lfoF, lfoAmt){
    const c=this.ctx, s=c.createBufferSource(), f=c.createBiquadFilter(),
          gn=c.createGain(), lfo=c.createOscillator(), lg=c.createGain();
    s.buffer=this.noiseBuf; s.loop=true;
    f.type='bandpass'; f.frequency.value=filtF; f.Q.value=q;
    lfo.frequency.value=lfoF; lg.gain.value=lfoAmt;
    lfo.connect(lg); lg.connect(f.frequency);
    gn.gain.value=g;
    s.connect(f); f.connect(gn); gn.connect(this.ambGain);
    s.start(); lfo.start();
    this.ambNodes.push(s,lfo);
  },
  startAmbient(key){
    if(!this.ctx) return;
    this.stopAmbient();
    const t=this.ctx.currentTime;
    this.ambGain.gain.cancelScheduledValues(t);
    this.ambGain.gain.setValueAtTime(0,t);
    this.ambGain.gain.linearRampToValueAtTime(.5,t+2.5);
    switch(key){
      case 0:                  // night jungle: warm slow pad + wind whisper
        this.pad(55,'triangle',7,300,.07,120,.30);
        this.pad(110,'sine',5,500,.05,150,.18);
        this.pad(164.8,'sine',-6,700,.09,200,.07);
        this.wind(900,.7,.05,.11,400);
        this.chirpKey='jungle'; break;
      case 1:                  // luminous cavern: deep hollow pad + water air
        this.pad(49,'triangle',5,240,.05,70,.28);
        this.pad(98,'sine',-4,380,.04,110,.14);
        this.pad(146.8,'sine',6,520,.08,140,.06);
        this.wind(320,2.6,.05,.05,90);
        this.chirpKey='cave'; break;
      case 2:                  // machine womb: dark hum + metallic pulse
        this.pad(41.2,'sawtooth',4,180,.05,60,.22);
        this.pad(82.4,'triangle',-7,260,.08,90,.13);
        this.wind(180,2.5,.06,.07,60);
        this.chirpKey='machine'; break;
      case 3:                  // geyser marsh: warm dusk pad + breezy reeds
        this.pad(73.4,'triangle',6,420,.08,160,.24);
        this.pad(110,'sine',-5,560,.06,170,.13);
        this.wind(700,1.1,.06,.09,300);
        this.chirpKey='marsh'; break;
      case 4:                  // summit night: airy + sparse bells
        this.pad(65.4,'sine',6,400,.04,150,.22);
        this.pad(98,'sine',-5,600,.06,180,.12);
        this.wind(1600,.6,.07,.13,700);
        this.chirpKey='bells'; break;
      case 'star':             // the star ride: urgent shimmer drone
        this.pad(82.4,'sawtooth',3,260,.07,90,.16);
        this.pad(123.5,'triangle',-6,420,.05,140,.11);
        this.pad(164.8,'sine',8,680,.11,220,.06);
        this.wind(1300,.8,.08,.16,560);
        this.chirpKey='space'; break;
    }
  },
  // sparse random ornaments scheduled from the game loop
  tickAmbient(){
    if(!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if(now < this.scheduled) return;
    this.scheduled = now + 2.5 + Math.random()*4;
    switch(this.chirpKey){
      case 'jungle': {
        const f = [392,440,523,587][Math.floor(Math.random()*4)]*(Math.random()<.5?1:2);
        this.blip(f,.04,.5,'sine',12); break; }
      case 'cave':
        this.blip(1100+Math.random()*900,.04,.5,'sine'); break;
      case 'machine':
        this.thud(60+Math.random()*30,.05); break;
      case 'marsh':
        this.splashy(.05,.35,260,820); break;
      case 'bells': {
        const f=[523,659,784,880][Math.floor(Math.random()*4)];
        this.blip(f,.05,2.2,'sine',4); break; }
      case 'space':
        this.blip(1568+Math.random()*800,.025,1.4,'sine',3); break;
    }
  },
  /* --- one-shot SFX --- */
  blip(freq, vol, dur, type, vib){
    if(!this.ctx) return;
    const c=this.ctx, o=c.createOscillator(), g=c.createGain(), t=c.currentTime;
    o.type=type||'sine'; o.frequency.value=freq;
    if(vib){ const l=c.createOscillator(), lg=c.createGain();
      l.frequency.value=6; lg.gain.value=vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t+dur); }
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.02);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t+dur+.05);
  },
  thud(freq, vol){
    if(!this.ctx) return;
    const c=this.ctx, o=c.createOscillator(), g=c.createGain(), t=c.currentTime;
    o.type='sine'; o.frequency.setValueAtTime(freq*2.5,t);
    o.frequency.exponentialRampToValueAtTime(freq,t+.12);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+.4);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t+.45);
  },
  splashy(vol, dur, f0, f1){
    if(!this.ctx) return;
    const c=this.ctx, s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(), t=c.currentTime;
    s.buffer=this.noiseBuf; f.type='bandpass'; f.Q.value=2;
    f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.03);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t+dur+.1);
  },
  meow(){ // a small synthesized mrrow: up-glide then settle
    if(!this.ctx) return;
    const c=this.ctx, o=c.createOscillator(), f=c.createBiquadFilter(), g=c.createGain(),
          lfo=c.createOscillator(), lg=c.createGain(), t=c.currentTime;
    o.type='sawtooth';
    f.type='lowpass'; f.frequency.value=1700; f.Q.value=2.5;
    o.frequency.setValueAtTime(520,t);
    o.frequency.linearRampToValueAtTime(860,t+.13);
    o.frequency.exponentialRampToValueAtTime(430,t+.5);
    lfo.frequency.value=24; lg.gain.value=16;
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.09,t+.05);
    g.gain.exponentialRampToValueAtTime(.0001,t+.55);
    o.connect(f); f.connect(g); g.connect(this.master);
    o.start(t); lfo.start(t); o.stop(t+.6); lfo.stop(t+.6);
  },
  sfx(name){
    if(!this.ctx) return;
    switch(name){
      case 'meow':   this.meow(); break;
      case 'chime':  this.blip(1319,.06,.8,'sine',4);
                     setTimeout(()=>this.blip(1760,.05,1.1,'sine',4),90); break;
      case 'squeak': this.blip(1500,.05,.12,'square',40); break;
      case 'hover':  this.blip(880,.02,.08,'sine'); break;
      case 'pick':   this.blip(523,.08,.18,'triangle'); this.blip(784,.06,.25,'sine'); break;
      case 'deny':   this.blip(160,.07,.25,'square'); break;
      case 'fill':   this.splashy(.16,.7,400,1800); this.blip(330,.05,.5,'sine',20); break;
      case 'water':  this.splashy(.14,.9,900,300); break;
      case 'gear':   this.thud(90,.18); this.blip(1200,.04,.1,'square'); break;
      case 'door':   this.splashy(.12,1.2,200,90); this.thud(50,.2); break;
      case 'snore':  this.blip(98,.06,1.4,'sine',8); break;
      case 'shimmer':this.splashy(.07,1.5,2000,6000); break;
      case 'drip':   this.blip(1400+Math.random()*600,.035,.12,'sine'); break;
      case 'bloom':  [523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.blip(f,.09,1.2,'sine',5),i*160)); break;
      case 'melody': [659,587,784,880,1047].forEach((f,i)=>setTimeout(()=>this.blip(f,.07,.9,'triangle',6),i*350)); break;
      case 'power':  this.splashy(.1,2,300,4000);
                     [262,330,392,523,659].forEach((f,i)=>setTimeout(()=>this.blip(f,.08,1.8,'sine',4),i*220)); break;
      case 'end':    [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>this.blip(f,.07,3,'sine',3),i*400)); break;
      case 'egg':    [784,988,1319].forEach((f,i)=>setTimeout(()=>this.blip(f,.08,.5,'triangle',4),i*110));
                     this.splashy(.05,.6,2500,5500); break;
      case 'croak':  this.blip(130,.1,.22,'square',26);
                     setTimeout(()=>this.blip(110,.09,.28,'square',22),200); break;
      case 'geyser': this.splashy(.18,1.3,200,900); break;
      case 'cap':    this.thud(120,.22); this.blip(300,.05,.2,'sine'); break;
      case 'launch': this.splashy(.2,1.6,300,2400);
                     [392,523,659,784].forEach((f,i)=>setTimeout(()=>this.blip(f,.07,1,'sine',5),i*180)); break;
      case 'boom':   this.thud(35,.5); this.splashy(.25,.9,1600,90); break;
      case 'unlock': [523,659,880,1319].forEach((f,i)=>setTimeout(()=>this.blip(f,.08,.9,'triangle',4),i*120)); break;
      case 'tick':   this.blip(1568,.045,.1,'sine'); break;
      case 'whoosh': this.splashy(.06,.3,800,2400); break;
    }
  }
};
