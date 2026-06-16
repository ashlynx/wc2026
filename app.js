/* =======================================================================
   外部リンク設定 — ここのURLを書き換えるだけでサイト全体に反映されます
   （PR/アフィリエイト枠は data-aff="dazn" と prCardが参照します）
   ======================================================================= */
const LINKS = {
  dazn:     "#",                                   // ← DAZN等アフィリエイトURLをここに
  nhk:      "https://www.nhk.jp/g/fifaworldcup/",  // NHK公式 W杯ページ
  bs4k:     "https://www.nhk.jp/p/bs4k/",          // BS4K案内
  schedule: "schedule.html",
  japan:    "japan.html",
  guideDazn:"guide-dazn.html",                     // 記事: DAZNで見る方法
  guideBs4k:"guide-bs4k.html"                      // 記事: BS4Kで見る方法
};
// data-aff属性を持つ静的リンクにURLを流し込む
function applyLinks(){
  document.querySelectorAll("[data-aff]").forEach(a=>{
    const k=a.getAttribute("data-aff"); if(LINKS[k]) a.href=LINKS[k];
  });
}
// 正式名称（試合行・ヒーローでの表示用。内部キーは短縮名のまま）
const FULLNAME = { "ボスニア":"ボスニア・ヘルツェゴビナ" };
function dispName(n){ return (typeof FULLNAME!=="undefined" && FULLNAME[n]) || n; }

// NHK風の導線ブロック（配信・速報・BS4K・日程）
function watchLinks(){
  const items=[
    {t:"DAZNで2026 W杯を見る方法",d:"全104試合ライブ＋日本戦は無料。料金プランと申し込み手順を解説。",c:"記事を読む",h:LINKS.guideDazn,pr:true,ext:false},
    {t:"NHK BS4Kで全試合を観る",d:"受信契約があれば追加料金なし。視聴方法をいちから解説。",c:"記事を読む",h:LINKS.guideBs4k,pr:false,ext:false},
    {t:"日本代表 速報・最新情報",d:"結果・メンバー・コメントを随時更新でチェック。",c:"速報を見る",h:LINKS.nhk,pr:false,ext:true},
    {t:"全試合スケジュール",d:"日本時間で全104試合の日程・放送を一覧。",c:"日程を見る",h:LINKS.schedule,pr:false,ext:false}
  ];
  return `<div class="sec-head"><span class="kicker">MORE</span><h2>もっと楽しむ・配信で見る</h2><div class="line"></div></div>
  <div class="link-grid">`+items.map(x=>`<a class="lcard" href="${x.h}"${x.ext?' target="_blank" rel="noopener"':''}>
      ${x.pr?'<span class="lc-tag">PR</span>':''}
      <div class="lc-body"><b>${x.t}</b><span>${x.d}</span></div>
      <span class="lc-cta">${x.c} →</span></a>`).join("")+`</div>`;
}

/* ===== ヘッダー & フッター（全ページ共通で注入） ===== */
function buildChrome(active){
  const nav = [
    ["index.html","トップ","top"],
    ["schedule.html","全試合日程","schedule"],
    ["japan.html","日本代表","japan"],
    ["standings.html","順位表","standings"],
    ["watch-guide.html","視聴診断","watch"]
  ];
  const links = nav.map(([h,t,k])=>`<a href="${h}"${k===active?' class="on"':''}>${t}</a>`).join("");
  const draw  = nav.map(([h,t,k])=>`<a href="${h}" data-close${k===active?' class="on"':''}>${t}</a>`).join("");
  document.getElementById("chrome-header").innerHTML = `
    <header><div class="wrap nav">
      <a href="index.html" class="brand"><span class="badge">P26</span>
        <span><b>PITCH26</b><small>2026 W杯 視聴ガイド</small></span></a>
      <nav class="menu">${links}</nav>
      <div class="countchip">キックオフまで <b id="hdr-days">--</b> 日</div>
      <a href="watch-guide.html" class="btn">視聴診断</a>
      <button class="menu-toggle" id="open-drawer" aria-label="メニュー">☰</button>
    </div></header>
    <div class="drawer" id="drawer">
      <button class="close" id="close-drawer" aria-label="閉じる">✕</button>${draw}
    </div>`;

  const foot = document.getElementById("chrome-footer");
  if(foot) foot.innerHTML = `
    <footer><div class="wrap">
      <div class="foot-links">
        <a href="privacy.html">プライバシーポリシー</a><a href="about.html">運営者情報</a>
        <a href="disclaimer.html">免責事項</a><a href="contact.html">お問い合わせ</a>
      </div>
      <p class="foot-note">© 2026 PITCH26｜2026 W杯 視聴ガイド ・本サイトは非公式ガイドです。日程・放送内容は変更される場合があります。最新情報は各公式サイトをご確認ください。</p>
    </div></footer>`;

  // drawer
  const drawer = document.getElementById("drawer");
  document.getElementById("open-drawer").onclick = ()=>drawer.classList.add("open");
  document.getElementById("close-drawer").onclick = ()=>drawer.classList.remove("open");
  drawer.querySelectorAll("[data-close]").forEach(a=>a.onclick=()=>drawer.classList.remove("open"));

  // header day counter（次の日本戦まで）
  const hd = document.getElementById("hdr-days");
  const _nm = (typeof nextMatch==="function") ? nextMatch(true) : null;
  const dleft = _nm ? Math.max(0, Math.ceil((matchDT(_nm)-Date.now())/86400000)) : 0;
  if(hd) hd.textContent = dleft;

  applyLinks();
}

