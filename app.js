const qs=s=>document.querySelector(s);
const qa=s=>Array.from(document.querySelectorAll(s));
const isEnglish=document.documentElement.lang==='en';
let readingAnchor=window.location.hash||'#top';
const languageSwitch=qs('.language-switch');
const languageSummary=languageSwitch.querySelector('summary');
function syncLanguageLinks(){
  qa('.language-menu a').forEach(a=>{
    const target=new URL(a.getAttribute('href'),window.location.href);
    target.hash=readingAnchor;
    a.href=target.href;
  });
}
languageSwitch.addEventListener('toggle',syncLanguageLinks);
window.addEventListener('hashchange',syncLanguageLinks);
qa('.language-menu a').forEach(a=>a.addEventListener('click',event=>{
  syncLanguageLinks();
  if(a.dataset.language===document.documentElement.lang){
    event.preventDefault();
    languageSwitch.open=false;
    languageSummary.focus();
  }
}));
document.addEventListener('click',event=>{
  if(!languageSwitch.contains(event.target))languageSwitch.open=false;
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&languageSwitch.open){
    languageSwitch.open=false;
    languageSummary.focus();
  }
});
syncLanguageLinks();
const gallery=qs('.video-gallery');
if(gallery){
  const strip=gallery.querySelector('.gallery-strip');
  const cards=Array.from(strip.querySelectorAll('.gallery-card'));
  const player=gallery.querySelector('video');
  const panel=gallery.querySelector('.gallery-panel');
  const playButton=gallery.querySelector('.gallery-play');
  const status=gallery.querySelector('.gallery-status');
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let selected=0;
  playButton.hidden=false;
  function playSelected(){
    // A browser may decline playback; its native controls remain available.
    const result=player.play();
    if(result)result.catch(()=>{if(player.paused)playButton.hidden=false;});
  }
  function revealCard(card){
    const item=card.getBoundingClientRect();
    const viewport=strip.getBoundingClientRect();
    const delta=item.left<viewport.left?item.left-viewport.left:
      item.right>viewport.right?item.right-viewport.right:0;
    if(delta)strip.scrollBy({left:delta,behavior:reducedMotion?'auto':'smooth'});
  }
  function selectVideo(index,focus=false){
    const card=cards[index];
    if(index!==selected||player.error){
      player.pause();
      selected=index;
      cards.forEach((item,i)=>{
        item.setAttribute('aria-selected',String(i===index));
        item.tabIndex=i===index?0:-1;
      });
      panel.setAttribute('aria-labelledby',card.id);
      gallery.querySelector('.gallery-counter').textContent=String(index+1).padStart(2,'0')+' / '+cards.length;
      gallery.querySelector('#gallery-title').textContent=card.dataset.title;
      gallery.querySelector('.gallery-description').textContent=card.dataset.description;
      const benchmark=gallery.querySelector('.gallery-benchmark');
      benchmark.textContent=card.dataset.benchmark;
      benchmark.setAttribute('href',card.dataset.anchor);
      status.hidden=true;
      player.poster=card.dataset.poster;
      player.setAttribute('aria-label',card.dataset.label);
      player.src=card.dataset.video;
      player.load();
    }
    if(focus)card.focus({preventScroll:true});
    revealCard(card);
    playSelected();
  }
  cards.forEach((card,index)=>{
    card.addEventListener('click',()=>selectVideo(index));
    card.addEventListener('keydown',event=>{
      let next=index;
      if(event.key==='ArrowRight')next=Math.min(cards.length-1,index+1);
      else if(event.key==='ArrowLeft')next=Math.max(0,index-1);
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=cards.length-1;
      else return;
      event.preventDefault();
      selectVideo(next,true);
    });
  });
  const scrollButtons=Array.from(gallery.querySelectorAll('.gallery-scroll'));
  function updateScrollButtons(){
    const max=Math.max(0,strip.scrollWidth-strip.clientWidth);
    scrollButtons[0].disabled=strip.scrollLeft<=1;
    scrollButtons[1].disabled=strip.scrollLeft>=max-1;
  }
  scrollButtons.forEach(button=>button.addEventListener('click',()=>{
    strip.scrollBy({left:Number(button.dataset.direction)*strip.clientWidth*.9,
      behavior:reducedMotion?'auto':'smooth'});
  }));
  strip.addEventListener('scroll',updateScrollButtons,{passive:true});
  window.addEventListener('resize',updateScrollButtons);
  updateScrollButtons();
  playButton.addEventListener('click',playSelected);
  player.addEventListener('play',()=>{playButton.hidden=true;status.hidden=true;});
  player.addEventListener('pause',()=>{playButton.hidden=false;});
  player.addEventListener('ended',()=>{playButton.hidden=false;});
  player.addEventListener('error',()=>{status.hidden=false;playButton.hidden=true;});
}
qa('.benchmark-metric').forEach(select=>select.addEventListener('change',()=>{
  const figure=select.closest('.benchmark-chart');
  const option=select.selectedOptions[0];
  const paired=figure.dataset.paired==='true';
  const caption=figure.dataset.benchmark+' · '+option.textContent+
    (isEnglish?'. '+(paired?'Task progress score is shown on the left and full-task success rate on the right, sorted by score.':'Models are ranked by success rate.'):
      '。'+(paired?'左侧为任务进度分数，右侧为完整任务成功率，按分数排序。':'按成功率从高到低排列。'));
  const img=figure.querySelector('.benchmark-image');
  img.src=option.dataset.src;
  img.alt=caption;
  figure.querySelector('.metric-caption').textContent=caption;
}));
const sectionLinks=qa('.toc a');
function updateReading(){
  const h=document.documentElement;
  qs('.progress').style.width=(100*window.scrollY/Math.max(1,h.scrollHeight-h.clientHeight))+'%';
  let current=qa('.chapter')[0];
  qa('.chapter').forEach(s=>{if(s.getBoundingClientRect().top<200)current=s;});
  let part=null;
  if(current.id==='benchmarks')qa('#benchmarks > .evaluation-part').forEach(s=>{if(s.getBoundingClientRect().top<200)part=s;});
  readingAnchor=qa('.chapter')[0].getBoundingClientRect().top>=200?'#top':'#'+(part?part.id:current.id);
  sectionLinks.forEach(a=>{
    const target=a.getAttribute('href');
    const active=target==='#'+current.id || (part!==null && target==='#'+part.id);
    a.classList.toggle('active',active);
    if(active && (!part || target==='#'+part.id))a.setAttribute('aria-current','location');
    else a.removeAttribute('aria-current');
  });
  syncLanguageLinks();
}
window.addEventListener('scroll',updateReading,{passive:true});updateReading();
qa('video').forEach(v=>v.addEventListener('play',()=>qa('video').forEach(other=>{if(other!==v)other.pause();})));
qs('#copy-citation').addEventListener('click',async()=>{const text='@article{team2026awomo,\n  title={Awomo-0.5 Technical Report},\n  author={{Awomo-WAM Team}},\n  year={2026}\n}';try{await navigator.clipboard.writeText(text);qs('#copy-status').textContent=isEnglish?'Copied':'已复制';}catch{let area=qs('#citation-fallback');if(!area){area=document.createElement('textarea');area.id='citation-fallback';area.style.cssText='width:100%;height:110px';qs('.article-end').after(area);}area.value=text;area.setAttribute('aria-label',isEnglish?'Article citation; copy this text':'论文引用，请复制');area.focus();area.select();qs('#copy-status').textContent=isEnglish?'Copy the citation below':'请复制下方引用';}});
