// Игровой движок — Безголовый всадник
// Запускается через startGame(canvas, getBest, saveBest) → возвращает cleanup

interface Star     { x:number; y:number; p:number; big:boolean }
interface Particle { x:number; y:number; vx:number; vy:number; life:number; maxLife:number; spark?:boolean }
interface Obstacle { type:string; x:number; y:number; w:number; h:number; bob:number; passed:boolean; hp:number; maxHp:number; xpVal:number }
interface Potion   { x:number; y:number; bob:number; collected?:boolean }
interface SwordItem{ x:number; y:number; bob:number; collected?:boolean }
interface HorseEnt { x:number; y:number; caught:boolean }
interface Rect     { x:number; y:number; w:number; h:number }
interface FloatNum { x:number; y:number; val:number; life:number; maxLife:number; col:string; crit:boolean }
interface Quest    { id:string; desc:string; target:number; progress:number; done:boolean; xpReward:number; icon:string; doneTimer?:number }
interface ZoneGate { x:number; kind:'dawn'|'dusk'|'desert'|'cyber'|'cat'|'boer'; entered?:boolean }
interface GoldItem  { x:number; y:number; bob:number; collected?:boolean }
interface LootDrop { type:string; x:number; y:number; bob:number; collected?:boolean }
interface LootFloat { text:string; x:number; y:number; life:number; maxLife:number }