/* ===== ライブデータ（wc2026-live.json）取り込み ===== */
let LIVE_STD = {};     // {A:[{team,p,w,d,l,gf,ga,gd,pts}], ...}
let LIVE_UPDATED = null;

// football-data.org の英語名 → 当サイトの日本語名
const EN2JP = {
  "Mexico":"メキシコ","South Africa":"南アフリカ","South Korea":"韓国","Czechia":"チェコ",
  "Canada":"カナダ","Bosnia-Herzegovina":"ボスニア","Switzerland":"スイス","Qatar":"カタール",
  "Brazil":"ブラジル","Morocco":"モロッコ","Haiti":"ハイチ","Scotland":"スコットランド",
  "United States":"アメリカ","Paraguay":"パラグアイ","Australia":"オーストラリア","Turkey":"トルコ","Türkiye":"トルコ",
  "Germany":"ドイツ","Curaçao":"キュラソー","Ivory Coast":"コートジボワール","Ecuador":"エクアドル",
  "Spain":"スペイン","Cape Verde Islands":"カーボベルデ","Cape Verde":"カーボベルデ","Belgium":"ベルギー",
  "Egypt":"エジプト","Saudi Arabia":"サウジアラビア","Uruguay":"ウルグアイ","Iran":"イラン",
  "New Zealand":"ニュージーランド","France":"フランス","Senegal":"セネガル","Iraq":"イラク",
  "Norway":"ノルウェー","Argentina":"アルゼンチン","Algeria":"アルジェリア","Austria":"オーストリア",
  "Jordan":"ヨルダン","Portugal":"ポルトガル","Congo DR":"DRコンゴ","DR Congo":"DRコンゴ",
  "England":"イングランド","Croatia":"クロアチア","Ghana":"ガーナ","Panama":"パナマ",
  "Uzbekistan":"ウズベキスタン","Colombia":"コロンビア","Netherlands":"オランダ","Japan":"日本",
  "Sweden":"スウェーデン","Tunisia":"チュニジア"
};
const toJp = en => EN2JP[en] || en;
const grpLetter = g => g ? g.replace(/^group[_\s]*/i,"").trim().toUpperCase() : null;

function applyLiveScores(scores){
  (scores||[]).forEach(sc=>{
    if(sc.homeScore==null||sc.awayScore==null) return;
    const g=grpLetter(sc.group), home=toJp(sc.homeTeam), away=toJp(sc.awayTeam);
    if(!g||!home||!away) return;
    const m=MATCHES.find(x=>x.g===g && ((x.a===home&&x.b===away)||(x.a===away&&x.b===home)));
    if(!m) return;
    m.s = (m.a===home) ? [sc.homeScore,sc.awayScore] : [sc.awayScore,sc.homeScore];
  });
}
function buildLiveStandings(stdArr){
  const out={};
  (stdArr||[]).forEach(g=>{
    const L=grpLetter(g.group); if(!L) return;
    out[L]=(g.teams||[]).map(t=>({
      team:toJp(t.team), p:t.played, w:t.won, d:t.drawn, l:t.lost,
      gf:t.goalsFor, ga:t.goalsAgainst, gd:t.goalDifference, pts:t.points
    }));
  });
  return out;
}
async function loadLive(){
  try{
    const r=await fetch("wc2026-live.json",{cache:"no-store"});
    if(!r.ok) return;
    const j=await r.json();
    if(j.standings) LIVE_STD=buildLiveStandings(j.standings);
    if(j.scores)    applyLiveScores(j.scores);
    LIVE_UPDATED=j.lastUpdated||null;
  }catch(e){ /* JSONが無ければ data.js の静的データにフォールバック */ }
}
// ライブ取得 → 描画。各ページは render 関数を渡す。
function bootstrap(render){ loadLive().then(render).catch(render); }

