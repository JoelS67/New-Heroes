const DEFAULTS = {
  heroTitle: "Todo herói precisa dar o primeiro passo.",
  heroIntro: "Explore o mundo, conheça seus heróis e descubra os acontecimentos que estão moldando uma nova era.",
  about: "New Heroes: The First Steps é um RP autoral de heróis, inspirado na tradição das grandes HQs, mas construído para contar histórias próprias. Aqui, cada personagem pode deixar sua marca.",
  history: "O universo de New Heroes começa em um momento em que o extraordinário deixa de ser apenas lenda. Pessoas comuns descobrem capacidades incomuns, governos tentam entender o fenômeno e novas figuras surgem para proteger — ou dominar — um mundo que ainda não sabe como chamá-las. Esta seção pode receber a cronologia oficial do servidor conforme a lore for escrita.",
  seasonTitle: "Os Primeiros Passos",
  seasonText: "Uma nova geração surge enquanto o mundo tenta entender a existência de pessoas capazes de mudar o destino de uma cidade — ou de um planeta.",
  ticker: "Bem-vindo ao portal oficial de New Heroes."
};

const CHARACTERS = [
  {n:"01", name:"Primeiro Herói", role:"A definir", desc:"Adicione aqui o primeiro personagem importante da sua lore."},
  {n:"02", name:"A Sentinela", role:"A definir", desc:"Adicione aqui uma figura central do universo."},
  {n:"03", name:"O Vigilante", role:"A definir", desc:"Um espaço reservado para um anti-herói ou vigilante."},
  {n:"04", name:"O Inimigo", role:"A definir", desc:"O grande nome que pode colocar esta nova era à prova."}
];

const NEWS_DEFAULT = [
  {date:"05 OUT 2026", tag:"MUNDO", title:"Uma nova era está começando", text:"As primeiras histórias de New Heroes estão sendo escritas. Novas informações serão adicionadas aqui conforme os acontecimentos avançarem."},
  {date:"04 OUT 2026", tag:"SOCIEDADE", title:"Quem serão os novos heróis?", text:"Com o surgimento de indivíduos extraordinários, a sociedade começa a discutir o que significa ser um herói."},
  {date:"02 OUT 2026", tag:"CIDADE", title:"Autoridades reforçam monitoramento", text:"Órgãos públicos observam discretamente os primeiros sinais de uma mudança que pode afetar o mundo inteiro."}
];

function loadData(){
  try { return {...DEFAULTS, ...(JSON.parse(localStorage.getItem("newHeroesData")) || {})}; }
  catch(e){ return {...DEFAULTS}; }
}
let data = loadData();

function render(){
  document.getElementById("heroTitle").textContent = data.heroTitle;
  document.getElementById("heroIntro").textContent = data.heroIntro;
  document.getElementById("aboutText").textContent = data.about;
  document.getElementById("historyPreview").textContent = data.history;
  document.getElementById("seasonTitle").textContent = data.seasonTitle;
  document.getElementById("seasonText").textContent = data.seasonText;
  document.getElementById("tickerText").textContent = data.ticker;
  document.getElementById("historyFull").innerHTML = `<p>${data.history}</p><p>Use o painel de personalização para substituir este texto pela cronologia oficial do servidor, mantendo as atualizações sempre em um único lugar.</p>`;
  document.getElementById("seasonModalTitle").textContent = data.seasonTitle;
  document.getElementById("seasonFull").innerHTML = `<p>${data.seasonText}</p><p>Você pode expandir esta sinopse com capítulos, personagens, eventos e ganchos de RP conforme a temporada for sendo desenvolvida.</p>`;
  document.getElementById("editHeroTitle").value = data.heroTitle;
  document.getElementById("editHeroIntro").value = data.heroIntro;
  document.getElementById("editAbout").value = data.about;
  document.getElementById("editHistory").value = data.history;
  document.getElementById("editSeasonTitle").value = data.seasonTitle;
  document.getElementById("editSeasonText").value = data.seasonText;
  document.getElementById("editTicker").value = data.ticker;
  renderCharacters();
  renderNews();
}
function renderCharacters(){
  document.getElementById("characterGrid").innerHTML = CHARACTERS.map(c =>
    `<article class="character-card"><span class="character-num">${c.n}</span><div class="character-content"><h3>${c.name}</h3><p>${c.role} · ${c.desc}</p></div></article>`
  ).join("");
}
function renderNews(){
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem("newHeroesNews") || "[]"); } catch(e){}
  const items = custom.length ? custom : NEWS_DEFAULT;
  document.getElementById("newsList").innerHTML = items.map(n =>
    `<article class="news-item"><div class="news-meta"><span>${n.tag}</span><span>${n.date}</span></div><h3>${n.title}</h3><p>${n.text}</p></article>`
  ).join("");
}

const drawer = document.getElementById("drawer"), backdrop = document.getElementById("backdrop");
function setMenu(open){
  drawer.classList.toggle("open",open); backdrop.classList.toggle("open",open);
  drawer.setAttribute("aria-hidden",String(!open));
  document.getElementById("menuButton").setAttribute("aria-expanded",String(open));
}
document.getElementById("menuButton").onclick=()=>setMenu(true);
document.getElementById("closeMenu").onclick=()=>setMenu(false);
backdrop.onclick=()=>setMenu(false);
document.querySelectorAll("[data-close-menu]").forEach(a=>a.onclick=()=>setMenu(false));

document.querySelectorAll("[data-open]").forEach(btn=>{
  btn.onclick=()=>{
    const m=document.getElementById(btn.dataset.open);
    m.classList.add("show"); m.setAttribute("aria-hidden","false");
  };
});
document.querySelectorAll("[data-close-modal]").forEach(btn=>btn.onclick=()=>btn.closest(".modal").classList.remove("show"));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("show")}));

document.getElementById("saveEdits").onclick=()=>{
  data = {
    heroTitle: document.getElementById("editHeroTitle").value.trim() || DEFAULTS.heroTitle,
    heroIntro: document.getElementById("editHeroIntro").value.trim() || DEFAULTS.heroIntro,
    about: document.getElementById("editAbout").value.trim() || DEFAULTS.about,
    history: document.getElementById("editHistory").value.trim() || DEFAULTS.history,
    seasonTitle: document.getElementById("editSeasonTitle").value.trim() || DEFAULTS.seasonTitle,
    seasonText: document.getElementById("editSeasonText").value.trim() || DEFAULTS.seasonText,
    ticker: document.getElementById("editTicker").value.trim() || DEFAULTS.ticker
  };
  localStorage.setItem("newHeroesData",JSON.stringify(data));
  render();
  alert("Alterações salvas neste celular/navegador.");
};
document.getElementById("resetEdits").onclick=()=>{
  if(confirm("Restaurar os textos padrão?")){
    localStorage.removeItem("newHeroesData");
    data={...DEFAULTS}; render();
  }
};

let currentSlide=0;
const slides=[...document.querySelectorAll(".hero-slide")], dots=[...document.querySelectorAll(".dot")];
function showSlide(i){
  currentSlide=i; slides.forEach((s,k)=>s.classList.toggle("active",k===i)); dots.forEach((d,k)=>d.classList.toggle("active",k===i));
}
dots.forEach((d,i)=>d.onclick=()=>showSlide(i));
setInterval(()=>showSlide((currentSlide+1)%slides.length),6500);

render();