export function startGame(
  cv: HTMLCanvasElement,
  getBest: () => number,
  saveBest: (n: number) => void,
  onDeath?: (score: number) => void,
  onOpenLeaderboard?: () => void,
): { stop: () => void; restart: () => void } {
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const W = cv.width, H = cv.height, GY = 150;
  const bloomCv = document.createElement('canvas');
  bloomCv.width = W; bloomCv.height = H;
  const bCtx = bloomCv.getContext('2d')!;

  // ---- Палитра ----
  const C = {
    skyTop:'#0d0820',skyMid:'#241043',skyBot:'#4a2168',skyGlow:'#6e3a7a',
    moon:'#f7eecb',moonLt:'#fffbe8',moonSh:'#d6c393',
    hillFar:'#1c1138',hillMid:'#241540',hillNear:'#2d1a4d',
    ground:'#3b2a1a',groundMid:'#332415',groundDk:'#241810',
    grass:'#2a5a32',grassMid:'#1f4426',grassDk:'#143018',grassTip:'#3a7040',
    cloak:'#241334',cloakMid:'#352048',cloakLt:'#503070',cloakHi:'#6a458e',
    body:'#17102a',bodyMid:'#241838',bodyHi:'#352450',
    leather:'#5a3d1f',leatherHi:'#7a5530',buckle:'#d8b040',
    neck:'#7a1f1f',neckHi:'#a83030',neckBone:'#e8dcc0',
    skin:'#caa78a',skinSh:'#9c7d62',
    horse:'#4a2e1a',horseMid:'#3a2414',horseDk:'#26160b',horseHi:'#65422a',
    horseMane:'#160c06',horseHoof:'#1a1008',horseEye:'#1a0f08',
    pumpkin:'#ef8a1c',pumpkinMid:'#d06e10',pumpkinDk:'#a8500a',
    pumpkinHi:'#ffaa3a',pumpkinStem:'#3f5f22',pumpkinStemHi:'#5a7a30',pumpkinGlow:'#ffd84a',
    crow:'#13101d',crowMid:'#1e1830',crowWing:'#2a2040',crowHi:'#3a3052',
    beak:'#c89020',beakHi:'#e8b440',eye:'#ffcf3a',
    fog:'#4a3568',
    tomb:'#9a94a7',tombMid:'#7a7488',tombDk:'#52506a',tombMoss:'#3a5240',
    wood:'#6b4a2a',woodMid:'#523620',woodDk:'#3a2614',woodHi:'#8a6438',
    ghost:'#cdeeff',ghostMid:'#a8d4ee',
    potBg:'#5ad8c0',potGlow:'#a0ffe8',potDk:'#1a7858',
    potBottle:'#c0fff2',potCork:'#8a6030',potFace:'#0a3830',
    text:'#e8d5a8',
    dSkyTop:'#1a4a90',dSkyMid:'#2878c8',dSkyBot:'#60b0e8',dSkyGlow:'#f0e060',
    dHillFar:'#2a3a6a',dHillMid:'#344870',dHillNear:'#3a5478',
    dGrass:'#3a7a30',dGrassM:'#2e6025',dGrassDk:'#1e4818',dGrassTip:'#52a040',
    dGround:'#5a4020',dGroundM:'#4a3418',dFog:'#a0c8e8',
    // пустыня
    desertSkyTop:'#c87820',desertSkyMid:'#e8a030',desertSkyBot:'#f5c860',desertSkyGlow:'#ffe090',
    desertDuneF:'#d4a44c',desertDuneM:'#c08830',desertDuneN:'#e8b85a',
    desertGround:'#c8923a',desertGroundM:'#b07828',desertGroundDk:'#8a5c18',
    desertFog:'#f0c870',
    cactus:'#3a7028',cactusHi:'#52a038',cactusDk:'#264e18',
    pyramid:'#c8a040',pyramidMid:'#a87e28',pyramidDk:'#7a5c18',pyramidHi:'#e8c060',
    mummy:'#d4c89a',mummyBand:'#b0a070',mummyDk:'#8a7848',mummyEye:'#e02020',
    scorpion:'#8a6020',scorpionHi:'#b08030',scorpionDk:'#5a3c10',scorpionTail:'#6a4818',
    banditCloak:'#2a1a10',banditCloakHi:'#3e2818',banditTunic:'#6a3a18',banditTunicHi:'#8a5228',
    banditHood:'#1a1008',banditSkin:'#c09870',banditMask:'#181008',banditDagger:'#a8a8b8',
    // Призрачные поля — тёмный кровавый ночной стиль
    hntSkyTop:'#190808',hntSkyMid:'#3e1228',hntSkyBot:'#6c1c40',hntSkyGlow:'#8c2248',
    hntHillFar:'#1e0a0a',hntHillMid:'#2e1010',hntHillNear:'#401a1a',
    hntFog:'#300a1a',
    hntGrass:'#1e2c12',hntGrassM:'#142008',hntGrassDk:'#0c1606',hntGrassTip:'#304420',
    hntGround:'#2a1008',hntGroundM:'#1e0c06',hntGroundDk:'#140806',
    // Киберпанк
    cyberSkyTop:'#020810',cyberSkyMid:'#050d1a',cyberSkyBot:'#0a1428',cyberSkyGlow:'#001a35',
    cyberBldDk:'#080c14',cyberBldMid:'#0d1420',cyberBldHi:'#141e2e',
    neonC:'#00e8ff',neonM:'#ff0090',neonP:'#7000ff',neonG:'#00ff78',
    cyberGround:'#06060e',cyberGroundM:'#04040a',cyberGroundDk:'#020206',cyberFog:'#001428',
    cyberHood:'#0a0a18',cyberHoodHi:'#181830',cyberVisor:'#00e8ff',
    droneBody:'#1a1a2a',droneHi:'#262640',robotBody:'#181822',robotHi:'#28283a',
    // Гоблин
    goblinSkin:'#3c9028',goblinSkinHi:'#54c038',goblinSkinDk:'#267018',goblinCloth:'#8a6830',goblinClothHi:'#a87a40',
    // Ящер
    lizardScale:'#287858',lizardScaleHi:'#3aaa70',lizardScaleDk:'#185038',lizardBelly:'#8ab890',
    // Крыса-шахтёр
    ratFur:'#706860',ratFurHi:'#908878',ratFurDk:'#504840',ratHelmet:'#d4a820',ratHelmetHi:'#f0c830',
    // Лут
    lootFlesh:'#8a2010',lootFleshHi:'#c03020',lootLeather:'#7a4a18',lootLeatherHi:'#a06828',
    lootCloth:'#c0b898',lootClothHi:'#e0d8b8',lootScale:'#287858',lootScaleHi:'#3aaa70',
    lootOre:'#5a5868',lootOreHi:'#8888a0',
    // Мир котов
    catSkyTop:'#ffc8e8',catSkyMid:'#ffd8f0',catSkyBot:'#ffe8f8',catSkyGlow:'#fff4fc',
    catGround:'#b8e890',catGroundM:'#9cd878',catGroundDk:'#78b858',catFog:'#ffe0f4',
    catFurO:'#e87840',catFurOHi:'#f8a060',catFurODk:'#c05820',
    catFurG:'#909090',catFurGHi:'#b8b8b8',catFurGDk:'#606060',
    catEye:'#22cc22',catNose:'#ff6688',
    stoneCol:'#8a8898',stoneHi:'#aeb0c0',stoneDk:'#626274',stoneMoss:'#5a8040',
    // Бурская война — выжженная африканская саванна
    boerSkyTop:'#b89030',boerSkyMid:'#c8a840',boerSkyBot:'#dcc060',boerSkyGlow:'#ecd870',
    boerGrass:'#8a7828',boerGrassHi:'#a89038',boerGrassDk:'#5e5018',
    boerGround:'#7a5820',boerGroundM:'#6a4818',boerGroundDk:'#502c0c',boerFog:'#d8c860',
    britRed:'#c02020',britRedHi:'#e03030',britRedDk:'#8a1010',
    britKhaki:'#8a7840',britKhakiHi:'#a89050',britKhakiDk:'#5e5018',
    britHelm:'#d4c878',britHelmHi:'#ece8a0',britRifle:'#7a5828',britRifleMet:'#909090',
    goldCol:'#f0c030',goldHi:'#ffe060',goldDk:'#b89010',goldGlow:'#ffeea0',
    // Бэкрумс — лиминальное пространство
    bkrWall:'#c8bc60',bkrWallHi:'#e0d478',bkrWallDk:'#a09840',
    bkrFloor:'#b0a030',bkrFloorHi:'#ccc050',bkrFloorDk:'#806e18',
    bkrCeil:'#d4ca70',bkrLight:'#ffffe8',bkrPillar:'#a09028',
    bkrEntity:'#181408',bkrEntityHi:'#302c10',
  };

  // ---- Состояния ----
  const ST = { MENU:0, PLAY:1, DEAD:2, CUTSCENE:3, ENDING:4, LEVELUP:5, BOSS:6 };
  let state = ST.MENU, ct = 0, menuSel = 0;

  // ---- Игровые переменные ----
  let camX=0, speed=1.0, distance=0, best=getBest();
  const hero = { x:54, y:GY, vy:0, onGround:true, mounted:true, runFrame:0, landTimer:0 };
  const GRAV=0.62, JUMP_V=-7.4, JUMP_HOLD=-0.26;
  let jumpHeld=false;
  let horseEntity: HorseEnt | null = { x:54, y:GY, caught:true };

  let obstacles: Obstacle[] = [], spawnTimer=60;
  let potions: Potion[]     = [], potionTimer=350;
  let swordItems: SwordItem[]= [], swordSpawnTimer=500;
  let lootDrops: LootDrop[] = [], lootFloats: LootFloat[] = [];

  let ghostTimer=0, drinkAnim=0;
  const GHOST_DUR=360;
  let ghostParticles: Particle[] = [];

  const SLASH_FRAMES=30;
  let swordSlash=0, swordAnim=0;
  let swordParticles: Particle[] = [];
  const SUPER_COOLDOWN=600;
  let superTimer=0, superFlash=0, catTimer=0;
  const SPRINT_DURATION=300, SPRINT_COOLDOWN=600; // 5 сек активен, 10 сек перезарядка
  let sprintActive=0, sprintTimer=0;

  let mountAnim=0, dismountAnim=0;
  let hp=3, maxHp=3, hitTimer=0;
  let lastMilestone=0, speedFlash=0;
  let dayPhase=0, dayTransition=0, lastDayMile=0, dayFlash=0;
  let desertTransition=0, desertFlash=0;
  let hauntedTransition=0;
  let cyberTransition=0, cyberFlash=0;
  let catTransition=0, catFlash=0;
  let zoneGates: ZoneGate[] = [];
  let boerTransition=0, boerFlash=0;
  // Бэкрумс: 0=нет, 1..60=падение, 61+=активен, 421=выход-анимация
  let backrooms=0;
  let goldItems: GoldItem[] = [], goldSpawnTimer=700;
  // Капля — монстр бэкрумса
  let dropX=-200, dropActive=false, dropKill=false;
  // Дырка для побега из бэкрумса
  let holeX=999, holeActive=false;
  // Для фоновой мебели в бэкрумсе
  let bkrFurniture: {type:string; x:number; y:number}[] = [];


  // ---- RPG ----
  let xp=0, level=1, xpToNext=60;
  let statAtk=1, statDef=0;           // атака / защита
  let floatNums: FloatNum[] = [];
  // квесты — 3 одновременно
  const QUEST_POOL: Quest[] = [
    {id:'kill5skel', desc:'Убей 3 скелетов',   icon:'💀', target:3,  progress:0, done:false, xpReward:40},
    {id:'kill3kni',  desc:'Убей 2 рыцарей',    icon:'⚔',  target:2,  progress:0, done:false, xpReward:50},
    {id:'kill5band', desc:'Убей 3 разбойников', icon:'🗡',  target:3,  progress:0, done:false, xpReward:40},
    {id:'travel1k',  desc:'Пройди 500м',        icon:'🏃',  target:500, progress:0, done:false, xpReward:30},
    {id:'kill3zomb', desc:'Убей 2 зомби',       icon:'🧟',  target:2,  progress:0, done:false, xpReward:35},
    {id:'kill5any',  desc:'Убей 3 врагов',      icon:'⚡',  target:3,  progress:0, done:false, xpReward:25},
    {id:'pot3',      desc:'Выпей 1 зелье',      icon:'🧪',  target:1,  progress:0, done:false, xpReward:30},
    {id:'kill2mum',  desc:'Убей 1 мумию',       icon:'🧟',  target:1,  progress:0, done:false, xpReward:45},
    {id:'kill5gob',  desc:'Убей 3 гоблинов',    icon:'👺',  target:3,  progress:0, done:false, xpReward:35},
    {id:'kill3liz',  desc:'Убей 2 ящеров',      icon:'🦎',  target:2,  progress:0, done:false, xpReward:45},
    {id:'kill3rat',  desc:'Убей 2 крысошахтёра', icon:'🐀',  target:2,  progress:0, done:false, xpReward:40},
  ];
  let activeQuests: Quest[] = [];
  let usedQuestIds = new Set<string>();
  // уровень-апгрейд — 3 варианта на выбор
  interface Upgrade { id:string; label:string; desc:string; col:string }
  const ALL_UPGRADES: Upgrade[] = [
    {id:'hp',    label:'+1 HP макс',    desc:'Восстановить и +1 к макс HP',   col:'#e84040'},
    {id:'atk',   label:'+1 Атака',      desc:'Удар мечом наносит больше урона',col:'#e8a030'},
    {id:'def',   label:'+1 Защита',     desc:'Получаешь на 1 меньше урона',   col:'#4090e8'},
    {id:'spd',   label:'+Скорость',     desc:'Базовая скорость +0.3',         col:'#40d870'},
    {id:'super', label:'Супер-КД -20%', desc:'Супер-удар перезаряжается быстрее',col:'#c840e8'},
    {id:'ghost', label:'Зелье +50%',    desc:'Неуязвимость длится дольше',    col:'#40d8d0'},
    {id:'heal',  label:'Лечение',       desc:'Восстановить 2 HP прямо сейчас',col:'#e84080'},
  ];
  let levelUpChoices: Upgrade[] = [];
  // Босс
  interface BossState { hp:number; maxHp:number; x:number; phase:number; tick:number; atkTimer:number; stunTimer:number }
  let _boss: BossState | null = null; void _boss;
  const _BOSS_TRIGGER = 7000; void _BOSS_TRIGGER;

  const crow = { x:250, y:50, bob:0 };
  let dust: Particle[] = [];
  interface Bird { x:number; y:number; speed:number; wing:number; dir:number }
  const birds: Bird[] = Array.from({length:10},()=>({
    x:Math.random()*W*2, y:18+Math.random()*55, speed:0.4+Math.random()*0.7,
    wing:Math.random()*Math.PI*2, dir:Math.random()<0.5?1:-1,
  }));
  const stars: Star[] = Array.from({length:55},()=>({
    x:Math.random()*W, y:Math.random()*95, p:Math.random()*Math.PI*2, big:Math.random()<0.15
  }));

  // ---- Вспомогательные ----
  const PF = "'Press Start 2P','Courier New',monospace";
  function px(x:number,y:number,w:number,h:number,col:string){ctx.fillStyle=col;ctx.fillRect(x|0,y|0,w,h);}
  function txt(s:string,x:number,y:number,col:string,size:number,align:CanvasTextAlign='left',outline='#000'){
    ctx.font=`${size}px ${PF}`;ctx.textAlign=align;ctx.fillStyle=outline;
    for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)if(dx||dy)ctx.fillText(s,x+dx,y+dy);
    ctx.fillStyle=col;ctx.fillText(s,x,y);
  }
  function lerpColor(a:string,b:string,t:number){
    const ah=parseInt(a.slice(1),16),bh=parseInt(b.slice(1),16);
    const ar=(ah>>16)&255,ag=(ah>>8)&255,ab=ah&255;
    const br=(bh>>16)&255,bg=(bh>>8)&255,bb=bh&255;
    const rr=((ar+(br-ar)*t)|0),rg=((ag+(bg-ag)*t)|0),rb=((ab+(bb-ab)*t)|0);
    return '#'+(((rr<<16)|(rg<<8)|rb)).toString(16).padStart(6,'0');
  }
  function clamp01(v:number){return v<0?0:v>1?1:v;}
  function lerp(a:number,b:number,t:number){return a+(b-a)*clamp01(t);}
  function ease(t:number){t=clamp01(t);return t*t*(3-2*t);}
  function overlap(a:Rect,b:Rect){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function heroBox():Rect{const top=hero.mounted?hero.y-34:hero.y-26;return{x:hero.x-6,y:top,w:12,h:hero.y-top};}

  // ---- Смерть ----
  let awaitingRestart=false;
  function killHero(){
    if(state===ST.DEAD)return;
    state=ST.DEAD;
    awaitingRestart=!!onDeath;
    onDeath?.(Math.floor(distance));
  }

  // ---- Меню ----
  function confirmMenuSel(){
    if(menuSel===0){state=ST.PLAY;if(activeQuests.length===0)initQuests();}
    else{onOpenLeaderboard?.();}
  }

  // ---- Ввод ----
  function doJump(){
    if(state===ST.MENU){state=ST.PLAY;if(activeQuests.length===0)initQuests();return;} // мышь/тач — всегда старт
    if(state===ST.DEAD){if(!awaitingRestart)resetGame();return;}
    if(hero.onGround&&mountAnim===0&&dismountAnim===0){
      hero.vy=JUMP_V;hero.onGround=false;jumpHeld=true;
      for(let i=0;i<6;i++)dust.push({x:hero.x,y:GY,vx:-Math.random()*1.5-speed*0.3,vy:-Math.random()*1.2,life:18,maxLife:18});
    }
  }
  function endHold(){jumpHeld=false;}
  function doMount(){
    if(state!==ST.PLAY||hero.mounted||mountAnim>0||dismountAnim>0)return;
    if(!horseEntity||Math.abs(horseEntity.x-hero.x)>38)return;
    hero.mounted=true;mountAnim=18;
    for(let i=0;i<8;i++)dust.push({x:hero.x,y:GY,vx:(-Math.random()*2-1)*(i<4?1:-0.5),vy:-Math.random()*2.5,life:22,maxLife:22});
  }
  function doDisMount(){
    if(state!==ST.PLAY||!hero.mounted||dismountAnim>0||mountAnim>0)return;
    hero.mounted=false;dismountAnim=16;
    if(horseEntity)horseEntity.x=hero.x+20;
    for(let i=0;i<8;i++)dust.push({x:hero.x+10,y:GY,vx:(Math.random()*2)*(i<4?1:-0.5),vy:-Math.random()*2,life:20,maxLife:20});
  }
  function doSwordAttack(){
    if(state!==ST.PLAY||swordSlash>0)return;
    swordSlash=SLASH_FRAMES;
    const reach=hero.x+42;
    let hit=false;
    const killed:string[]=[];
    obstacles=obstacles.filter(ob=>{
      if(ob.x>hero.x-10&&ob.x<reach){
        hit=true;killed.push(ob.type);spawnLoot(ob);
        for(let i=0;i<12;i++)swordParticles.push({x:ob.x,y:(ob.y||GY)-ob.h/2,vx:(Math.random()-0.4)*4,vy:-Math.random()*3.5-1,life:28,maxLife:28,spark:ob.type==='knight_mob'||ob.type==='skeleton'});
        return false;
      }
      return true;
    });
    for(const t of killed)trackKill(t);
    if(hit)for(let i=0;i<6;i++)swordParticles.push({x:hero.x+30,y:hero.y-20,vx:Math.random()*3+1,vy:(Math.random()-0.5)*2,life:16,maxLife:16,spark:true});
    // котик наносит ответный урон игроку — мгновенная смерть
    if(killed.some(t=>t==='cat')){hp=0;hitTimer=90;killHero();}
  }

  function doSuperAttack(){
    if(state!==ST.PLAY||superTimer>0)return;
    superTimer=SUPER_COOLDOWN;
    superFlash=40;
    catTimer=180;
    // уничтожить всех врагов на экране
    let count=0;
    const superKilled:string[]=[];
    obstacles=obstacles.filter(ob=>{
      if(ob.x>-20&&ob.x<W+20&&ob.type!=='ghost'){
        count++;superKilled.push(ob.type);spawnLoot(ob);
        for(let i=0;i<18;i++)swordParticles.push({x:ob.x,y:(ob.y||GY)-ob.h/2,vx:(Math.random()-0.5)*6,vy:-Math.random()*5-2,life:38,maxLife:38,spark:true});
        return false;
      }
      return true;
    });
    for(const t of superKilled)trackKill(t);
    // волна частиц от героя
    for(let i=0;i<28;i++){
      const ang=Math.random()*Math.PI*2;
      swordParticles.push({x:hero.x,y:hero.y-18,vx:Math.cos(ang)*5,vy:Math.sin(ang)*5-3,life:44,maxLife:44,spark:true});
    }
    if(count>0&&hp<maxHp)hp=Math.min(maxHp,hp+1); // бонус — восстановить 1 HP за убийство
  }

  function doHorseSprint(){
    if(state!==ST.PLAY||!hero.mounted||sprintActive>0||sprintTimer>0)return;
    sprintActive=SPRINT_DURATION;
    sprintTimer=SPRINT_COOLDOWN;
    // пыль из-под копыт при старте
    for(let i=0;i<14;i++)dust.push({x:hero.x-10,y:GY,vx:-Math.random()*5-2,vy:-Math.random()*3.5,life:28,maxLife:28});
  }

  function onKeyDown(e:KeyboardEvent){
    if(state===ST.MENU){
      if(e.code==='ArrowDown'||e.code==='KeyS'){menuSel=(menuSel+1)%2;return;}
      if(e.code==='ArrowUp'  ||e.code==='KeyW'){menuSel=(menuSel+1)%2;return;}
      if(e.code==='Space'    ||e.code==='Enter'){e.preventDefault();confirmMenuSel();return;}
      return;
    }
    if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'){e.preventDefault();if(!e.repeat)doJump();}
    if(e.code==='Escape')doDisMount();
    if(e.code==='KeyE'&&!e.repeat)doMount();
    if(e.code==='KeyQ'&&!e.repeat)doSuperAttack();
    if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!e.repeat)doHorseSprint();
    if(state===ST.LEVELUP&&!e.repeat){
      const idx=e.code==='Digit1'?0:e.code==='Digit2'?1:e.code==='Digit3'?2:-1;
      if(idx>=0&&idx<levelUpChoices.length)applyUpgrade(levelUpChoices[idx]);
    }
  }
  function onKeyUp(e:KeyboardEvent){if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')endHold();}
  function onMouseDown(e:MouseEvent){
    e.preventDefault();
    if(e.button!==0)return;
    if(state===ST.LEVELUP){
      const rect=cv.getBoundingClientRect();
      const mx=(e.clientX-rect.left)*(W/rect.width);
      const my=(e.clientY-rect.top)*(H/rect.height);
      const BW=84,BH=56,BG=6;
      const startX=((W-(3*BW+2*BG))/2)|0;
      const BY=((H/2)-10)|0;
      for(let i=0;i<levelUpChoices.length;i++){
        const bx=startX+i*(BW+BG);
        if(mx>=bx&&mx<bx+BW&&my>=BY&&my<BY+BH){applyUpgrade(levelUpChoices[i]);break;}
      }
      return;
    }
    doSwordAttack();
  }
  function onMouseUp(){endHold();}
  function onTouch(e:TouchEvent){e.preventDefault();doJump();}
  function onTouchEnd(e:TouchEvent){e.preventDefault();endHold();}

  window.addEventListener('keydown',onKeyDown);
  window.addEventListener('keyup',onKeyUp);
  cv.addEventListener('mousedown',onMouseDown);
  cv.addEventListener('mouseup',onMouseUp);
  cv.addEventListener('touchstart',onTouch,{passive:false});
  cv.addEventListener('touchend',onTouchEnd,{passive:false});

  // ---- RPG Функции ----
  function initQuests(){
    usedQuestIds.clear();activeQuests=[];
    const pool=QUEST_POOL.map(q=>({...q,progress:0,done:false,doneTimer:0}));
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    for(let i=0;i<Math.min(3,pool.length);i++){activeQuests.push(pool[i]);usedQuestIds.add(pool[i].id);}
  }
  function giveXP(amount:number){
    xp+=amount;
    floatNums.push({x:hero.x,y:hero.y-40,val:amount,life:70,maxLife:70,col:'#ffe840',crit:false});
    if(xp>=xpToNext&&state===ST.PLAY)triggerLevelUp();
  }
  function triggerLevelUp(){
    xp-=xpToNext;level++;xpToNext=Math.floor(xpToNext*1.4);
    const sh=[...ALL_UPGRADES].sort(()=>Math.random()-0.5);
    levelUpChoices=sh.slice(0,3);state=ST.LEVELUP;
  }
  function applyUpgrade(up:Upgrade){
    if(up.id==='hp'){maxHp++;hp=Math.min(hp+1,maxHp);}
    else if(up.id==='atk')statAtk++;
    else if(up.id==='def')statDef++;
    else if(up.id==='spd')speed=Math.min(3.5,speed+0.2);
    else if(up.id==='super')superTimer=Math.max(0,superTimer-120);
    else if(up.id==='ghost')ghostTimer=Math.min(ghostTimer+180,GHOST_DUR+180);
    else if(up.id==='heal')hp=Math.min(maxHp,hp+2);
    state=ST.PLAY;
  }
  function trackKill(type:string){
    const ENEMIES=new Set(['skeleton','knight_mob','zombie','mummy','bandit','ghost','scorpion','goblin','lizard','rat_miner']);
    for(const q of activeQuests){
      if(q.done)continue;
      let hit=false;
      if(q.id==='kill5any'&&ENEMIES.has(type))hit=true;
      else if(q.id==='kill5skel'&&type==='skeleton')hit=true;
      else if(q.id==='kill3kni'&&type==='knight_mob')hit=true;
      else if(q.id==='kill5band'&&type==='bandit')hit=true;
      else if(q.id==='kill3zomb'&&type==='zombie')hit=true;
      else if(q.id==='kill2mum'&&type==='mummy')hit=true;
      else if(q.id==='kill5gob'&&type==='goblin')hit=true;
      else if(q.id==='kill3liz'&&type==='lizard')hit=true;
      else if(q.id==='kill3rat'&&type==='rat_miner')hit=true;
      if(hit){q.progress++;checkQuestDone(q);}
    }
  }
  function trackPotion(){
    for(const q of activeQuests){
      if(q.done||q.id!=='pot3')continue;
      q.progress++;checkQuestDone(q);
    }
  }
  function checkQuestDone(q:Quest){
    if(q.progress>=q.target&&!q.done){q.done=true;q.doneTimer=120;giveXP(q.xpReward);}
  }
  const LOOT_TABLE: Record<string,string> = {
    zombie:'loot_flesh', goblin:'loot_leather', bandit:'loot_cloth',
    lizard:'loot_scale', rat_miner:'loot_ore',
  };
  function spawnLoot(ob:Obstacle){
    const lt=LOOT_TABLE[ob.type];
    if(!lt||Math.random()>0.68)return;
    lootDrops.push({type:lt,x:ob.x,y:GY,bob:Math.random()*6});
  }

  function replaceQuest(q:Quest){
    const avail=QUEST_POOL.filter(p=>!usedQuestIds.has(p.id));
    if(avail.length===0){usedQuestIds.clear();activeQuests.forEach(a=>usedQuestIds.add(a.id));}
    const pool2=QUEST_POOL.filter(p=>!usedQuestIds.has(p.id));
    if(pool2.length===0)return;
    const next={...pool2[Math.floor(Math.random()*pool2.length)],progress:0,done:false,doneTimer:0};
    usedQuestIds.add(next.id);
    const idx=activeQuests.indexOf(q);
    if(idx>=0)activeQuests[idx]=next;
  }

  // ---- Сброс ----
  function resetGame(){
    state=ST.PLAY;camX=0;speed=1.0;distance=0;best=getBest();
    hero.x=54;hero.y=GY;hero.vy=0;hero.onGround=true;hero.mounted=true;hero.runFrame=0;hero.landTimer=0;
    obstacles=[];dust=[];potions=[];ghostParticles=[];swordItems=[];swordParticles=[];lootDrops=[];lootFloats=[];
    spawnTimer=60;potionTimer=350;swordSpawnTimer=500;
    horseEntity={x:54,y:GY,caught:true};
    ghostTimer=0;drinkAnim=0;swordSlash=0;swordAnim=0;superTimer=0;superFlash=0;catTimer=0;
    mountAnim=0;dismountAnim=0;hp=3;maxHp=3;hitTimer=0;
    lastMilestone=0;speedFlash=0;
    dayPhase=0;dayTransition=0;lastDayMile=0;dayFlash=0;
    desertTransition=0;desertFlash=0;cyberTransition=0;cyberFlash=0;catTransition=0;catFlash=0;
    boerTransition=0;boerFlash=0;backrooms=0;hauntedTransition=0;
    zoneGates=[];sprintActive=0;sprintTimer=0;menuSel=0;
    goldItems=[];goldSpawnTimer=700;
    dropX=-200;dropActive=false;dropKill=false;
    holeX=999;holeActive=false;
    bkrFurniture=[];

    crow.x=250;crow.y=50;crow.bob=0;
    xp=0;level=1;xpToNext=60;statAtk=1;statDef=0;floatNums=[];levelUpChoices=[];
    initQuests();
  }

  // ---- Обновление ----
  function spawnOb(){
    let pool:string[];
    if(backrooms>=61)pool=['bkr_entity','bkr_entity','bkr_light','bkr_tv','bkr_entity','bkr_tv'];
    else if(boerTransition>0.5)pool=['british_soldier','british_soldier','british_officer','british_soldier','british_officer','british_soldier'];
    else if(catTransition>0.5)pool=['cat','cat','stone','cat','stone','cat'];
    else if(cyberTransition>0.5)pool=['cyber_punk','drone','robot','cyber_car','neon_barrier','cyber_punk','drone'];
    else if(distance>20000)pool=['cactus','mummy','scorpion','ghost','cactus','mummy'];
    else if(distance>1000)pool=['tomb','fence','log','ghost','skeleton','knight_mob','zombie','bandit','goblin','goblin','lizard','rat_miner'];
    else pool=['tomb','fence','log','ghost','bandit','goblin'];
    const t=pool[Math.floor(Math.random()*pool.length)];
    const ob:Obstacle={type:t,x:W+20,y:GY,w:0,h:0,bob:Math.random()*6,passed:false,hp:1,maxHp:1,xpVal:5};
    if(t==='tomb')      {ob.w=16;ob.h=22;}
    if(t==='fence')     {ob.w=20;ob.h=16;}
    if(t==='log')       {ob.w=24;ob.h=12;}
    if(t==='ghost')     {ob.w=16;ob.h=16;ob.y=GY-26-Math.random()*14;}
    if(t==='skeleton')  {ob.w=14;ob.h=26;}
    if(t==='knight_mob'){ob.w=18;ob.h=28;}
    if(t==='zombie')    {ob.w=20;ob.h=22;}
    if(t==='cactus')    {ob.w=18;ob.h=28;}
    if(t==='mummy')     {ob.w=16;ob.h=32;}
    if(t==='scorpion')  {ob.w=24;ob.h=12;}
    if(t==='bandit')    {ob.w=16;ob.h=26;}
    if(t==='cyber_punk'){ob.w=14;ob.h=26;}
    if(t==='drone')     {ob.w=22;ob.h=14;ob.y=GY-30-Math.random()*12;}
    if(t==='robot')     {ob.w=18;ob.h=30;}
    if(t==='cyber_car') {ob.w=38;ob.h=16;}
    if(t==='neon_barrier'){ob.w=8;ob.h=24;}
    if(t==='cat')             {ob.w=18;ob.h=16;}
    if(t==='stone')           {ob.w=20;ob.h=14;}
    if(t==='goblin')          {ob.w=14;ob.h=22;}
    if(t==='lizard')          {ob.w=18;ob.h=24;}
    if(t==='rat_miner')       {ob.w=14;ob.h=22;}
    if(t==='british_soldier') {ob.w=16;ob.h=28;}
    if(t==='british_officer') {ob.w=16;ob.h=30;}
    if(t==='bkr_entity')      {ob.w=14;ob.h=30;}
    if(t==='bkr_light')       {ob.w=18;ob.h=8;}
    if(t==='bkr_tv')          {ob.w=26;ob.h=22;}
    obstacles.push(ob);
  }

  function update(){
    ct++;
    if(state!==ST.PLAY)return;
    if(speed<3.5)speed=Math.min(3.5,speed+0.0006);
    const eff=hero.mounted?(sprintActive>0?speed*2.5:speed*1.22):speed;
    camX+=eff;distance+=eff;
    if(distance>best){best=Math.floor(distance);saveBest(best);}
    // квест на дистанцию
    for(const q of activeQuests){
      if(!q.done&&q.id==='travel1k'){
        const dp=Math.min(q.target,Math.floor(distance));
        if(dp>q.progress){q.progress=dp;if(dp>=q.target)checkQuestDone(q);}
      }
    }

    const milestone=Math.floor(distance/1000);
    if(milestone>lastMilestone){lastMilestone=milestone;if(speed<3.5)speed=Math.min(3.5,speed+0.2);speedFlash=120;
      for(let i=0;i<10;i++)dust.push({x:hero.x+(-8+i*2),y:GY,vx:(-Math.random()*3-2)*(i<5?1:-0.4),vy:-Math.random()*2.5,life:24,maxLife:24});}
    if(speedFlash>0)speedFlash--;

    const dayMile=Math.floor(distance/5000);
    if(dayMile>lastDayMile){lastDayMile=dayMile;dayPhase=1-dayPhase;dayFlash=180;zoneGates.push({x:W+50,kind:dayPhase===1?'dawn':'dusk'});}
    if(dayFlash>0)dayFlash--;
    if(desertFlash>0)desertFlash--;
    if(dayPhase===1&&dayTransition<1)dayTransition=Math.min(1,dayTransition+0.004);
    if(dayPhase===0&&dayTransition>0)dayTransition=Math.max(0,dayTransition-0.004);
    // пустыня после 20000м
    if(distance>=20000){
      if(desertTransition<1)desertTransition=Math.min(1,desertTransition+0.003);
    }else{
      if(desertTransition>0)desertTransition=Math.max(0,desertTransition-0.003);
    }
    if(distance>=20000&&distance<20000+eff*2&&desertFlash===0){desertFlash=200;zoneGates.push({x:W+50,kind:'desert'});}
    // киберпанк после 5000м
    if(distance>=5000){if(cyberTransition<1)cyberTransition=Math.min(1,cyberTransition+0.003);}
    else{if(cyberTransition>0)cyberTransition=Math.max(0,cyberTransition-0.003);}
    if(distance>=5000&&distance<5000+eff*2&&cyberFlash===0){cyberFlash=220;zoneGates.push({x:W+50,kind:'cyber'});}
    // мир котов после 10000м
    if(distance>=10000){if(catTransition<1)catTransition=Math.min(1,catTransition+0.003);}
    else{if(catTransition>0)catTransition=Math.max(0,catTransition-0.003);}
    if(distance>=10000&&distance<10000+eff*2&&catFlash===0){catFlash=220;zoneGates.push({x:W+50,kind:'cat'});}
    // Бурская война после 30000м
    if(distance>=30000){if(boerTransition<1)boerTransition=Math.min(1,boerTransition+0.003);}
    else{if(boerTransition>0)boerTransition=Math.max(0,boerTransition-0.003);}
    if(distance>=30000&&distance<30000+eff*2&&boerFlash===0){boerFlash=220;zoneGates.push({x:W+50,kind:'boer'});}
    if(boerFlash>0)boerFlash--;
    // переход в Призрачные поля после 1000м
    if(distance>=1000){if(hauntedTransition<1)hauntedTransition=Math.min(1,hauntedTransition+0.008);}
    else{if(hauntedTransition>0)hauntedTransition=Math.max(0,hauntedTransition-0.008);}

    // Бесконечная игра — конец только от смерти

    if(!hero.onGround){
      if(jumpHeld&&hero.vy<0)hero.vy+=JUMP_HOLD;
      hero.vy+=GRAV;hero.y+=hero.vy;
      // блокируем посадку только во время анимации падения (1..60)
      if(hero.y>=GY&&!(backrooms>=1&&backrooms<=60)){
        hero.y=GY;hero.vy=0;hero.onGround=true;hero.landTimer=10;
        for(let i=0;i<7;i++)dust.push({x:hero.x+(-6+i*2),y:GY,vx:(-Math.random()*2.5-eff*0.3)*(i<4?1:-0.5),vy:-Math.random()*2,life:20,maxLife:20});
      }
    }
    // анимация провала в бэкрумс
    if(backrooms>0&&backrooms<=60){
      backrooms++;
      hero.vy+=0.5;hero.onGround=false; // проваливается сквозь землю
      // частицы-земля летят вверх (след «хвоста»)
      if(backrooms%4===0)for(let i=0;i<3;i++)dust.push({x:hero.x+(-4+i*4),y:GY,vx:(Math.random()-0.5)*3,vy:-Math.random()*3-1,life:25,maxLife:25});
      if(backrooms===60){backrooms=61;hero.y=GY;hero.vy=0;hero.onGround=true;obstacles=[];
        for(let i=0;i<20;i++)dust.push({x:hero.x+(-8+i*2),y:GY,vx:(Math.random()-0.5)*6,vy:-Math.random()*4-2,life:30,maxLife:30});}
    }
    // ---- Активная фаза бэкрумса ----
    if(backrooms>=61){
      backrooms++;
      // Инициализация мебели при входе
      if(backrooms===62){
        bkrFurniture=[];
        for(let i=0;i<12;i++)bkrFurniture.push({
          type:['table','chair','cabinet','lamp'][i%4],
          x:80+i*220, y:GY
        });
        dropX=-200;dropActive=false;holeX=999;holeActive=false;
      }
      // Капля появляется через 80 кадров после входа
      if(backrooms===141&&!dropActive){dropActive=true;dropX=-200;}
      // Двигаем каплю к герою (экранные координаты — герой на x=54)
      if(dropActive&&!dropKill){
        dropX+=0.9; // медленно ползёт вправо
        // Частицы-слизь за каплей
        if(backrooms%3===0)dust.push({x:dropX+4,y:GY-6,vx:-0.5,vy:-Math.random()*1.5,life:20,maxLife:20});
        if(dropX>=hero.x-8){
          // Капля догнала! Разрыв
          dropKill=true;
          for(let i=0;i<28;i++)swordParticles.push({x:hero.x,y:hero.y-14,vx:(Math.random()-0.5)*8,vy:-Math.random()*6-1,life:45,maxLife:45,spark:true});
          for(let i=0;i<14;i++)dust.push({x:hero.x,y:hero.y-10,vx:(Math.random()-0.5)*5,vy:-Math.random()*4-1,life:30,maxLife:30});
          hp=0;hitTimer=90;killHero();return;
        }
      }
      // Дырка появляется через 120 кадров после входа, мчится слева с правого края
      if(backrooms===181&&!holeActive){holeActive=true;holeX=W+20;}
      if(holeActive){
        holeX-=eff*1.2; // быстрее обычных препятствий
        // Прыжок в дырку: герой на земле И позиция совпадает
        if(hero.onGround&&Math.abs(holeX-hero.x)<18){
          // Телепорт в обычный мир
          holeActive=false;dropActive=false;dropX=-200;
          backrooms=361; // запускаем анимацию выхода
        }
        if(holeX<-30){holeActive=false;} // улетела — шанс упущен
      }
    }
    // Анимация выхода из бэкрумса
    if(backrooms>=361&&backrooms<=420){
      backrooms++;
      if(backrooms===421){backrooms=0;hero.y=GY;hero.vy=0;hero.onGround=true;obstacles=[];
        dropActive=false;dropX=-200;holeActive=false;holeX=999;bkrFurniture=[];
        for(let i=0;i<20;i++)swordParticles.push({x:hero.x,y:hero.y-20,vx:(Math.random()-0.5)*7,vy:-Math.random()*5-2,life:40,maxLife:40,spark:true});
      }
    }
    if(hero.landTimer>0)hero.landTimer--;
    hero.runFrame+=eff*0.25;
    if(mountAnim>0)mountAnim--;
    if(dismountAnim>0)dismountAnim--;

    if(horseEntity){
      if(hero.mounted){horseEntity.x=hero.x;horseEntity.caught=true;}
      else{
        if(!horseEntity.caught){
          horseEntity.x-=eff;
          if(Math.abs(horseEntity.x-hero.x)<14){horseEntity.caught=true;hero.mounted=true;mountAnim=18;}
        }else{const tgt=hero.x+22;horseEntity.x+=(tgt-horseEntity.x)*0.07;}
      }
    }
    if(hitTimer>0)hitTimer--;

    potionTimer--;
    if(potionTimer<=0){potionTimer=380+Math.random()*280;
      if(Math.random()<0.5){const sx=W+16;const bl=obstacles.some(ob=>Math.abs(ob.x-sx)<44);if(!bl)potions.push({x:sx,y:GY,bob:Math.random()*6});}}
    const hb=heroBox();
    for(const p of potions){p.x-=eff;p.bob+=0.08;
      const pb:Rect={x:p.x-6,y:GY-14,w:12,h:14};
      if(drinkAnim===0&&ghostTimer===0&&overlap(hb,pb)){p.collected=true;drinkAnim=50;trackPotion();}}
    potions=potions.filter(p=>p.x>-20&&!p.collected);
    if(drinkAnim>0){drinkAnim--;if(drinkAnim===0){ghostTimer=GHOST_DUR;for(let i=0;i<16;i++){const ang=Math.random()*Math.PI*2;ghostParticles.push({x:hero.x,y:hero.y-20,vx:Math.cos(ang)*2,vy:Math.sin(ang)*2-2,life:40,maxLife:40});}}}
    if(ghostTimer>0){ghostTimer--;if((Math.floor(distance*3))%4===0)ghostParticles.push({x:hero.x-2+Math.random()*8,y:hero.y-10-Math.random()*14,vx:(Math.random()-0.5)*0.8,vy:-0.8-Math.random()*0.6,life:30,maxLife:30});}
    for(const g of ghostParticles){g.x+=g.vx;g.y+=g.vy;g.vy*=0.95;g.life--;}
    ghostParticles=ghostParticles.filter(g=>g.life>0);

    swordSpawnTimer--;
    if(swordSpawnTimer<=0){swordSpawnTimer=1000+Math.random()*600;
      const sx=W+16;const bl=obstacles.some(ob=>Math.abs(ob.x-sx)<44);
      if(!bl)swordItems.push({x:sx,y:GY,bob:Math.random()*6});}
    for(const sw of swordItems){sw.x-=eff;sw.bob+=0.07;
      const sb:Rect={x:sw.x-5,y:GY-18,w:10,h:18};
      if(overlap(hb,sb)&&!sw.collected){sw.collected=true;if(hp<maxHp)hp++;
        for(let i=0;i<14;i++)swordParticles.push({x:sw.x,y:sw.y-10,vx:(Math.random()-0.5)*4,vy:-Math.random()*4-1,life:32,maxLife:32,spark:true});}}
    swordItems=swordItems.filter(sw=>sw.x>-20&&!sw.collected);

    // ---- Лут ----
    const LOOT_NAMES:Record<string,string>={loot_flesh:'Гнилая плоть',loot_leather:'Кожа',loot_cloth:'Ткань',loot_scale:'Чешуя',loot_ore:'Руда'};
    const LOOT_XP:Record<string,number>={loot_flesh:6,loot_leather:8,loot_cloth:7,loot_scale:9,loot_ore:12};
    for(const ld of lootDrops){
      ld.x-=eff;ld.bob+=0.1;
      const lb:Rect={x:ld.x-5,y:GY-12,w:10,h:12};
      if(overlap(hb,lb)&&!ld.collected){
        ld.collected=true;
        giveXP(LOOT_XP[ld.type]??5);
        lootFloats.push({text:LOOT_NAMES[ld.type]??'Лут',x:ld.x,y:GY-20,life:65,maxLife:65});
      }
    }
    lootDrops=lootDrops.filter(ld=>ld.x>-20&&!ld.collected);
    for(const lf of lootFloats){lf.y-=0.7;lf.life--;}
    lootFloats=lootFloats.filter(lf=>lf.life>0);
    if(swordSlash>0)swordSlash--;
    if(swordAnim>0)swordAnim--;
    if(superTimer>0)superTimer--;
    if(superFlash>0)superFlash--;
    if(catTimer>0)catTimer--;
    if(sprintActive>0)sprintActive--;
    if(sprintTimer>0)sprintTimer--;
    for(const sp of swordParticles){sp.x+=sp.vx;sp.y+=sp.vy;sp.vy+=0.08;sp.life--;}
    swordParticles=swordParticles.filter(sp=>sp.life>0);

    spawnTimer--;
    if(spawnTimer<=0){spawnOb();const base=hero.mounted?44:60;spawnTimer=Math.max(28,base+Math.random()*52-Math.min(28,distance*0.01));}
    for(const g of zoneGates)g.x-=eff;
    // Вход в ворота — мгновенный переход в локацию
    for(const g of zoneGates){
      if(!g.entered&&Math.abs(g.x-hero.x)<32){
        g.entered=true;
        if(g.kind==='dawn'){dayPhase=1;dayTransition=1;dayFlash=180;hauntedTransition=0;}
        else if(g.kind==='dusk'){dayPhase=0;dayTransition=0;dayFlash=180;}
        else if(g.kind==='desert'){desertTransition=1;desertFlash=220;hauntedTransition=0;}
        else if(g.kind==='cyber'){cyberTransition=1;cyberFlash=220;}
        else if(g.kind==='cat'){catTransition=1;catFlash=220;}
        else if(g.kind==='boer'){boerTransition=1;boerFlash=220;}
        superFlash=35;
        for(let i=0;i<28;i++){const ang=i/28*Math.PI*2;swordParticles.push({x:hero.x,y:hero.y-22,vx:Math.cos(ang)*5.5,vy:Math.sin(ang)*4.5-1.5,life:48,maxLife:48,spark:true});}
      }
    }
    zoneGates=zoneGates.filter(g=>g.x>-120);
    // ---- Золото (Бурская война) ----
    if(boerTransition>0.5){
      goldSpawnTimer--;
      if(goldSpawnTimer<=0){goldSpawnTimer=600+Math.random()*500;
        if(Math.random()<0.55){const sx=W+14;const bl=obstacles.some(ob=>Math.abs(ob.x-sx)<40);if(!bl)goldItems.push({x:sx,y:GY,bob:Math.random()*6});}}
    }
    for(const g of goldItems){g.x-=eff;g.bob+=0.09;
      const gb:Rect={x:g.x-6,y:GY-14,w:12,h:14};
      if(overlap(hb,gb)&&!g.collected){g.collected=true;superTimer=0;superFlash=30;
        for(let i=0;i<12;i++)swordParticles.push({x:g.x,y:GY-10,vx:(Math.random()-0.5)*5,vy:-Math.random()*4-1,life:28,maxLife:28,spark:true});
        floatNums.push({x:g.x,y:GY-24,val:0,life:70,maxLife:70,col:'#ffe840',crit:true});}}
    goldItems=goldItems.filter(g=>g.x>-20&&!g.collected);

    for(const ob of obstacles){
      ob.x-=eff;
      if(ob.type==='ghost')ob.bob+=0.12;
      if(ob.type==='skeleton'||ob.type==='zombie'||ob.type==='knight_mob')ob.bob+=0.14;
      if(ob.type==='mummy')ob.bob+=0.10;
      if(ob.type==='scorpion')ob.bob+=0.18;
      if(ob.type==='bandit')ob.bob+=0.13;
      if(ob.type==='goblin')ob.bob+=0.17;
      if(ob.type==='lizard')ob.bob+=0.12;
      if(ob.type==='rat_miner')ob.bob+=0.15;
      if(ghostTimer===0&&drinkAnim===0&&swordSlash===0&&hitTimer===0&&mountAnim===0){
        const obb:Rect={x:ob.x-ob.w/2+3,y:(ob.type==='ghost'?ob.y+Math.sin(ob.bob)*4:ob.y)-ob.h+2,w:ob.w-6,h:ob.h-4};
        if(overlap(hb,obb)){hp--;hitTimer=90;for(let i=0;i<8;i++)dust.push({x:hero.x,y:hero.y-10,vx:(Math.random()-0.5)*3,vy:-Math.random()*2.5,life:20,maxLife:20});if(hp<=0){killHero();return;}}
      }
      // перепрыгнуто — шанс 0.05% провалиться в бэкрумс
      if(!ob.passed&&ob.x+ob.w/2<hero.x-4){
        ob.passed=true;
        if(backrooms===0&&Math.random()<0.0075)backrooms=1;
      }
    }
    obstacles=obstacles.filter(o=>o.x>-30);

    crow.bob+=0.038;
    const targX=238+Math.sin(crow.bob*0.8)*36+Math.sin(crow.bob*1.7)*16;
    const targY=48+Math.sin(crow.bob*1.1)*20+Math.sin(crow.bob*2.3)*8;
    crow.x+=(targX-crow.x)*0.055;crow.y+=(targY-crow.y)*0.055;

    // обновление птиц на фоне
    for(const b of birds){
      b.x+=b.speed*b.dir;b.wing+=0.18+b.speed*0.1;
      b.y+=Math.sin(b.wing*0.3)*0.15;
      if(b.dir>0&&b.x>W+20){b.x=-20;b.y=18+Math.random()*55;}
      if(b.dir<0&&b.x<-20){b.x=W+20;b.y=18+Math.random()*55;}
    }

    for(const d of dust){d.x+=d.vx;d.y+=d.vy;d.vy+=0.06;d.life--;}
    dust=dust.filter(d=>d.life>0);
    for(const s of stars)s.p+=0.05;
    // таймеры выполненных квестов
    for(const q of activeQuests){
      if(q.done&&(q.doneTimer??0)>0){q.doneTimer=(q.doneTimer??1)-1;if(q.doneTimer===0)replaceQuest(q);}
    }
    // плавающие числа
    for(const fn of floatNums){fn.y-=0.9;fn.life--;}
    floatNums=floatNums.filter(fn=>fn.life>0);
  }

  // ============================================================
  // ---- Рисование ----
  // ============================================================

  function drawSun(sx:number,sy:number){
    const halo=ctx.createRadialGradient(sx,sy,4,sx,sy,28);
    halo.addColorStop(0,'rgba(255,240,100,0.5)');halo.addColorStop(1,'rgba(255,240,100,0)');
    ctx.fillStyle=halo;ctx.fillRect(sx-28,sy-28,56,56);
    const rays=[[0,-16],[0,16],[-16,0],[16,0],[-11,-11],[11,-11],[-11,11],[11,11]];
    for(const[rx,ry]of rays)px(sx+rx-1,sy+ry-1,2,2,'#ffe840');
    const r=9;
    for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++)
      if(xx*xx+yy*yy<=r*r){const d=-(xx+yy);px(sx+xx,sy+yy,1,1,d<-5?'#ffffc0':d>5?'#f0c030':'#ffee60');}
  }
  function drawMoon(mx:number,my:number){
    const halo=ctx.createRadialGradient(mx+11,my+11,4,mx+11,my+11,30);
    halo.addColorStop(0,'rgba(120,100,150,0.35)');halo.addColorStop(1,'rgba(120,100,150,0)');
    ctx.fillStyle=halo;ctx.fillRect(mx-19,my-19,60,60);
    const r=11,cx=mx+11,cy=my+11;
    for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++)
      if(xx*xx+yy*yy<=r*r){const d=xx+yy;px(cx+xx,cy+yy,1,1,d<-7?C.moonLt:d>6?C.moonSh:C.moon);}
    px(cx+3,cy-2,3,3,C.moonSh);px(cx-4,cy+3,2,2,C.moonSh);
    px(cx+1,cy+5,2,2,C.moonSh);px(cx-5,cy-4,2,2,C.moonSh);
  }
  function drawHills(off:number,col:string,baseY:number,amp:number,lit:boolean){
    off=off%200;
    for(let bx=-off-200;bx<W+200;bx+=200)
      for(let x=0;x<200;x++){
        const y=(baseY-Math.sin((x/200)*Math.PI)*amp-Math.sin((x/50)+bx)*2)|0;
        ctx.fillStyle=col;ctx.fillRect(bx+x,y,1,GY-y);
        if(lit){ctx.fillStyle=C.skyGlow;ctx.fillRect(bx+x,y,1,1);}
      }
  }
  function drawTrees(off:number,sp:number,gy:number,col:string,hgt:number){
    for(const base of[40,150,250,330]){
      let x=base-(off%sp);while(x<-40)x+=sp;if(x>W+40)continue;
      for(let i=0;i<hgt;i++){const sx2=x+Math.round(Math.sin(i*0.25)*1.5);px(sx2,gy-i,2,1,col);}
      const ty=gy-hgt;
      px(x-7,ty+4,7,1,col);px(x-9,ty+2,3,1,col);px(x+2,ty+1,8,1,col);px(x+9,ty-2,3,1,col);
      px(x-5,ty+9,5,1,col);px(x+2,ty+11,6,1,col);px(x-1,ty-3,1,4,col);
    }
  }
  function drawFarTombs(off:number){
    for(const base of[70,180,290,360]){
      let x=base-(off%380);while(x<-20)x+=380;if(x>W+20)continue;
      const c='#1e1838';px(x,GY-8,6,8,c);px(x+1,GY-10,4,2,c);px(x+9,GY-5,3,5,c);px(x+8,GY-7,5,2,c);
    }
  }
  // средневековый город — секции стен, башни, шпили
  // каждая секция: тип ('wall'|'tower'|'keep'), ширина, высота
  interface CitySection { kind:string; w:number; h:number }
  const CITY_PLAN:CitySection[]=[
    {kind:'wall', w:30,h:28},{kind:'tower',w:16,h:58},{kind:'wall',w:20,h:24},
    {kind:'keep', w:28,h:72},{kind:'wall', w:18,h:26},{kind:'tower',w:14,h:50},
    {kind:'wall', w:24,h:22},{kind:'tower',w:18,h:64},{kind:'wall',w:16,h:20},
    {kind:'keep', w:32,h:80},{kind:'wall', w:22,h:28},{kind:'tower',w:12,h:46},
  ];
  const CITY_W=CITY_PLAN.reduce((s,b)=>s+b.w+1,0);

  function drawMedievalTower(bx:number,by:number,w:number,h:number,isKeep:boolean){
    const stone='#2a2238', stoneHi='#342a42', stoneDk='#18102a';
    const win='#f0c84a', winDk='#c8a020';
    // тело башни
    px(bx,by,w,h,stone);px(bx,by,2,h,stoneHi);px(bx+w-2,by,2,h,stoneDk);
    // горизонтальные швы кладки
    for(let y=by+h-6;y>by;y-=8)px(bx,y,w,1,stoneDk);
    // вертикальные швы (шахматный паттерн)
    for(let y=by+h-6;y>by;y-=8)for(let x=0;x<w;x+=6)px(bx+x,y-4,1,4,stoneDk);
    for(let y=by+h-10;y>by;y-=8)for(let x=3;x<w;x+=6)px(bx+x,y-4,1,4,stoneDk);
    // зубцы (мерлоны)
    const mw=isKeep?5:4, mg=isKeep?3:2, mh=isKeep?7:5;
    for(let mx=bx;mx<bx+w-mw;mx+=mw+mg){
      px(mx,by-mh,mw,mh,stone);px(mx,by-mh,2,mh,stoneHi);px(mx+mw-1,by-mh,1,mh,stoneDk);
    }
    // окна-бойницы
    const winRows=Math.max(1,Math.floor(h/22));
    const winCols=Math.max(1,Math.floor((w-6)/12));
    for(let r=0;r<winRows;r++)for(let c=0;c<winCols;c++){
      const wx=bx+4+c*12,wy=by+8+r*22;
      if(wy+8<by+h){
        px(wx,wy,4,6,stoneDk);px(wx+1,wy-1,2,8,win);px(wx+1,wy-1,2,1,winDk);
      }
    }
    // шпиль у башни (конический)
    if(!isKeep){
      const tw=w;const th=12;
      for(let i=0;i<th;i++){const sw2=Math.max(1,(tw-i*tw/th/1.2)|0);px((bx+w/2-sw2/2)|0,by-mh-th+i,sw2,1,'#1a0c30');}
      px((bx+w/2-1)|0,by-mh-th-2,2,2,'#c8a020');
    }else{
      // замок — несколько башенок на крыше
      for(let i=0;i<3;i++){
        const tx=bx+4+i*(w-8)/2;
        for(let j=0;j<8;j++){const sw2=Math.max(1,(5-j*5/8)|0);px((tx+2-sw2/2)|0,by-mh-8+j,sw2,1,'#1a0c30');}
        px(tx+1,by-mh-10,2,2,'#c8a020');
      }
    }
  }
  function drawMedievalWall(bx:number,by:number,w:number,h:number){
    const stone='#221830', stoneHi='#2c2040', stoneDk='#160e24';
    px(bx,by,w,h,stone);px(bx,by,1,h,stoneHi);px(bx+w-1,by,1,h,stoneDk);
    for(let y=by+h-4;y>by;y-=7)px(bx,y,w,1,stoneDk);
    for(let y=by+h-4;y>by;y-=7)for(let x=0;x<w;x+=5)px(bx+x,y-3,1,3,stoneDk);
    // зубцы маленькие
    for(let mx=bx;mx<bx+w-3;mx+=5){px(mx,by-3,3,3,stone);px(mx,by-3,1,3,stoneHi);}
    // арочные ворота если секция широкая
    if(w>=24){
      const ax=bx+w/2-5;
      px(ax,GY-14,10,14,stoneDk);px(ax+1,GY-16,8,3,stoneDk);px(ax+2,GY-17,6,2,stoneDk);
      px(ax+3,GY-18,4,2,stoneDk);
    }
  }
  function drawCity(off:number,alpha:number){
    if(alpha<=0)return;
    off=((off%CITY_W)+CITY_W)%CITY_W;
    for(let tile=-1;tile<=2;tile++){
      let bx=tile*CITY_W-off;
      for(const b of CITY_PLAN){
        const by=GY-b.h;
        ctx.globalAlpha=alpha*(b.kind==='keep'?0.92:0.78);
        if(b.kind==='wall')drawMedievalWall(bx,by,b.w,b.h);
        else drawMedievalTower(bx,by,b.w,b.h,b.kind==='keep');
        bx+=b.w+1;
      }
    }
    ctx.globalAlpha=1;
  }

  function drawBirds(alpha:number){
    if(alpha<=0)return;
    ctx.globalAlpha=alpha;
    for(const b of birds){
      const wing=Math.sin(b.wing);
      const col=b.dir>0?'#1a1530':'#1a1530';
      const wx=(b.x)|0,wy=(b.y)|0;
      // тело
      px(wx,wy,2,1,col);
      // крылья: верх/низ в зависимости от фазы
      const wy2=wing>0?wy-1:wy+1;
      if(b.dir>0){px(wx-3,wy2,3,1,col);px(wx+2,wy2,3,1,col);}
      else{px(wx-3,wy2,3,1,col);px(wx+2,wy2,3,1,col);}
    }
    ctx.globalAlpha=1;
  }

  function drawPyramids(off:number){
    for(const base of[40,150,260]){
      let x=base-(off%320);while(x<-60)x+=320;if(x>W+60)continue;
      const h=36,w=52;
      for(let i=0;i<h;i++){
        const row=h-i,ww=(row/h)*w;
        const col=i<4?C.pyramidHi:i>h-8?C.pyramidDk:C.pyramid;
        px((x-ww/2)|0,(GY-i)|0,ww|0,1,col);
        if(i===0)px((x-ww/2)|0,(GY-i)|0,3,1,C.pyramidMid);
      }
      px((x-2)|0,(GY-h)|0,4,3,C.pyramidHi);
    }
  }
  function drawDesertDunes(off:number,col:string,baseY:number,amp:number){
    off=off%280;
    for(let bx=-off-280;bx<W+280;bx+=280)
      for(let x=0;x<280;x++){
        const y=(baseY-Math.sin((x/280)*Math.PI)*amp)|0;
        ctx.fillStyle=col;ctx.fillRect(bx+x,y,1,GY-y);
      }
  }
  function drawCyberCity(off:number){
    // Низкие здания (1-2 этажа, h=18..36)
    const Hs=[28,20,36,24,18,32,22,30,26,20,34,24];
    const Ws=[38,30,44,28,50,36,42,32,48,26,40,34];
    const NS=['#00e8ff','#ff0090','#7000ff','#00ff78','#00e8ff','#ff0090','#7000ff','#00e8ff','#ff0090','#00ff78','#7000ff','#00e8ff'];
    const period=440;
    for(let rep=-1;rep<2;rep++){
      for(let j=0;j<Hs.length;j++){
        const bx=(j*36+rep*period-((off*0.45)%period))|0;
        const h=Hs[j],w=Ws[j],nc=NS[j];
        if(bx>W+60||bx+w<-10)continue;
        const by=GY-h;
        // корпус
        px(bx,by,w,h,C.cyberBldDk);
        px(bx,by,w,2,C.cyberBldMid);
        px(bx,by,2,h,C.cyberBldMid);
        px(bx+w-2,by,2,h,'#020408');
        // окна в один ряд
        for(let wx=bx+5;wx<bx+w-5;wx+=10){
          const lit=(wx+j)%7<4;
          if(lit){ctx.globalAlpha=0.7;px(wx,by+6,6,8,nc);ctx.globalAlpha=0.15;px(wx-1,by+5,8,10,nc);ctx.globalAlpha=1;}
          else px(wx,by+6,6,8,'#05090f');
        }
        // неоновая полоска на крыше (статичная)
        ctx.globalAlpha=0.7;
        px(bx+2,by-1,w-4,2,nc);
        ctx.globalAlpha=0.12;
        px(bx,by-3,w,6,nc);
        ctx.globalAlpha=1;
        // вентиляционные трубы на крыше
        if(j%4===0){px(bx+w-8,by-5,4,5,C.cyberBldMid);px(bx+w-7,by-7,2,3,C.cyberBldHi);}
        if(j%3===0){px(bx+4,by-4,3,4,C.cyberBldMid);}
      }
    }
    // Наземные вывески — крупные, прямо на земле / стенах
    const SIGNS=[
      {rx:30,  ry:GY-22,txt:'NOODLES',col:'#ff0090',bg:'#1a0010'},
      {rx:110, ry:GY-18,txt:'HACK',   col:'#00e8ff',bg:'#001020'},
      {rx:185, ry:GY-24,txt:'CYBER',  col:'#7000ff',bg:'#0a0018'},
      {rx:255, ry:GY-20,txt:'DATA',   col:'#00ff78',bg:'#001408'},
      {rx:330, ry:GY-22,txt:'SHOP',   col:'#ff0090',bg:'#1a0010'},
      {rx:395, ry:GY-18,txt:'NET',    col:'#00e8ff',bg:'#001020'},
    ];
    for(const s of SIGNS){
      const sx=((s.rx-((off*0.8)%450)+450)%450)|0;
      if(sx<-40||sx>W+40)continue;
      const sw=s.txt.length*5+10;
      ctx.globalAlpha=0.9;
      px(sx,s.ry,sw,13,s.bg);
      px(sx,s.ry,sw,1,s.col);px(sx,s.ry+12,sw,1,s.col);
      px(sx,s.ry,1,13,s.col);px(sx+sw-1,s.ry,1,13,s.col);
      txt(s.txt,(sx+sw/2)|0,s.ry+10,s.col,5,'center',s.bg);
      ctx.globalAlpha=0.18;
      px(sx-1,s.ry-1,sw+2,15,s.col);
      ctx.globalAlpha=1;
    }
    // Неоновые огни вдоль тротуара
    for(let i=0;i<12;i++){
      const lx=((i*38-((off*1.0)%456)+456)%456)|0;
      if(lx<0||lx>W)continue;
      const nc=NS[i%NS.length];
      ctx.globalAlpha=0.85;
      px(lx,GY-4,3,4,nc);
      ctx.globalAlpha=0.18;
      px(lx-2,GY-6,7,8,nc);
      ctx.globalAlpha=1;
    }
  }
  function drawCyberRain(off:number,alpha:number){
    ctx.globalAlpha=alpha*0.45;
    for(let i=0;i<55;i++){
      const rx=((i*127+off*3)%W)|0;
      const ry=((i*83+off*2.1)%GY)|0;
      px(rx,ry,1,6,'#003a5a');
    }
    ctx.globalAlpha=1;
  }
  function drawCatWorld(off:number){
    // Гигантские лежачие коты на заднем плане (2 штуки, скроллятся медленно)
    const CATS=[
      {rx:60, col:C.catFurO,  hi:C.catFurOHi, dk:C.catFurODk, stripe:true},
      {rx:220,col:C.catFurG,  hi:C.catFurGHi, dk:C.catFurGDk, stripe:false},
    ];
    for(const cat of CATS){
      const cx=((cat.rx-((off*0.15)%W+W))%W)|0;
      for(let dx=-1;dx<=1;dx++){
        const bx=cx+dx*W;
        if(bx>W+120||bx+120<-120)continue;
        // тело — огромный кот лежит (ширина ~120px, высота ~40px)
        const by=GY-42;
        // туловище (овал из прямоугольников)
        px(bx+10,by+8,100,28,cat.col);
        px(bx+5,by+14,110,18,cat.col);
        px(bx+18,by+4,84,10,cat.col);
        // светлые бока
        px(bx+12,by+10,96,6,cat.hi);
        // тёмное брюхо
        px(bx+30,by+22,60,12,cat.dk);
        // голова
        px(bx+88,by,32,26,cat.col);
        px(bx+86,by+4,36,18,cat.col);
        px(bx+90,by+2,28,10,cat.hi);
        // уши
        px(bx+90,by-8,8,9,cat.col);px(bx+91,by-6,6,7,cat.hi);
        px(bx+110,by-6,7,8,cat.col);px(bx+111,by-4,5,6,cat.hi);
        // глаза (закрытые — спит)
        px(bx+95,by+8,8,2,cat.dk);px(bx+107,by+8,7,2,cat.dk);
        // нос
        px(bx+100,by+13,5,3,C.catNose);
        // усы
        px(bx+84,by+14,14,1,cat.hi);px(bx+106,by+14,14,1,cat.hi);
        px(bx+84,by+16,12,1,cat.hi);px(bx+106,by+16,12,1,cat.hi);
        // хвост
        px(bx-10,by+20,22,8,cat.col);px(bx-14,by+12,10,14,cat.col);px(bx-16,by+8,12,8,cat.col);
        px(bx-18,by+6,14,5,cat.hi);
        // полоски (только у рыжего)
        if(cat.stripe){
          for(let s=0;s<4;s++){px(bx+25+s*22,by+6,6,16,cat.dk);}
        }
        // лапы торчат
        px(bx+20,by+30,18,10,cat.col);px(bx+22,by+34,14,8,cat.hi);
        px(bx+50,by+30,18,10,cat.col);px(bx+52,by+34,14,8,cat.hi);
      }
    }
    // Клубки ниток (препятствия-декор на фоне)
    for(let i=0;i<3;i++){
      const yx=((i*130+20-((off*0.4)%(W+60))+W+60)%(W+60))|0;
      const col=i%2===0?C.neonM:'#ffd040';
      px(yx,GY-16,14,14,col);
      px(yx+2,GY-18,10,4,col);px(yx+3,GY-14,8,10,col);
      px(yx+1,GY-16,12,3,'rgba(255,255,255,0.25)');
    }
    // Следы лап на земле
    for(let i=0;i<8;i++){
      const px2=((i*48+off*0.6)%W)|0;
      ctx.globalAlpha=0.25;
      ctx.fillStyle='#c090c8';
      ctx.fillRect(px2,GY-2,4,3);ctx.fillRect(px2+6,GY-2,4,3);
      ctx.fillRect(px2+2,GY-5,5,4);ctx.fillRect(px2-1,GY-6,3,3);ctx.fillRect(px2+7,GY-6,3,3);
      ctx.globalAlpha=1;
    }
  }
  function drawBG(){
    const dt=dayTransition, dst=desertTransition, hnt=hauntedTransition, cyt=cyberTransition, cat=catTransition;
    // Ночная палитра: Деревня (hnt=0) → Призрачные поля (hnt=1)
    const nTop=lerpColor(C.skyTop,C.hntSkyTop,hnt);
    const nMid=lerpColor(C.skyMid,C.hntSkyMid,hnt);
    const nBot=lerpColor(C.skyBot,C.hntSkyBot,hnt);
    const nGlow=lerpColor(C.skyGlow,C.hntSkyGlow,hnt);
    // смешиваем небо: ночь→день→пустыня
    let sTop=lerpColor(nTop,C.dSkyTop,dt);
    let sMid=lerpColor(nMid,C.dSkyMid,dt);
    let sBot=lerpColor(nBot,C.dSkyBot,dt);
    let sGlow=lerpColor(nGlow,C.dSkyGlow,dt);
    if(dst>0){sTop=lerpColor(sTop,C.desertSkyTop,dst);sMid=lerpColor(sMid,C.desertSkyMid,dst);sBot=lerpColor(sBot,C.desertSkyBot,dst);sGlow=lerpColor(sGlow,C.desertSkyGlow,dst);}
    if(cyt>0){sTop=lerpColor(sTop,C.cyberSkyTop,cyt);sMid=lerpColor(sMid,C.cyberSkyMid,cyt);sBot=lerpColor(sBot,C.cyberSkyBot,cyt);sGlow=lerpColor(sGlow,C.cyberSkyGlow,cyt);}
    if(cat>0){sTop=lerpColor(sTop,C.catSkyTop,cat);sMid=lerpColor(sMid,C.catSkyMid,cat);sBot=lerpColor(sBot,C.catSkyBot,cat);sGlow=lerpColor(sGlow,C.catSkyGlow,cat);}
    const g=ctx.createLinearGradient(0,0,0,GY);
    g.addColorStop(0,sTop);g.addColorStop(0.45,sMid);g.addColorStop(0.82,sBot);g.addColorStop(1,sGlow);
    ctx.fillStyle=g;ctx.fillRect(0,0,W,GY);
    // Туманности в ночном небе
    const nA=(1-dt)*(1-dst)*0.42;
    if(nA>0.01){
      ctx.globalAlpha=nA;
      const n1=ctx.createRadialGradient(72,30,0,72,30,36);n1.addColorStop(0,'rgba(130,70,200,0.6)');n1.addColorStop(1,'rgba(130,70,200,0)');ctx.fillStyle=n1;ctx.fillRect(36,0,72,66);
      const n2=ctx.createRadialGradient(205,18,0,205,18,28);n2.addColorStop(0,'rgba(50,110,200,0.5)');n2.addColorStop(1,'rgba(50,110,200,0)');ctx.fillStyle=n2;ctx.fillRect(177,0,56,46);
      const n3=ctx.createRadialGradient(148,40,0,148,40,20);n3.addColorStop(0,'rgba(200,90,150,0.4)');n3.addColorStop(1,'rgba(200,90,150,0)');ctx.fillStyle=n3;ctx.fillRect(128,20,40,40);
      ctx.globalAlpha=1;
    }
    // звёзды (исчезают в пустыне-день)
    ctx.globalAlpha=(1-dt)*(1-dst);
    for(const s of stars){const tw=(Math.sin(s.p)+1)*0.5;if(tw>0.25){if(s.big&&tw>0.6){px(s.x,s.y-1,1,3,'#fff');px(s.x-1,s.y,3,1,'#fff');}else px(s.x,s.y,1,1,tw>0.7?'#fff':'#b8a8e0');}}
    ctx.globalAlpha=1;
    if(dt<0.5&&dst<0.5){ctx.globalAlpha=(1-dt*2)*(1-dst*2);drawMoon(248,14);ctx.globalAlpha=1;}
    // Красная луна в Призрачных полях
    if(dt<0.5&&dst<0.5&&hnt>0){const moonA=(1-dt*2)*(1-dst*2)*hnt*0.55;ctx.globalAlpha=moonA;ctx.fillStyle='#c01818';ctx.beginPath();ctx.arc(248,14,9,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
    // солнце — в день и в пустыне яркое
    const sunA=dt>0.5?(dt-0.5)*2:0, desertSun=dst*0.8;
    if(sunA>0||desertSun>0){ctx.globalAlpha=Math.min(1,sunA+desertSun);drawSun(260,22);ctx.globalAlpha=1;}
    if(dst<1){
      // обычный фон (город, холмы, деревья)
      ctx.globalAlpha=1-dst;
      drawCity(camX*0.08,(1-dst)*(dt<0.5?0.72:0.55));
      drawBirds((1-dst)*0.9);
      const fogNight=lerpColor('#4a3568',C.hntFog,hnt);
      const fogCol=lerpColor(fogNight,C.dFog,dt);
      px(0,GY-34,W,34,`rgba(74,53,104,${dt<0.5?0.18:0.10})`);
      drawHills(camX*0.15,lerpColor(lerpColor(C.hillFar,C.hntHillFar,hnt),C.dHillFar,dt),GY-22,30,false);
      drawHills(camX*0.32,lerpColor(lerpColor(C.hillMid,C.hntHillMid,hnt),C.dHillMid,dt),GY-12,22,false);
      drawHills(camX*0.5,lerpColor(lerpColor(C.hillNear,C.hntHillNear,hnt),C.dHillNear,dt),GY-4,16,true);
      const tN=lerpColor(lerpColor('#150c20','#1e0c0c',hnt),'#304060',dt);
      const tF=lerpColor(lerpColor('#0f0818','#160808',hnt),'#202a40',dt);
      drawTrees(camX*0.5,360,GY,tN,30);drawTrees(camX*0.72,260,GY,tF,22);
      drawFarTombs(camX*0.6);
      const fogA=dt>0.5?0.06:0.12;ctx.globalAlpha=(1-dst)*fogA;
      for(let i=-1;i<W/60+2;i++){const x=i*60-((camX*0.3)%60);const y=GY-6+Math.sin(i*1.7+camX*0.01)*2;px(x,y,50,5,fogCol);px(x+10,y-2,30,3,fogCol);}
      ctx.globalAlpha=1;
    }
    if(cyt>0){
      // киберпанк-фон: небоскрёбы, вывески, дождь
      ctx.globalAlpha=cyt;
      drawCyberCity(camX*0.55);
      ctx.globalAlpha=1;
      drawCyberRain(camX,cyt);
      // неоновое свечение горизонта
      ctx.globalAlpha=cyt*0.35;
      const cyh=ctx.createLinearGradient(0,GY-30,0,GY);
      cyh.addColorStop(0,'rgba(0,50,120,0)');cyh.addColorStop(1,'rgba(0,200,255,0.3)');
      ctx.fillStyle=cyh;ctx.fillRect(0,GY-30,W,30);
      ctx.globalAlpha=1;
    }
    if(cat>0){
      ctx.globalAlpha=cat;
      drawCatWorld(camX*0.4);
      ctx.globalAlpha=1;
    }
    if(dst>0){
      // пустынный фон (дюны, пирамиды)
      ctx.globalAlpha=dst;
      px(0,GY-6,W,8,'rgba(240,190,100,0.12)');
      drawDesertDunes(camX*0.12,C.desertDuneF,GY-16,20);
      drawDesertDunes(camX*0.28,C.desertDuneM,GY-8,14);
      drawDesertDunes(camX*0.48,C.desertDuneN,GY-2,8);
      drawPyramids(camX*0.18);
      ctx.globalAlpha=1;
    }
    // земля — смешиваем трава→призрачные→день→песок
    const grTip=lerpColor(lerpColor(lerpColor(C.grassTip,C.hntGrassTip,hnt),C.dGrassTip,dt),C.desertDuneN,dst);
    const gr=lerpColor(lerpColor(lerpColor(C.grass,C.hntGrass,hnt),C.dGrass,dt),C.desertDuneF,dst);
    const grMid=lerpColor(lerpColor(lerpColor(C.grassMid,C.hntGrassM,hnt),C.dGrassM,dt),C.desertDuneM,dst);
    const grDk=lerpColor(lerpColor(lerpColor(C.grassDk,C.hntGrassDk,hnt),C.dGrassDk,dt),C.desertGround,dst);
    const grnd=lerpColor(lerpColor(lerpColor(C.ground,C.hntGround,hnt),C.dGround,dt),C.desertGround,dst);
    const grndM=lerpColor(lerpColor(lerpColor(C.groundMid,C.hntGroundM,hnt),C.dGroundM,dt),C.desertGroundM,dst);
    const grndDk=lerpColor(lerpColor(lerpColor(C.groundDk,C.hntGroundDk,hnt),'#3a2810',dt),C.desertGroundDk,dst);
    px(0,GY,W,3,grTip);px(0,GY+1,W,1,gr);px(0,GY+3,W,3,grMid);px(0,GY+6,W,4,grDk);
    px(0,GY+10,W,4,grnd);px(0,GY+14,W,H-GY-14,grndM);
    for(let i=-1;i<W/14+1;i++){const x=i*14-(camX%14);px(x,GY+16,5,2,grndDk);px(x+8,GY+22,3,2,grndDk);}
    if(dst<0.8){for(let i=-1;i<W/7+1;i++){const x=i*7-(camX%7);const h=2+((i*37)%3);px(x,GY-h,1,h,grMid);px(x+1,GY-h+1,1,h-1,gr);px(x+2,GY-h,1,h,grDk);px(x+1,GY-h,1,1,grTip);}}
    if(dst>0.2){
      // песчаные рябины
      ctx.globalAlpha=(dst-0.2)/0.8;
      for(let i=-1;i<W/18+1;i++){const x=i*18-(camX%18)*0.5;px(x,GY+2,10,1,C.desertDuneN);px(x+6,GY+5,8,1,C.desertDuneF);}
      ctx.globalAlpha=1;
    }
    if(cyt>0){
      // неоновая сетка на земле
      ctx.globalAlpha=cyt*0.5;
      for(let i=-1;i<W/22+1;i++){const gx=(i*22-(camX%22))|0;px(gx,GY,1,H-GY,'#001840');}
      for(let gy=GY+10;gy<H;gy+=12)px(0,gy,W,1,'#001840');
      ctx.globalAlpha=cyt*0.3;px(0,GY,W,2,C.neonC);
      ctx.globalAlpha=1;
      // тёмный асфальт поверх травы
      ctx.globalAlpha=cyt*0.75;
      px(0,GY,W,H-GY,C.cyberGround);
      ctx.globalAlpha=cyt*0.5;
      for(let i=-1;i<W/22+1;i++){const gx=(i*22-(camX%22))|0;px(gx,GY,1,H-GY,'#001840');}
      for(let gy=GY+10;gy<H;gy+=12)px(0,gy,W,1,'#001840');
      ctx.globalAlpha=cyt*0.25;px(0,GY,W,2,C.neonC);
      ctx.globalAlpha=1;
    }
    // Бурская война — выжженная саванна
    if(boerTransition>0){
      ctx.globalAlpha=boerTransition;
      // небо — жёлто-коричневое
      const bg=ctx.createLinearGradient(0,0,0,GY);
      bg.addColorStop(0,C.boerSkyTop);bg.addColorStop(0.5,C.boerSkyMid);bg.addColorStop(1,C.boerSkyBot);
      ctx.fillStyle=bg;ctx.fillRect(0,0,W,GY);
      // далёкие копье (kopje — скалистые холмы ЮА)
      for(const bx of[40,140,240,310]){
        let rx=bx-((camX*0.1)%320);if(rx<-30)rx+=320;
        px(rx-14,GY-28,28,28,C.britKhakiDk);px(rx-10,GY-34,20,8,C.britKhakiDk);px(rx-6,GY-38,12,5,C.britKhakiDk);
        px(rx-14,GY-28,2,28,C.britKhaki); // подсветка
      }
      // трава саванны — сухая жёлтая
      for(let i=-1;i<W/9+1;i++){const sx=(i*9-((camX*0.7)%9))|0;const sh=3+((i*17)%4);px(sx,GY-sh,1,sh,C.boerGrassHi);px(sx+1,GY-sh+1,1,sh-1,C.boerGrass);}
      // земля
      px(0,GY,W,3,C.boerGrass);px(0,GY+3,W,3,C.boerGrassHi);px(0,GY+6,W,5,C.boerGround);
      px(0,GY+11,W,H-GY-11,C.boerGroundM);
      // пыль на горизонте
      ctx.globalAlpha=boerTransition*0.25;px(0,GY-18,W,18,C.boerFog);ctx.globalAlpha=boerTransition;
      ctx.globalAlpha=1;
    }
    // Бэкрумс — лиминальный офис
    if(backrooms>=61){
      const aRaw=backrooms<=120?(backrooms-61)/59:backrooms>=361?1-(backrooms-361)/59:1;
      const a=Math.max(0,Math.min(1,aRaw));
      const dropPresent=dropActive&&!dropKill;
      // когда капля активна — более насыщенный жёлтый
      const wallCol=dropPresent?'#e0d050':C.bkrWall;
      const floorCol=dropPresent?'#c8b820':C.bkrFloor;
      const wallDkCol=dropPresent?'#b0a020':C.bkrWallDk;
      ctx.globalAlpha=a;
      // стены и потолок
      px(0,0,W,GY,wallCol);
      // решётка потолочных плиток
      for(let i=-1;i<W/22+1;i++){const gx=(i*22-(camX%22))|0;px(gx,0,1,GY,wallDkCol);}
      for(let gy=0;gy<GY;gy+=14)px(0,gy,W,1,wallDkCol);
      // флуоресцентные лампы
      const flick=(Math.sin(ct*0.23+1)*0.5+0.5);
      const lampCount=dropPresent?6:4;
      const lampSpacing=dropPresent?54:80;
      for(let i=0;i<lampCount;i++){const lx=(i*lampSpacing-(camX%(lampSpacing))|0);
        ctx.globalAlpha=a*(0.8+flick*0.2);px(lx,1,lampSpacing-4,5,C.bkrLight);
        ctx.globalAlpha=a*(0.25+flick*0.25);px(lx-3,0,lampSpacing+2,22,C.bkrLight);ctx.globalAlpha=a;}
      // пол — потёртый ковёр
      px(0,GY,W,H-GY,floorCol);
      for(let i=-1;i<W/16+1;i++){const gx=(i*16-(camX%16))|0;px(gx,GY,1,H-GY,wallDkCol);}
      for(let gy=GY+8;gy<H;gy+=8)px(0,gy,W,1,wallDkCol);
      // фоновая мебель (параллакс)
      for(const f of bkrFurniture){
        const fx=(f.x-camX*0.35)|0;
        if(fx<-40||fx>W+40)continue;
        ctx.globalAlpha=a*0.55;
        if(f.type==='table'){
          px(fx-14,GY-18,28,10,wallDkCol);px(fx-12,GY-8,4,8,wallDkCol);px(fx+8,GY-8,4,8,wallDkCol);
        }else if(f.type==='chair'){
          px(fx-8,GY-14,16,8,wallDkCol);px(fx-7,GY-6,3,6,wallDkCol);px(fx+4,GY-6,3,6,wallDkCol);
          px(fx-8,GY-22,3,9,wallDkCol);px(fx-8,GY-22,14,3,wallDkCol);
        }else if(f.type==='cabinet'){
          px(fx-10,GY-36,20,36,wallDkCol);px(fx-9,GY-20,18,1,'#907830');px(fx-9,GY-35,18,1,C.bkrWall);
          px(fx-4,GY-28,3,3,'#706020');px(fx+2,GY-28,3,3,'#706020');
        }else if(f.type==='lamp'){
          px(fx-1,GY-48,3,48,wallDkCol);px(fx-8,GY-50,16,10,wallDkCol);
          ctx.globalAlpha=a*(0.3+flick*0.2);px(fx-10,GY-54,20,16,C.bkrLight);ctx.globalAlpha=a*0.55;
        }
        ctx.globalAlpha=a;
      }
      // пятна и следы на полу
      for(const bxf of[30,90,160,230,280]){const rx=(bxf-((camX*0.9)%320))|0;ctx.globalAlpha=a*0.22;px(rx,GY+3,12,5,wallDkCol);ctx.globalAlpha=a;}

      // ---- Рисунки чёрного света (UV-арт на стенах) ----
      const UV=['#d020ff','#00ffee','#40ff30','#ff2090','#ff8800'];
      // 8 рисунков по миру, тайлятся каждые 560 единиц
      const uvDefs:[number,number,string][]=[
        [40, 60,'eye'],[140,40,'figure'],[230,72,'spiral'],
        [310,50,'face'],[400,62,'eye'],[470,44,'figure'],
        [530,55,'spiral'],[610,42,'face'],
      ];
      const uvTile=560;
      for(const[wx,wy,ut] of uvDefs){
        const raw=wx-(camX*0.18);
        const sx=(((raw%uvTile)+uvTile)%uvTile)|0;
        if(sx<-40||sx>W+40)continue;
        const col=UV[Math.floor(wx/80)%UV.length];
        const pulse=(Math.sin(ct*0.04+wx*0.07)*0.5+0.5);
        // свечение
        ctx.globalAlpha=a*(0.08+pulse*0.10);
        px(sx-18,wy-18,36,36,col);
        ctx.globalAlpha=a*(0.7+pulse*0.2);
        if(ut==='eye'){
          // Большой глаз — внешний контур
          px(sx-11,wy,22,2,col);px(sx-13,wy-2,26,2,col);
          px(sx-14,wy-4,4,2,col);px(sx+10,wy-4,4,2,col);
          px(sx-13,wy+2,26,2,col);px(sx-11,wy+4,22,2,col);
          // зрачок
          px(sx-4,wy-4,8,8,col);px(sx-2,wy-6,4,2,col);px(sx-2,wy+4,4,2,col);
          // блик
          ctx.globalAlpha=a*0.9;px(sx-2,wy-3,2,2,'#ffffff');
          // радужка
          ctx.globalAlpha=a*0.4;px(sx-6,wy-2,12,4,col);
        }else if(ut==='spiral'){
          // Концентрические прямоугольники
          for(let r=2;r<=12;r+=4){
            px(sx-r,wy-r,r*2,1,col);px(sx-r,wy+r-1,r*2,1,col);
            px(sx-r,wy-r,1,r*2,col);px(sx+r-1,wy-r,1,r*2,col);
          }
          // центр
          px(sx-2,wy-2,4,4,col);
        }else if(ut==='figure'){
          // Странная вытянутая фигура
          px(sx-4,wy-20,8,6,col);  // голова
          px(sx-2,wy-14,4,12,col); // шея+тело
          px(sx-10,wy-12,8,2,col);px(sx+2,wy-12,8,2,col); // руки
          px(sx-2,wy-10,1,2,col);px(sx+1,wy-10,1,2,col); // пальцы
          px(sx-3,wy-2,3,10,col);px(sx,wy-2,3,10,col); // ноги
          // лицо — косые глаза
          px(sx-3,wy-18,2,2,col);px(sx+1,wy-18,2,2,col);
          px(sx-2,wy-15,4,1,col);
        }else if(ut==='face'){
          // Жуткое лицо без нормальных черт
          // контур
          px(sx-8,wy-8,16,2,col);px(sx-10,wy-6,20,2,col);
          px(sx-10,wy+6,20,2,col);px(sx-8,wy+8,16,2,col);
          px(sx-10,wy-6,2,14,col);px(sx+8,wy-6,2,14,col);
          // X-глаза
          px(sx-6,wy-4,2,2,col);px(sx-4,wy-2,2,2,col);
          px(sx-4,wy-4,2,2,col);px(sx-6,wy-2,2,2,col);
          px(sx+2,wy-4,2,2,col);px(sx+4,wy-2,2,2,col);
          px(sx+4,wy-4,2,2,col);px(sx+2,wy-2,2,2,col);
          // рот-зигзаг
          for(let m=-5;m<=5;m++)px(sx+m,wy+3+(m%2===0?0:2),1,3,col);
        }
        ctx.globalAlpha=a;
      }
      ctx.globalAlpha=1;
    }
  }

  function drawPumpkinHead(x:number,y:number){
    x|=0;y|=0;
    // 5-tone pumpkin body with segments
    px(x-6,y+1,13,8,C.pumpkinMid);   // base shape
    px(x-5,y,11,10,C.pumpkin);        // main body
    px(x-4,y-1,9,11,C.pumpkin);       // center bulge
    // segment shading — 5 tones
    px(x-6,y+1,2,8,C.pumpkinDk);     // far left shadow
    px(x+4,y+1,2,8,C.pumpkinDk);     // far right shadow
    px(x-4,y,2,9,'#c85e0c');          // inner-left mid
    px(x+2,y,2,9,'#c85e0c');          // inner-right mid
    px(x-1,y-1,3,11,C.pumpkinHi);    // center highlight strip
    px(x-5,y,2,9,C.pumpkinMid);      // outer-left mid
    px(x+3,y,2,9,C.pumpkinMid);      // outer-right mid
    // stem with curl and leaf
    px(x,y-3,2,3,C.pumpkinStem);
    px(x+1,y-4,1,2,C.pumpkinStemHi);
    px(x-1,y-4,2,1,C.pumpkinStemHi); // curl left
    px(x+2,y-5,2,1,'#4a7028');        // leaf pixel
    // carved triangular eye holes with inner glow
    px(x-4,y+2,3,4,'#200a00');        // left eye dark
    px(x+1,y+2,3,4,'#200a00');        // right eye dark
    px(x-3,y+2,1,1,'#101000');        // left eye triangle tip
    px(x+2,y+2,1,1,'#101000');        // right eye triangle tip
    // inner orange eye glow
    ctx.globalAlpha=0.45;
    px(x-3,y+3,2,2,C.pumpkinGlow);
    px(x+2,y+3,2,2,C.pumpkinGlow);
    ctx.globalAlpha=1;
    // jagged carved mouth
    px(x-3,y+7,7,2,'#200a00');        // mouth base
    px(x-2,y+6,1,1,'#200a00');        // left tooth gap top
    px(x+1,y+6,1,1,'#200a00');        // middle tooth gap top
    // white teeth pixels
    px(x-3,y+7,1,1,'#f8f0d8');        // left tooth
    px(x-1,y+7,1,1,'#f8f0d8');        // mid-left tooth
    px(x+1,y+7,1,1,'#f8f0d8');        // mid-right tooth
    px(x+3,y+7,1,1,'#f8f0d8');        // right tooth
    // flickering inner fire
    const fireAmt=(Math.sin(crow.bob*3)+1)*0.5;
    ctx.globalAlpha=0.15+fireAmt*0.25;
    px(x-3,y+3,7,4,C.pumpkinGlow);
    ctx.globalAlpha=1;
  }
  function drawGhostPotion(x:number,y:number){
    x|=0;y|=0;
    const pulse=(Math.sin(crow.bob*2.5)+1)*0.5,ghostBob=(Math.sin(crow.bob*3)*2)|0;
    // outer glow
    ctx.globalAlpha=0.10+pulse*0.12;px(x-10,y-22,20,24,C.potGlow);ctx.globalAlpha=1;
    // hexagonal bottle illusion: darker corners
    px(x-4,y,8,1,C.potBg);px(x-5,y-1,10,1,C.potBg);
    px(x-5,y-11,10,10,C.potBg);
    // darker corner pixels for hex illusion
    px(x-5,y-11,1,1,C.potDk);px(x+4,y-11,1,1,C.potDk);
    px(x-5,y-1,1,1,C.potDk);px(x+4,y-1,1,1,C.potDk);
    px(x+3,y-11,2,10,C.potDk);px(x-5,y-10,1,8,C.potBottle);
    // tiny rune marks on bottle label area
    px(x-3,y-8,1,1,C.potDk);px(x-1,y-9,1,1,C.potDk);px(x+1,y-8,1,1,C.potDk);
    px(x-2,y-6,3,1,C.potDk);
    // neck
    px(x-4,y-13,8,2,C.potBg);px(x-2,y-18,4,5,C.potBg);
    // cork with texture
    px(x-3,y-21,6,4,C.potCork);px(x-3,y-21,6,1,'#d0a050');
    px(x-2,y-20,1,2,'#c89040');px(x,y-21,1,3,'#b07828');  // cork texture lines
    // ghost inside (3-tone body)
    const gy=(y-8+ghostBob)|0;
    ctx.globalAlpha=0.75+pulse*0.2;
    // 3-tone ghost body
    px(x-2,gy-4,4,5,C.ghost);       // main body
    px(x-1,gy-5,2,1,C.ghost);       // top dome
    px(x+1,gy-4,1,4,C.ghostMid);    // right shadow
    px(x-2,gy-4,1,3,'#e8faff');     // left highlight
    // wispy bottom with 3 tendrils
    px(x-2,gy+1,1,2,C.ghostMid);px(x,gy,1,2,C.ghostMid);px(x+2,gy+1,1,2,C.ghostMid);
    // better face
    px(x-1,gy-3,1,1,C.potFace);px(x+1,gy-3,1,1,C.potFace);  // eyes
    px(x-1,gy-1,3,1,C.potFace);                               // mouth
    px(x-1,gy-3,1,1,'#40ffff');px(x+1,gy-3,1,1,'#40ffff');   // cyan eye glow
    ctx.globalAlpha=1;
    // bottle liquid highlights
    px(x-2,y-7,5,4,'rgba(8,20,18,0.6)');px(x-1,y-6,1,1,C.potGlow);px(x+1,y-6,1,1,C.potGlow);
    px(x,y-5,1,1,C.potGlow);px(x-1,y-4,3,1,C.potGlow);
  }
  function drawGoldItem(x:number,y:number,bob:number){
    x|=0;y|=0;
    const pulse=(Math.sin(bob*2.2)+1)*0.5;
    // свечение
    ctx.globalAlpha=0.18+pulse*0.18;px(x-10,y-20,20,22,C.goldGlow);ctx.globalAlpha=1;
    // самородок золота — неправильная форма
    px(x-5,y-2,10,2,C.goldDk);
    px(x-6,y-10,12,9,C.goldCol);px(x-5,y-12,10,3,C.goldCol);px(x-4,y-13,8,1,C.goldCol);
    px(x-6,y-10,2,7,C.goldHi);px(x-4,y-12,2,3,C.goldHi);
    px(x+3,y-10,3,7,C.goldDk);
    // блики
    px(x-4,y-11,2,2,C.goldHi);px(x-2,y-9,1,1,C.goldHi);
    ctx.globalAlpha=0.35+pulse*0.3;px(x-3,y-12,2,2,'#ffffff');ctx.globalAlpha=1;
  }

  function drawDrop(dx:number){
    // Капля из бэкрумса — желтовато-зелёная слизь, пульсирует
    const bY=GY, x=dx|0;
    const pulse=(Math.sin(ct*0.18)*0.5+0.5);
    const drip=(Math.sin(ct*0.28)*4)|0;
    // светящийся ореол
    ctx.globalAlpha=0.18+pulse*0.14;
    const grd=ctx.createRadialGradient(x,bY-16,2,x,bY-16,28);
    grd.addColorStop(0,'rgba(200,200,30,0.7)');grd.addColorStop(1,'rgba(200,200,30,0)');
    ctx.fillStyle=grd;ctx.fillRect(x-28,bY-44,56,56);
    ctx.globalAlpha=1;
    // тело капли — неправильная форма
    px(x-8,bY-28+drip,17,20,'#c8b820');      // основа
    px(x-10,bY-22+drip,21,12,'#d4c828');     // широкая часть
    px(x-7,bY-32+drip,14,6,'#b8a818');       // верхушка
    px(x-4,bY-34+drip,9,3,'#a89010');        // самый верх
    // внутреннее свечение (ядро)
    ctx.globalAlpha=0.55+pulse*0.3;
    px(x-5,bY-26+drip,11,14,'#f0e030');
    ctx.globalAlpha=1;
    // жёлтые «глаза» — пустые дыры
    px(x-5,bY-26+drip,3,3,'#181408');px(x+2,bY-26+drip,3,3,'#181408');
    px(x-4,bY-26+drip,2,2,'#000');px(x+3,bY-26+drip,2,2,'#000');
    // нижние сопли (потёки)
    px(x-3,bY-8+drip,2,10,'#a89010');px(x+1,bY-6+drip,2,8,'#c8b020');px(x+4,bY-9+drip,2,6,'#b0a018');
    px(x-6,bY-5+drip,2,5,'#a89010');
    // зловещее свечение снизу
    ctx.globalAlpha=0.22+pulse*0.18;px(x-12,bY-4,26,6,'#d4c820');ctx.globalAlpha=1;
  }

  function drawEscapeHole(hx:number){
    // Дырка для побега — тёмный провал в полу с зелёным мерцанием
    const x=hx|0, bY=GY;
    const pulse=(Math.sin(ct*0.22)*0.5+0.5);
    // ямка в полу
    ctx.globalAlpha=0.6;px(x-14,bY,28,H-bY,'#000');ctx.globalAlpha=1;
    // контур дырки
    px(x-14,bY,28,3,C.bkrFloorDk);px(x-14,bY,3,H-bY,'#000');px(x+11,bY,3,H-bY,'#000');
    // зелёное свечение из глубины
    ctx.globalAlpha=0.25+pulse*0.25;
    const grd=ctx.createRadialGradient(x,bY+12,1,x,bY+12,22);
    grd.addColorStop(0,'rgba(60,220,60,0.8)');grd.addColorStop(1,'rgba(60,220,60,0)');
    ctx.fillStyle=grd;ctx.fillRect(x-22,bY,44,30);
    ctx.globalAlpha=1;
    // стрелка «вниз»
    ctx.globalAlpha=0.7+pulse*0.3;
    txt('↓',x+1,bY-4,'#40ff40',8,'center','#000');
    ctx.globalAlpha=1;
  }

  function drawSwordItem(x:number,y:number){
    x|=0;y|=0;
    const bob=(Math.sin(crow.bob*1.8+x)*2)|0;
    const pulse=(Math.sin(crow.bob*2.2)+1)*0.5;
    ctx.globalAlpha=0.12+pulse*0.14;px(x-12,y-24,24,26,'#c8e0ff');ctx.globalAlpha=1;
    // tapered blade: wider near crossguard, pointed tip
    px(x-1,y-24+bob,2,2,'#e0f0ff');   // pointed tip (narrow)
    px(x-1,y-22+bob,2,8,'#b0c4dc');   // upper blade
    px(x-2,y-14+bob,4,8,'#b0c4dc');   // lower blade (wider near guard)
    // blood groove down center
    px(x,y-22+bob,1,18,'#8098b0');     // blood groove
    // bright highlight stripe
    px(x-1,y-22+bob,1,18,'#d8ecff');
    // ornate crossguard with blue gem pixel (#4080ff)
    px(x-6,y-4+bob,12,2,'#c09820');   // crossguard body
    px(x-6,y-4+bob,12,1,'#e0b828');   // crossguard highlight
    px(x-7,y-5+bob,2,3,'#a07010');    // left quillon
    px(x+5,y-5+bob,2,3,'#a07010');    // right quillon
    px(x-1,y-5+bob,2,3,'#4080ff');    // blue gem in center
    // leather grip with alternating band colors
    px(x-1,y-2+bob,2,6,C.leather);
    px(x-1,y-2+bob,2,1,C.leatherHi);  // band 1 bright
    px(x-1,y+0+bob,2,1,C.leather);
    px(x-1,y+1+bob,2,1,'#3a2010');    // band 2 dark
    px(x-1,y+2+bob,2,1,C.leather);
    px(x-1,y+3+bob,2,1,C.leatherHi);  // band 3 bright
    // round pommel cap
    px(x-2,y+4+bob,5,3,'#c09820');
    px(x-1,y+4+bob,3,1,'#e0c040');    // pommel top highlight
    px(x-2,y+6+bob,5,1,'#806010');    // pommel bottom shadow
    ctx.globalAlpha=0.55+pulse*0.3;txt('МЕЧ',x,y-27,'#c8e0ff',6,'center','#0a1830');ctx.globalAlpha=1;
  }
  function drawSwordInHand(x:number,y:number,angle:number){
    ctx.save();ctx.translate(x|0,y|0);ctx.rotate(angle||0);
    ctx.globalAlpha=0.25;px(1,-15,2,18,'#000');ctx.globalAlpha=1;
    px(-1,-20,3,20,'#b8ccdc');px(-1,-22,3,3,'#e8f4ff');px(-1,-20,1,18,'#dceeff');px(1,-19,1,14,'#8098b0');
    px(-1,-14,1,2,'#c8a030');px(-1,-10,1,2,'#c8a030');
    px(-5,0,10,3,'#c09820');px(-5,0,10,1,'#e0c040');px(4,1,1,2,'#806010');
    px(-1,3,3,6,C.leather);px(-1,3,1,6,C.leatherHi);
    px(-2,9,5,3,'#c09820');px(-2,9,5,1,'#e0c040');
    ctx.restore();
  }
  function drawSwordSlashEffect(x:number,y:number){
    if(swordSlash<=0)return;
    const prog=1-swordSlash/SLASH_FRAMES,fadeOut=swordSlash<8?swordSlash/8:1;
    let angle:number,swinging=false;
    if(prog<0.25){angle=lerp(0.2,-2.2,ease(prog/0.25));}
    else if(prog<0.70){angle=lerp(-2.2,1.0,ease((prog-0.25)/0.45));swinging=true;}
    else{angle=lerp(1.0,0.6,ease((prog-0.70)/0.30));}
    if(swinging){
      const swingProg=(prog-0.25)/0.45;
      for(let i=0;i<14;i++){
        const t2=i/14,trailAng=angle-(0.2+t2*0.6),r2=26+i;
        ctx.globalAlpha=fadeOut*(1-t2)*0.85;
        const sz=Math.max(1,4-Math.floor(t2*3));
        px(x+Math.cos(trailAng)*r2,y+Math.sin(trailAng)*r2,sz,sz,i<4?'#ffffff':i<8?'#c0e4ff':'#6090c8');
      }
      ctx.globalAlpha=1;
      const flashPeak=1-Math.abs(swingProg-0.55)/0.25;
      if(flashPeak>0){
        ctx.globalAlpha=fadeOut*flashPeak*0.55;px(x-2,y-32,38,28,'#ffffff');
        ctx.globalAlpha=fadeOut*flashPeak*0.3;px(x-6,y-36,46,36,'#c0e0ff');ctx.globalAlpha=1;
      }
      if(swingProg>0.4&&swingProg<0.7&&Math.random()<0.6)
        swordParticles.push({x:x+28+Math.random()*8,y:y-16+Math.random()*8,vx:Math.random()*4+1,vy:(Math.random()-0.5)*3,life:8,maxLife:8,spark:true});
    }
    ctx.globalAlpha=fadeOut;drawSwordInHand(x,y,angle);ctx.globalAlpha=1;
  }

  function drawCrowFull(x:number,y:number){
    x|=0;y|=0;const flap=Math.sin(crow.bob*2.2)*3.5;
    drawPumpkinHead(x,y+11);
    px(x-2,y+8,1,3,C.beak);px(x+2,y+8,1,3,C.beak);
    px(x-4,y,9,6,C.crow);px(x-6,y+1,13,4,C.crow);px(x-5,y+1,11,1,C.crowMid);
    px(x+4,y-2,4,4,C.crow);px(x+8,y-1,3,2,C.beak);px(x+5,y-1,1,1,C.eye);
    px(x-9,y+1,4,3,C.crow);
    px(x-3,y-4-flap,7,3,C.crowWing);px(x-6,y-2-flap,5,2,C.crowMid);
    px(x-2,y-3-flap,5,1,C.crowHi);
    px(x-3,y+4+flap*0.5,7,3,C.crowWing);px(x-6,y+5+flap*0.5,4,2,C.crowMid);
  }
  function drawCrowEmpty(x:number,y:number){
    x|=0;y|=0;const flap=Math.sin(crow.bob*2.4)*4;
    px(x-4,y,9,5,C.crow);px(x-6,y+1,13,3,C.crow);px(x+4,y-2,4,4,C.crow);
    px(x+8,y-1,3,2,C.beak);px(x+5,y-1,1,1,C.eye);px(x-8,y+1,3,2,C.crow);
    px(x-1,y+4,1,3,C.beak);px(x+2,y+4,1,3,C.beak);
    px(x-3,y-5-flap,7,3,C.crowWing);px(x-6,y-3-flap,4,2,C.crowWing);
    px(x-3,y+5+flap*0.5,7,3,C.crowWing);px(x+1,y+7+flap*0.5,4,2,C.crowWing);
  }

  function drawHorseBody(x:number,hy:number,legLen:number[],saddle:boolean){
    px(x-19,hy-19,2,4,C.horseMane);px(x-20,hy-16,3,9,C.horseMane);px(x-19,hy-9,2,6,C.horseDk);
    px(x-17,hy-17,8,10,C.horse);px(x-16,hy-18,7,1,C.horseHi);
    px(x-10,hy-16,13,9,C.horse);px(x-10,hy-8,13,1,C.horseDk);px(x-9,hy-15,11,1,C.horseHi);
    px(x+2,hy-17,6,11,C.horse);px(x+2,hy-17,6,1,C.horseHi);px(x+6,hy-14,2,8,C.horseMid);
    px(x+5,hy-23,6,9,C.horse);px(x+7,hy-25,6,6,C.horse);px(x+6,hy-23,1,9,C.horseHi);px(x+10,hy-22,2,7,C.horseMid);
    px(x+10,hy-27,7,7,C.horse);px(x+16,hy-25,4,4,C.horse);px(x+19,hy-24,2,3,C.horseMid);
    px(x+11,hy-28,2,3,C.horse);px(x+14,hy-27,1,1,C.horseHi);
    px(x+13,hy-25,2,2,C.horseEye);px(x+13,hy-25,1,1,C.eye);
    px(x+6,hy-27,5,11,C.horseMane);px(x+4,hy-23,3,9,C.horseMane);px(x+9,hy-28,3,5,C.horseMane);
    if(saddle){px(x-8,hy-18,9,3,C.leather);px(x-8,hy-18,9,1,C.leatherHi);px(x-4,hy-19,3,1,C.leatherHi);}
    const lx=[-12,-6,1,5];
    for(let i=0;i<4;i++){
      const far=i===0||i===2,c=far?C.horseDk:C.horseMid,ln=legLen[i];
      px(x+lx[i],hy-8,3,ln,c);px(x+lx[i],hy-8,1,ln,far?C.horseDk:C.horse);
      px(x+lx[i]-1,hy-8+ln,4,2,C.horseHoof);
      if(ln>6)px(x+lx[i],hy-8+Math.floor(ln/2),3,1,far?C.horse:C.horseHi);
    }
  }
  function drawWildHorse(x:number,y:number){
    x|=0;y|=0;
    const bob=Math.sin(crow.bob*1.3)*1,f=Math.floor(crow.bob*2)%4;
    const fr=[[3,9,4,9],[9,3,9,4],[4,10,3,10],[10,4,10,3]][f];
    drawHorseBody(x,(y+bob)|0,fr,false);
    const a=(Math.sin(crow.bob*2)+1)*0.5;
    ctx.globalAlpha=0.5+a*0.5;px(x-4,(y+bob-36)|0,2,5,'#fff');px(x-4,(y+bob-30)|0,2,2,'#fff');ctx.globalAlpha=1;
  }

  function drawHeroOnFoot(x:number,y:number){
    x|=0;y|=0;
    const drinking=drinkAnim>0,f=Math.floor(hero.runFrame)%4;
    const ghostActive=ghostTimer>0,ghostPulse=ghostActive?(0.55+0.2*Math.sin(ghostTimer*0.15)):1;
    const hitFlash=hitTimer>0&&Math.floor(hitTimer/6)%2===0;
    if(hitFlash)ctx.globalAlpha=0.4;else if(ghostActive)ctx.globalAlpha=ghostPulse;
    const inAir=!hero.onGround,goingUp=hero.vy<-1.5,falling=hero.vy>1.5,landing=hero.landTimer>0;
    const squat=landing?(hero.landTimer/10)*3|0:0,ty=y-squat;
    let cw=[0,1,2,1][f];if(goingUp)cw=3;
    if(falling){px(x-8,ty-34,7,18,C.cloak);px(x-11,ty-30,5,14,C.cloakMid);px(x-6,ty-36,8,22,C.cloakMid);px(x-5,ty-35,5,18,C.cloakLt);px(x-5,ty-35,2,18,C.cloakHi);}
    else if(goingUp){px(x-13,ty-20,10,8,C.cloak);px(x-16,ty-17,7,6,C.cloakMid);px(x-8,ty-24,9,16,C.cloakMid);px(x-7,ty-23,6,13,C.cloakLt);px(x-7,ty-23,2,13,C.cloakHi);}
    else{px(x-10-cw,ty-22,8,15,C.cloak);px(x-13-cw,ty-17,5,10,C.cloakMid);px(x-7,ty-25,9,18,C.cloakMid);px(x-6,ty-24,6,15,C.cloakLt);px(x-6,ty-24,2,15,C.cloakHi);}
    if(!inAir&&!drinking){
      const legA=[0,3,0,-2][f],legB=[0,-2,0,3][f],sqH=squat;
      px(x-3,ty-8,3,6+legA-sqH,C.body);px(x+1,ty-8,3,6+legB-sqH,C.bodyMid);
      px(x-4,ty-2+legA-sqH,5,2,'#0d0818');px(x+1,ty-2+legB-sqH,5,2,'#0d0818');
    }else if(goingUp){px(x-4,ty-5,3,3,C.body);px(x+2,ty-6,3,3,C.bodyMid);px(x-6,ty-3,4,2,'#0d0818');px(x+3,ty-3,4,2,'#0d0818');px(x-9,ty-5,4,2,C.body);px(x+5,ty-5,4,2,C.bodyMid);}
    else if(falling){px(x-4,ty-8,3,7,C.body);px(x+1,ty-8,3,6,C.bodyMid);px(x-5,ty-1,5,2,'#0d0818');px(x+1,ty-2,5,2,'#0d0818');}
    else if(drinking){px(x-4,ty-8,3,5,C.body);px(x+1,ty-8,3,4,C.bodyMid);px(x-5,ty-3,5,2,'#0d0818');px(x+1,ty-4,5,2,'#0d0818');}
    px(x-4,ty-23,8,15,C.body);px(x-4,ty-23,8,3,C.bodyHi);px(x-4,ty-23,2,15,C.bodyMid);px(x+2,ty-21,1,9,C.bodyHi);
    px(x-3,ty-20,6,1,C.leather);px(x+1,ty-19,1,6,C.leatherHi);px(x-4,ty-12,8,2,C.leather);px(x-1,ty-12,2,2,C.buckle);
    if(drinking){
      const prog2=1-drinkAnim/50,armRise=Math.min(1,prog2*2),armY=lerp(ty-21,ty-27,armRise);
      px(x-1,armY|0,7,3,C.body);px(x+5,armY|0,2,3,C.skin);
    }else if(goingUp){px(x-10,ty-20,7,3,C.body);px(x-13,ty-20,3,2,C.skin);px(x+3,ty-20,7,3,C.body);px(x+9,ty-20,3,2,C.skin);}
    else if(falling){px(x-7,ty-28,3,7,C.body);px(x-8,ty-29,3,2,C.skin);px(x+4,ty-26,3,6,C.body);px(x+4,ty-27,3,2,C.skin);}
    else{const reach=[6,8,7,5][f];px(x+3,ty-21,reach,3,C.body);px(x+3+reach,ty-21,2,3,C.skin);}
    if(!drinking){
      if(swordSlash>0){drawSwordSlashEffect(x+14,ty-26);}
      else{const ib=goingUp?-0.4:falling?0.5:Math.sin(hero.runFrame*0.5)*0.18;drawSwordInHand(x+12,ty-22,0.25+ib);}
    }
    px(x-2,ty-25,5,3,C.neck);px(x-2,ty-25,5,1,C.neckHi);px(x,ty-26,1,2,C.neckBone);px(x-1,ty-23,3,1,'#5a1515');
    if(ghostActive){ctx.globalAlpha=0.18*ghostPulse;px(x-6,ty-26,14,26,C.potBg);}
    ctx.globalAlpha=1;
    if(goingUp){ctx.globalAlpha=0.35;px(x-18,ty-14,8,1,'#c0b0e0');px(x-22,ty-10,10,1,'#c0b0e0');px(x-16,ty-6,6,1,'#c0b0e0');ctx.globalAlpha=1;}
  }

  function drawHeroOnHorse(x:number,y:number){
    x|=0;y|=0;
    // след спринта — синие полосы позади лошади
    if(sprintActive>0){
      const a=sprintActive/SPRINT_DURATION;
      for(let i=1;i<=4;i++){
        ctx.globalAlpha=a*(0.35-i*0.07);
        px(x-10-i*9,y-18,8,12,'#40e8ff');
        px(x-10-i*9,y-10,6,8,'#80ffee');
      }
      ctx.globalAlpha=1;
    }
    const f=Math.floor(hero.runFrame)%4;
    const inAir=!hero.onGround,goingUp=hero.vy<-1.5,falling=hero.vy>1.5,landing=hero.landTimer>0;
    const squat=landing?(hero.landTimer/10)*2|0:0;
    const gallop=hero.onGround?[0,-2,0,-1][f]-squat:0,hy=y+gallop;
    const ghostActive=ghostTimer>0,ghostPulse=ghostActive?(0.55+0.2*Math.sin(ghostTimer*0.15)):1;
    const hitFlash=hitTimer>0&&Math.floor(hitTimer/6)%2===0;
    if(hitFlash)ctx.globalAlpha=0.4;else if(ghostActive)ctx.globalAlpha=ghostPulse;
    let fr:number[];
    if(goingUp)fr=[1,13,2,13];else if(falling)fr=[13,1,13,2];
    else fr=[[2,11,3,11],[11,3,11,4],[5,8,5,7],[3,11,4,11]][f];
    drawHorseBody(x,hy,fr,true);
    if(inAir){ctx.globalAlpha=goingUp?0.5:0.3;px(x-26,hy-10,12,1,'#c0b0e0');px(x-30,hy-6,14,1,'#c0b0e0');px(x-24,hy-2,10,1,'#c0b0e0');ctx.globalAlpha=ghostActive?ghostPulse:hitFlash?0.4:1;}
    const rx=x-4,ry=hy-16,lean=inAir?-2:[0,-1,0,-1][f];
    if(falling){px(rx-8,ry-24,7,20,C.cloak);px(rx-11,ry-20,5,16,C.cloakMid);px(rx-5,ry-27,8,22,C.cloakMid);px(rx-4,ry-26,5,18,C.cloakLt);px(rx-4,ry-26,2,18,C.cloakHi);}
    else if(goingUp){px(rx-15,ry-12,12,7,C.cloak);px(rx-18,ry-8,8,5,C.cloakMid);px(rx-7,ry-15,9,16,C.cloakMid);px(rx-6,ry-14,6,13,C.cloakLt);px(rx-6,ry-14,2,13,C.cloakHi);}
    else{px(rx-9,ry-12+lean,7,15,C.cloak);px(rx-12,ry-7,5,11,C.cloakMid);px(rx-6,ry-15+lean,8,17,C.cloakMid);px(rx-5,ry-14+lean,5,14,C.cloakLt);px(rx-5,ry-14+lean,2,14,C.cloakHi);}
    px(rx-3,ry-14+lean,7,14,C.body);px(rx-3,ry-14+lean,7,3,C.bodyHi);
    px(rx-3,ry-7,7,2,C.leather);px(rx,ry-7,2,2,C.buckle);px(rx-2,ry-12+lean,1,8,C.bodyHi);
    px(rx-2,ry-1,3,6,C.body);px(rx-3,ry+4,4,2,'#0d0818');px(rx+1,ry-1,2,5,C.bodyMid);
    if(drinkAnim>0){
      const prog2=1-drinkAnim/50,armY=lerp(ry-12,ry-17,Math.min(1,prog2*2))+lean;
      px(rx+3,armY|0,7,2,C.body);px(rx+9,armY|0,2,3,C.skin);
    }else{
      if(swordSlash>0){px(rx+3,ry-18+lean,10,2,C.body);drawSwordSlashEffect(rx+16,ry-20+lean);}
      else{px(rx+3,ry-12+lean,8,2,C.body);px(rx+10,ry-12+lean,2,2,C.skin);
        const ib=inAir?-0.3:Math.sin(hero.runFrame*0.5)*0.15;drawSwordInHand(rx+13,ry-14+lean,0.2+ib);}
    }
    px(rx-1,ry-16+lean,5,3,C.neck);px(rx-1,ry-16+lean,5,1,C.neckHi);px(rx+1,ry-17+lean,1,2,C.neckBone);px(rx,ry-14+lean,3,1,'#5a1515');
    if(ghostActive){ctx.globalAlpha=0.18*ghostPulse;px(rx-14,ry-36,28,46,C.potBg);}
    ctx.globalAlpha=1;
  }

  function drawOb(ob:Obstacle){
    const x=ob.x|0,bY=GY;
    if(ob.type==='tomb'){
      px(x-10,bY-1,20,2,'rgba(0,0,0,0.3)');px(x-8,bY-22,16,22,C.tomb);px(x-6,bY-26,12,5,C.tomb);px(x-4,bY-27,8,2,C.tomb);
      px(x+4,bY-24,4,24,C.tombMid);px(x+6,bY-22,2,22,C.tombDk);px(x-8,bY-26,2,26,'#b4aec0');
      px(x-4,bY-19,7,1,C.tombDk);px(x-4,bY-16,7,1,C.tombDk);px(x-4,bY-13,7,1,C.tombDk);
      px(x-7,bY-8,3,6,C.tombMoss);px(x-6,bY-5,2,3,C.tombMoss);
    }else if(ob.type==='fence'){
      px(x-12,bY-1,24,2,'rgba(0,0,0,0.25)');
      px(x-10,bY-17,3,17,C.wood);px(x-10,bY-17,1,17,C.woodHi);px(x-9,bY-19,1,2,C.wood);
      px(x+7,bY-17,3,17,C.wood);px(x+7,bY-17,1,17,C.woodHi);px(x+8,bY-19,1,2,C.wood);
      px(x-10,bY-13,20,3,C.woodMid);px(x-10,bY-13,20,1,C.woodHi);px(x-10,bY-6,20,3,C.woodMid);px(x-10,bY-6,20,1,C.woodHi);
    }else if(ob.type==='log'){
      px(x-13,bY-1,26,2,'rgba(0,0,0,0.25)');px(x-12,bY-11,24,11,C.wood);px(x-12,bY-11,24,3,C.woodHi);px(x-12,bY-4,24,4,C.woodDk);
      px(x-12,bY-9,4,7,C.woodDk);px(x-11,bY-8,2,5,C.woodMid);px(x+8,bY-9,4,7,C.woodDk);px(x+9,bY-8,2,5,C.woodMid);
    }else if(ob.type==='ghost'){
      const gy=(ob.y+Math.sin(ob.bob)*4)|0;
      ctx.globalAlpha=0.12;px(x-11,gy-20,22,22,C.ghost);ctx.globalAlpha=0.82;
      px(x-8,gy-16,16,14,C.ghost);px(x-6,gy-18,12,4,C.ghost);px(x-4,gy-19,8,2,C.ghost);
      px(x+4,gy-16,4,14,C.ghostMid);px(x-8,gy-16,2,14,C.ghost);
      px(x-8,gy-4,3,4,C.ghostMid);px(x-3,gy-4,3,3,C.ghostMid);px(x+2,gy-4,3,4,C.ghostMid);
      ctx.globalAlpha=1;px(x-4,gy-13,2,4,'#15304a');px(x+2,gy-13,2,4,'#15304a');
    }else if(ob.type==='skeleton'){
      const ph=Math.sin(ob.bob),lA=(ph*3)|0,lB=(-ph*3)|0,aA=(ph*2)|0;
      const bn='#d4d0c8',bk='#9a9488',ey='#0a0010';
      px(x-7,bY-1,14,2,'rgba(0,0,0,0.3)');
      px(x-4,bY-8,2,8+lA,bk);px(x+2,bY-8,2,8+lB,bk);px(x-5,bY-1,4,2,bk);px(x+2,bY-1,4,2,bk);
      px(x-3,bY-9,7,2,bn);px(x-1,bY-18,3,9,bn);
      px(x-5,bY-16,4,1,bn);px(x+2,bY-16,4,1,bn);px(x-4,bY-14,3,1,bn);px(x+1,bY-14,3,1,bn);px(x-4,bY-12,3,1,bn);px(x+1,bY-12,3,1,bn);
      px(x-8,bY-17-aA,7,2,bk);px(x+2,bY-17+aA,7,2,bk);
      px(x-4,bY-24,9,5,bn);px(x-3,bY-25,7,1,bn);px(x-2,bY-26,5,1,bn);
      px(x-3,bY-23,2,3,ey);px(x+1,bY-23,2,3,ey);px(x-1,bY-21,2,1,ey);
      px(x-3,bY-19,2,1,bn);px(x,bY-19,2,1,bn);px(x-2,bY-18,7,1,'#0a0010');
    }else if(ob.type==='knight_mob'){
      const ph=Math.sin(ob.bob*0.7),lA=(ph*2)|0,lB=(-ph*2)|0;
      const ac='#606870',ah='#8090a0',ad='#383e44',ag='#b08820',ap='#d04030';
      px(x-9,bY-1,18,2,'rgba(0,0,0,0.35)');
      px(x-4,bY-10+lA,3,10,ad);px(x+1,bY-10+lB,3,10,ad);px(x-5,bY-1,4,2,ac);px(x+1,bY-1,4,2,ac);
      px(x-4,bY-11,8,2,ag);px(x-5,bY-22,10,11,ac);px(x-5,bY-22,10,2,ah);px(x+3,bY-20,2,9,ad);
      px(x-7,bY-22,3,4,ac);px(x+4,bY-22,3,4,ac);px(x-8,bY-20,4,2,ad);px(x+4,bY-20,4,2,ad);
      px(x-11,bY-22,4,8,ah);px(x-12,bY-20,6,6,ac);px(x-11,bY-18,4,1,ag);px(x-9,bY-22,1,6,ag);
      px(x+5,bY-32,2,14,ah);px(x+3,bY-22,6,2,ag);px(x+5,bY-20,2,4,ad);
      px(x-4,bY-30,8,8,ac);px(x-5,bY-32,10,4,ac);px(x-4,bY-27,8,2,ad);px(x-4,bY-33,8,1,ah);
      px(x-1,bY-37,3,6,ap);px(x,bY-39,2,4,ap);
    }else if(ob.type==='zombie'){
      const ph=Math.sin(ob.bob*0.8),lA=(ph*2)|0,lB=(-ph*2)|0;
      const gs='#4a7028',cl='#5a4428',cd='#3a2c18',bl2='#981818',bn2='#d4d0c8';
      px(x-8,bY-1,16,2,'rgba(0,0,0,0.3)');
      px(x-4,bY-7+lA,3,7,cl);px(x+1,bY-7+lB,3,7,cd);px(x-5,bY-1,4,2,cd);px(x+1,bY-1,3,2,cd);
      px(x-4,bY-14,8,7,cl);px(x-8,bY-13,4,2,cl);px(x+4,bY-13,8,2,cl);px(x+10,bY-13,3,4,gs);
      px(x-1,bY-15,3,2,gs);
      px(x-4,bY-21,8,6,gs);px(x-3,bY-22,6,1,gs);px(x-2,bY-23,4,1,gs);
      px(x-3,bY-20,2,1,bl2);px(x-2,bY-19,1,1,bl2);px(x-3,bY-18,1,1,bl2);
      px(x+1,bY-20,2,1,bl2);px(x+1,bY-19,1,1,bl2);px(x+2,bY-18,1,1,bl2);
      px(x-2,bY-17,5,1,cd);px(x-1,bY-17,1,1,bn2);px(x+1,bY-17,1,1,bn2);
    }else if(ob.type==='cactus'){
      // кактус
      px(x-1,bY-1,14,2,'rgba(0,0,0,0.2)');
      px(x+1,bY-28,4,28,C.cactus);px(x+2,bY-28,2,28,C.cactusHi);px(x+3,bY-27,1,26,C.cactusDk);
      // иголки
      px(x,bY-26,2,1,C.cactusHi);px(x+5,bY-26,2,1,C.cactusHi);px(x,bY-18,2,1,C.cactusHi);px(x+5,bY-18,2,1,C.cactusHi);
      // левое ответвление
      px(x-7,bY-22,8,3,C.cactus);px(x-7,bY-22,8,1,C.cactusHi);px(x-7,bY-22,1,3,C.cactusDk);
      px(x-7,bY-28,3,6,C.cactus);px(x-7,bY-28,2,6,C.cactusHi);
      px(x-8,bY-28,1,1,C.cactusHi);px(x-8,bY-23,1,1,C.cactusHi);
      // правое ответвление
      px(x+5,bY-18,7,3,C.cactus);px(x+5,bY-18,7,1,C.cactusHi);px(x+11,bY-18,1,3,C.cactusDk);
      px(x+9,bY-24,3,6,C.cactus);px(x+9,bY-24,2,6,C.cactusHi);
      px(x+12,bY-24,1,1,C.cactusHi);px(x+12,bY-19,1,1,C.cactusHi);
    }else if(ob.type==='mummy'){
      const ph=Math.sin(ob.bob*0.7),lA=(ph*2)|0,lB=(-ph*2)|0;
      const ey=C.mummyEye;
      px(x-8,bY-1,16,2,'rgba(0,0,0,0.3)');
      // ноги в бинтах
      px(x-4,bY-10+lA,4,10,C.mummy);px(x+1,bY-10+lB,4,10,C.mummy);
      for(let i=0;i<3;i++){px(x-4,bY-4+lA-i*3,4,1,C.mummyBand);px(x+1,bY-4+lB-i*3,4,1,C.mummyBand);}
      px(x-5,bY-1,5,2,C.mummyDk);px(x+1,bY-1,5,2,C.mummyDk);
      // тело
      px(x-5,bY-24,11,14,C.mummy);px(x+4,bY-22,2,10,C.mummyDk);px(x-5,bY-22,2,10,C.mummy);
      for(let i=0;i<4;i++)px(x-5,bY-24+i*4,11,1,C.mummyBand);
      // руки — вытянуты вперёд
      px(x+5,bY-20,8,2,C.mummy);px(x+5,bY-20,8,1,C.mummyBand);px(x+11,bY-21,3,3,C.mummyDk);
      px(x-13,bY-20,8,2,C.mummy);px(x-13,bY-20,8,1,C.mummyBand);px(x-13,bY-22,2,3,C.mummyDk);
      // голова
      px(x-4,bY-32,9,8,C.mummy);px(x+3,bY-31,2,6,C.mummyDk);
      px(x-4,bY-32,9,2,C.mummyBand);px(x-4,bY-28,9,1,C.mummyBand);
      px(x-3,bY-30,3,2,ey);px(x+1,bY-30,3,2,ey);px(x-2,bY-30,1,1,'#ff6060');px(x+2,bY-30,1,1,'#ff6060');
      px(x-2,bY-27,5,1,C.mummyDk);
    }else if(ob.type==='scorpion'){
      const ph=Math.sin(ob.bob*1.1),tA=(Math.sin(ob.bob*0.9)*4)|0;
      px(x-12,bY-1,24,2,'rgba(0,0,0,0.3)');
      // тело
      px(x-6,bY-8,12,8,C.scorpion);px(x-6,bY-8,12,2,C.scorpionHi);px(x+4,bY-7,2,6,C.scorpionDk);
      // голова
      px(x+4,bY-10,6,5,C.scorpion);px(x+4,bY-10,6,1,C.scorpionHi);
      // клешни
      px(x+9,bY-12,3,3,C.scorpionHi);px(x+11,bY-14,3,4,C.scorpion);px(x+13,bY-13,2,2,C.scorpionDk);
      px(x+9,bY-10,3,3,C.scorpionHi);px(x+11,bY-8,3,4,C.scorpion);px(x+13,bY-9,2,2,C.scorpionDk);
      // ноги
      for(let i=0;i<3;i++){const lx=x-4+i*3,lph=(ph*(i%2===0?1:-1)*2)|0;px(lx,bY-8+lph,1,8,C.scorpionDk);px(lx+1,bY-3+lph,1,3,C.scorpionDk);}
      for(let i=0;i<3;i++){const lx=x-4+i*3,lph=(ph*(i%2===0?-1:1)*2)|0;px(lx,bY-8+lph,1,8,C.scorpionTail);px(lx+1,bY-3+lph,1,3,C.scorpionTail);}
      // хвост-жало
      px(x-8,bY-8,4,3,C.scorpionTail);px(x-10,bY-11,3,4,C.scorpionTail);
      px(x-11,bY-16-tA,3,6,C.scorpionTail);px(x-10,bY-20-tA,4,3,C.scorpionTail);px(x-9,bY-21-tA,2,1,C.scorpionHi);
    }else if(ob.type==='bandit'){
      // разбойник — кинжал, плащ, капюшон, маска
      const ph=Math.sin(ob.bob),lA=(ph*3)|0,lB=(-ph*3)|0,aA=(Math.sin(ob.bob*1.3)*3)|0;
      const bY2=bY;
      // тень
      px(x-9,bY2-1,18,2,'rgba(0,0,0,0.35)');
      // ноги в кожаных штанах
      px(x-4,bY2-9+lA,3,9,C.banditCloak);px(x+1,bY2-9+lB,3,9,C.banditCloak);
      px(x-5,bY2-1,4,2,C.banditCloakHi);px(x+1,bY2-1,4,2,C.banditCloakHi);
      // пояс с подсумком
      px(x-5,bY2-10,10,2,'#7a5018');px(x-5,bY2-10,10,1,'#a07030');px(x+2,bY2-10,3,2,'#4a3010');
      // туника/плащ — развевается
      px(x-6,bY2-24,12,14,C.banditTunic);px(x-7,bY2-20,3,10,C.banditCloak);px(x+4,bY2-20,3,10,C.banditCloak);
      px(x-6,bY2-24,12,2,C.banditTunicHi);px(x-5,bY2-22,1,12,C.banditTunicHi);
      // правая рука — кинжал наготове
      px(x+4,bY2-20+aA,7,2,C.banditCloak);
      // кинжал
      px(x+10,bY2-24+aA,2,8,C.banditDagger);px(x+10,bY2-25+aA,2,1,'#d8d8e8');px(x+9,bY2-22+aA,4,1,'#7a7080');
      // левая рука — вперёд угрожающе
      px(x-10,bY2-19-aA,6,2,C.banditCloak);px(x-11,bY2-20-aA,3,3,C.banditSkin);
      // шея
      px(x-1,bY2-26,3,3,C.banditSkin);
      // капюшон — тёмный
      px(x-4,bY2-34,9,8,C.banditHood);px(x-5,bY2-32,11,5,C.banditHood);px(x-3,bY2-35,7,2,C.banditHood);
      px(x-4,bY2-34,2,8,'#110a04');px(x+2,bY2-34,2,8,'#0e0804');
      // лицо — видны только глаза (остальное закрыто маской)
      px(x-3,bY2-32,7,6,C.banditMask);px(x-2,bY2-30,2,2,'#ff4040');px(x+1,bY2-30,2,2,'#ff4040');
      // блеск глаз
      px(x-2,bY2-30,1,1,'#ff8080');px(x+1,bY2-30,1,1,'#ff8080');
    }else if(ob.type==='goblin'){
      // Гоблин — маленький, горбатый, злые красные глаза, дубина
      const ph=Math.sin(ob.bob),lA=(ph*3)|0,lB=(-ph*3)|0,aA=(Math.sin(ob.bob*1.2)*2)|0;
      px(x-7,bY-1,14,2,'rgba(0,0,0,0.3)');
      // ноги
      px(x-4,bY-7+lA,3,7,C.goblinCloth);px(x+1,bY-7+lB,3,7,C.goblinCloth);
      px(x-5,bY-1,4,2,C.goblinSkin);px(x+1,bY-1,4,2,C.goblinSkin);
      // тело — пузатое
      px(x-5,bY-14,10,7,C.goblinCloth);px(x-5,bY-14,10,2,C.goblinClothHi);px(x+3,bY-12,2,5,C.goblinSkinDk);
      // левая рука
      px(x-9,bY-13+aA,5,2,C.goblinSkin);px(x-9,bY-13+aA,2,4,C.goblinSkin);
      // правая рука с дубиной
      px(x+5,bY-13-aA,4,2,C.goblinSkin);
      px(x+8,bY-20-aA,2,10,'#6a4020');px(x+7,bY-22-aA,4,4,'#8a5828');px(x+6,bY-23-aA,6,2,'#a06830');
      // уши — торчат в стороны
      px(x-7,bY-19,2,5,C.goblinSkin);px(x-7,bY-20,2,2,C.goblinSkinHi);
      px(x+5,bY-19,2,5,C.goblinSkin);px(x+5,bY-20,2,2,C.goblinSkinHi);
      // голова
      px(x-4,bY-22,8,7,C.goblinSkin);px(x-3,bY-23,6,1,C.goblinSkinHi);px(x+2,bY-21,2,5,C.goblinSkinDk);
      // злые глаза
      px(x-3,bY-20,2,2,'#e82020');px(x+1,bY-20,2,2,'#e82020');
      px(x-3,bY-20,1,1,'#ff6060');px(x+1,bY-20,1,1,'#ff6060');
      // большой нос
      px(x-1,bY-18,3,2,C.goblinSkinDk);
      // рот с зубами
      px(x-2,bY-16,5,1,C.goblinSkinDk);px(x-1,bY-16,1,1,'#e8e8d0');px(x+1,bY-16,1,1,'#e8e8d0');
    }else if(ob.type==='lizard'){
      // Ящер — чешуйчатый, двуногий, жёлтые глаза-щели, хвост
      const ph=Math.sin(ob.bob*0.9),lA=(ph*2)|0,lB=(-ph*2)|0,aA=(Math.sin(ob.bob*1.1)*2)|0;
      px(x-9,bY-1,18,2,'rgba(0,0,0,0.3)');
      // хвост — изгибается
      const tA=(Math.sin(ob.bob*0.7)*3)|0;
      px(x-9,bY-5,5,3,C.lizardScale);px(x-13,bY-7+tA,5,3,C.lizardScaleDk);px(x-16,bY-9+tA,3,2,C.lizardScaleDk);
      // ноги
      px(x-4,bY-9+lA,3,9,C.lizardScale);px(x+1,bY-9+lB,3,9,C.lizardScale);
      px(x-5,bY-1,4,2,C.lizardScaleDk);px(x+1,bY-1,4,2,C.lizardScaleDk);
      // тело
      px(x-5,bY-19,10,10,C.lizardScale);px(x-5,bY-19,10,2,C.lizardScaleHi);px(x+3,bY-17,2,8,C.lizardScaleDk);
      // живот светлее
      px(x-3,bY-17,5,8,C.lizardBelly);
      // чешуйный узор
      for(let i=0;i<3;i++)px(x-4,bY-19+i*3,9,1,C.lizardScaleDk);
      // руки
      px(x-8,bY-17+aA,4,2,C.lizardScale);px(x-8,bY-16+aA,2,3,C.lizardScale);
      px(x+5,bY-17-aA,4,2,C.lizardScale);px(x+7,bY-16-aA,2,3,C.lizardScale);
      // голова — ящеричья
      px(x-4,bY-24,8,5,C.lizardScale);px(x-4,bY-25,8,1,C.lizardScaleHi);px(x+2,bY-23,2,4,C.lizardScaleDk);
      // морда вытянута
      px(x+2,bY-23,6,4,C.lizardScale);px(x+2,bY-23,6,1,C.lizardScaleHi);px(x+7,bY-22,2,2,C.lizardScaleDk);
      // ноздри
      px(x+6,bY-21,1,1,C.lizardScaleDk);
      // глаза — жёлтые с вертикальным зрачком
      px(x-2,bY-22,3,2,'#f0d020');px(x-2,bY-22,1,2,'#000');
      px(x+1,bY-22,3,2,'#f0d020');px(x+2,bY-22,1,2,'#000');
    }else if(ob.type==='rat_miner'){
      // Крыса-шахтёр — горняцкая каска с фонарём, кайло, рюкзак с рудой
      const ph=Math.sin(ob.bob),lA=(ph*3)|0,lB=(-ph*3)|0,aA=(Math.sin(ob.bob*1.3)*2)|0;
      px(x-7,bY-1,14,2,'rgba(0,0,0,0.3)');
      // хвост
      px(x-8,bY-5,5,2,C.ratFurDk);px(x-12,bY-7,4,2,C.ratFurDk);px(x-14,bY-8,3,1,C.ratFurDk);
      // ноги
      px(x-4,bY-7+lA,3,7,C.ratFur);px(x+1,bY-7+lB,3,7,C.ratFur);
      px(x-5,bY-1,4,2,C.ratFurDk);px(x+1,bY-1,4,2,C.ratFurDk);
      // рюкзак с рудой — на спине
      px(x-7,bY-14,3,8,'#4a3010');px(x-7,bY-14,3,1,'#6a4820');
      px(x-7,bY-9,3,2,C.lootOre);px(x-7,bY-12,3,2,C.lootOreHi);
      // тело
      px(x-4,bY-15,8,8,C.ratFur);px(x-4,bY-15,8,2,C.ratFurHi);px(x+2,bY-13,2,6,C.ratFurDk);
      // левая рука
      px(x-8,bY-13+aA,5,2,C.ratFur);px(x-9,bY-12+aA,2,3,C.ratFur);
      // правая рука с кайлом
      px(x+4,bY-14-aA,4,2,C.ratFur);
      px(x+7,bY-19-aA,2,9,'#7a7080');px(x+5,bY-21-aA,7,2,'#8a8090');px(x+6,bY-20-aA,6,1,'#c0c0c8');
      // шея
      px(x-1,bY-17,3,2,C.ratFur);
      // голова — грызун
      px(x-3,bY-21,7,4,C.ratFur);px(x-3,bY-22,5,1,C.ratFurHi);px(x+2,bY-20,2,3,C.ratFurDk);
      // морда — вытянутая
      px(x+2,bY-20,4,3,C.ratFur);px(x+5,bY-19,2,1,'#d09898');
      // ухо
      px(x-3,bY-23,2,3,C.ratFur);px(x-3,bY-24,2,1,C.ratFurHi);px(x-2,bY-23,1,2,'#c87878');
      // каска горняка
      px(x-4,bY-24,9,3,C.ratHelmet);px(x-3,bY-25,7,1,C.ratHelmet);px(x-4,bY-24,9,1,C.ratHelmetHi);
      // фонарик на каске — светится
      px(x+3,bY-26,3,2,'#f0e060');
      ctx.globalAlpha=0.35+(Math.sin(ob.bob*3)*0.15);px(x+2,bY-28,6,5,'#f8f060');ctx.globalAlpha=1;
      // глаза — красные
      px(x-2,bY-20,2,2,'#e82020');px(x+2,bY-20,2,2,'#e82020');
      px(x-2,bY-20,1,1,'#ff6060');px(x+2,bY-20,1,1,'#ff6060');
    }else if(ob.type==='cyber_punk'){
      // Хакер в капюшоне с неоновым визором
      const ph=Math.sin(ob.bob),lA=(ph*3)|0,lB=(-ph*3)|0,aA=(Math.sin(ob.bob*1.2)*3)|0;
      px(x-7,bY-1,14,2,'rgba(0,0,0,0.4)');
      px(x-3,bY-9+lA,3,9,C.cyberHood);px(x+1,bY-9+lB,3,9,C.cyberHood);
      px(x-4,bY-1,4,2,C.cyberHoodHi);px(x+1,bY-1,4,2,C.cyberHoodHi);
      px(x-5,bY-22,10,13,C.cyberHood);px(x-5,bY-22,10,2,C.cyberHoodHi);px(x+3,bY-20,2,11,'#060614');
      px(x-8,bY-18+aA,4,2,C.cyberHood);px(x+5,bY-18-aA,5,2,C.cyberHood);
      // энергетический клинок
      px(x+8,bY-26-aA,2,10,'#00e8ff');px(x+7,bY-27-aA,4,2,'#00e8ff');
      ctx.globalAlpha=0.4;px(x+6,bY-28-aA,6,14,'#00e8ff');ctx.globalAlpha=1;
      // голова и капюшон
      px(x-4,bY-30,9,8,C.cyberHood);px(x-5,bY-28,11,4,C.cyberHood);px(x-3,bY-31,7,2,C.cyberHood);
      // визор — неон
      px(x-3,bY-28,7,3,C.cyberVisor);ctx.globalAlpha=0.35;px(x-4,bY-29,9,5,C.cyberVisor);ctx.globalAlpha=1;
    }else if(ob.type==='drone'){
      // Летающий дрон
      const gy=(ob.y+Math.sin(ob.bob)*4)|0;
      const pr=(Math.sin(ob.bob*4)*3)|0;
      px(x-11,gy-1,22,2,'rgba(0,0,0,0.3)');
      // Ротор левый
      px(x-12,gy-pr-10,10,2,C.droneHi);ctx.globalAlpha=0.3;px(x-13,gy-pr-11,12,4,'#00e8ff');ctx.globalAlpha=1;
      // Ротор правый
      px(x+2,gy+pr-10,10,2,C.droneHi);ctx.globalAlpha=0.3;px(x+1,gy+pr-11,12,4,'#00e8ff');ctx.globalAlpha=1;
      // Тело дрона
      px(x-7,gy-8,14,8,C.droneBody);px(x-7,gy-8,14,2,C.droneHi);px(x+5,gy-7,2,6,'#101020');
      px(x-5,gy-9,10,2,C.droneHi);
      // Сенсор — красный глаз
      px(x-2,gy-5,4,4,'#200000');px(x-1,gy-4,2,2,'#ff2020');
      ctx.globalAlpha=0.5;px(x-3,gy-6,6,6,'#ff2020');ctx.globalAlpha=1;
      // Подвеска
      px(x-1,gy,2,4,C.droneHi);px(x-2,gy+4,4,2,C.droneBody);
      // Нижняя нео-полоска
      ctx.globalAlpha=0.8;px(x-6,gy-1,12,1,'#00e8ff');ctx.globalAlpha=0.2;px(x-7,gy-2,14,3,'#00e8ff');ctx.globalAlpha=1;
    }else if(ob.type==='robot'){
      // Боевой робот
      const ph=Math.sin(ob.bob*0.8),lA=(ph*2)|0,lB=(-ph*2)|0;
      px(x-9,bY-1,18,2,'rgba(0,0,0,0.4)');
      // Ноги металлические
      px(x-4,bY-10+lA,4,10,C.robotBody);px(x-4,bY-10+lA,1,10,C.robotHi);
      px(x+1,bY-10+lB,4,10,C.robotBody);px(x+1,bY-10+lB,1,10,C.robotHi);
      px(x-6,bY-1,5,2,'#0a0a16');px(x+2,bY-1,5,2,'#0a0a16');
      // Корпус
      px(x-6,bY-24,13,14,C.robotBody);px(x-6,bY-24,13,2,C.robotHi);px(x+5,bY-22,2,12,'#060610');
      px(x-7,bY-22,2,10,C.robotBody);
      // Пушка-рука
      px(x+5,bY-20,8,3,C.robotHi);px(x+12,bY-21,4,4,C.robotBody);px(x+12,bY-20,4,2,'#0a0a16');
      ctx.globalAlpha=0.7;px(x+15,bY-20,3,2,'#00e8ff');ctx.globalAlpha=1;
      // Голова
      px(x-4,bY-32,9,8,C.robotBody);px(x-4,bY-32,9,2,C.robotHi);px(x+3,bY-31,2,6,'#060610');
      // Красный глаз
      px(x-2,bY-29,4,3,'#5000');px(x-1,bY-28,2,2,'#ff2020');
      ctx.globalAlpha=0.45;px(x-3,bY-30,6,4,'#ff2020');ctx.globalAlpha=1;
      // Неон-полосы на корпусе
      px(x-6,bY-18,2,6,'#00e8ff');ctx.globalAlpha=0.25;px(x-7,bY-19,4,8,'#00e8ff');ctx.globalAlpha=1;
    }else if(ob.type==='cyber_car'){
      // Кибер-машина (парящий автомобиль)
      const hover=(Math.sin(ob.bob*2)*2)|0;
      px(x-19,bY-1,38,2,'rgba(0,0,0,0.4)');
      // Подушка воздуха (свечение снизу)
      ctx.globalAlpha=0.4;px(x-17,bY-3,34,4,'#00e8ff');ctx.globalAlpha=0.15;px(x-19,bY-1,38,6,'#00e8ff');ctx.globalAlpha=1;
      // Кузов нижний
      px(x-16,bY-10+hover,32,8,C.cyberBldDk);px(x-16,bY-10+hover,32,1,C.cyberBldHi);
      // Кузов верхний
      px(x-12,bY-18+hover,24,8,C.cyberBldMid);px(x-11,bY-19+hover,22,2,C.cyberBldHi);px(x+10,bY-17+hover,2,6,'#040810');
      // Лобовое стекло
      px(x-8,bY-17+hover,16,6,'#051828');px(x-7,bY-17+hover,14,1,'#0a2a40');
      // Неон-обвес
      ctx.globalAlpha=0.9;px(x-16,bY-10+hover,32,1,C.neonC);px(x-16,bY-3+hover,32,1,C.neonC);ctx.globalAlpha=1;
      // Фары
      px(x+13,bY-13+hover,4,3,'#002030');ctx.globalAlpha=0.8;px(x+15,bY-13+hover,3,3,C.neonC);ctx.globalAlpha=0.3;px(x+13,bY-15+hover,8,7,C.neonC);ctx.globalAlpha=1;
    }else if(ob.type==='neon_barrier'){
      // Неон-барьер (голографическое заграждение)
      px(x-4,bY-1,8,2,'rgba(0,0,0,0.4)');
      // Пост
      px(x-1,bY-24,3,24,C.robotBody);px(x-1,bY-24,1,24,C.robotHi);
      // Голо-панели (статичные)
      ctx.globalAlpha=0.75;
      for(let s=0;s<3;s++){const sy=bY-22+s*7;px(x-8,sy,16,5,'#00e8ff');px(x-8,sy,16,1,'#ffffff');px(x-8,sy+4,16,1,'#004488');}
      ctx.globalAlpha=0.18;px(x-9,bY-23,18,22,C.neonC);
      ctx.globalAlpha=1;
      // Предупреждение
      ctx.globalAlpha=0.85;txt('!',x,bY-26,'#ff0090',7,'center','#000');ctx.globalAlpha=1;
    }else if(ob.type==='cat'){
      // Котик-враг (ходит, хвост виляет)
      const bob=Math.sin(ob.bob*2.5)*2|0;
      // тень
      ctx.globalAlpha=0.2;px(x-7,bY-1,16,3,'#000');ctx.globalAlpha=1;
      // тело
      px(x-7,bY-10+bob,14,9,C.catFurO);px(x-5,bY-12+bob,10,5,C.catFurO);
      px(x-6,bY-11+bob,12,4,C.catFurOHi);
      // голова
      px(x-4,bY-18+bob,10,9,C.catFurO);px(x-3,bY-19+bob,8,5,C.catFurOHi);
      // уши
      px(x-4,bY-22+bob,4,5,C.catFurO);px(x-3,bY-21+bob,2,3,C.catFurOHi);
      px(x+2,bY-21+bob,4,4,C.catFurO);px(x+3,bY-20+bob,2,3,C.catFurOHi);
      // глаза (злые — угрожают)
      px(x-2,bY-15+bob,3,2,C.catEye);px(x+2,bY-15+bob,3,2,C.catEye);
      // нос
      px(x,bY-12+bob,2,2,C.catNose);
      // хвост (виляет)
      const tailX=x+7+Math.sin(ob.bob*3)|0;
      px(tailX,bY-8+bob,3,8,C.catFurO);px(tailX+1,bY-12+bob,3,5,C.catFurO);
      // полоски
      px(x-5,bY-10+bob,2,6,C.catFurODk);px(x-1,bY-10+bob,2,6,C.catFurODk);px(x+3,bY-10+bob,2,6,C.catFurODk);
      // предупреждение — не трогай!
      txt('ʘᴥʘ',x+1,bY-26+bob,C.catEye,4,'center','#000');
    }else if(ob.type==='stone'){
      // Камень с мхом
      ctx.globalAlpha=0.25;px(x-8,bY-1,18,4,'#000');ctx.globalAlpha=1;
      px(x-8,bY-10,16,10,C.stoneCol);px(x-7,bY-12,14,4,C.stoneCol);
      px(x-6,bY-13,10,3,C.stoneHi);
      px(x+4,bY-10,4,10,C.stoneDk);px(x+3,bY-12,3,3,C.stoneDk);
      px(x-6,bY-14,5,3,C.stoneMoss);px(x+1,bY-13,4,2,C.stoneMoss);
      px(x-4,bY-11,3,2,C.stoneMoss);
    }else if(ob.type==='british_soldier'){
      // Британский солдат — красный мундир, пробковый шлем, винтовка
      const ph=Math.sin(ob.bob),lA=(ph*3)|0,lB=(-ph*3)|0,aA=(Math.sin(ob.bob*1.2)*2)|0;
      px(x-8,bY-1,16,2,'rgba(0,0,0,0.35)');
      // ноги — тёмные штаны
      px(x-4,bY-9+lA,3,9,C.britKhakiDk);px(x+1,bY-9+lB,3,9,C.britKhakiDk);
      px(x-5,bY-1,5,2,C.britKhakiDk);px(x+1,bY-1,5,2,C.britKhakiDk);
      // тело — красный мундир
      px(x-5,bY-22,11,13,C.britRed);px(x-5,bY-22,11,2,C.britRedHi);px(x+4,bY-20,2,11,C.britRedDk);
      // жёлтые пуговицы
      px(x-1,bY-20,1,10,C.goldCol);
      // левая рука — держит ружьё
      px(x-8,bY-19+aA,4,2,C.britRed);
      // правая рука — целится
      px(x+5,bY-20-aA,5,2,C.britRed);
      // винтовка
      px(x+5,bY-26-aA,2,14,C.britRifle);px(x+4,bY-27-aA,4,2,C.britRifleMet);px(x+6,bY-27-aA,1,14,C.britRifleMet);
      // шея
      px(x-1,bY-24,3,3,C.skin);
      // пробковый шлем (тропический)
      px(x-5,bY-32,10,4,C.britHelm);px(x-6,bY-30,12,2,C.britHelmHi);px(x-4,bY-34,8,3,C.britHelm);
      px(x-3,bY-35,6,1,C.britHelmHi);px(x+3,bY-31,2,4,C.britKhakiDk);
      // лицо под козырьком
      px(x-3,bY-29,7,4,C.skin);px(x-2,bY-27,2,2,'#200808');px(x+1,bY-27,2,2,'#200808');
      // усы
      px(x-2,bY-25,5,1,'#5a3010');
    }else if(ob.type==='british_officer'){
      // Офицер — шляпа с плюмажем, сабля, эполеты
      const ph=Math.sin(ob.bob*0.9),lA=(ph*2)|0,lB=(-ph*2)|0,aA=(Math.sin(ob.bob*1.1)*3)|0;
      px(x-9,bY-1,18,2,'rgba(0,0,0,0.4)');
      // ноги
      px(x-4,bY-10+lA,3,10,C.britKhakiDk);px(x+1,bY-10+lB,3,10,C.britKhakiDk);
      px(x-5,bY-1,5,2,C.britKhakiDk);px(x+1,bY-1,5,2,C.britKhakiDk);
      // тело — красный мундир с эполетами
      px(x-6,bY-23,12,13,C.britRed);px(x-6,bY-23,12,2,C.britRedHi);px(x+4,bY-21,2,11,C.britRedDk);
      px(x-1,bY-21,1,11,C.goldCol); // пуговицы
      // эполеты (золотые погоны)
      px(x-8,bY-23,4,3,C.goldCol);px(x+4,bY-23,4,3,C.goldCol);
      // правая рука — сабля замахнулась
      px(x+5,bY-22+aA,5,2,C.britRed);
      // сабля
      px(x+9,bY-32+aA,2,12,C.britRifleMet);px(x+8,bY-31+aA,4,2,C.goldCol);px(x+10,bY-33+aA,2,3,C.britRifleMet);
      // левая рука
      px(x-9,bY-20-aA,4,2,C.britRed);
      // шея
      px(x-1,bY-25,3,3,C.skin);
      // офицерская фуражка с плюмажем
      px(x-5,bY-34,10,5,C.britRed);px(x-6,bY-32,12,2,C.britRedHi);px(x-4,bY-36,8,2,C.britKhakiDk);
      // плюмаж (белый)
      px(x-2,bY-40,1,5,'#e8e8d0');px(x,bY-42,1,7,'#f0f0e0');px(x+2,bY-40,1,5,'#e8e8d0');
      // лицо
      px(x-3,bY-31,7,5,C.skin);px(x-2,bY-29,2,2,'#200808');px(x+1,bY-29,2,2,'#200808');
      px(x-2,bY-27,5,1,'#402010'); // усы и бакенбарды
    }else if(ob.type==='bkr_entity'){
      // Сущность бэкрумса — тёмная высокая фигура без чёрт лица
      const ph=Math.sin(ob.bob*0.5),lA=(ph*2)|0,lB=(-ph*2)|0;
      ctx.globalAlpha=0.85;
      px(x-7,bY-1,14,2,'rgba(0,0,0,0.5)');
      // ноги
      px(x-4,bY-10+lA,3,10,C.bkrEntity);px(x+1,bY-10+lB,3,10,C.bkrEntity);
      // тело — вытянутое
      px(x-4,bY-26,9,16,C.bkrEntity);px(x-4,bY-26,9,2,C.bkrEntityHi);px(x+3,bY-24,2,14,'#000');
      // длинные руки
      px(x-11,bY-22,8,2,C.bkrEntity);px(x-12,bY-24,3,4,C.bkrEntity);
      px(x+5,bY-22,8,2,C.bkrEntity);px(x+11,bY-24,3,4,C.bkrEntity);
      // голова — почти без лица, тёмная
      px(x-5,bY-34,10,8,C.bkrEntity);px(x-4,bY-35,8,2,C.bkrEntityHi);px(x+3,bY-33,2,7,'#000');
      // пустые глаза — чуть светлее
      ctx.globalAlpha=0.4;px(x-3,bY-31,2,2,C.bkrWallDk);px(x+1,bY-31,2,2,C.bkrWallDk);ctx.globalAlpha=0.85;
      ctx.globalAlpha=1;
    }else if(ob.type==='bkr_light'){
      // Упавший флуоресцентный светильник — лежит на полу
      const flicker=(Math.sin(ob.bob*7)*0.5+0.5);
      px(x-9,bY-1,18,2,'rgba(0,0,0,0.3)');
      px(x-9,bY-8,18,7,C.bkrWallDk);px(x-9,bY-8,18,1,C.bkrWall);
      ctx.globalAlpha=0.5+flicker*0.4;
      px(x-8,bY-7,16,5,C.bkrLight);ctx.globalAlpha=0.3+flicker*0.3;px(x-10,bY-10,20,12,C.bkrLight);
      ctx.globalAlpha=1;
      px(x-4,bY-8,1,4,'#605820');px(x+3,bY-8,1,4,'#605820');
    }else if(ob.type==='bkr_tv'){
      // Телевизор с белым экраном — стоит на полу
      const flicker=(Math.sin(ob.bob*11)*0.5+0.5);
      px(x-13,bY-1,26,2,'rgba(0,0,0,0.35)');
      // корпус (серо-бежевый)
      px(x-13,bY-22,26,22,C.bkrWallDk);px(x-12,bY-23,24,2,C.bkrWall);
      px(x-13,bY-22,2,22,C.bkrWall);px(x+11,bY-22,2,22,'#707048');
      // экран — белый, мерцает
      ctx.globalAlpha=0.75+flicker*0.25;
      px(x-10,bY-20,20,14,C.bkrLight);
      ctx.globalAlpha=1;
      // помехи — горизонтальные полосы
      ctx.globalAlpha=0.12+flicker*0.25;
      for(let s=0;s<3;s++)px(x-10,bY-20+s*4+((Math.floor(ob.bob*4))%4),20,2,'#000');
      ctx.globalAlpha=1;
      // свечение от экрана
      ctx.globalAlpha=(0.15+flicker*0.2);px(x-14,bY-24,28,26,C.bkrLight);ctx.globalAlpha=1;
      // ножка и антенна
      px(x-2,bY-1,4,2,C.bkrWallDk);
      px(x-5,bY-22,1,8,'#909060');px(x+4,bY-22,1,10,'#909060');
      px(x-6,bY-30,1,9,'#a0a070');px(x+5,bY-28,1,8,'#a0a070');
    }
  }

  function drawLootDrop(ld:LootDrop){
    const x=ld.x|0,y=(GY-9+Math.sin(ld.bob)*3)|0;
    ctx.globalAlpha=0.35;px(x-5,GY-2,10,3,'#000');ctx.globalAlpha=1;
    if(ld.type==='loot_flesh'){
      px(x-4,y-3,8,5,C.lootFlesh);px(x-3,y-4,6,2,C.lootFleshHi);
      px(x-2,y-2,2,2,'#5a0808');px(x+1,y-3,2,1,'#c04828');px(x-3,y-1,2,1,C.lootFleshHi);
    }else if(ld.type==='loot_leather'){
      px(x-4,y-3,8,5,C.lootLeather);px(x-3,y-4,6,2,C.lootLeatherHi);
      px(x-3,y-1,7,1,'#4a2808');px(x+2,y-3,2,1,C.lootLeatherHi);
    }else if(ld.type==='loot_cloth'){
      px(x-5,y-2,10,4,C.lootCloth);px(x-4,y-3,8,1,C.lootClothHi);
      px(x-4,y-1,3,2,'#a0988a');px(x+2,y-2,3,2,'#a0988a');
    }else if(ld.type==='loot_scale'){
      px(x-3,y-5,6,7,C.lootScale);px(x-2,y-6,4,2,C.lootScaleHi);
      px(x-3,y-3,2,2,C.lizardScaleDk);px(x+1,y-4,2,2,C.lizardScaleDk);
    }else if(ld.type==='loot_ore'){
      px(x-4,y-4,8,6,C.lootOre);px(x-3,y-5,5,2,C.lootOreHi);
      px(x-1,y-5,2,1,'#c8c8d8');px(x+2,y-3,1,2,'#a8a8bc');px(x-2,y-2,2,1,C.lootOreHi);
    }
  }
  function drawLootFloats(){
    for(const lf of lootFloats){
      const a=lf.life/lf.maxLife;ctx.globalAlpha=a;
      txt(lf.text,lf.x,lf.y,'#ffe870',5,'center','#000');
      ctx.globalAlpha=1;
    }
  }
  function drawDust(){
    for(const d of dust){
      const lr=d.life/d.maxLife;
      const a=Math.max(0,lr);
      const col=lr>0.66?'#a08870':lr>0.33?'#7a6050':'#4a3828';
      ctx.globalAlpha=a*0.25;
      const hs=lr>0.5?3:2;
      px(d.x-1,d.y-1,hs+1,hs+1,'#c0a888');
      ctx.globalAlpha=a*0.7;
      const sz=lr>0.66?3:lr>0.33?2:1;
      px(d.x,d.y,sz,sz,col);
      ctx.globalAlpha=1;
    }
  }
  function drawGhostParticles(){
    for(const g of ghostParticles){
      const a=g.life/g.maxLife;
      // outer glow ring
      ctx.globalAlpha=a*0.3;
      px(g.x-1,g.y-1,4,4,'#80f0e0');
      // teardrop body: 2x3 with pointed bottom
      ctx.globalAlpha=a*0.8;
      px(g.x,g.y-2,2,2,C.potGlow);  // top wider
      px(g.x,g.y,2,1,C.potGlow);    // mid
      px(g.x,g.y+1,1,1,C.potGlow);  // pointed bottom
      // white core pixel
      ctx.globalAlpha=a;
      px(g.x,g.y-2,1,1,'#ffffff');
      ctx.globalAlpha=1;
    }
  }
  function drawSwordParticles(){
    for(const sp of swordParticles){
      const a=sp.life/sp.maxLife;
      if(sp.spark){
        // white→gold→orange 3 layers
        ctx.globalAlpha=a*0.4;
        px(sp.x-1,sp.y-1,4,4,'#ff8020');  // orange outer
        ctx.globalAlpha=a*0.7;
        px(sp.x,sp.y,2,2,'#ffd040');       // gold mid
        ctx.globalAlpha=a*0.9;
        px(sp.x,sp.y,1,1,'#ffffff');       // white core
        // cross sparkle lines at high life
        if(a>0.6){
          ctx.globalAlpha=a*0.5;
          px(sp.x-1,sp.y,3,1,'#ffe880');  // horizontal
          px(sp.x,sp.y-1,1,3,'#ffe880');  // vertical
        }
      }else{
        // blue core + soft blue glow
        ctx.globalAlpha=a*0.3;
        px(sp.x-1,sp.y-1,4,4,'#4060ff');  // outer blue glow
        ctx.globalAlpha=a*0.8;
        px(sp.x,sp.y,2,2,'#80c8ff');       // blue core
        ctx.globalAlpha=a;
        px(sp.x,sp.y,1,1,'#c0e8ff');       // bright center
      }
      ctx.globalAlpha=1;
    }
  }

  function drawZoneGate(g:ZoneGate){
    const x=g.x|0;
    if(g.kind==='desert'){
      // Египетские обелиски
      const ob=C.pyramid,obHi=C.pyramidHi,obDk=C.pyramidDk,obM=C.pyramidMid;
      // Левый обелиск — сужается вверх
      for(let i=0;i<78;i++){const ww=Math.max(3,(12-i*8/78))|0;px(x-42-((ww/2)|0),GY-i,ww,1,i<5?obHi:i>70?obDk:ob);}
      px(x-46,GY-2,14,4,obM);// пьедестал
      // Правый обелиск
      for(let i=0;i<78;i++){const ww=Math.max(3,(12-i*8/78))|0;px(x+42-((ww/2)|0),GY-i,ww,1,i<5?obHi:i>70?obDk:ob);}
      px(x+32,GY-2,14,4,obM);// пьедестал
      // Перемычка (линтель)
      px(x-46,GY-86,92,14,ob);px(x-46,GY-86,92,2,obHi);px(x-46,GY-75,92,2,obDk);
      // Орнамент — глаз на линтеле
      px(x-8,GY-83,16,7,obDk);px(x-6,GY-82,12,5,'#1a0c04');px(x-4,GY-81,8,3,obHi);px(x-2,GY-80,4,1,ob);
      // Свет у основания обелисков
      ctx.globalAlpha=0.25;px(x-50,GY-8,18,8,obHi);px(x+32,GY-8,18,8,obHi);ctx.globalAlpha=1;
      ctx.globalAlpha=0.8;txt('ПУСТЫНЯ',x,GY-96,'#f5c040',6,'center','#3a1800');ctx.globalAlpha=1;
    }else{
      // Средневековые каменные ворота
      const stone='#2a1e3c',stHi='#3c2a54',stDk='#190e28',stMoss='#1e3020';
      const col=g.kind==='dawn'?'#ffe860':'#c8a8ff';
      const pW=16,pTop=GY-75,lintH=10;
      const openH=58; // высота прохода
      // Левая опора
      px(x-40,pTop,pW,GY-pTop,stone);px(x-40,pTop,2,GY-pTop,stHi);px(x-26,pTop,1,GY-pTop,stDk);
      // Зубцы левой опоры
      for(let m=0;m<3;m++)px(x-40+m*6,pTop-6,4,6,stone);
      // Правая опора
      px(x+24,pTop,pW,GY-pTop,stone);px(x+24,pTop,2,GY-pTop,stHi);px(x+38,pTop,1,GY-pTop,stDk);
      // Зубцы правой опоры
      for(let m=0;m<3;m++)px(x+24+m*6,pTop-6,4,6,stone);
      // Линтель (перемычка сверху арки)
      px(x-40,GY-openH-lintH,80,lintH,stone);px(x-40,GY-openH-lintH,80,2,stHi);px(x-40,GY-openH-2,80,2,stDk);
      // Зубцы линтеля по центру
      for(let m=0;m<8;m++)px(x-38+m*10,GY-openH-lintH-5,7,5,stone);
      // Арочный проём (тёмный)
      px(x-24,GY-openH,48,openH,stDk);
      // Округление арки (2 пикселя срезов углов)
      px(x-24,GY-openH,2,2,stone);px(x+20,GY-openH,2,2,stone);
      // Кладка стен на опорах (горизонтальные швы)
      for(let y=pTop+6;y<GY-openH-lintH;y+=8){px(x-40,y,pW,1,stDk);px(x+24,y,pW,1,stDk);}
      // Мох у основания
      px(x-40,GY-5,pW,3,stMoss);px(x+24,GY-5,pW,3,stMoss);
      // Факел левый
      px(x-31,GY-48,3,10,C.wood);px(x-32,GY-52,5,1,C.buckle);
      const fl=Math.sin(crow.bob*4+g.x*0.1)*1.5|0;
      ctx.globalAlpha=0.8;px(x-33,GY-58+fl,6,6,'#ff8010');px(x-32,GY-61+fl,4,4,'#ffcc20');ctx.globalAlpha=0.4;px(x-35,GY-60+fl,10,8,'#ff6000');ctx.globalAlpha=1;
      // Факел правый
      px(x+28,GY-48,3,10,C.wood);px(x+27,GY-52,5,1,C.buckle);
      ctx.globalAlpha=0.8;px(x+27,GY-58-fl,6,6,'#ff8010');px(x+28,GY-61-fl,4,4,'#ffcc20');ctx.globalAlpha=0.4;px(x+25,GY-60-fl,10,8,'#ff6000');ctx.globalAlpha=1;
      // Табличка с названием
      ctx.globalAlpha=0.85;txt(g.kind==='dawn'?'РАССВЕТ':'ЗАКАТ',x,GY-openH-lintH-10,col,6,'center','#0a0418');ctx.globalAlpha=1;
    }
    if(g.kind==='cyber'){
      // Киберпанк-портал: голографическая арка из неона
      const openH=62,pW=10,pTop=GY-80;
      // Левая колонна — тёмный металл с неон-стрипами
      px(x-42,pTop,pW,GY-pTop,C.cyberBldDk);px(x-42,pTop,2,GY-pTop,C.cyberBldMid);
      for(let s=pTop+6;s<GY-openH;s+=12)px(x-42,s,pW,1,C.neonC);
      // Правая колонна
      px(x+32,pTop,pW,GY-pTop,C.cyberBldDk);px(x+32,pTop,2,GY-pTop,C.cyberBldMid);
      for(let s=pTop+6;s<GY-openH;s+=12)px(x+32,s,pW,1,C.neonC);
      // Перекладина сверху
      px(x-42,GY-openH-8,84,8,C.cyberBldDk);px(x-42,GY-openH-8,84,1,C.neonC);px(x-42,GY-openH-1,84,1,C.neonC);
      // Голо-портал внутри (статичный)
      ctx.globalAlpha=0.22;
      for(let py=GY-openH;py<GY;py+=3)px(x-30,py,62,2,C.neonC);
      ctx.globalAlpha=0.10;px(x-30,GY-openH,62,openH,'#004488');
      ctx.globalAlpha=1;
      // Неон-свечение арки (статичное)
      ctx.globalAlpha=0.7;
      px(x-42,pTop,2,GY-pTop,C.neonC);px(x+40,pTop,2,GY-pTop,C.neonC);
      ctx.globalAlpha=0.18;
      px(x-44,pTop-2,6,GY-pTop+4,C.neonC);px(x+38,pTop-2,6,GY-pTop+4,C.neonC);
      ctx.globalAlpha=1;
      // Антенны (без мигания)
      px(x-38,pTop-12,2,12,C.cyberBldHi);px(x+36,pTop-12,2,12,C.cyberBldHi);
      ctx.globalAlpha=0.8;px(x-39,pTop-13,4,3,C.neonM);px(x+35,pTop-13,4,3,C.neonM);ctx.globalAlpha=1;
      // Надпись
      ctx.globalAlpha=0.85;txt('CYBERPUNK',x,GY-openH-14,C.neonC,6,'center','#000');ctx.globalAlpha=1;
    }else if(g.kind==='cat'){
      // Кошачьи ворота — арка из розовых колонн с ушами
      const pTop=GY-75,openH=58,pW=12;
      // Левая колонна
      px(x-44,pTop,pW,GY-pTop,'#e8a0c8');px(x-44,pTop,2,GY-pTop,'#f8c8e8');px(x-33,pTop,2,GY-pTop,'#c870a8');
      // Правая колонна
      px(x+32,pTop,pW,GY-pTop,'#e8a0c8');px(x+32,pTop,2,GY-pTop,'#f8c8e8');px(x+43,pTop,2,GY-pTop,'#c870a8');
      // Перекладина
      px(x-44,GY-openH-10,88,10,'#e8a0c8');px(x-44,GY-openH-10,88,2,'#f8c8e8');px(x-44,GY-openH-2,88,2,'#c870a8');
      // Кошачьи уши на колоннах
      px(x-48,pTop-14,8,15,'#e8a0c8');px(x-46,pTop-10,4,9,'#f8c8e8');
      px(x+40,pTop-14,8,15,'#e8a0c8');px(x+42,pTop-10,4,9,'#f8c8e8');
      // Лапки-украшения
      for(let i=0;i<4;i++){px(x-43+i*26,GY-openH-8,8,6,'#f8c8e8');px(x-42+i*26,GY-openH-7,6,4,'#c870a8');}
      // Портал (мягкий розовый)
      ctx.globalAlpha=0.18;px(x-30,GY-openH,62,openH,'#ffaadd');ctx.globalAlpha=1;
      // Следы лап на арке
      ctx.globalAlpha=0.6;
      txt('🐾',x-10,GY-openH-16,'#f060b0',7,'center','#000');
      txt('🐾',x+12,GY-openH-16,'#f060b0',7,'center','#000');
      ctx.globalAlpha=1;
      txt('МИР КОТОВ',x,GY-openH-26,'#ff80c0',5,'center','#000');
    }
  }

  // ---- RPG Рендер ----
  function drawFloatNums(){
    for(const fn of floatNums){
      const a=Math.min(1,fn.life/fn.maxLife*2);ctx.globalAlpha=a;
      txt('+'+fn.val+'XP',fn.x,fn.y,'#ffe840',7,'center','#0a0418');
      ctx.globalAlpha=1;
    }
  }
  function drawXPBar(){
    const bw=Math.max(40,maxHp*14+2),bx=5,by=57;
    px(bx-1,by-1,bw+2,9,'rgba(6,2,14,0.78)');
    px(bx,by,bw,7,'#1a1038');
    const prog=Math.min(1,xp/xpToNext);
    const fw=Math.floor(bw*prog);
    if(fw>0){
      // 3-row gradient fill: dark bottom, main mid, bright top
      ctx.fillStyle='#3828a0';ctx.fillRect(bx,by+5,fw,2);  // dark bottom
      ctx.fillStyle='#5040c8';ctx.fillRect(bx,by+2,fw,3);  // main mid
      ctx.fillStyle='#9070f8';ctx.fillRect(bx,by,fw,2);    // bright top strip
      // tick marks every 8px
      for(let tx=bx+8;tx<bx+fw-2;tx+=8){
        ctx.fillStyle='rgba(30,10,80,0.5)';ctx.fillRect(tx,by,1,7);
      }
      // glowing edge pixel at progress end
      if(fw>1){
        ctx.globalAlpha=0.9;px(bx+fw-1,by,1,7,'#c0a8ff');ctx.globalAlpha=1;
      }
    }
    txt('Lv'+level,bx+bw+4,by+6,'#c0a0f0',6,'left','#0a0418');
  }
  function drawQuestPanel(){
    if(activeQuests.length===0)return;
    const qx=5,qy=70,qw=90,qh=9;
    px(qx-1,qy-1,qw+2,activeQuests.length*qh+2,'rgba(6,2,14,0.80)');
    px(qx-1,qy-1,qw+2,1,'#2a1858');
    for(let i=0;i<activeQuests.length;i++){
      const q=activeQuests[i],y=qy+i*qh;
      const isDone=q.done,prog=Math.min(1,q.progress/q.target);
      if(!isDone&&prog>0){px(qx,y+qh-2,Math.floor(qw*prog),2,'#3a2878');px(qx,y+qh-2,Math.floor(qw*prog),1,'#6050b8');}
      const col=isDone?'#ffe840':'#a090c8';
      txt(isDone?'✓ ГОТОВО':q.icon+' '+q.desc,qx+2,y+6,col,5,'left','#000');
      if(!isDone)txt(q.progress+'/'+q.target,qx+qw-2,y+6,'#6858a8',5,'right','#000');
    }
  }
  function drawLevelUp(){
    drawOverlay();
    const BW=84,BH=58,BG=6;
    const startX=((W-(3*BW+2*BG))/2)|0;
    const BY=((H/2)-12)|0;
    txt('УРОВЕНЬ '+level+'!',W/2,BY-22,'#ffe840',9,'center','#0a0818');
    txt('Выбери улучшение:',W/2,BY-10,'#c0a0f0',6,'center','#0a0418');
    for(let i=0;i<levelUpChoices.length;i++){
      const up=levelUpChoices[i];const bx=startX+i*(BW+BG);
      px(bx,BY,BW,BH,'rgba(10,4,24,0.92)');
      px(bx,BY,BW,2,up.col);px(bx,BY+BH-2,BW,2,up.col);
      px(bx,BY,2,BH,up.col);px(bx+BW-2,BY,2,BH,up.col);
      txt(up.label,bx+BW/2,BY+13,up.col,6,'center','#000');
      // описание: разбиваем по словам
      const words=up.desc.split(' ');let l1='',l2='';let inL2=false;
      for(const w of words){if(!inL2&&(l1+w).length>12){inL2=true;l2=w;}else if(inL2)l2+=' '+w;else l1+=(l1?' ':'')+w;}
      txt(l1,bx+BW/2,BY+26,'#b0a0c8',5,'center','#000');
      if(l2)txt(l2,bx+BW/2,BY+33,'#b0a0c8',5,'center','#000');
      txt('['+(i+1)+'] CLICK',bx+BW/2,BY+BH-5,'#504890',5,'center','#000');
    }
    drawFloatNums();
  }

  // ---- HUD ----
  function drawHeart(hx:number,hy:number,full:boolean){
    const c=full?'#e84040':'#3a1020',hi=full?'#ff8080':'#2a0818';
    px(hx-3,hy-3,2,2,c);px(hx+1,hy-3,2,2,c);px(hx-4,hy-2,4,2,c);px(hx,hy-2,4,2,c);
    px(hx-4,hy,8,2,c);px(hx-3,hy+2,6,1,c);px(hx-2,hy+3,4,1,c);px(hx-1,hy+4,2,1,c);
    if(full)px(hx-3,hy-3,1,1,hi);
  }
  function drawHUD(){
    px(5,5,122,35,'rgba(6,2,14,0.85)');px(5,5,122,2,'#3a2060');
    txt('ПУТЬ '+Math.floor(distance)+'M',8,17,C.text,7,'left');
    txt('РЕК  '+best+'M',8,28,'#9080c8',7,'left');
    px(5,38,maxHp*14+6,16,'rgba(6,2,14,0.75)');
    for(let i=0;i<maxHp;i++)drawHeart(15+i*14,48,i<hp);
    drawXPBar();drawQuestPanel();
    if(hero.mounted){{px(W-80,5,75,14,'rgba(6,2,14,0.85)');txt('ВЕРХОМ!',W-76,15,'#60d870',7,'left');}}
    else if(horseEntity?.caught){{px(W-80,5,75,14,'rgba(6,2,14,0.85)');txt('[E] СЕСТЬ',W-76,15,'#e8d870',7,'left');}}
    if(ghostTimer>0||drinkAnim>0){
      const prog=ghostTimer>0?ghostTimer/GHOST_DUR:(drinkAnim/50);
      const bw=92,bx=(W/2-bw/2)|0;
      px(bx-1,5,bw+2,22,'rgba(6,2,14,0.9)');px(bx,7,bw,8,'#061a14');
      const pulse=(Math.sin(ghostTimer*0.25)+1)*0.5;
      ctx.fillStyle=`rgba(80,210,180,${0.65+pulse*0.3})`;ctx.fillRect(bx,7,(bw*prog)|0,8);
      txt(drinkAnim>0?'ПЬЕТ...':'НЕУЯЗВИМ!',W/2,23,C.potGlow,7,'center');
    }
    if(dayFlash>0){
      const a=Math.min(1,(dayFlash/180)*4);ctx.globalAlpha=a;
      txt(dayPhase===1?'РАССВЕТ':'ЗАКАТ',W/2,44,dayPhase===1?'#ffe840':'#c8a8ff',8,'center','#0a0818');
      ctx.globalAlpha=1;
    }
    if(desertFlash>0){
      const a=Math.min(1,(desertFlash/200)*4);ctx.globalAlpha=a;
      txt('ПУСТЫНЯ',W/2,56,'#f5c040',9,'center','#3a1800');
      ctx.globalAlpha=1;
    }
    if(boerFlash>0){
      const a=Math.min(1,(boerFlash/220)*4);ctx.globalAlpha=a;
      txt('БУРСКАЯ ВОЙНА',W/2,56,C.britRed,9,'center','#3a0800');
      ctx.globalAlpha=1;
    }
    if(backrooms>=61&&backrooms<=420){
      const a=backrooms<=120?(backrooms-61)/59:backrooms>=361?1-(backrooms-361)/59:1;
      ctx.globalAlpha=Math.max(0,Math.min(1,a));
      px(0,0,W,H,'rgba(20,18,0,0.25)'); // жёлтый оттенок
      if(dropActive&&!dropKill){
        // Прогресс-бар угрозы капли
        const threat=Math.max(0,Math.min(1,(dropX+200)/254));
        const bw=100,bx=(W/2-50)|0;
        px(bx-1,H-14,bw+2,10,'rgba(20,18,0,0.9)');
        ctx.fillStyle=`rgb(${(180+threat*75)|0},${(180-threat*140)|0},0)`;
        ctx.fillRect(bx,H-13,bw*threat,8);
        txt('КАПЛЯ',W/2,H-6,threat>0.8?C.britRed:'#c8b820',5,'center','#000');
      }
      ctx.globalAlpha=1;
    }
    if(speedFlash>0){
      const t2=speedFlash/120,sc=t2>0.85?1+(1-t2/0.85)*0.45:1;
      ctx.save();ctx.globalAlpha=Math.min(1,t2*3);ctx.translate(W/2,H/2-18);ctx.scale(sc,sc);
      const flash=(Math.sin(speedFlash*0.4)+1)*0.5;
      txt('x'+lastMilestone+' БЫСТРЕЕ!',0,0,`rgb(255,${(110+flash*110)|0},20)`,9,'center','#1a0820');
      ctx.restore();ctx.globalAlpha=1;
    }
    if(hitTimer>60){ctx.globalAlpha=(hitTimer-60)/30;px(0,0,W,H,'rgba(200,40,20,0.15)');ctx.globalAlpha=1;}
    // вспышка супер-удара
    if(superFlash>0){
      ctx.globalAlpha=superFlash/40*0.55;px(0,0,W,H,'#ffffff');ctx.globalAlpha=1;
    }
    // портрет кошки при супер-ударе — вписан в полосу земли (GY..H = 150..180)
    if(catTimer>0){
      const CAT_DUR=180;
      const t=catTimer/CAT_DUR;
      // выезжает снизу
      const slide=t>0.85?ease((1-t)/0.15):t<0.15?ease(t/0.15):1;
      const PW=68,PH=28; // портрет 68×28 px
      const px0=2, py0=H-PH-1; // левый нижний угол, над краем
      const drawY=(py0+(1-slide)*PH)|0;
      ctx.globalAlpha=slide;
      // фон
      px(px0,drawY,PW,PH,'#0d0820');
      px(px0,drawY,PW,1,'#3a2060');px(px0,drawY+PH-1,PW,1,'#3a2060');
      px(px0,drawY,1,PH,'#3a2060');px(px0+PW-1,drawY,1,PH,'#3a2060');
      // морда — всё компактно в 22×22 зоне
      const fx=px0+3, fy=drawY+3;
      // уши (треугольники 4×4)
      px(fx,fy,4,4,'#f0f0f0');px(fx+1,fy+1,2,2,'#f8c0c8');
      px(fx+14,fy,4,4,'#f0f0f0');px(fx+14,fy+1,2,2,'#f8c0c8');
      // голова
      px(fx,fy+3,20,18,'#f0f0f0');px(fx+1,fy+3,18,17,'#ffffff');
      px(fx,fy+3,1,18,'#ddd');px(fx+19,fy+3,1,18,'#ddd');
      // глаза зелёные
      px(fx+3,fy+7,4,4,'#38d048');px(fx+5,fy+7,2,4,'#000');px(fx+3,fy+7,1,2,'#80ff90');
      px(fx+13,fy+7,4,4,'#38d048');px(fx+15,fy+7,2,4,'#000');px(fx+13,fy+7,1,2,'#80ff90');
      // нос
      px(fx+9,fy+13,3,2,'#f090a0');px(fx+10,fy+13,1,1,'#ffb0c0');
      // рот
      px(fx+7,fy+15,2,1,'#c06878');px(fx+11,fy+15,2,1,'#c06878');px(fx+9,fy+15,2,1,'#c06878');
      // усы левые (3 штуки)
      px(fx-7,fy+11,7,1,'#bbb');px(fx-8,fy+13,9,1,'#bbb');px(fx-6,fy+15,6,1,'#bbb');
      // усы правые
      px(fx+20,fy+11,7,1,'#bbb');px(fx+19,fy+13,9,1,'#bbb');px(fx+20,fy+15,6,1,'#bbb');
      // текст МЯЯУ справа от мордочки
      ctx.font=`6px 'Press Start 2P',monospace`;ctx.textAlign='left';
      ctx.fillStyle='#1a0830';ctx.fillText('МЯУ!',px0+27,drawY+10);ctx.fillText('МЯУ!',px0+27,drawY+10);
      ctx.fillStyle='#f0c8ff';ctx.fillText('МЯУ!',px0+27,drawY+10);
      ctx.fillStyle='#1a0830';ctx.fillText('SUPER!',px0+27,drawY+20);
      ctx.fillStyle='#ffe080';ctx.fillText('SUPER!',px0+27,drawY+20);
      ctx.globalAlpha=1;
    }
    // иконка меча (ЛКМ)
    {const pulse=(Math.sin(camX*0.05)+1)*0.5;ctx.globalAlpha=0.6+pulse*0.3;drawSwordInHand(W-18,58,-0.5);ctx.globalAlpha=1;}
    if(swordSlash===0){const pulse=(Math.sin(camX*0.08)+1)*0.5;ctx.globalAlpha=0.35+pulse*0.2;txt('ЛКМ',W-12,70,'#c8e0ff',6,'right','#0a1428');ctx.globalAlpha=1;}
    // супер-удар (Q) — полоска кулдауна
    {
      const bw=60,bx=W-bw-4,by=76;
      px(bx-1,by-1,bw+2,10,'rgba(6,2,14,0.85)');
      const ready=superTimer===0;
      const prog=ready?1:1-superTimer/SUPER_COOLDOWN;
      ctx.fillStyle=ready?'#ffe840':'#806820';ctx.fillRect(bx,by,bw*prog,8);
      const pulse=(Math.sin(camX*0.1)+1)*0.5;
      ctx.globalAlpha=ready?0.7+pulse*0.25:0.45;
      txt(ready?'[Q] СУПЕР!':'[Q]...',W-4,by+7,ready?'#ffe840':'#7a6020',6,'right','#0a0818');
      ctx.globalAlpha=1;
    }
    // спринт лошади (Shift)
    if(hero.mounted){
      const bw=60,bx=W-bw-4,by=90;
      px(bx-1,by-1,bw+2,10,'rgba(6,2,14,0.85)');
      if(sprintActive>0){
        // активен — показываем оставшееся время
        const prog=sprintActive/SPRINT_DURATION;
        ctx.fillStyle='#40e8ff';ctx.fillRect(bx,by,bw*prog,8);
        txt('[SHIFT] СПРИНТ!',W-4,by+7,'#40e8ff',6,'right','#0a0818');
      } else {
        const ready=sprintTimer===0;
        const prog=ready?1:1-sprintTimer/SPRINT_COOLDOWN;
        ctx.fillStyle=ready?'#a0ffd8':'#2a6050';ctx.fillRect(bx,by,bw*prog,8);
        ctx.globalAlpha=ready?0.85:0.45;
        txt(ready?'[SHIFT] ВПЕРЁД!':'[SHIFT]...',W-4,by+7,ready?'#a0ffd8':'#2a6050',6,'right','#0a0818');
        ctx.globalAlpha=1;
      }
    }
    drawFloatNums();
  }

  function centerText(lines:{t:string;size:number;col?:string;gap?:number}[],yStart:number){
    let y=yStart;
    for(const ln of lines){txt(ln.t,W/2,y,ln.col||C.text,ln.size,'center','#000');y+=ln.gap||(ln.size+6);}
  }
  function csCaption(s:string,f:number){
    ctx.globalAlpha=clamp01(f);
    px(0,H-28,W,22,'rgba(6,2,14,0.88)');px(0,H-28,W,2,'#2a1050');
    txt(s,W/2,H-13,C.text,7,'center','#0a0418');ctx.globalAlpha=1;
  }
  function drawOverlay(){ctx.fillStyle='rgba(8,4,18,0.72)';ctx.fillRect(0,0,W,H);}

  function drawMenu(){
    drawOverlay();
    drawPumpkinHead(W/2,52);px(W/2-10,42,20,12,C.pumpkin);px(W/2-12,45,24,8,C.pumpkin);
    centerText([
      {t:'СОРВИ ГОЛОВА',size:11,col:C.pumpkin,gap:16},
      {t:'Безголовый всадник',size:7,col:'#c8b0e8',gap:20},
    ],52);
    // Два пункта меню
    const items=['ИГРАТЬ','ТАБЛИЦА ЛИДЕРОВ'];
    const cols=['#ffe08a','#a0c8ff'];
    const itemY=108;
    for(let i=0;i<items.length;i++){
      const sel=menuSel===i;
      const col=sel?cols[i]:'#4a3868';
      if(sel){txt('►',W/2-62,itemY+i*18,col,7,'left','#000');}
      txt(items[i],W/2-46,itemY+i*18,col,7,'left','#000');
    }
    txt('↑↓ выбор  ПРОБЕЛ подтвердить',W/2,H-10,C.text,5,'center','#000');
  }
  function drawDead(){
    drawOverlay();
    const deathMsg=dropKill?'КАПЛЯ РАЗОРВАЛА!':'СОРВИ ГОЛОВА ПАЛ';
    const deathCol=dropKill?'#c8c820':'#e85a5a';
    const deathSub=dropKill?'Бэкрумс забрал тебя...':'Ворона улетела...';
    centerText([{t:deathMsg,size:11,col:deathCol,gap:20},{t:'ПУТЬ: '+Math.floor(distance)+'M',size:7,gap:14},{t:'РЕКОРД: '+best+'M',size:7,col:'#a090d0',gap:18},{t:deathSub,size:7,col:'#9070b0',gap:17},{t:'>> НАЖМИ ЧТОБЫ СНОВА <<',size:7,col:'#ffe08a',gap:10}],52);
  }

  function drawPumpkinLight(){
    const mounted=hero.mounted;
    const lx=(hero.x-(mounted?4:2))|0,ly=(hero.y-(mounted?36:34))|0;
    const pulse=(Math.sin(crow.bob*3)+1)*0.5;
    const grd=ctx.createRadialGradient(lx,ly,1,lx,ly+10,55);
    grd.addColorStop(0,`rgba(255,160,30,${(0.26+pulse*0.10).toFixed(2)})`);
    grd.addColorStop(0.4,`rgba(220,70,10,${(0.10+pulse*0.05).toFixed(2)})`);
    grd.addColorStop(1,'rgba(180,40,0,0)');
    ctx.globalCompositeOperation='screen';
    ctx.fillStyle=grd;ctx.fillRect(lx-56,ly-16,112,92);
    ctx.globalCompositeOperation='source-over';
  }
  function applyBloom(){
    bCtx.clearRect(0,0,W,H);
    bCtx.filter='blur(2.5px) brightness(1.9)';
    bCtx.drawImage(cv,0,0);
    bCtx.filter='none';
    ctx.globalCompositeOperation='screen';
    ctx.globalAlpha=0.20;
    ctx.drawImage(bloomCv,0,0);
    ctx.globalCompositeOperation='source-over';
    ctx.globalAlpha=1;
  }
  function drawScanlines(){
    ctx.globalAlpha=0.07;
    ctx.fillStyle='#000';
    for(let y=0;y<H;y+=2)ctx.fillRect(0,y,W,1);
    ctx.globalAlpha=1;
  }
  function render(){
    drawBG();
    for(const g of zoneGates)drawZoneGate(g);
    drawCrowFull(crow.x,crow.y);
    if(horseEntity&&!hero.mounted)drawWildHorse(horseEntity.x,horseEntity.y);
    for(const p of potions)drawGhostPotion(p.x,p.y+Math.sin(p.bob)*3);
    for(const sw of swordItems)drawSwordItem(sw.x,sw.y+Math.sin(sw.bob)*3);
    for(const g of goldItems)drawGoldItem(g.x,g.y+Math.sin(g.bob)*3,g.bob);
    for(const ob of obstacles)drawOb(ob);
    for(const ld of lootDrops)drawLootDrop(ld);
    drawLootFloats();
    drawDust();drawGhostParticles();drawSwordParticles();
    // Дырка и капля — рисуем ПОВЕРХ препятствий и под героем
    if(holeActive)drawEscapeHole(holeX);
    if(dropActive&&!dropKill)drawDrop(dropX);
    if(state===ST.PLAY||state===ST.DEAD||state===ST.LEVELUP){if(hero.mounted)drawHeroOnHorse(hero.x,hero.y);else drawHeroOnFoot(hero.x,hero.y);}
    if(state===ST.PLAY||state===ST.LEVELUP)drawPumpkinLight();
    if(state===ST.PLAY)drawHUD();
    if(state===ST.MENU)drawMenu();
    if(state===ST.DEAD)drawDead();
    if(state===ST.LEVELUP)drawLevelUp();
    applyBloom();
    const vg=ctx.createRadialGradient(W/2,H/2,50,W/2,H/2,200);
    vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(0.6,'rgba(0,0,0,0.12)');vg.addColorStop(1,'rgba(0,0,0,0.65)');
    ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    drawScanlines();
  }

  // ---- Главный цикл ----
  let animId=0;
  function loop(){
    update();render();
    animId=requestAnimationFrame(loop);
  }
  loop();

  // подавляем TS6133 для функций, зарезервированных для будущего использования
  void drawCrowEmpty; void csCaption;

  // ---- Cleanup / Restart ----
  const stop=()=>{
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown',onKeyDown);
    window.removeEventListener('keyup',onKeyUp);
    cv.removeEventListener('mousedown',onMouseDown);
    cv.removeEventListener('mouseup',onMouseUp);
    cv.removeEventListener('touchstart',onTouch);
    cv.removeEventListener('touchend',onTouchEnd);
  };
  const restart=()=>{awaitingRestart=false;resetGame();};
  return {stop,restart};
}