/* ===== 試合日時・次の試合・ヒーロー ===== */
function matchDT(m){
  const p=m.d.split("."), mo=p[0].padStart(2,"0"), da=p[1].padStart(2,"0");
  return new Date(`2026-${mo}-${da}T${m.time}:00+09:00`);
}
function nextMatch(japanOnly){
  const now=Date.now();
  const pool=MATCHES.filter(m=>m.g && (!japanOnly||m.jp) && matchDT(m).getTime()>now);
  pool.sort((a,b)=>matchDT(a)-matchDT(b));
  return pool[0]||null;
}
function jpMatchNo(m){
  const jps=MATCHES.filter(x=>x.jp).sort((a,b)=>matchDT(a)-matchDT(b));
  const i=jps.indexOf(m); return i>=0?i+1:null;
}
function dateLabel(m){ const p=m.d.split("."); return `${parseInt(p[0],10)}月${parseInt(p[1],10)}日(${m.w})`; }
function heroTicket(m){
  if(!m) return `<div class="ticket"><div class="ticket-grid" style="grid-template-columns:1fr"><div class="center"><div class="kick-date">グループステージ全日程終了</div><div class="kick-jst">決勝トーナメントは順位表ページへ</div></div></div></div>`;
  const left = m.b==="日本" ? m.b : m.a;     // 日本を左に
  const right = left===m.a ? m.b : m.a;
  const tb=(name,r)=>`<div class="team${name==="日本"?' jp':''}${r?' right':''}"><img class="flag" src="${flag(name)}" alt="${name}"><div><div class="name">${dispName(name)}</div><div class="rank">FIFA ${RANK[name]||'-'}位</div></div></div>`;
  const chips=(m.tv||[]).map(t=>`<span class="chip${t==="無料"?' free':''}">${t}</span>`).join("");
  const local = m.loc?`<div class="kick-local">${m.loc}</div>`:'';
  return `<div class="ticket">
    <div class="ticket-grid">
      ${tb(left,false)}
      <div class="center"><div class="kick-date">${dateLabel(m)}</div><div class="kick-time">${m.time}</div><div class="kick-jst">日本時間 (JST)</div>${local}</div>
      ${tb(right,true)}
    </div>
    <div class="ticket-foot">
      <span class="where">📍 ${m.v}</span>
      <div class="chips">${chips}<a href="match.html?m=${encodeURIComponent(matchId(m))}" class="detail-link">詳細 →</a></div>
    </div></div>`;
}

/* ===== 順位計算（試合結果 s:[a,b] から集計し並び替え） ===== */
function computeStandings(g){
  // ライブ順位があればそれを採用（並びは念のため再ソート）
  if(LIVE_STD[g]){
    return [...LIVE_STD[g]].sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
  }
  const teams=GROUPS[g];
  const T={}; teams.forEach(t=>T[t]={team:t,p:0,w:0,d:0,l:0,gf:0,ga:0});
  MATCHES.forEach(m=>{
    if(m.g!==g||!m.s) return;
    const A=T[m.a],B=T[m.b]; if(!A||!B) return;
    const ga=m.s[0],gb=m.s[1];
    A.p++;B.p++;A.gf+=ga;A.ga+=gb;B.gf+=gb;B.ga+=ga;
    if(ga>gb){A.w++;B.l++;} else if(ga<gb){B.w++;A.l++;} else {A.d++;B.d++;}
  });
  const arr=teams.map(t=>{const x=T[t];x.gd=x.gf-x.ga;x.pts=x.w*3+x.d;return x;});
  // 勝点 → 得失点差 → 総得点 → ドロー順
  arr.sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||teams.indexOf(a.team)-teams.indexOf(b.team));
  return arr;
}
function gdFmt(n){return n>0?("+"+n):(""+n);}

