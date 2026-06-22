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
interface ZoneGate { x:number; kind:'dawn'|'dusk'|'desert'|'cyber'|'cat'|'boer'|'mine'; entered?:boolean }
interface GoldItem  { x:number; y:number; bob:number; collected?:boolean }
interface LootDrop { type:string; x:number; y:number; bob:number; collected?:boolean }
interface LootFloat { text:string; x:number; y:number; life:number; maxLife:number }

export function startGame(
  cv: HTMLCanvasElement,
  getBest: () => number,
  saveBest: (n: number) => void,
  onDeath?: (score: number) => void,
  onOpenLeaderboard?: () => void,
  onPumpkinSpeak?: (info: { event: string; distance: number; hp: number; maxHp: number; isJoke: boolean }) => void,
): { stop: () => void; restart: () => void } {
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const W = cv.width, H = cv.height, GY = 150;
  const bloomCv = document.createElement('canvas');
  bloomCv.width = W; bloomCv.height = H;
  const bCtx = bloomCv.getContext('2d')!;

  // ---- Палитра ----
  const C = {
    skyTop:'#040c1e',skyMid:'#091828',skyBot:'#112040',skyGlow:'#1a3060',
    moon:'#f7eecb',moonLt:'#fffbe8',moonSh:'#d6c393',
    hillFar:'#0c2010',hillMid:'#163820',hillNear:'#1e5028',
    ground:'#6a4820',groundMid:'#563818',groundDk:'#3e2810',
    grass:'#52a030',grassMid:'#3e8024',grassDk:'#2a5c18',grassTip:'#72cc40',
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
    dSkyTop:'#1a6ab4',dSkyMid:'#3494d8',dSkyBot:'#78c8f0',dSkyGlow:'#c0e8f8',
    dHillFar:'#1e4820',dHillMid:'#286030',dHillNear:'#347838',
    dGrass:'#5ab838',dGrassM:'#469828',dGrassDk:'#327018',dGrassTip:'#80e050',
    dGround:'#7a5830',dGroundM:'#624618',dFog:'#c8e4f4',
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
    // Шахта/Пещера
    mineSkyTop:'#0c0810',mineSkyMid:'#160e18',mineSkyBot:'#201420',mineSkyGlow:'#2a1828',
    mineWall:'#4a3c38',mineWallHi:'#6a5850',mineWallDk:'#2a1e1c',
    mineGround:'#3a2c20',mineGroundM:'#2a1e14',mineGroundDk:'#1a1008',
    mineGrass:'#504030',mineGrassHi:'#6a5440',mineGrassDk:'#382818',
    mineFog:'#301828',
    mineTorch:'#ffaa30',mineTorchDim:'#cc7710',mineTorchGlow:'#ff6a10',
    mineOre:'#8a7058',mineOreHi:'#c0a060',mineOreDk:'#5a4030',
    // Мимик
    mimicWood:'#7a4820',mimicWoodHi:'#a06030',mimicWoodDk:'#4a2c10',
    mimicBand:'#c8a030',mimicBandHi:'#f0cc50',mimicEye:'#ff2020',
    mimicTeeth:'#e8e0c0',mimicTongue:'#d03040',mimicLock:'#d4a820',
  };

  // ---- Состояния ----
  const ST = { MENU:0, PLAY:1, DEAD:2, CUTSCENE:3, ENDING:4, LEVELUP:5, BOSS:6 };
  let state = ST.MENU, ct = 0, menuSel = 0;

  // ---- Обучение ----
  const TUT_KEY='headless_tut';
  const TUT_STEPS=[
    {icon:'↑', line1:'ПРОБЕЛ / МЫШЬ',   line2:'— ПРЫЖОК'},
    {icon:'⚔', line1:'ЛКМ',             line2:'— УДАР МЕЧОМ'},
    {icon:'🐴',line1:'ESC',             line2:'— СЛЕЗТЬ С КОНЯ'},
    {icon:'🐴',line1:'E',               line2:'— СЕСТЬ НА КОНЯ'},
    {icon:'⚡',line1:'SHIFT',           line2:'— РЫВОК!'},
  ];
  let tutStep=localStorage.getItem(TUT_KEY)?0:1;
  let tutTimer=0;
  const TUT_AUTO=300;

  function advTut(forStep:number){
    if(tutStep!==forStep)return;
    tutTimer=0;tutStep++;
    if(tutStep>TUT_STEPS.length){tutStep=0;localStorage.setItem(TUT_KEY,'1');}
  }

  // ---- Игровые переменные ----
  let camX=0, speed=1.0, distance=0, best=getBest();
  let pumpkinSpeakNext=1500;
  const hero = { x:54, y:GY, vy:0, onGround:true, mounted:true, runFrame:0, landTimer:0 };
  const GRAV=0.62, JUMP_V=-7.4, JUMP_HOLD=-0.26;
  let jumpHeld=false;
  let moveLeft=false, moveRight=false;
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
  let mineTransition=0, mineFlash=0;
  let goldItems: GoldItem[] = [], goldSpawnTimer=700;


  // ---- RPG ----
  let xp=0, level=1, xpToNext=60;
  let statAtk=1, statDef=0;           // атака / защита
  let floatNums: FloatNum[] = [];
  // квесты — 3 одновременно
  const QUEST_POOL: Quest[] = [
    {id:'kill5skel', desc:'Убей 3 скелета',   icon:'💀', target:3,  progress:0, done:false, xpReward:40},
    {id:'kill3kni',  desc:'Убей 2 рыцаря',    icon:'⚔',  target:2,  progress:0, done:false, xpReward:50},
    {id:'kill5band', desc:'Убей 3 бандита',   icon:'🗡',  target:3,  progress:0, done:false, xpReward:40},
    {id:'travel1k',  desc:'Проедь 500 метров', icon:'🏇',  target:500, progress:0, done:false, xpReward:30},
    {id:'kill3zomb', desc:'Убей 2 зомби',      icon:'🧟',  target:2,  progress:0, done:false, xpReward:35},
    {id:'kill5any',  desc:'Убей 3 врага',      icon:'⚡',  target:3,  progress:0, done:false, xpReward:25},
    {id:'pot3',      desc:'Выпей зелье',        icon:'🧪',  target:1,  progress:0, done:false, xpReward:30},
    {id:'kill2mum',  desc:'Убей мумию',         icon:'🪦',  target:1,  progress:0, done:false, xpReward:45},
    {id:'kill5gob',  desc:'Убей 3 гоблина',    icon:'👺',  target:3,  progress:0, done:false, xpReward:35},
    {id:'kill3liz',  desc:'Убей 2 ящера',      icon:'🦎',  target:2,  progress:0, done:false, xpReward:45},
    {id:'kill3rat',  desc:'Убей 2 шахтёра',    icon:'🐀',  target:2,  progress:0, done:false, xpReward:40},
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
  const PF = "'Segoe UI','Arial',sans-serif";
  function px(x:number,y:number,w:number,h:number,col:string){ctx.fillStyle=col;ctx.fillRect(x|0,y|0,w,h);}
  function txt(s:string,x:number,y:number,col:string,size:number,align:CanvasTextAlign='left',outline='#000',maxW?:number){
    ctx.font=`bold ${size}px ${PF}`;ctx.textAlign=align;
    ctx.fillStyle=outline;
    ctx.fillText(s,x+1,y+1,maxW);
    ctx.fillStyle=col;ctx.fillText(s,x,y,maxW);
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
      advTut(1);
    }
  }
  function endHold(){jumpHeld=false;}
  function doMount(){
    if(state!==ST.PLAY||hero.mounted||mountAnim>0||dismountAnim>0)return;
    if(!horseEntity||Math.abs(horseEntity.x-hero.x)>38)return;
    hero.mounted=true;mountAnim=18;
    for(let i=0;i<8;i++)dust.push({x:hero.x,y:GY,vx:(-Math.random()*2-1)*(i<4?1:-0.5),vy:-Math.random()*2.5,life:22,maxLife:22});
    advTut(4);
  }
  function doDisMount(){
    if(state!==ST.PLAY||!hero.mounted||dismountAnim>0||mountAnim>0)return;
    hero.mounted=false;dismountAnim=16;
    if(horseEntity)horseEntity.x=hero.x+20;
    for(let i=0;i<8;i++)dust.push({x:hero.x+10,y:GY,vx:(Math.random()*2)*(i<4?1:-0.5),vy:-Math.random()*2,life:20,maxLife:20});
    advTut(3);
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
    advTut(2);
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
    for(let i=0;i<14;i++)dust.push({x:hero.x-10,y:GY,vx:-Math.random()*5-2,vy:-Math.random()*3.5,life:28,maxLife:28});
    advTut(5);
  }

  function onKeyDown(e:KeyboardEvent){
    if(state===ST.MENU){
      if(e.code==='ArrowDown'||e.code==='KeyS'){menuSel=(menuSel+1)%2;return;}
      if(e.code==='ArrowUp'  ||e.code==='KeyW'){menuSel=(menuSel+1)%2;return;}
      if(e.code==='Space'    ||e.code==='Enter'){e.preventDefault();confirmMenuSel();return;}
      return;
    }
    if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'){e.preventDefault();if(!e.repeat)doJump();}
    if(e.code==='ArrowLeft' ||e.code==='KeyA'){e.preventDefault();moveLeft=true;}
    if(e.code==='ArrowRight'||e.code==='KeyD'){e.preventDefault();moveRight=true;}
    if(e.code==='Escape')doDisMount();
    if(e.code==='KeyE'&&!e.repeat)doMount();
    if(e.code==='KeyQ'&&!e.repeat)doSuperAttack();
    if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!e.repeat)doHorseSprint();
    if(state===ST.LEVELUP&&!e.repeat){
      const idx=e.code==='Digit1'?0:e.code==='Digit2'?1:e.code==='Digit3'?2:-1;
      if(idx>=0&&idx<levelUpChoices.length)applyUpgrade(levelUpChoices[idx]);
    }
  }
  function onKeyUp(e:KeyboardEvent){
    if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')endHold();
    if(e.code==='ArrowLeft' ||e.code==='KeyA')moveLeft=false;
    if(e.code==='ArrowRight'||e.code==='KeyD')moveRight=false;
  }
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
    boerTransition=0;boerFlash=0;mineTransition=0;mineFlash=0;hauntedTransition=0;
    zoneGates=[];sprintActive=0;sprintTimer=0;menuSel=0;moveLeft=false;moveRight=false;
    goldItems=[];goldSpawnTimer=700;
    pumpkinSpeakNext=1500;

    crow.x=250;crow.y=50;crow.bob=0;
    xp=0;level=1;xpToNext=60;statAtk=1;statDef=0;floatNums=[];levelUpChoices=[];
    initQuests();
  }

  // ---- Меню-демо (фоновая анимация) ----
  const MX=60, MSPEED=1.3;
  let mCamX=0, mHeroY=GY, mHeroVY=0, mOnGround=true, mSlash=0, mRunF=0, mSpawnT=60;
  let mObs:Obstacle[]=[], mDust:Particle[]=[];

  function updateMenuDemo(){
    mCamX+=MSPEED; mRunF+=0.18;
    // гравитация
    if(!mOnGround){mHeroVY+=GRAV;mHeroY+=mHeroVY;if(mHeroY>=GY){mHeroY=GY;mHeroVY=0;mOnGround=true;}}
    if(mSlash>0)mSlash--;
    // двигаем препятствия
    for(const o of mObs){o.x-=MSPEED;o.bob+=o.type==='zombie'?0.08:o.type==='skeleton'?0.22:0.10;}
    mObs=mObs.filter(o=>o.x>-40);
    // пыль под копытами
    if(mOnGround&&Math.floor(mRunF*4)%4===0)mDust.push({x:MX-10,y:GY,vx:-Math.random()*2-1,vy:-Math.random()*1.5,life:18,maxLife:18});
    for(const d of mDust){d.x+=d.vx;d.y+=d.vy;d.vy+=0.06;d.life--;}
    mDust=mDust.filter(d=>d.life>0);
    // ИИ: реагируем на ближайшее препятствие
    const alive=mObs.filter(o=>o.x>MX-5&&o.hp>0);
    const near=alive.sort((a,b)=>a.x-b.x)[0];
    if(near){
      const dist=near.x-MX;
      const enemy=near.type==='zombie'||near.type==='skeleton';
      if(enemy&&dist<50&&dist>18&&mSlash===0){
        mSlash=18;near.hp=0;
        for(let i=0;i<10;i++)mDust.push({x:near.x,y:GY-12,vx:(Math.random()-0.4)*5,vy:-Math.random()*4,life:22,maxLife:22,spark:true});
      }else if(!enemy&&dist<34&&mOnGround){
        mHeroVY=JUMP_V;mOnGround=false;
      }
    }
    // спавн
    mSpawnT--;
    if(mSpawnT<=0){
      const pool=['zombie','skeleton','zombie','tomb','skeleton','fence','zombie','tomb'];
      const t=pool[Math.floor(Math.random()*pool.length)];
      const o:Obstacle={type:t,x:W+24,y:GY,w:0,h:0,bob:Math.random()*6,passed:false,hp:1,maxHp:1,xpVal:0};
      if(t==='tomb'){o.w=16;o.h=22;}else if(t==='fence'){o.w=12;o.h=14;}
      else if(t==='zombie'){o.w=20;o.h=22;}else if(t==='skeleton'){o.w=14;o.h=26;}
      mObs.push(o);
      mSpawnT=70+Math.floor(Math.random()*70);
    }
  }

  function drawMenuDemo(){
    // пыль
    for(const d of mDust){
      const a=d.life/d.maxLife;ctx.globalAlpha=a*0.7;
      if(d.spark){px(d.x|0,d.y|0,2,2,'#ffe840');}
      else{px(d.x|0,d.y|0,3,2,'#7a6050');}
    }
    ctx.globalAlpha=1;
    // препятствия
    for(const o of mObs){if(o.hp>0)drawOb(o);}
    // всадник
    const sx=hero.x,sy=hero.y,so=hero.onGround,svy=hero.vy,sf=hero.runFrame,sl=hero.landTimer;
    const sSlash=swordSlash,sAnim=swordAnim,sGhost=ghostTimer,sHit=hitTimer,sSprint=sprintActive;
    hero.x=MX;hero.y=mHeroY;hero.onGround=mOnGround;hero.vy=mHeroVY;hero.runFrame=mRunF;hero.landTimer=0;
    swordSlash=mSlash;swordAnim=mSlash;ghostTimer=0;hitTimer=0;sprintActive=0;
    drawHeroOnHorse(MX,mHeroY);
    if(mSlash>0)drawSwordSlashEffect(MX,mHeroY);
    hero.x=sx;hero.y=sy;hero.onGround=so;hero.vy=svy;hero.runFrame=sf;hero.landTimer=sl;
    swordSlash=sSlash;swordAnim=sAnim;ghostTimer=sGhost;hitTimer=sHit;sprintActive=sSprint;
  }

  // ---- Обновление ----
  function spawnOb(){
    let pool:string[];
    if(mineTransition>0.5)pool=['mimic','rat_miner','mimic','rat_miner','mimic','rat_miner','mimic'];
    else if(boerTransition>0.5)pool=['british_soldier','british_soldier','british_officer','british_soldier','british_officer','british_soldier'];
    else if(catTransition>0.5)pool=['cat','cat','stone','cat','stone','cat'];
    else if(cyberTransition>0.5)pool=['cyber_punk','drone','robot','cyber_car','neon_barrier','cyber_punk','drone'];
    else if(distance>20000)pool=['cactus','mummy','scorpion','ghost','cactus','mummy'];
    else if(distance>1000)pool=['tomb','fence','log','ghost','skeleton','knight_mob','zombie','bandit','goblin','goblin','lizard'];
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
    if(t==='mimic')           {ob.w=22;ob.h=20;ob.xpVal=18;}
    obstacles.push(ob);
  }

  function update(){
    ct++;
    if(state===ST.MENU){updateMenuDemo();return;}
    if(state!==ST.PLAY)return;
    if(speed<3.5)speed=Math.min(3.5,speed+0.0006);
    const eff=hero.mounted?(sprintActive>0?speed*2.5:speed*1.22):speed;
    const MOVE_SPD=2.2;
    if(moveRight)hero.x=Math.min(hero.x+MOVE_SPD, W-30);
    if(moveLeft) hero.x=Math.max(hero.x-MOVE_SPD, 20);
    camX+=eff;
    if(tutStep===0){
      distance+=eff;
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
      if(distance>=pumpkinSpeakNext){pumpkinSpeakNext=distance+1200+Math.random()*800;onPumpkinSpeak?.({event:'ride',distance:Math.floor(distance),hp,maxHp,isJoke:Math.random()<0.15});}
    }

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
    // шахта после 40000м
    if(distance>=40000){if(mineTransition<1)mineTransition=Math.min(1,mineTransition+0.003);}
    else{if(mineTransition>0)mineTransition=Math.max(0,mineTransition-0.003);}
    if(distance>=40000&&distance<40000+eff*2&&mineFlash===0){mineFlash=220;zoneGates.push({x:W+50,kind:'mine'});}
    if(mineFlash>0)mineFlash--;
    // переход в Призрачные поля после 1000м
    if(distance>=1000){if(hauntedTransition<1)hauntedTransition=Math.min(1,hauntedTransition+0.008);}
    else{if(hauntedTransition>0)hauntedTransition=Math.max(0,hauntedTransition-0.008);}

    // Бесконечная игра — конец только от смерти

    if(!hero.onGround){
      if(jumpHeld&&hero.vy<0)hero.vy+=JUMP_HOLD;
      hero.vy+=GRAV;hero.y+=hero.vy;
      if(hero.y>=GY){
        hero.y=GY;hero.vy=0;hero.onGround=true;hero.landTimer=10;
        for(let i=0;i<7;i++)dust.push({x:hero.x+(-6+i*2),y:GY,vx:(-Math.random()*2.5-eff*0.3)*(i<4?1:-0.5),vy:-Math.random()*2,life:20,maxLife:20});
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

    if(tutStep===0){
      spawnTimer--;
      if(spawnTimer<=0){spawnOb();const base=hero.mounted?44:60;spawnTimer=Math.max(28,base+Math.random()*52-Math.min(28,distance*0.01));}
    }
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
        else if(g.kind==='mine'){mineTransition=1;mineFlash=220;}
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
      if(ob.type==='ghost')     ob.bob+=0.11;
      if(ob.type==='zombie')    ob.bob+=0.08;  // медленное шарканье
      if(ob.type==='skeleton')  ob.bob+=0.22;  // бешеная пляска
      if(ob.type==='knight_mob')ob.bob+=0.10;  // тяжёлый марш
      if(ob.type==='mummy')     ob.bob+=0.06;  // жёсткая скованная
      if(ob.type==='scorpion')  ob.bob+=0.22;  // быстрое скуттерование
      if(ob.type==='bandit')    ob.bob+=0.20;  // быстрый бег
      if(ob.type==='goblin')    ob.bob+=0.24;  // прыжки
      if(ob.type==='lizard')    ob.bob+=0.13;  // рептилия
      if(ob.type==='rat_miner') ob.bob+=0.28;  // быстрая суета
      if(ghostTimer===0&&drinkAnim===0&&swordSlash===0&&hitTimer===0&&mountAnim===0){
        const obb:Rect={x:ob.x-ob.w/2+3,y:(ob.type==='ghost'?ob.y+Math.sin(ob.bob)*4:ob.y)-ob.h+2,w:ob.w-6,h:ob.h-4};
        if(overlap(hb,obb)){hp--;hitTimer=90;for(let i=0;i<8;i++)dust.push({x:hero.x,y:hero.y-10,vx:(Math.random()-0.5)*3,vy:-Math.random()*2.5,life:20,maxLife:20});if(hp<=0){killHero();return;}}
      }
      if(!ob.passed&&ob.x+ob.w/2<hero.x-4){ob.passed=true;}
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
    // таймер обучения — авто-переход
    if(tutStep>0){
      tutTimer++;
      if(tutTimer>TUT_AUTO){tutTimer=0;tutStep++;if(tutStep>TUT_STEPS.length){tutStep=0;localStorage.setItem(TUT_KEY,'1');}}
    }
  }

  // ============================================================
  // ---- Рисование ----
  // ============================================================

  function drawSun(sx:number,sy:number){
    // внешнее сияние
    const outer=ctx.createRadialGradient(sx,sy,6,sx,sy,38);
    outer.addColorStop(0,'rgba(255,240,80,0.28)');outer.addColorStop(0.6,'rgba(255,200,40,0.12)');outer.addColorStop(1,'rgba(255,200,40,0)');
    ctx.fillStyle=outer;ctx.fillRect(sx-38,sy-38,76,76);
    // лучи: 8 длинных и 8 коротких, чередуются
    const rayAngles=[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5];
    for(let i=0;i<rayAngles.length;i++){
      const a=rayAngles[i]*Math.PI/180;
      const long=i%2===0;
      const r1=11, r2=long?22:16;
      const x1=sx+Math.cos(a)*r1, y1=sy+Math.sin(a)*r1;
      const x2=sx+Math.cos(a)*r2, y2=sy+Math.sin(a)*r2;
      ctx.globalAlpha=long?0.75:0.45;
      ctx.strokeStyle='#ffe840';ctx.lineWidth=long?1.5:1;
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    }
    ctx.globalAlpha=1;ctx.lineWidth=1;
    // диск солнца с градиентом
    const r=9;
    for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++)
      if(xx*xx+yy*yy<=r*r){const d=-(xx+yy);px(sx+xx,sy+yy,1,1,d<-6?'#ffffc8':d>6?'#f0a020':'#ffee60');}
    // яркое ядро
    px(sx-2,sy-2,5,5,'#ffffc0');px(sx-1,sy-1,3,3,'#ffffff');
  }
  function drawMoon(mx:number,my:number){
    const cx=mx+11,cy=my+11;
    // многослойное свечение луны
    const halo2=ctx.createRadialGradient(cx,cy,5,cx,cy,40);
    halo2.addColorStop(0,'rgba(180,160,220,0.20)');halo2.addColorStop(0.5,'rgba(120,100,160,0.10)');halo2.addColorStop(1,'rgba(80,60,120,0)');
    ctx.fillStyle=halo2;ctx.fillRect(cx-40,cy-40,80,80);
    // диск луны
    const r=11;
    for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++)
      if(xx*xx+yy*yy<=r*r){const d=xx+yy;px(cx+xx,cy+yy,1,1,d<-7?C.moonLt:d>6?C.moonSh:C.moon);}
    // кратеры (больше, разного размера)
    px(cx+3,cy-2,4,4,C.moonSh);px(cx+4,cy-1,2,2,C.moonSh);px(cx+3,cy-2,1,1,C.moon);
    px(cx-5,cy+3,3,3,C.moonSh);px(cx-4,cy+4,1,1,C.moon);
    px(cx+1,cy+5,3,3,C.moonSh);px(cx+2,cy+6,1,1,C.moon);
    px(cx-6,cy-4,3,3,C.moonSh);px(cx-5,cy-3,1,1,C.moonLt);
    px(cx-1,cy-1,2,2,C.moonSh); // маленький кратер в центре
    // тонкая подсветка края
    for(let a=0;a<Math.PI*2;a+=0.4){
      const ex=cx+(r-1)*Math.cos(a),ey=cy+(r-1)*Math.sin(a);
      if(Math.cos(a)+Math.sin(a)<-0.8){ctx.globalAlpha=0.4;px(ex|0,ey|0,1,1,C.moonLt);ctx.globalAlpha=1;}
    }
  }
  function drawHills(off:number,col:string,baseY:number,amp:number,lit:boolean){
    off=off%200;
    const colDk=lerpColor(col,'#000000',0.22);
    const colHi=lerpColor(col,'#ffffff',0.15);
    for(let bx=-off-200;bx<W+200;bx+=200)
      for(let x=0;x<200;x++){
        const y=(baseY-Math.sin((x/200)*Math.PI)*amp-Math.sin((x/50)+bx)*2)|0;
        // тёмный склон на правой стороне холма
        const slope=(Math.cos((x/200)*Math.PI)*amp*0.012+Math.cos((x/50)+bx)*0.04);
        ctx.fillStyle=slope>0.5?colDk:slope<-0.3?colHi:col;
        ctx.fillRect(bx+x,y,1,GY-y);
        // освещённый гребень
        if(lit){ctx.fillStyle=colHi;ctx.fillRect(bx+x,y,1,1);}
        // редкая трава на гребне
        if(lit&&x%5===0){ctx.fillStyle=col;ctx.fillRect(bx+x,y-2,1,2);}
      }
  }
  function drawTrees(off:number,sp:number,gy:number,col:string,hgt:number){
    const colDk=lerpColor(col,'#000000',0.35);
    const colHi=lerpColor(col,'#ffffff',0.18);
    for(const base of[40,150,250,330]){
      let x=base-(off%sp);while(x<-40)x+=sp;if(x>W+40)continue;
      // ствол с качанием и текстурой коры
      for(let i=0;i<hgt;i++){
        const sw=i<4?3:2;
        const sx2=x+Math.round(Math.sin(i*0.28)*1.8);
        px(sx2,gy-i,sw,1,i%4===0?colDk:col);
        if(i%6===2)px(sx2+sw,gy-i,1,1,colDk); // метка коры
      }
      // корни у основания
      px(x-3,gy,2,2,colDk);px(x+2,gy,2,2,colDk);
      // крона — три слоя (нижний широкий, средний, верхушка)
      const ty=gy-hgt;
      const r1=hgt>24?12:9, r2=hgt>24?9:7, r3=hgt>24?5:4;
      px(x-r1,ty+r1-2,r1*2,r1,col);px(x-r1,ty+r1-2,r1*2,1,colHi); // низ кроны
      px(x-r1+1,ty+r1-3,r1*2-2,1,colDk); // тень под кроной
      px(x-r2,ty+4,r2*2,r2+1,col);px(x-r2,ty+4,r2*2,1,colHi);
      px(x-r3,ty,r3*2,r3+2,col);px(x-r3,ty,r3*2,1,colHi);
      px(x-1,ty-2,3,3,col); // верхушка
      // темные пятна глубины кроны
      px(x+r1-4,ty+r1,3,4,colDk);px(x-r1+1,ty+r1-1,2,3,colDk);
      px(x+r2-3,ty+6,2,3,colDk);px(x-r2+1,ty+7,2,2,colDk);
    }
  }
  function drawFarTombs(off:number){
    const shapes=[
      (x:number)=>{px(x,GY-9,7,9,'#1e1838');px(x+1,GY-11,5,3,'#1e1838');px(x+2,GY-12,3,2,'#1e1838');px(x+2,GY-6,3,1,'#26204a');}, // надгробие
      (x:number)=>{px(x,GY-7,4,7,'#1a1630');px(x+1,GY-9,2,3,'#1a1630');px(x+5,GY-5,4,5,'#1a1630');px(x+5,GY-7,4,2,'#1a1630');}, // два надгробия
      (x:number)=>{px(x,GY-12,8,12,'#201840');px(x+1,GY-12,2,12,'#2a2252');px(x+1,GY-8,6,1,'#2a2252');}, // обелиск
      (x:number)=>{px(x,GY-6,10,6,'#1c1436');px(x+3,GY-8,4,3,'#1c1436');px(x+4,GY-9,2,2,'#1c1436');px(x+1,GY-5,2,1,'#26204a');px(x+6,GY-5,2,1,'#26204a');}, // арка
    ];
    const bases=[70,150,220,310,390,450];
    for(let i=0;i<bases.length;i++){
      let x=bases[i]-(off%500);while(x<-20)x+=500;if(x>W+20)continue;
      shapes[i%shapes.length](x);
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
      const wing2=Math.sin(b.wing*0.7+0.4);
      const col='#1a1530', colHi='#2a2448', colBeak='#4a3820';
      const wx=(b.x)|0,wy=(b.y)|0;
      const flip=b.dir<0;
      // тело 3px + голова + хвост
      px(wx,wy,3,1,col);px(wx+1,wy,1,1,colHi);
      if(!flip){
        px(wx+3,wy,1,1,col);px(wx+4,wy-1,1,1,colBeak); // голова + клюв
        px(wx-2,wy,2,1,col);px(wx-3,wy+1,1,1,col); // хвост
        // крылья: вверх при взмахе, вниз при опускании
        const wo=wing>0?-1:1;
        px(wx-2,wy+wo,4,1,col); // левое крыло
        const wo2=wing2>0?-1:1;
        px(wx+3,wy+wo2,4,1,col); // правое крыло
        if(Math.abs(wing)>0.5){px(wx-3,wy+wo-1,2,1,colHi);px(wx+5,wy+wo2-1,2,1,colHi);}
      }else{
        px(wx-1,wy,1,1,col);px(wx-2,wy-1,1,1,colBeak); // голова+клюв
        px(wx+3,wy,2,1,col);px(wx+5,wy+1,1,1,col); // хвост
        const wo=wing>0?-1:1;
        px(wx+3,wy+wo,4,1,col);
        const wo2=wing2>0?-1:1;
        px(wx-4,wy+wo2,4,1,col);
        if(Math.abs(wing)>0.5){px(wx+5,wy+wo-1,2,1,colHi);px(wx-5,wy+wo2-1,2,1,colHi);}
      }
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
        // левый освещённый край
        if(i>4&&i<h-4)px((x-ww/2)|0,(GY-i)|0,2,1,C.pyramidMid);
        if(i===0)px((x-ww/2)|0,(GY-i)|0,3,1,C.pyramidMid);
      }
      // капстоун
      px((x-2)|0,(GY-h)|0,4,4,C.pyramidHi);px(x|0,(GY-h-1)|0,1,2,'#fff8c0');
      // иероглифы (маленькие символы на стене)
      const px2=x|0;
      px(px2-8,GY-12,1,4,C.pyramidDk);px(px2-8,GY-12,3,1,C.pyramidDk); // Т-образный
      px(px2-4,GY-10,2,2,C.pyramidDk); // точка
      px(px2+2,GY-14,1,6,C.pyramidDk);px(px2+1,GY-14,3,1,C.pyramidDk); // крест
      // горизонтальные линии блоков
      px((x-w/2+4)|0,GY-8,w-8|0,1,C.pyramidDk);
      px((x-w/2+8)|0,GY-18,w-16|0,1,C.pyramidDk);
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
        // вентиляционные трубы + антенны на крыше
        if(j%4===0){px(bx+w-8,by-5,4,5,C.cyberBldMid);px(bx+w-7,by-7,2,3,C.cyberBldHi);}
        if(j%3===0){px(bx+4,by-4,3,4,C.cyberBldMid);}
        // антенна (каждое 2-е здание)
        if(j%2===0){
          px(bx+w/2|0,by-12,1,12,C.cyberBldHi);
          ctx.globalAlpha=0.9;px(bx+(w/2-1)|0,by-13,3,2,nc);ctx.globalAlpha=0.25;px(bx+(w/2-3)|0,by-15,7,5,nc);ctx.globalAlpha=1;
        }
        // горизонтальные линии этажей
        if(h>28){for(let fy=by+h/2|0;fy<by+h-4;fy+=10)px(bx,fy,w,1,'#020408');}
        // сайд-окна (другого цвета)
        if(j%5===0&&h>26){ctx.globalAlpha=0.5;px(bx+w-8,by+8,5,6,'#ff9900');ctx.globalAlpha=1;}
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
    // капли разных длин и яркостей
    ctx.globalAlpha=alpha*0.50;
    for(let i=0;i<80;i++){
      const rx=((i*127+off*3)%W)|0;
      const ry=((i*83+off*2.1)%GY)|0;
      const len=4+((i*13)%8);
      const bright=i%3===0?'#00aacc':i%3===1?'#003a5a':'#005577';
      px(rx,ry,1,len,bright);
    }
    // яркие отдельные капли
    ctx.globalAlpha=alpha*0.25;
    for(let i=0;i<20;i++){
      const rx=((i*197+off*4.5)%W)|0;
      const ry=((i*61+off*3.2)%(GY-10))|0;
      px(rx,ry,1,2,'#00eeff');
    }
    // отражения на земле
    ctx.globalAlpha=alpha*0.12;
    for(let i=0;i<30;i++){
      const rx=((i*139+off*2.8)%W)|0;
      px(rx,GY,1,4,'#00aacc');
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
        // лапы торчат — с когтями
        px(bx+20,by+30,18,10,cat.col);px(bx+22,by+34,14,8,cat.hi);
        px(bx+50,by+30,18,10,cat.col);px(bx+52,by+34,14,8,cat.hi);
        // когти на передних лапах (маленькие серпы)
        for(let cl=0;cl<3;cl++){px(bx+22+cl*4,by+39,2,3,cat.hi);px(bx+22+cl*4,by+41,1,1,cat.col);}
        for(let cl=0;cl<3;cl++){px(bx+52+cl*4,by+39,2,3,cat.hi);}
        // паттерн шерсти (несколько коротких штрихов)
        ctx.globalAlpha=0.35;
        for(let s2=0;s2<5;s2++){px(bx+12+s2*18,by+18,4,2,cat.dk);}
        ctx.globalAlpha=1;
      }
    }
    // Клубки ниток — с намотанными нитями
    for(let i=0;i<3;i++){
      const yx=((i*130+20-((off*0.4)%(W+60))+W+60)%(W+60))|0;
      const col=i%2===0?C.neonM:'#ffd040';
      const colHi=i%2===0?'#ffb0ff':'#ffe880';
      const colDk=i%2===0?'#a030d0':'#c09010';
      // шар
      px(yx,GY-16,14,14,col);
      px(yx+2,GY-18,10,4,col);px(yx+3,GY-14,8,10,col);
      // нити поверх
      px(yx+1,GY-16,12,1,colHi);px(yx+1,GY-12,12,1,colHi);
      px(yx+3,GY-17,1,14,colHi);px(yx+9,GY-17,1,12,colHi);
      // диагональные нити
      px(yx+1,GY-14,3,1,colDk);px(yx+9,GY-14,3,1,colDk);
      px(yx+4,GY-17,1,1,colDk);px(yx+9,GY-11,1,1,colDk);
      // блик
      ctx.globalAlpha=0.35;px(yx+3,GY-17,5,3,colHi);ctx.globalAlpha=1;
      // тень
      ctx.globalAlpha=0.25;px(yx+1,GY-2,12,3,'#000');ctx.globalAlpha=1;
    }
    // Следы лап на земле (детальнее — подушечки и когти)
    const PAW_COLORS=['#c090c8','#b880c0','#d0a0d8'];
    for(let i=0;i<10;i++){
      const px2=((i*48+off*0.6+i*7)%W)|0;
      const pc=PAW_COLORS[i%3];
      ctx.globalAlpha=0.22;
      // основная подушечка
      ctx.fillStyle=pc;
      ctx.fillRect(px2,GY-2,5,3);ctx.fillRect(px2+7,GY-2,5,3);
      ctx.fillRect(px2+2,GY-5,6,4);ctx.fillRect(px2-1,GY-6,4,3);ctx.fillRect(px2+8,GY-6,4,3);
      // маленькие пальчики (сверху)
      ctx.fillRect(px2+1,GY-7,2,2);ctx.fillRect(px2+4,GY-8,2,2);ctx.fillRect(px2+7,GY-7,2,2);
      ctx.globalAlpha=1;
    }
  }
  function drawBG(){
    const dt=dayTransition, dst=desertTransition, hnt=hauntedTransition, cyt=cyberTransition, cat=catTransition, mnt=mineTransition;
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
    if(mnt>0){sTop=lerpColor(sTop,C.mineSkyTop,mnt);sMid=lerpColor(sMid,C.mineSkyMid,mnt);sBot=lerpColor(sBot,C.mineSkyBot,mnt);sGlow=lerpColor(sGlow,C.mineSkyGlow,mnt);}
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
    for(const s of stars){
      const tw=(Math.sin(s.p)+1)*0.5;
      if(tw>0.25){
        if(s.big&&tw>0.6){
          // крест + диагональ для ярких звёзд
          const a=(tw-0.6)/0.4;
          px(s.x,s.y-2,1,5,'#fff');px(s.x-2,s.y,5,1,'#fff'); // крест
          ctx.globalAlpha=(1-dt)*(1-dst)*a*0.4;
          px(s.x-1,s.y-1,1,1,'#e0d8ff');px(s.x+1,s.y+1,1,1,'#e0d8ff'); // диагональ
          px(s.x+1,s.y-1,1,1,'#e0d8ff');px(s.x-1,s.y+1,1,1,'#e0d8ff');
          ctx.globalAlpha=(1-dt)*(1-dst);
        }else{
          const col=tw>0.8?'#fff':tw>0.7?'#e8e0ff':'#b8a8e0';
          px(s.x,s.y,1,1,col);
          if(tw>0.9){px(s.x,s.y-1,1,1,col);px(s.x,s.y+1,1,1,col);} // мерцание
        }
      }
    }
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
      const fogNight=lerpColor('#2a4060',C.hntFog,hnt);
      const fogCol=lerpColor(fogNight,C.dFog,dt);
      px(0,GY-34,W,34,`rgba(74,53,104,${dt<0.5?0.18:0.10})`);
      drawHills(camX*0.15,lerpColor(lerpColor(C.hillFar,C.hntHillFar,hnt),C.dHillFar,dt),GY-22,30,false);
      drawHills(camX*0.32,lerpColor(lerpColor(C.hillMid,C.hntHillMid,hnt),C.dHillMid,dt),GY-12,22,false);
      drawHills(camX*0.5,lerpColor(lerpColor(C.hillNear,C.hntHillNear,hnt),C.dHillNear,dt),GY-4,16,true);
      const tN=lerpColor(lerpColor('#0c1a08','#1e0c0c',hnt),'#1e4010',dt);
      const tF=lerpColor(lerpColor('#081208','#160808',hnt),'#142c0c',dt);
      drawTrees(camX*0.5,360,GY,tN,30);drawTrees(camX*0.72,260,GY,tF,22);
      drawFarTombs(camX*0.6);
      const fogA=dt>0.5?0.06:0.12;ctx.globalAlpha=(1-dst)*fogA;
      for(let i=-1;i<W/60+2;i++){const x=i*60-((camX*0.3)%60);const y=GY-6+Math.sin(i*1.7+camX*0.01)*2;px(x,y,50,5,fogCol);px(x+10,y-2,30,3,fogCol);}
      // второй слой тумана чуть выше
      ctx.globalAlpha=(1-dst)*fogA*0.5;
      for(let i=-1;i<W/80+2;i++){const x=i*80-((camX*0.18)%80);const y=GY-14+Math.sin(i*2.1+camX*0.008)*3;px(x,y,64,4,fogCol);}
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
      // марево на горизонте (тепловые волны)
      ctx.globalAlpha=dst*(0.08+Math.sin(ct*0.12)*0.04);
      for(let i=0;i<W;i+=3){const heat=Math.sin(i*0.09+ct*0.08)*2;px(i,GY-18+(heat|0),2,5,'rgba(255,200,80,0.5)');}
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
    // Terraria: тайловая сетка на земле
    ctx.globalAlpha=0.22;const TW=16;
    for(let gi=-1;gi<W/TW+2;gi++){const gx=(gi*TW-(camX%TW))|0;px(gx,GY+10,1,H-GY-10,grndDk);}
    for(let gy=GY+10;gy<H;gy+=14)px(0,gy,W,1,grndDk);
    ctx.globalAlpha=1;
    for(let i=-1;i<W/14+1;i++){const x=i*14-(camX%14);px(x,GY+16,5,2,grndDk);px(x+8,GY+22,3,2,grndDk);}
    if(dst<0.8){for(let i=-1;i<W/7+1;i++){const x=i*7-(camX%7);const h=2+((i*37)%3);px(x,GY-h,1,h,grMid);px(x+1,GY-h+1,1,h-1,gr);px(x+2,GY-h,1,h,grDk);px(x+1,GY-h,1,1,grTip);}}
    // камешки на земле (нет в пустыне и шахте)
    if(dst<0.5&&mnt<0.5){
      ctx.globalAlpha=(1-dst*2)*(1-mnt*2)*0.7;
      for(let i=0;i<8;i++){const kx=((i*83-(camX*0.9)%664)+664)%664|0;px(kx,GY+3,3,2,grndDk);px(kx+1,GY+2,1,1,grnd);}
      // полевые цветы (ночью)
      if(dt<0.3&&hnt<0.5){
        ctx.globalAlpha=(1-dt*3)*(1-hnt*2)*0.55;
        for(let i=0;i<6;i++){const fx=((i*107-(camX*0.8)%642)+642)%642|0;px(fx,GY-3,1,3,grMid);px(fx-1,GY-4,3,1,'#c070d0');px(fx,GY-5,1,1,'#e090f0');}
      }
      ctx.globalAlpha=1;
    }
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
    // Шахта/Пещера
    if(mineTransition>0){
      ctx.globalAlpha=mineTransition;
      // потолок пещеры с нависающими камнями
      const skyMine=ctx.createLinearGradient(0,0,0,GY);
      skyMine.addColorStop(0,C.mineSkyTop);skyMine.addColorStop(0.6,C.mineSkyMid);skyMine.addColorStop(1,C.mineSkyBot);
      ctx.fillStyle=skyMine;ctx.fillRect(0,0,W,GY);
      // каменные блоки стен
      for(let i=-1;i<W/40+2;i++){
        const wx=(i*40-(camX*0.25)%40)|0;
        for(let row=0;row<4;row++){const wy=row*14;px(wx,wy,39,13,C.mineWall);px(wx,wy,39,2,C.mineWallHi);px(wx+37,wy,2,13,C.mineWallDk);}
      }
      // сталактиты (свисают сверху)
      for(let i=0;i<8;i++){
        const sx=((i*78-(camX*0.5)%624)+624)%624|0;
        const sh=14+((i*31)%12);
        px(sx-3,0,7,sh,C.mineWall);px(sx-2,0,5,sh,C.mineWallHi);px(sx-1,sh-1,3,2,C.mineWallDk);
      }
      // жилы руды в стенах
      for(let i=0;i<6;i++){
        const ox=((i*110-(camX*0.4)%660)+660)%660|0;
        const oy=4+((i*23)%30);
        px(ox,oy,10,4,C.mineOre);px(ox+1,oy+1,6,2,C.mineOreHi);
      }
      // факелы на стенах
      for(let i=0;i<5;i++){
        const tx=((i*120-(camX*0.6)%600)+600)%600|0;
        // держатель
        px(tx-1,GY-30,3,6,C.mineWallDk);
        // пламя — мигает
        const flicker=0.6+Math.sin(ct*0.25+i*1.3)*0.25;
        ctx.globalAlpha=mineTransition*flicker;
        px(tx-2,GY-38,5,9,C.mineTorch);px(tx-1,GY-40,3,5,C.mineTorchGlow);px(tx,GY-42,1,3,'#fff8e0');
        // свечение пола
        const g2=ctx.createRadialGradient(tx,GY,0,tx,GY,36);
        g2.addColorStop(0,'rgba(255,140,20,0.22)');g2.addColorStop(1,'rgba(255,140,20,0)');
        ctx.fillStyle=g2;ctx.fillRect(tx-36,GY-36,72,50);
        ctx.globalAlpha=mineTransition;
      }
      // сталагмиты (растут снизу)
      for(let i=0;i<6;i++){
        const sx=((i*92+30-(camX*0.45)%552)+552)%552|0;
        const sh=8+((i*17)%10);
        px(sx-2,GY-sh,5,sh,C.mineWall);px(sx-1,GY-sh,3,sh,C.mineWallHi);
      }
      // земля пещеры
      px(0,GY,W,3,C.mineGrassHi);px(0,GY+3,W,4,C.mineGrass);
      px(0,GY+7,W,5,C.mineGround);px(0,GY+12,W,H-GY-12,C.mineGroundM);
      for(let i=-1;i<W/16+1;i++){const gx=(i*16-(camX*0.7)%16)|0;px(gx,GY+14,4,2,C.mineGroundDk);px(gx+9,GY+20,3,2,C.mineGroundDk);}
      // туман в глубине
      ctx.globalAlpha=mineTransition*0.22;
      for(let i=-1;i<W/64+2;i++){const fx=(i*64-(camX*0.2)%64)|0;px(fx,GY-22,54,16,C.mineFog);}
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
    // inner orange eye glow (ярче)
    ctx.globalAlpha=0.65;
    px(x-3,y+3,2,2,C.pumpkinGlow);px(x+2,y+3,2,2,C.pumpkinGlow);
    ctx.globalAlpha=0.35;px(x-4,y+2,4,5,C.pumpkinGlow);px(x+1,y+2,4,5,C.pumpkinGlow);
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
    // двойное свечение
    ctx.globalAlpha=0.06+pulse*0.08;px(x-13,y-26,26,30,C.potGlow);
    ctx.globalAlpha=0.10+pulse*0.12;px(x-10,y-22,20,24,C.potGlow);ctx.globalAlpha=1;
    // витающие частички вокруг
    for(let sp=0;sp<3;sp++){
      const sa=crow.bob*2+sp*2.1;const sr=11;
      ctx.globalAlpha=0.25+pulse*0.2;
      px((x+Math.cos(sa)*sr)|0,(y-11+Math.sin(sa)*sr*0.4)|0,1,1,C.potGlow);
    }
    ctx.globalAlpha=1;
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
    // внешнее свечение (два слоя)
    ctx.globalAlpha=0.08+pulse*0.10;px(x-12,y-22,24,26,C.goldGlow);
    ctx.globalAlpha=0.18+pulse*0.18;px(x-10,y-20,20,22,C.goldGlow);ctx.globalAlpha=1;
    // тень
    ctx.globalAlpha=0.3;px(x-6,y-1,12,3,'#000');ctx.globalAlpha=1;
    // самородок — угловатый с фасетами
    px(x-5,y-2,10,2,C.goldDk);
    px(x-6,y-10,12,9,C.goldCol);px(x-5,y-12,10,3,C.goldCol);px(x-4,y-13,8,1,C.goldCol);
    px(x-4,y-14,5,1,C.goldCol); // острый выступ сверху
    px(x+3,y-12,3,1,C.goldCol);
    // грани
    px(x-6,y-10,2,7,C.goldHi);px(x-4,y-12,2,3,C.goldHi);
    px(x+3,y-10,3,7,C.goldDk);px(x+2,y-9,1,5,C.goldDk); // правая грань
    px(x-3,y-9,2,4,'#c08010'); // средняя грань
    // блики — три точки
    px(x-4,y-11,2,2,C.goldHi);px(x-2,y-9,1,1,C.goldHi);
    ctx.globalAlpha=0.35+pulse*0.3;px(x-3,y-12,2,2,'#ffffff');
    ctx.globalAlpha=0.20+pulse*0.15;px(x-1,y-13,1,1,'#ffffff');
    ctx.globalAlpha=1;
    // вращающиеся искры вокруг
    for(let sp=0;sp<4;sp++){
      const sa=bob*1.5+sp*Math.PI*0.5;const sr=9+sp;
      ctx.globalAlpha=0.3+pulse*0.25;
      px((x+Math.cos(sa)*sr)|0,(y-8+Math.sin(sa)*sr*0.5)|0,1,1,'#ffe840');
    }
    ctx.globalAlpha=1;
  }


  function drawSwordItem(x:number,y:number){
    x|=0;y|=0;
    const bob=(Math.sin(crow.bob*1.8+x)*2)|0;
    const pulse=(Math.sin(crow.bob*2.2)+1)*0.5;
    // руническое свечение вокруг меча
    ctx.globalAlpha=0.08+pulse*0.12;px(x-14,y-26,28,30,'#6080ff');
    ctx.globalAlpha=0.12+pulse*0.14;px(x-12,y-24,24,26,'#c8e0ff');ctx.globalAlpha=1;
    // рунические символы плавают вокруг
    ctx.globalAlpha=0.25+pulse*0.35;
    px(x-10,y-20+bob,2,1,'#80a0ff');px(x-10,y-17+bob,1,2,'#80a0ff'); // руна 1
    px(x+8,y-16+bob,2,1,'#80a0ff');px(x+9,y-13+bob,1,2,'#80a0ff');   // руна 2
    ctx.globalAlpha=1;
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
    // тень клинка
    ctx.globalAlpha=0.20;px(2,-14,2,18,'#000');ctx.globalAlpha=1;
    // клинок — три тона
    px(-1,-22,4,24,'#b8ccdc');px(-1,-24,3,3,'#e8f4ff');px(2,-22,1,22,'#8098b0'); // тёмный правый край
    px(-1,-22,2,22,'#dceeff'); // светлый левый край
    // дол (fuller) — центральная канавка
    px(0,-20,1,16,'#6888a0');
    // рунические засечки на клинке
    px(-1,-17,1,1,'#e0d080');px(1,-17,1,1,'#e0d080');
    px(-1,-13,1,1,'#e0d080');px(1,-13,1,1,'#e0d080');
    px(0,-10,1,1,'#e0d080');
    // крестовина с gem
    px(-7,0,14,3,'#c09820');px(-7,0,14,1,'#e0c040');px(6,1,1,2,'#806010');
    px(-8,0,2,3,'#806010');px(-8,0,1,3,'#a07010'); // левый конец
    px(7,0,2,3,'#806010');
    // самоцвет в центре крестовины
    px(-1,0,3,3,'#40c0ff');px(0,0,1,1,'#a0e8ff');
    // рукоять с обмоткой
    px(-1,3,3,6,C.leather);px(-1,3,1,6,C.leatherHi);
    for(let i=0;i<6;i+=2)px(-1,3+i,3,1,'#8a5818'); // ромбовидная обмотка
    // навершие (pommel)
    px(-2,9,5,4,'#c09820');px(-2,9,5,1,'#e0c040');px(2,10,1,2,'#806010');
    px(-1,11,3,1,'#f0d040'); // блик на навершии
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
      px(x-10,bY-1,20,2,'rgba(0,0,0,0.3)');
      // камень
      px(x-8,bY-22,16,22,C.tomb);px(x-6,bY-26,12,5,C.tomb);px(x-4,bY-27,8,2,C.tomb);
      // подсветка левый край, тень правый
      px(x-8,bY-26,2,26,'#b4aec0');px(x+4,bY-24,4,24,C.tombMid);px(x+6,bY-22,2,22,C.tombDk);
      // горизонтальные морщины камня
      px(x-6,bY-19,13,1,C.tombDk);px(x-6,bY-14,13,1,C.tombDk);px(x-5,bY-9,11,1,C.tombDk);
      // резной крест
      px(x-1,bY-25,3,10,'#9a94a8');px(x-4,bY-21,10,3,'#9a94a8');
      px(x,bY-24,1,8,'#b0aab8'); // блик на кресте
      // трещина
      px(x+2,bY-18,1,8,C.tombDk);px(x+3,bY-14,1,5,C.tombDk);
      // мох и плющ
      px(x-7,bY-8,4,6,C.tombMoss);px(x-6,bY-5,2,3,C.tombMoss);
      px(x-7,bY-4,3,1,'#5a7840'); // темнее мох
      px(x+3,bY-3,3,3,C.tombMoss);px(x+4,bY-5,2,2,C.tombMoss);
      // RIP надпись (маленькие линии)
      px(x-3,bY-7,6,1,'#807878');px(x-3,bY-6,1,1,'#807878');px(x-3,bY-5,4,1,'#807878');
    }else if(ob.type==='fence'){
      px(x-12,bY-1,24,2,'rgba(0,0,0,0.25)');
      // левый столб
      px(x-10,bY-17,3,17,C.wood);px(x-10,bY-17,1,17,C.woodHi);px(x-9,bY-19,1,2,C.wood);
      // зерно дерева на столбе
      px(x-10,bY-14,1,4,C.woodDk);px(x-10,bY-8,1,3,C.woodDk);
      // правый столб
      px(x+7,bY-17,3,17,C.wood);px(x+7,bY-17,1,17,C.woodHi);px(x+8,bY-19,1,2,C.wood);
      px(x+9,bY-12,1,4,C.woodDk);px(x+9,bY-6,1,3,C.woodDk);
      // перекладины
      px(x-10,bY-13,20,3,C.woodMid);px(x-10,bY-13,20,1,C.woodHi);px(x+8,bY-13,2,3,C.woodDk);
      px(x-10,bY-6,20,3,C.woodMid);px(x-10,bY-6,20,1,C.woodHi);px(x+8,bY-6,2,3,C.woodDk);
      // гвозди
      px(x-8,bY-13,1,1,'#909098');px(x+6,bY-13,1,1,'#909098');
      px(x-8,bY-6,1,1,'#909098');px(x+6,bY-6,1,1,'#909098');
      // щель в дереве (трещина)
      px(x+8,bY-16,1,5,C.woodDk);
    }else if(ob.type==='log'){
      px(x-13,bY-1,26,2,'rgba(0,0,0,0.25)');
      // тело бревна
      px(x-12,bY-11,24,11,C.wood);px(x-12,bY-11,24,2,C.woodHi);px(x-12,bY-4,24,4,C.woodDk);
      // полосы коры вдоль
      px(x-8,bY-10,1,9,C.woodDk);px(x-2,bY-9,1,8,C.woodDk);px(x+4,bY-10,1,9,C.woodDk);
      px(x-5,bY-5,1,4,C.woodMid);px(x+1,bY-6,1,5,C.woodMid);
      // мох на верхней стороне
      px(x-6,bY-11,5,2,C.tombMoss);px(x+2,bY-11,4,2,C.tombMoss);px(x-1,bY-11,2,1,'#5a7840');
      // левый торец — годичные кольца
      px(x-12,bY-9,4,7,C.woodDk);px(x-11,bY-8,2,5,C.woodMid);
      px(x-12,bY-8,1,5,'#9a7040'); // светлое кольцо
      px(x-11,bY-9,1,1,C.woodHi);
      // правый торец
      px(x+8,bY-9,4,7,C.woodDk);px(x+9,bY-8,2,5,C.woodMid);
      px(x+11,bY-8,1,5,'#9a7040');px(x+10,bY-9,1,1,C.woodHi);
      // сучок
      px(x+1,bY-7,3,3,C.woodDk);px(x+2,bY-6,1,1,C.woodMid);
    }else if(ob.type==='ghost'){
      // Призрак — парит, тело растягивается/сжимается, хвост разделяется, прозрачность мигает
      const gy=(ob.y+Math.sin(ob.bob)*6)|0;
      const stretch=(Math.sin(ob.bob*1.8)*4)|0;
      const alpha=0.70+Math.sin(ob.bob*2.3)*0.20;
      ctx.globalAlpha=0.10;px(x-13,gy-22,26,26,C.ghost);
      ctx.globalAlpha=alpha;
      px(x-8,gy-16-stretch,16,14+stretch*2,C.ghost);
      px(x-6,gy-18-stretch,12,4,C.ghost);px(x-4,gy-19-stretch,8,2,C.ghost);
      px(x+4,gy-16,4,14+stretch,C.ghostMid);px(x-8,gy-16,2,14+stretch,C.ghost);
      // хвост делится на три щупальца
      const t1=(Math.sin(ob.bob*1.4)*3)|0,t2=(Math.sin(ob.bob*1.9)*3)|0;
      px(x-6,gy-3+stretch,3,5+t1,C.ghostMid);
      px(x-1,gy-2+stretch,2,6,C.ghostMid);
      px(x+3,gy-3+stretch,3,5-t2,C.ghost);
      ctx.globalAlpha=1;
      // глаза мигают (меняют высоту)
      const eyeH=Math.max(1,(2+Math.sin(ob.bob*2.8))|0);
      px(x-4,gy-13-stretch,2,eyeH,'#15304a');px(x+2,gy-13-stretch,2,eyeH,'#15304a');
    }else if(ob.type==='skeleton'){
      // Скелет — бешеная пляска: большой размах рук и ног, челюсть открывается/закрывается
      const ph=Math.sin(ob.bob),lA=(ph*5)|0,lB=(-ph*5)|0,aA=(ph*5)|0;
      const jawOpen=(Math.abs(Math.sin(ob.bob*2.5))*3)|0;
      const bn='#d4d0c8',bk='#9a9488',ey='#0a0010';
      px(x-7,bY-1,14,2,'rgba(0,0,0,0.3)');
      px(x-4,bY-8+lA,2,8,bk);px(x+2,bY-8+lB,2,8,bk);
      px(x-5,bY-1,4,2,bk);px(x+2,bY-1,4,2,bk);
      px(x-3,bY-9,7,2,bn);px(x-1,bY-18,3,9,bn);
      px(x-5,bY-16,4,1,bn);px(x+2,bY-16,4,1,bn);
      px(x-4,bY-14,3,1,bn);px(x+1,bY-14,3,1,bn);
      px(x-4,bY-12,3,1,bn);px(x+1,bY-12,3,1,bn);
      // руки — одна вверх, другая вниз
      px(x-9,bY-17-aA,8,2,bk);px(x-9,bY-18-aA,2,5,bk);
      px(x+3,bY-17+aA,8,2,bk);px(x+10,bY-16+aA,2,5,bk);
      px(x-4,bY-24,9,5,bn);px(x-3,bY-25,7,1,bn);px(x-2,bY-26,5,1,bn);
      px(x-3,bY-23,2,3,ey);px(x+1,bY-23,2,3,ey);px(x-1,bY-21,2,1,ey);
      // челюсть двигается
      px(x-3,bY-19+jawOpen,2,1,bn);px(x,bY-19+jawOpen,2,1,bn);
      px(x-2,bY-18+jawOpen,7,1,'#0a0010');
    }else if(ob.type==='knight_mob'){
      // Рыцарь — тяжёлый марш, тело опускается на каждом шаге, щит качается независимо
      const ph=Math.sin(ob.bob*0.8),lA=(ph*3)|0,lB=(-ph*3)|0;
      const stomp=(Math.abs(ph)*2)|0;
      const shieldBob=(Math.sin(ob.bob*0.4)*3)|0;
      const ac='#606870',ah='#8090a0',ad='#383e44',ag='#b08820',ap='#d04030';
      px(x-9,bY-1,18,2,'rgba(0,0,0,0.35)');
      px(x-4,bY-10+lA,3,10,ad);px(x+1,bY-10+lB,3,10,ad);px(x-5,bY-1,4,2,ac);px(x+1,bY-1,4,2,ac);
      px(x-4,bY-11,8,2,ag);
      px(x-5,bY-22+stomp,10,11,ac);px(x-5,bY-22+stomp,10,2,ah);px(x+3,bY-20+stomp,2,9,ad);
      px(x-7,bY-22+stomp,3,4,ac);px(x+4,bY-22+stomp,3,4,ac);
      px(x-8,bY-20+stomp,4,2,ad);px(x+4,bY-20+stomp,4,2,ad);
      // щит качается независимо
      px(x-11,bY-22+shieldBob,4,8,ah);px(x-12,bY-20+shieldBob,6,6,ac);
      px(x-11,bY-18+shieldBob,4,1,ag);px(x-9,bY-22+shieldBob,1,6,ag);
      px(x+5,bY-32+stomp,2,14,ah);px(x+3,bY-22+stomp,6,2,ag);px(x+5,bY-20+stomp,2,4,ad);
      px(x-4,bY-30+stomp,8,8,ac);px(x-5,bY-32+stomp,10,4,ac);
      px(x-4,bY-27+stomp,8,2,ad);px(x-4,bY-33+stomp,8,1,ah);
      px(x-1,bY-37+stomp,3,6,ap);px(x,bY-39+stomp,2,4,ap);
    }else if(ob.type==='zombie'){
      // Зомби — тяжёлое шарканье, обе руки вытянуты вперёд к герою, голова опущена
      const ph=Math.sin(ob.bob*0.9),lA=(ph*4)|0,lB=(-ph*4)|0;
      const bodyBob=(Math.sin(ob.bob*0.9)*2)|0;
      const armSway=(Math.sin(ob.bob*1.8)*2)|0;
      const gs='#4a7028',cl='#5a4428',cd='#3a2c18',bl2='#981818',bn2='#d4d0c8';
      px(x-8,bY-1,16,2,'rgba(0,0,0,0.3)');
      // ноги — широкий тяжёлый шаг
      px(x-4,bY-8+lA,3,8,cl);px(x+1,bY-8+lB,3,8,cl);
      px(x-5,bY-1,4,2,cd);px(x+1,bY-1,4,2,cd);
      // тело сутулое
      px(x-4,bY-15+bodyBob,9,7,cl);
      // обе руки вытянуты вперёд (к герою — в сторону меньших x)
      px(x-14,bY-14+armSway+bodyBob,10,2,cl);
      px(x-14,bY-13+armSway+bodyBob,2,3,gs);
      px(x-12,bY-12-armSway+bodyBob,10,2,cd);
      px(x-12,bY-11-armSway+bodyBob,2,3,gs);
      // голова опущена вниз
      px(x-4,bY-22+bodyBob,8,6,gs);px(x-3,bY-23+bodyBob,6,1,gs);px(x-2,bY-24+bodyBob,4,1,gs);
      px(x-3,bY-21+bodyBob,2,1,bl2);px(x-2,bY-20+bodyBob,1,1,bl2);
      px(x+1,bY-21+bodyBob,2,1,bl2);px(x+1,bY-20+bodyBob,1,1,bl2);
      // рот открыт
      px(x-2,bY-17+bodyBob,5,1,cd);px(x-1,bY-17+bodyBob,1,1,bn2);px(x+1,bY-17+bodyBob,1,1,bn2);
    }else if(ob.type==='cactus'){
      // кактус
      px(x-1,bY-1,14,2,'rgba(0,0,0,0.2)');
      // ствол с текстурой
      px(x+1,bY-28,4,28,C.cactus);px(x+2,bY-28,2,28,C.cactusHi);px(x+3,bY-27,1,26,C.cactusDk);
      px(x+1,bY-22,1,5,C.cactusDk);px(x+1,bY-12,1,4,C.cactusDk); // вертикальные рёбра
      // иголки ствола (больше)
      px(x,bY-26,2,1,C.cactusHi);px(x+5,bY-26,2,1,C.cactusHi);
      px(x,bY-22,2,1,C.cactusHi);px(x+5,bY-22,2,1,C.cactusHi);
      px(x,bY-17,2,1,C.cactusHi);px(x+5,bY-17,2,1,C.cactusHi);
      px(x,bY-12,2,1,C.cactusHi);px(x+5,bY-12,2,1,C.cactusHi);
      px(x,bY-7,2,1,C.cactusHi);px(x+5,bY-7,2,1,C.cactusHi);
      // левое ответвление (толще)
      px(x-7,bY-22,8,4,C.cactus);px(x-7,bY-22,8,1,C.cactusHi);px(x-7,bY-22,1,4,C.cactusDk);
      px(x-7,bY-29,4,7,C.cactus);px(x-7,bY-29,2,7,C.cactusHi);px(x-7,bY-28,1,6,C.cactusDk);
      px(x-8,bY-30,1,1,C.cactusHi);px(x-8,bY-25,1,1,C.cactusHi);
      px(x-9,bY-27,2,1,C.cactusHi);px(x-6,bY-29,1,1,C.cactusHi); // иголки ветки
      // правое ответвление
      px(x+5,bY-17,8,4,C.cactus);px(x+5,bY-17,8,1,C.cactusHi);px(x+12,bY-17,1,4,C.cactusDk);
      px(x+10,bY-24,4,7,C.cactus);px(x+10,bY-24,2,7,C.cactusHi);px(x+13,bY-23,1,6,C.cactusDk);
      px(x+13,bY-25,2,1,C.cactusHi);px(x+13,bY-20,2,1,C.cactusHi);
      px(x+14,bY-22,1,1,C.cactusHi);px(x+11,bY-24,1,1,C.cactusHi);
      // цветок на верхушке (пустынные кактусы цветут)
      px(x+1,bY-29,4,2,'#e86080');px(x+2,bY-31,2,3,'#e86080');px(x+2,bY-31,2,1,'#ffa0c0');
    }else if(ob.type==='mummy'){
      // Мумия — жёсткая скованная походка, руки ВСЕГДА горизонтально вперёд (к герою)
      const ph=Math.sin(ob.bob*0.55),lA=(ph*2)|0,lB=(-ph*2)|0;
      const bodyBob=(ph)|0;
      const ey=C.mummyEye;
      px(x-8,bY-1,16,2,'rgba(0,0,0,0.3)');
      px(x-4,bY-10+lA,4,10,C.mummy);px(x+1,bY-10+lB,4,10,C.mummy);
      for(let i=0;i<3;i++){px(x-4,bY-4+lA-i*3,4,1,C.mummyBand);px(x+1,bY-4+lB-i*3,4,1,C.mummyBand);}
      px(x-5,bY-1,5,2,C.mummyDk);px(x+1,bY-1,5,2,C.mummyDk);
      px(x-5,bY-24+bodyBob,11,14,C.mummy);px(x+4,bY-22+bodyBob,2,10,C.mummyDk);px(x-5,bY-22+bodyBob,2,10,C.mummy);
      for(let i=0;i<4;i++)px(x-5,bY-24+i*4+bodyBob,11,1,C.mummyBand);
      // обе руки жёстко вытянуты вперёд (к герою) — не качаются
      px(x-19,bY-20+bodyBob,14,3,C.mummy);
      for(let i=0;i<3;i++)px(x-19+i*4,bY-20+bodyBob,3,1,C.mummyBand);
      px(x-19,bY-22+bodyBob,3,3,C.mummyDk);
      px(x-5,bY-18+bodyBob,10,2,C.mummy);
      for(let i=0;i<2;i++)px(x-5+i*4,bY-18+bodyBob,3,1,C.mummyBand);
      px(x+4,bY-20+bodyBob,2,3,C.mummyDk);
      px(x-4,bY-32+bodyBob,9,8,C.mummy);px(x+3,bY-31+bodyBob,2,6,C.mummyDk);
      px(x-4,bY-32+bodyBob,9,2,C.mummyBand);px(x-4,bY-28+bodyBob,9,1,C.mummyBand);
      px(x-3,bY-30+bodyBob,3,2,ey);px(x+1,bY-30+bodyBob,3,2,ey);
      px(x-2,bY-30+bodyBob,1,1,'#ff6060');px(x+2,bY-30+bodyBob,1,1,'#ff6060');
      px(x-2,bY-27+bodyBob,5,1,C.mummyDk);
    }else if(ob.type==='scorpion'){
      // Скорпион — волновые ноги (каждая в своей фазе), клешни щёлкают, хвост хлещет высоко
      const tA=(Math.sin(ob.bob*1.2)*8)|0;
      const clawSnap=(Math.sin(ob.bob*0.8)*2)|0;
      px(x-12,bY-1,24,2,'rgba(0,0,0,0.3)');
      px(x-6,bY-8,12,8,C.scorpion);px(x-6,bY-8,12,2,C.scorpionHi);px(x+4,bY-7,2,6,C.scorpionDk);
      px(x+4,bY-10,6,5,C.scorpion);px(x+4,bY-10,6,1,C.scorpionHi);
      // клешни щёлкают — верхняя и нижняя двигаются навстречу
      px(x+9,bY-12+clawSnap,3,3,C.scorpionHi);px(x+11,bY-14+clawSnap,3,4,C.scorpion);px(x+13,bY-13+clawSnap,2,2,C.scorpionDk);
      px(x+9,bY-10-clawSnap,3,3,C.scorpionHi);px(x+11,bY-8-clawSnap,3,4,C.scorpion);px(x+13,bY-9-clawSnap,2,2,C.scorpionDk);
      // ноги — каждая в своей фазе (волновой паттерн)
      for(let i=0;i<3;i++){const lph=(Math.sin(ob.bob*2.5+i*1.1)*3)|0;px(x-4+i*3,bY-8+lph,1,8,C.scorpionDk);px(x-3+i*3,bY-3+lph,1,3,C.scorpionDk);}
      for(let i=0;i<3;i++){const lph=(Math.sin(ob.bob*2.5+i*1.1+Math.PI)*3)|0;px(x-4+i*3,bY-8+lph,1,8,C.scorpionTail);px(x-3+i*3,bY-3+lph,1,3,C.scorpionTail);}
      // хвост — хлещет высоко и широко
      px(x-8,bY-8,4,3,C.scorpionTail);px(x-10,bY-12,3,5,C.scorpionTail);
      px(x-12,bY-18-tA,3,7,C.scorpionTail);px(x-11,bY-22-tA,5,3,C.scorpionTail);px(x-10,bY-23-tA,3,1,C.scorpionHi);
      ctx.globalAlpha=0.4;px(x-12,bY-24-tA,7,4,'#80ff30');ctx.globalAlpha=1;
    }else if(ob.type==='bandit'){
      // Разбойник — быстрый бег, плащ хлещет сильно, кинжал с большим замахом
      const ph=Math.sin(ob.bob),lA=(ph*5)|0,lB=(-ph*5)|0,aA=(Math.sin(ob.bob*1.4)*5)|0;
      const capeFlap=(Math.sin(ob.bob*1.6)*4)|0;
      const bY2=bY;
      px(x-9,bY2-1,18,2,'rgba(0,0,0,0.35)');
      // ноги — быстрый высокий бег
      px(x-4,bY2-9+lA,3,9,C.banditCloak);px(x+1,bY2-9+lB,3,9,C.banditCloak);
      px(x-5,bY2-1,4,2,C.banditCloakHi);px(x+1,bY2-1,4,2,C.banditCloakHi);
      px(x-5,bY2-10,10,2,'#7a5018');px(x-5,bY2-10,10,1,'#a07030');px(x+2,bY2-10,3,2,'#4a3010');
      // плащ сильно хлещет при беге
      px(x-6,bY2-24,12,14,C.banditTunic);
      px(x-7,bY2-20+capeFlap,3,12,C.banditCloak);
      px(x+4,bY2-20-capeFlap,3,12,C.banditCloak);
      px(x-6,bY2-24,12,2,C.banditTunicHi);px(x-5,bY2-22,1,12,C.banditTunicHi);
      // правая рука — кинжал с большим замахом
      px(x+4,bY2-20+aA,7,2,C.banditCloak);
      px(x+10,bY2-24+aA,2,8,C.banditDagger);px(x+10,bY2-25+aA,2,1,'#d8d8e8');px(x+9,bY2-22+aA,4,1,'#7a7080');
      // левая рука
      px(x-10,bY2-19-aA,6,2,C.banditCloak);px(x-11,bY2-20-aA,3,3,C.banditSkin);
      px(x-1,bY2-26,3,3,C.banditSkin);
      px(x-4,bY2-34,9,8,C.banditHood);px(x-5,bY2-32,11,5,C.banditHood);px(x-3,bY2-35,7,2,C.banditHood);
      px(x-4,bY2-34,2,8,'#110a04');px(x+2,bY2-34,2,8,'#0e0804');
      px(x-3,bY2-32,7,6,C.banditMask);px(x-2,bY2-30,2,2,'#ff4040');px(x+1,bY2-30,2,2,'#ff4040');
      px(x-2,bY2-30,1,1,'#ff8080');px(x+1,bY2-30,1,1,'#ff8080');
    }else if(ob.type==='goblin'){
      // Гоблин — весь прыгает, дубина описывает большую дугу, глаза ярче в прыжке
      const ph=Math.sin(ob.bob),lA=(ph*4)|0,lB=(-ph*4)|0;
      const hop=(Math.abs(Math.sin(ob.bob*2))*5)|0;
      const aA=(Math.sin(ob.bob*2)*6)|0;
      px(x-7,bY-1-hop,14,2,'rgba(0,0,0,0.3)');
      px(x-4,bY-7+lA-hop,3,7,C.goblinCloth);px(x+1,bY-7+lB-hop,3,7,C.goblinCloth);
      px(x-5,bY-1-hop,4,2,C.goblinSkin);px(x+1,bY-1-hop,4,2,C.goblinSkin);
      px(x-5,bY-14-hop,10,7,C.goblinCloth);px(x-5,bY-14-hop,10,2,C.goblinClothHi);px(x+3,bY-12-hop,2,5,C.goblinSkinDk);
      px(x-9,bY-13+aA-hop,5,2,C.goblinSkin);px(x-9,bY-13+aA-hop,2,4,C.goblinSkin);
      // дубина — большая дуга
      px(x+5,bY-13-aA-hop,4,2,C.goblinSkin);
      px(x+8,bY-20-aA-hop,2,10,'#6a4020');px(x+7,bY-22-aA-hop,4,4,'#8a5828');px(x+6,bY-23-aA-hop,6,2,'#a06830');
      px(x-7,bY-19-hop,2,5,C.goblinSkin);px(x-7,bY-20-hop,2,2,C.goblinSkinHi);
      px(x+5,bY-19-hop,2,5,C.goblinSkin);px(x+5,bY-20-hop,2,2,C.goblinSkinHi);
      px(x-4,bY-22-hop,8,7,C.goblinSkin);px(x-3,bY-23-hop,6,1,C.goblinSkinHi);px(x+2,bY-21-hop,2,5,C.goblinSkinDk);
      // глаза ярче в прыжке
      const eyeGlow=hop>3?'#ff3030':'#e82020';
      px(x-3,bY-20-hop,2,2,eyeGlow);px(x+1,bY-20-hop,2,2,eyeGlow);
      px(x-3,bY-20-hop,1,1,'#ff6060');px(x+1,bY-20-hop,1,1,'#ff6060');
      px(x-1,bY-18-hop,3,2,C.goblinSkinDk);
      px(x-2,bY-16-hop,5,1,C.goblinSkinDk);px(x-1,bY-16-hop,1,1,'#e8e8d0');px(x+1,bY-16-hop,1,1,'#e8e8d0');
    }else if(ob.type==='lizard'){
      // Ящер — рептильная походка с боковым покачиванием тела, хвост хлещет широко
      const ph=Math.sin(ob.bob*0.9),lA=(ph*3)|0,lB=(-ph*3)|0,aA=(Math.sin(ob.bob*1.1)*3)|0;
      const sway=(Math.sin(ob.bob*0.6)*3)|0;
      const tA=(Math.sin(ob.bob*1.3)*6)|0;
      px(x-9,bY-1,18,2,'rgba(0,0,0,0.3)');
      // хвост хлещет широко из стороны в сторону
      px(x-9,bY-5+sway,5,3,C.lizardScale);
      px(x-13,bY-7+tA,5,3,C.lizardScaleDk);
      px(x-17,bY-9+tA*2,4,2,C.lizardScaleDk);
      px(x-20,bY-10+tA*2,3,1,C.lizardScaleDk);
      // ноги
      px(x-4,bY-9+lA,3,9,C.lizardScale);px(x+1,bY-9+lB,3,9,C.lizardScale);
      px(x-5,bY-1,4,2,C.lizardScaleDk);px(x+1,bY-1,4,2,C.lizardScaleDk);
      // тело качается вбок при ходьбе
      px(x-5+sway,bY-19,10,10,C.lizardScale);px(x-5+sway,bY-19,10,2,C.lizardScaleHi);px(x+3+sway,bY-17,2,8,C.lizardScaleDk);
      px(x-3+sway,bY-17,5,8,C.lizardBelly);
      for(let i=0;i<3;i++)px(x-4+sway,bY-19+i*3,9,1,C.lizardScaleDk);
      px(x-8+sway,bY-17+aA,4,2,C.lizardScale);px(x-8+sway,bY-16+aA,2,3,C.lizardScale);
      px(x+5+sway,bY-17-aA,4,2,C.lizardScale);px(x+7+sway,bY-16-aA,2,3,C.lizardScale);
      // голова следует за телом
      px(x-4+sway,bY-24,8,5,C.lizardScale);px(x-4+sway,bY-25,8,1,C.lizardScaleHi);px(x+2+sway,bY-23,2,4,C.lizardScaleDk);
      px(x+2+sway,bY-23,6,4,C.lizardScale);px(x+2+sway,bY-23,6,1,C.lizardScaleHi);px(x+7+sway,bY-22,2,2,C.lizardScaleDk);
      px(x+6+sway,bY-21,1,1,C.lizardScaleDk);
      px(x-2+sway,bY-22,3,2,'#f0d020');px(x-2+sway,bY-22,1,2,'#000');
      px(x+1+sway,bY-22,3,2,'#f0d020');px(x+2+sway,bY-22,1,2,'#000');
    }else if(ob.type==='mimic'){
      // Мимик — сундук-монстр: крышка открывается, зубы, глаза, ножки
      const open=(Math.abs(Math.sin(ob.bob*1.4))*10)|0;
      const eyePulse=0.7+Math.sin(ob.bob*2.6)*0.3;
      const stompL=(Math.abs(Math.sin(ob.bob*2.5))*4)|0;
      const stompR=(Math.abs(Math.sin(ob.bob*2.5+1.2))*4)|0;
      // тень
      px(x-11,bY-1,22,3,'rgba(0,0,0,0.35)');
      // ноги сундука — топают
      px(x-10,bY-stompL,5,stompL+4,C.mimicWoodDk);px(x-10,bY-stompL,5,2,C.mimicWood);
      px(x+5, bY-stompR,5,stompR+4,C.mimicWoodDk);px(x+5, bY-stompR,5,2,C.mimicWood);
      // нижняя часть сундука (тело)
      const bY2=bY-4;
      px(x-11,bY2-11,22,11,C.mimicWood);px(x-11,bY2-11,22,2,C.mimicWoodHi);px(x+9,bY2-11,2,11,C.mimicWoodDk);
      // металлические полосы
      px(x-11,bY2-8,22,2,C.mimicBand);px(x-11,bY2-8,22,1,C.mimicBandHi);
      px(x-1,bY2-11,2,11,C.mimicBand);
      // замок
      px(x-2,bY2-9,5,4,C.mimicLock);px(x-1,bY2-8,3,2,'#f0e060');
      // рот — открывается (зубы в нижней части)
      if(open>1){
        px(x-10,bY2-11,20,2,C.mimicTeeth);
        for(let ti=0;ti<5;ti++){px(x-9+ti*4,bY2-13,2,3,C.mimicTeeth);}
        // язык в глубине
        ctx.globalAlpha=0.85;px(x-4,bY2-9,8,3,C.mimicTongue);ctx.globalAlpha=1;
      }
      // крышка — открывается с анимацией
      px(x-11,bY2-11-open,22,4,C.mimicWood);px(x-11,bY2-11-open,22,1,C.mimicWoodHi);
      px(x+9,bY2-11-open,2,4,C.mimicWoodDk);
      px(x-11,bY2-12-open,22,2,C.mimicBand);px(x-11,bY2-12-open,22,1,C.mimicBandHi);
      // глаза (в верхней части)
      ctx.globalAlpha=eyePulse*mineTransition;
      px(x-7,bY2-17,4,4,C.mimicEye);px(x-7,bY2-17,4,1,'#ff8080');px(x-7,bY2-20,2,3,'#ff8080');
      px(x+3,bY2-17,4,4,C.mimicEye);px(x+3,bY2-17,4,1,'#ff8080');px(x+5,bY2-20,2,3,'#ff8080');
      ctx.globalAlpha=1;
      // свечение глаз
      const eg=ctx.createRadialGradient(x-5,bY2-17,0,x-5,bY2-17,12);
      eg.addColorStop(0,'rgba(255,30,10,0.35)');eg.addColorStop(1,'rgba(255,30,10,0)');
      ctx.fillStyle=eg;ctx.fillRect(x-17,bY2-29,24,24);
    }else if(ob.type==='rat_miner'){
      // Крыса-шахтёр — быстрая суета, кайло описывает большой круг, хвост и голова бобятся
      const ph=Math.sin(ob.bob),lA=(ph*5)|0,lB=(-ph*5)|0;
      const aA=(Math.sin(ob.bob*2)*6)|0;
      const headBob=(Math.sin(ob.bob*2)*2)|0;
      const tailWag=(Math.sin(ob.bob*1.4)*4)|0;
      px(x-7,bY-1,14,2,'rgba(0,0,0,0.3)');
      // хвост виляет активно
      px(x-8,bY-5+tailWag,5,2,C.ratFurDk);px(x-12,bY-7+tailWag,4,2,C.ratFurDk);px(x-14,bY-8+tailWag,3,1,C.ratFurDk);
      // ноги — быстрые мелкие шаги
      px(x-4,bY-7+lA,3,7,C.ratFur);px(x+1,bY-7+lB,3,7,C.ratFur);
      px(x-5,bY-1,4,2,C.ratFurDk);px(x+1,bY-1,4,2,C.ratFurDk);
      px(x-7,bY-14,3,8,'#4a3010');px(x-7,bY-14,3,1,'#6a4820');
      px(x-7,bY-9,3,2,C.lootOre);px(x-7,bY-12,3,2,C.lootOreHi);
      px(x-4,bY-15,8,8,C.ratFur);px(x-4,bY-15,8,2,C.ratFurHi);px(x+2,bY-13,2,6,C.ratFurDk);
      px(x-8,bY-13+aA,5,2,C.ratFur);px(x-9,bY-12+aA,2,3,C.ratFur);
      // кайло описывает большой круговой замах
      px(x+4,bY-14-aA,4,2,C.ratFur);
      px(x+7,bY-19-aA,2,9,'#7a7080');px(x+5,bY-21-aA,7,2,'#8a8090');px(x+6,bY-20-aA,6,1,'#c0c0c8');
      // голова бобится при беге
      px(x-1,bY-17+headBob,3,2,C.ratFur);
      px(x-3,bY-21+headBob,7,4,C.ratFur);px(x-3,bY-22+headBob,5,1,C.ratFurHi);px(x+2,bY-20+headBob,2,3,C.ratFurDk);
      px(x+2,bY-20+headBob,4,3,C.ratFur);px(x+5,bY-19+headBob,2,1,'#d09898');
      px(x-3,bY-23+headBob,2,3,C.ratFur);px(x-3,bY-24+headBob,2,1,C.ratFurHi);px(x-2,bY-23+headBob,1,2,'#c87878');
      px(x-4,bY-24+headBob,9,3,C.ratHelmet);px(x-3,bY-25+headBob,7,1,C.ratHelmet);px(x-4,bY-24+headBob,9,1,C.ratHelmetHi);
      px(x+3,bY-26+headBob,3,2,'#f0e060');
      ctx.globalAlpha=0.35+(Math.sin(ob.bob*3)*0.15);px(x+2,bY-28+headBob,6,5,'#f8f060');ctx.globalAlpha=1;
      px(x-2,bY-20+headBob,2,2,'#e82020');px(x+2,bY-20+headBob,2,2,'#e82020');
      px(x-2,bY-20+headBob,1,1,'#ff6060');px(x+2,bY-20+headBob,1,1,'#ff6060');
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
      ctx.globalAlpha=0.28;px(x-9,bY-1,20,5,'#000');ctx.globalAlpha=1;
      // основная форма камня
      px(x-8,bY-10,16,10,C.stoneCol);px(x-7,bY-12,14,4,C.stoneCol);px(x-5,bY-13,8,2,C.stoneCol);
      // подсветка верха и тень правого края
      px(x-6,bY-13,10,3,C.stoneHi);px(x-7,bY-12,2,4,C.stoneHi);
      px(x+4,bY-10,4,10,C.stoneDk);px(x+3,bY-12,3,3,C.stoneDk);
      // трещины
      px(x-2,bY-12,1,8,C.stoneDk);px(x-1,bY-8,1,4,C.stoneDk);
      px(x+2,bY-11,1,5,C.stoneDk);
      // лишайник двух тонов
      px(x-6,bY-13,5,3,C.stoneMoss);px(x+1,bY-12,4,2,C.stoneMoss);
      px(x-4,bY-10,3,2,C.stoneMoss);
      px(x-7,bY-9,2,3,'#5a7840'); // тёмный мох
      px(x+3,bY-10,2,2,'#7a6030'); // охровый лишайник
      // мелкие камни у основания
      px(x-10,bY-2,3,2,C.stoneDk);px(x+8,bY-3,2,2,C.stoneDk);px(x+7,bY-1,3,1,C.stoneCol);
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
    }
  }

  function drawLootDrop(ld:LootDrop){
    const x=ld.x|0,y=(GY-9+Math.sin(ld.bob)*3)|0;
    // тень под предметом
    ctx.globalAlpha=0.40;px(x-5,GY-2,10,3,'#000');
    // мерцающий ореол
    ctx.globalAlpha=0.18+Math.sin(ld.bob*2)*0.08;
    px(x-6,y-6,12,12,'#ffee80');
    ctx.globalAlpha=1;
    if(ld.type==='loot_flesh'){
      // мясо — неровная форма, кровяные пятна
      px(x-4,y-3,8,5,C.lootFlesh);px(x-3,y-4,6,2,C.lootFleshHi);
      px(x-4,y-1,3,1,C.lootFlesh);px(x+2,y-1,3,1,C.lootFlesh); // неровные края
      px(x-2,y-2,2,2,'#5a0808');px(x+1,y-3,2,1,'#c04828');px(x-3,y-1,2,1,C.lootFleshHi);
      px(x,y-4,1,1,'#800c0c'); // тёмное пятно
    }else if(ld.type==='loot_leather'){
      // кожа — сложенная, со стежками
      px(x-4,y-3,8,5,C.lootLeather);px(x-3,y-4,6,2,C.lootLeatherHi);
      px(x-3,y-1,7,1,'#4a2808');px(x+2,y-3,2,1,C.lootLeatherHi);
      // стежки
      for(let i=0;i<3;i++)px(x-3+i*2,y-4,1,1,'#2a1404');
      px(x+3,y-2,1,3,'#4a2808'); // складка
    }else if(ld.type==='loot_cloth'){
      // ткань — складки, неровный верх
      px(x-5,y-2,10,4,C.lootCloth);px(x-4,y-3,8,1,C.lootClothHi);
      px(x-5,y-1,2,2,C.lootCloth);px(x+3,y-1,3,2,C.lootCloth); // угловые складки
      px(x-4,y-1,3,2,'#a0988a');px(x+2,y-2,3,2,'#a0988a');
      px(x-3,y-3,2,1,'#d0c8be'); // яркое пятно
      px(x+1,y-2,2,1,'#c0b8ae');
    }else if(ld.type==='loot_scale'){
      // чешуя — перекрывающийся узор
      px(x-3,y-5,6,7,C.lootScale);px(x-2,y-6,4,2,C.lootScaleHi);
      px(x-3,y-3,2,2,C.lizardScaleDk);px(x+1,y-4,2,2,C.lizardScaleDk);
      px(x-1,y-5,2,2,C.lootScaleHi); // блик
      // узор чешуи
      px(x-2,y-2,1,2,C.lizardScaleDk);px(x+1,y-1,1,2,C.lizardScaleDk);
    }else if(ld.type==='loot_ore'){
      // руда — угловатый самородок
      px(x-4,y-4,8,6,C.lootOre);px(x-3,y-5,5,2,C.lootOreHi);
      px(x+2,y-4,2,5,C.mineOreDk); // тёмный скол
      px(x-1,y-5,2,1,'#c8c8d8');px(x+2,y-3,1,2,'#a8a8bc');px(x-2,y-2,2,1,C.lootOreHi);
      // блеск металла
      px(x-3,y-5,1,1,'#e8e8f0');px(x,y-4,1,1,'#e0e0ec');
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
      // три тона частицы
      const col=lr>0.66?'#a08870':lr>0.33?'#7a6050':'#4a3828';
      const colHi=lr>0.66?'#c8b098':lr>0.33?'#9a7860':'#6a4838';
      // внешнее свечение
      ctx.globalAlpha=a*0.20;
      const hs=lr>0.5?4:3;
      px(d.x-1,d.y-1,hs+1,hs+1,'#c0a888');
      // ядро частицы (неправильная форма)
      ctx.globalAlpha=a*0.75;
      const sz=lr>0.66?3:lr>0.33?2:1;
      px(d.x,d.y,sz,sz,col);
      // блик сверху
      ctx.globalAlpha=a*0.4;
      px(d.x,d.y,sz,1,colHi);
      // маленький осколок рядом
      if(lr>0.5&&sz>1){ctx.globalAlpha=a*0.3;px(d.x+sz+1,d.y-1,1,1,colHi);}
      ctx.globalAlpha=1;
    }
  }
  function drawGhostParticles(){
    for(const g of ghostParticles){
      const a=g.life/g.maxLife;
      // большое внешнее свечение
      ctx.globalAlpha=a*0.18;
      px(g.x-2,g.y-3,6,7,'#40e0d0');
      // средний ореол
      ctx.globalAlpha=a*0.30;
      px(g.x-1,g.y-2,4,5,'#80f0e0');
      // слеза тела: широкий верх, острый низ
      ctx.globalAlpha=a*0.85;
      px(g.x-1,g.y-2,3,2,C.potGlow);
      px(g.x,g.y,2,1,C.potGlow);
      px(g.x,g.y+1,1,1,C.potGlow);
      // яркое белое ядро
      ctx.globalAlpha=a;
      px(g.x,g.y-2,1,1,'#ffffff');px(g.x-1,g.y-1,1,1,'#c0fffa');
      // мини-хвостик
      ctx.globalAlpha=a*0.4;
      px(g.x,g.y+2,1,1,C.potGlow);
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
    if(g.kind==='boer'){
      // Бурские ворота — деревянный форт
      const pTop=GY-68,openH=52,pW=14;
      const wd=C.wood,wdHi=C.woodHi,wdDk=C.woodDk;
      px(x-44,pTop,pW,GY-pTop,wd);px(x-44,pTop,2,GY-pTop,wdHi);px(x-32,pTop,1,GY-pTop,wdDk);
      px(x+30,pTop,pW,GY-pTop,wd);px(x+30,pTop,2,GY-pTop,wdHi);px(x+43,pTop,1,GY-pTop,wdDk);
      for(let y=pTop+8;y<GY-4;y+=10){px(x-44,y,pW,1,wdDk);px(x+30,y,pW,1,wdDk);}
      px(x-44,GY-openH-8,88,8,wd);px(x-44,GY-openH-8,88,2,wdHi);px(x-44,GY-openH-1,88,1,wdDk);
      for(let m=0;m<9;m++)px(x-42+m*10,GY-openH-14,7,6,wd);
      ctx.globalAlpha=0.85;txt('БУРСКИЙ ФРОНТ',x,GY-openH-18,C.britRed,5,'center','#000');ctx.globalAlpha=1;
    }
    if(g.kind==='mine'){
      // Ворота шахты — деревянный крепёж из брёвен, рельсы уходят внутрь
      const pTop=GY-70,openH=54,pW=12;
      const wd=C.mimicWoodDk,wdHi=C.mimicWood,wdDk='#2a1808';
      const st=C.mineWall,stHi=C.mineWallHi,stDk=C.mineWallDk;
      // каменные стены шахты
      px(x-46,pTop,pW+2,GY-pTop,st);px(x-46,pTop,2,GY-pTop,stHi);px(x-36,pTop,2,GY-pTop,stDk);
      px(x+34,pTop,pW+2,GY-pTop,st);px(x+34,pTop,2,GY-pTop,stHi);px(x+44,pTop,2,GY-pTop,stDk);
      for(let y=pTop+8;y<GY-openH;y+=9){px(x-46,y,pW+2,1,stDk);px(x+34,y,pW+2,1,stDk);}
      // деревянные распорки — крест-наперекрест
      px(x-46,GY-openH-10,90,10,wd);px(x-46,GY-openH-10,90,2,wdHi);px(x-46,GY-openH-2,90,2,wdDk);
      // деревянные стойки по бокам
      px(x-36,pTop-2,8,GY-pTop+2,wd);px(x-36,pTop,4,GY-pTop,wdHi);
      px(x+28,pTop-2,8,GY-pTop+2,wd);px(x+28,pTop,4,GY-pTop,wdHi);
      // диагональные подпорки
      for(let i=0;i<6;i++){const dy=i*9;px(x-34+i,GY-openH-10+dy,4,3,wdDk);}
      // тьма внутри шахты
      ctx.globalAlpha=0.9;px(x-26,GY-openH,54,openH,'#050208');ctx.globalAlpha=1;
      // рельсы (два параллельных пути уходят вглубь)
      ctx.globalAlpha=0.6;
      px(x-12,GY-2,3,openH,'#808088');px(x+9,GY-2,3,openH,'#808088');
      px(x-12,GY-2,3,1,'#a0a0a8');px(x+9,GY-2,3,1,'#a0a0a8');
      ctx.globalAlpha=1;
      // факелы на стойках
      const fl=(Math.sin(ct*0.3)*1.5)|0;
      ctx.globalAlpha=0.85;px(x-34,GY-56+fl,5,7,C.mineTorch);px(x-33,GY-59+fl,3,4,C.mineTorchGlow);px(x-32,GY-61+fl,1,3,'#fff8e0');
      ctx.globalAlpha=0.35;const tg=ctx.createRadialGradient(x-31,GY-56,0,x-31,GY-56,22);tg.addColorStop(0,'rgba(255,140,20,0.4)');tg.addColorStop(1,'rgba(255,140,20,0)');ctx.fillStyle=tg;ctx.fillRect(x-53,GY-78,44,44);
      ctx.globalAlpha=0.85;px(x+29,GY-56-fl,5,7,C.mineTorch);px(x+30,GY-59-fl,3,4,C.mineTorchGlow);px(x+31,GY-61-fl,1,3,'#fff8e0');
      ctx.globalAlpha=0.35;const tg2=ctx.createRadialGradient(x+32,GY-56,0,x+32,GY-56,22);tg2.addColorStop(0,'rgba(255,140,20,0.4)');tg2.addColorStop(1,'rgba(255,140,20,0)');ctx.fillStyle=tg2;ctx.fillRect(x+9,GY-78,44,44);
      ctx.globalAlpha=1;
      // опасная табличка
      px(x-10,GY-openH-18,20,10,wdHi);px(x-10,GY-openH-18,20,1,C.mimicBandHi);px(x-10,GY-openH-10,20,1,wdDk);
      ctx.globalAlpha=0.9;txt('ШАХТА',x,GY-openH-11,C.mineTorch,5,'center','#000');ctx.globalAlpha=1;
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
    // рамка с внешним свечением
    ctx.globalAlpha=0.18;px(bx-2,by-2,bw+4,11,'#6040c8');ctx.globalAlpha=1;
    px(bx-1,by-1,bw+2,9,'rgba(6,2,14,0.85)');
    // фоновая полоса
    px(bx,by,bw,7,'#1a1038');
    // рамочка
    px(bx-1,by-1,bw+2,1,'#2a1850');px(bx-1,by+7,bw+2,1,'#2a1850');
    px(bx-1,by,1,7,'#2a1850');px(bx+bw,by,1,7,'#2a1850');
    const prog=Math.min(1,xp/xpToNext);
    const fw=Math.floor(bw*prog);
    if(fw>0){
      // заливка 4 слоя градиент
      ctx.fillStyle='#281870';ctx.fillRect(bx,by+6,fw,1);   // нижний тёмный
      ctx.fillStyle='#3828a0';ctx.fillRect(bx,by+4,fw,2);   // тёмный
      ctx.fillStyle='#5040c8';ctx.fillRect(bx,by+2,fw,2);   // основной
      ctx.fillStyle='#7858e8';ctx.fillRect(bx,by+1,fw,1);   // светлый
      ctx.fillStyle='#9070f8';ctx.fillRect(bx,by,fw,1);     // яркий верх
      // деления
      for(let tx=bx+8;tx<bx+fw-2;tx+=8){
        ctx.fillStyle='rgba(30,10,80,0.45)';ctx.fillRect(tx,by,1,7);
      }
      // сияющий край заполнения
      if(fw>1){
        ctx.globalAlpha=0.95;px(bx+fw-1,by,1,7,'#d0b8ff');
        ctx.globalAlpha=0.35;px(bx+fw,by,1,7,'#a080e0');
        ctx.globalAlpha=1;
      }
      // блик сверху (только в заполненной части)
      ctx.globalAlpha=0.3;px(bx,by,fw,1,'#c0a8ff');ctx.globalAlpha=1;
    }
    txt('Lv'+level,bx+bw+4,by+6,'#c0a0f0',6,'left','#0a0418');
  }
  function drawQuestPanel(){
    if(activeQuests.length===0)return;
    const qx=4,qy=60,qw=136,qh=14;
    px(qx-2,qy-3,qw+4,activeQuests.length*qh+5,'rgba(4,1,12,0.88)');
    px(qx-2,qy-3,qw+4,1,'#4a2888');
    for(let i=0;i<activeQuests.length;i++){
      const q=activeQuests[i],y=qy+i*qh;
      const prog=Math.min(1,q.progress/q.target);
      if(q.done){
        txt('✓ '+q.desc,qx+3,y+10,'#ffe840',7,'left','#000');
      }else{
        // иконка + текст слева, счётчик справа — одна строка
        const counter=q.progress+'/'+q.target;
        ctx.font=`bold 7px ${PF}`;
        const cw=ctx.measureText(counter).width+2;
        txt(q.icon+' '+q.desc,qx+3,y+10,'#d8c8ff',7,'left','#000',qw-cw-6);
        txt(counter,qx+qw-1,y+10,'#8070c0',7,'right','#000');
        // тонкая полоска прогресса
        px(qx+2,y+12,qw-4,2,'rgba(30,14,60,0.8)');
        if(prog>0)px(qx+2,y+12,Math.floor((qw-4)*prog),2,'#7060c0');
      }
    }
  }
  function drawTutorial(){
    if(tutStep===0||tutStep>TUT_STEPS.length)return;
    const s=TUT_STEPS[tutStep-1];
    const fadeIn=Math.min(1,tutTimer/20);
    const fadeOut=tutTimer>TUT_AUTO-40?Math.max(0,(TUT_AUTO-tutTimer)/40):1;
    const alpha=fadeIn*fadeOut;
    if(alpha<=0)return;
    const BW=186,BH=38;
    const bx=((W-BW)/2)|0,by=96;
    // фон
    ctx.globalAlpha=alpha*0.92;
    px(bx,by,BW,BH,'rgba(4,1,14,0.95)');
    // рамка — оранжевая как тыква
    ctx.globalAlpha=alpha;
    px(bx,by,BW,2,'#ef8a1c');px(bx,by+BH-2,BW,2,'#ef8a1c');
    px(bx,by,2,BH,'#ef8a1c');px(bx+BW-2,by,2,BH,'#ef8a1c');
    // иконка
    const blink=Math.sin(ct*0.18)*0.35+0.65;
    ctx.globalAlpha=alpha*blink;
    txt(s.icon,bx+18,by+24,'#ef8a1c',14,'center','#000');
    ctx.globalAlpha=alpha;
    // текст — две строки
    txt(s.line1,bx+BW/2+8,by+16,'#ffe8a0',8,'center','#1a0800');
    txt(s.line2,bx+BW/2+8,by+29,'#c8b0e0',7,'center','#1a0800');
    // прогресс-бар авто-перехода
    const pp=Math.min(1,tutTimer/TUT_AUTO);
    ctx.globalAlpha=alpha*0.5;
    px(bx+2,by+BH-4,Math.floor((BW-4)*pp),2,'#ef8a1c');
    ctx.globalAlpha=1;
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
    if(mineFlash>0){
      const a=Math.min(1,(mineFlash/220)*4);ctx.globalAlpha=a;
      txt('ШАХТА',W/2,56,C.mineTorch,9,'center','#1a0800');
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
      ctx.font=`bold 7px ${PF}`;ctx.textAlign='left';
      ctx.fillStyle='#1a0830';ctx.fillText('МЯУ!',px0+27,drawY+10);
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
      {t:'БЕЗГОЛОВЫЙ ВСАДНИК',size:11,col:C.pumpkin,gap:16},
      {t:'ENDLESS RUNNER',size:7,col:'#c8b0e8',gap:20},
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
    const deathMsg='БЕЗГОЛОВЫЙ ВСАДНИК ПАЛ';
    const deathCol='#e85a5a';
    const deathSub='Ворона улетела...';
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
    if(state===ST.MENU)camX=mCamX;
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
    if(state===ST.MENU)drawMenuDemo();
    if(state===ST.PLAY||state===ST.DEAD||state===ST.LEVELUP){if(hero.mounted)drawHeroOnHorse(hero.x,hero.y);else drawHeroOnFoot(hero.x,hero.y);}
    if(state===ST.PLAY||state===ST.LEVELUP)drawPumpkinLight();
    if(state===ST.PLAY)drawHUD();
    if(state===ST.PLAY)drawTutorial();
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