/* ===== 順位表（1グループ） ===== */
function standingsTable(g){
  const arr=computeStandings(g), teams=GROUPS[g];
  const live=arr.some(t=>t.p>0);
  const rows=arr.map((t,i)=>{
    const rank=i+1, cls=rank<=3?("r"+rank):"";
    const jp=t.team==="日本"?' class="jpn"':'';
    return `<tr class="${cls}"><td></td><td><span class="t-team"><span class="pos">${rank}</span><img src="${flag(t.team)}" alt=""><span${jp}>${t.team}</span></span></td><td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${gdFmt(t.gd)}</td><td class="pts">${t.pts}</td></tr>`;
  }).join("");
  const badge=live?'<span class="live-badge">LIVE</span>':'<span class="pre-badge">開幕前</span>';
  return `<div class="stand-wrap">
    <div class="stand-top"><span class="g">${g}</span><b>グループ${g}</b>${badge}<span class="mini">${teams.map(t=>`<img src="${flag(t)}" alt="">`).join("")}</span></div>
    <table><thead><tr><th></th><th style="text-align:left">チーム</th><th>試</th><th>勝</th><th>分</th><th>負</th><th>得失</th><th>勝点</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ===== 放送局チップ ===== */
function tvChips(tv){
  if(!tv) return "";
  return tv.map(t=>{
    let cls="chip";
    if(t==="無料") cls="chip free";
    else if(t==="DAZN") cls="chip dazn";
    return `<span class="${cls}">${t}</span>`;
  }).join("");
}

/* ===== 1試合の行 ===== */
function teamSide(name, right){
  const f = flag(name);
  const img = f ? `<img src="${f}" alt="">` : `<span class="ph"></span>`;
  const jp = name==="日本" ? " jpn" : "";
  const rk = (typeof RANK!=="undefined" && RANK[name]) ? `<span class="rk">${RANK[name]}</span>` : "";
  return `<span class="side${right?' r':''}">${img}<span class="tn${jp}">${dispName(name)}</span>${rk}</span>`;
}
function matchRow(m){
  const mid = m.s
    ? `<span class="m-score"><span class="ft">FT</span><span class="sc">${m.s[0]}<span class="ms-dash">-</span>${m.s[1]}</span></span>`
    : `<span class="vs">VS</span>`;
  return `<a class="match${m.jp?' jp':''}" href="match.html?m=${encodeURIComponent(matchId(m))}">
    <div class="m-time"><b>${m.time}</b><span>${m.loc||'&nbsp;'}</span></div>
    <div class="m-teams">${teamSide(m.a)}${mid}${teamSide(m.b,true)}</div>
    <div class="m-meta">
      <span class="m-grp">${m.g?'グループ'+m.g+' · ':''}${m.v}</span>
      <span class="m-chips">${tvChips(m.tv)}</span>
    </div></a>`;
}

/* ===== PR枠（差し替え用。href="#" にアフィリエイトリンクを） ===== */
const PR_VARIANTS = [
  {h:"テレビでもスマホでも",d:"スマートTV・スマホ・PC・タブレット対応。自宅でも外出先でもW杯を。",c:"視聴方法を見る"},
  {h:"全104試合をライブで",d:"好カードも番狂わせも、すべてリアルタイム。見逃し配信にも対応。",c:"今すぐ確認"},
  {h:"日本代表をフルカバー",d:"グループステージから決勝まで、日本の全試合をチェック。",c:"プランを見る"}
];
function prCard(i){
  const v = PR_VARIANTS[((i||0) % PR_VARIANTS.length + PR_VARIANTS.length) % PR_VARIANTS.length];
  return `<div class="pr">
    <span class="pr-tag">PR</span>
    <div class="pr-body"><b>${v.h}</b><span>${v.d}</span></div>
    <a href="${LINKS.dazn}" class="btn ghost"${LINKS.dazn.startsWith('http')?' target="_blank" rel="noopener"':''}>${v.c}</a></div>`;
}

/* ===== 放送ガイド4枚 ===== */
function howToWatch(){
  return `<div class="sec-head"><span class="kicker">HOW TO WATCH</span><h2>放送・配信ガイド</h2><div class="line"></div></div>
  <div class="watch-grid">
    <div class="wcard"><div class="w-mark m1">D</div><div class="w-name">DAZN</div><div class="w-sub">全104試合をライブ＋見逃し配信。</div></div>
    <div class="wcard"><div class="w-mark m2">N</div><div class="w-name">NHK</div><div class="w-sub">日本戦・開幕戦・決勝などを地上波/BSで。</div></div>
    <div class="wcard"><div class="w-mark m3">日</div><div class="w-name">日テレ</div><div class="w-sub">日本代表 第2戦などを無料放送。</div></div>
    <div class="wcard"><div class="w-mark m4">フ</div><div class="w-name">フジ</div><div class="w-sub">日本進出時の決勝トーナメントなど。</div></div>
  </div>`;
}

/* ===== カウントダウン（要素 cd-d/h/m/s があれば動かす） ===== */
function startCountdown(target){
  const t = new Date(target).getTime();
  const g = id=>document.getElementById(id);
  function tick(){
    const diff=t-Date.now();
    const set=(id,v)=>{const e=g(id);if(e)e.textContent=v;};
    if(diff<=0){["cd-d","cd-h","cd-m","cd-s"].forEach(i=>set(i,"0"));return;}
    set("cd-d",Math.floor(diff/86400000));
    set("cd-h",String(Math.floor(diff%86400000/3600000)).padStart(2,"0"));
    set("cd-m",String(Math.floor(diff%3600000/60000)).padStart(2,"0"));
    set("cd-s",String(Math.floor(diff%60000/1000)).padStart(2,"0"));
  }
  tick(); setInterval(tick,1000);
}

/* =======================================================================
   試合詳細ページ / 国（代表）ページ 用の共通ヘルパー & レンダラ
   ======================================================================= */
function qparam(k){ return new URLSearchParams(location.search).get(k); }
function matchId(m){ return `${m.a}__${m.b}__${m.d}__${m.time}`; }
function findMatch(id){ return MATCHES.find(m=>matchId(m)===id) || null; }
function teamGroup(name){ return Object.keys(GROUPS).find(G=>GROUPS[G].includes(name)) || null; }

function groupMatchNo(m){
  const gm=MATCHES.filter(x=>x.g===m.g).sort((a,b)=>matchDT(a)-matchDT(b));
  const i=gm.indexOf(m); return i>=0?i+1:null;
}
function roundLabel(m){
  if(m.r) return m.r;
  const n=groupMatchNo(m);
  return n?`グループステージ・第${n}戦`:'グループステージ';
}

function dayGrouped(list){
  if(!list.length) return '<p class="muted" style="padding:8px 2px">該当する試合はありません。</p>';
  const days=[...new Set(list.map(m=>m.d))];
  let html="";
  days.forEach(d=>{
    const ms=list.filter(m=>m.d===d);
    html+=`<div class="daygroup"><div class="dayhead"><div class="daydate">${d}<small>${ms[0].w}曜</small></div><span class="daycount">${ms.length}試合</span></div>`;
    ms.forEach(m=>{ html+=matchRow(m); });
    html+=`</div>`;
  });
  return html;
}

function teamLinkCard(name){
  return `<a class="team-link" href="team.html?t=${encodeURIComponent(name)}">
    <img src="${flag(name)}" alt=""><span><b>${dispName(name)}</b>のすべての試合を見る</span><i>→</i></a>`;
}

function matchHero(m){
  const fin = !!m.s;
  const side=(n,r)=>`<div class="mh-team${n==="日本"?' jp':''}${r?' r':''}">
      <img src="${flag(n)}" alt=""><div class="mh-name">${dispName(n)}</div><div class="mh-rk">FIFA ${RANK[n]||'-'}位</div></div>`;
  const center = fin
    ? `<div class="mh-center"><div class="mh-date">${dateLabel(m)} ・ FT</div><div class="mh-score">${m.s[0]}<span>-</span>${m.s[1]}</div></div>`
    : `<div class="mh-center"><div class="mh-date">${dateLabel(m)}</div><div class="mh-jst">日本時間</div><div class="mh-time">${m.time}</div><div class="mh-vs">VS</div>${m.loc?`<div class="mh-local">${m.loc}</div>`:''}</div>`;
  const chips=(m.tv||[]).map(t=>`<span class="chip${t==='無料'?' free':t==='DAZN'?' dazn':''}">${t}</span>`).join("");
  const status = fin?'<span class="mh-status">試合終了</span>':'';
  return `<div class="mhero">
    <div class="mh-top"><span class="mh-g">GROUP ${m.g}</span><span class="mh-round">${roundLabel(m)}</span>${status}</div>
    <div class="mh-grid">${side(m.a,false)}${center}${side(m.b,true)}</div>
    <div class="mh-foot"><span class="mh-where">📍 ${m.v}</span><div class="mh-chips"><span class="mh-lab">${fin?'放送局':'ここで見られる'}</span>${chips}</div></div>
  </div>`;
}

function squadSection(name){
  const head=`<div class="sec-head"><span class="kicker">SQUAD</span><h2>${dispName(name)} 代表メンバー</h2><div class="line"></div></div>`;
  const sq = (typeof SQUADS!=="undefined" && SQUADS[name]) ? SQUADS[name]
           : (name==="日本" && typeof SQUAD!=="undefined") ? SQUAD : null;
  if(sq){
    let s="";
    for(const pos of ["GK","DF","MF","FW"]){
      const ps=(sq[pos]||[]).map(p=>{
        const star=p[3]==="key"?'<span class="star">★</span>':'';
        return `<div class="player"><span class="no">${p[0]}</span><span class="pn">${p[1]}${star}</span><span class="club">${p[2]}</span></div>`;
      }).join("");
      s+=`<div class="pos-block"><h4>${pos}</h4>${ps}</div>`;
    }
    return head+`<div class="squad">${s}</div><p style="font-size:11.5px;color:var(--faint);margin-top:12px">★ … 各国の中心となるキーマン</p>`;
  }
  return head+`<div class="squad-tba">代表メンバーは発表・確定が進み次第、順次追加します。</div>`;
}

function renderMatchPage(){
  const root=document.getElementById("match-root"); if(!root) return;
  const id=qparam("m"); const m=id?findMatch(id):null;
  if(!m){ root.innerHTML=`<a class="back" href="schedule.html">‹ 戻る</a><div class="empty">試合が見つかりませんでした。<br><a href="schedule.html">全試合日程へ →</a></div>`; return; }
  document.title=`${dispName(m.a)} vs ${dispName(m.b)}（${m.d} ${m.w} ${m.time}）｜2026W杯 PITCH26`;
  const others=MATCHES.filter(x=>x.g===m.g && matchId(x)!==id).sort((a,b)=>matchDT(a)-matchDT(b));
  root.innerHTML=`
    <a class="back" href="schedule.html">‹ 戻る</a>
    ${matchHero(m)}
    <div class="tl-cards">${teamLinkCard(m.a)}${teamLinkCard(m.b)}</div>
    <div class="sec-head"><span class="kicker">GROUP ${m.g}</span><h2>グループ${m.g} 順位表</h2><div class="line"></div></div>
    ${standingsTable(m.g)}
    ${prCard(groupMatchNo(m)||0)}
    <div class="sec-head"><span class="kicker">GROUP ${m.g}</span><h2>グループ${m.g} その他の試合</h2><div class="line"></div></div>
    <div class="day-list">${dayGrouped(others)}</div>`;
  applyLinks();
}

function renderTeamPage(){
  const root=document.getElementById("team-root"); if(!root) return;
  const name=qparam("t"); const g=name?teamGroup(name):null;
  if(!name||!g){ root.innerHTML=`<a class="back" href="schedule.html">‹ 戻る</a><div class="empty">チームが見つかりませんでした。<br><a href="schedule.html">全試合日程へ →</a></div>`; return; }
  document.title=`${dispName(name)}｜日程・順位・メンバー｜2026W杯 PITCH26`;
  const ms=MATCHES.filter(x=>x.a===name||x.b===name).sort((a,b)=>matchDT(a)-matchDT(b));
  const head=`<div class="thero">
    <div class="th-main"><img class="th-flag" src="${flag(name)}" alt="">
      <div><div class="th-kick">グループ${g}</div><h1 class="th-name${name==="日本"?' jp':''}">${dispName(name)}</h1></div></div>
    <div class="th-rank"><span>FIFA RANK</span><b>${RANK[name]||'-'}</b></div></div>`;
  root.innerHTML=`
    <a class="back" href="schedule.html">‹ 戻る</a>
    ${head}
    <div class="sec-head"><span class="kicker">GROUP STAGE</span><h2>${dispName(name)} の試合日程</h2><div class="line"></div></div>
    <div class="day-list">${dayGrouped(ms)}</div>
    ${prCard(0)}
    <div class="sec-head"><span class="kicker">GROUP ${g}</span><h2>グループ${g} 順位表</h2><div class="line"></div></div>
    ${standingsTable(g)}
    ${howToWatch()}
    ${squadSection(name)}`;
  applyLinks();
}
