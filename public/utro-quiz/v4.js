
(function(){
  var booted=false;
  var audioCache=new Map();
  var currentAudio=null;

  function v4Q(id,cat,diff,kind,text,correct,distractors,explanation,extra){
    var item=q(id,cat,diff,text,correct,distractors,explanation);
    item.kind=kind;
    item.family=(extra&&extra.family)||id.split("-").slice(0,3).join("-");
    item.icon=(extra&&extra.icon)||null;
    item.speechText=(extra&&extra.speechText)||null;
    item.speechLang=(extra&&extra.speechLang)||null;
    return item;
  }

  function extraQuestions(){
    var out=[
      v4Q("v4-geo-tf-1","География",1,"truefalse","Канберра — столица Австралии.","Правда",["Ложь"],"Канберра действительно является столицей Австралии.",{icon:"🌏"}),
      v4Q("v4-geo-tf-2","География",2,"truefalse","Столица Турции — Стамбул.","Ложь",["Правда"],"Столица Турции — Анкара.",{icon:"🧭"}),
      v4Q("v4-geo-tf-3","География",2,"truefalse","Экватор проходит через Эквадор.","Правда",["Ложь"],"Экватор пересекает территорию Эквадора.",{icon:"🌎"}),
      v4Q("v4-geo-odd-1","География",1,"odd","Что лишнее по части света?","Бразилия",["Япония","Китай","Индия"],"Япония, Китай и Индия находятся в Азии, а Бразилия — в Южной Америке.",{icon:"🧩"}),
      v4Q("v4-geo-odd-2","География",2,"odd","Что лишнее среди столиц Европы?","Токио",["Париж","Рим","Берлин"],"Токио — столица Японии в Азии.",{icon:"🧩"}),
      v4Q("v4-geo-odd-3","География",3,"odd","Какой объект лишний?","Анды",["Нил","Амазонка","Дунай"],"Анды — горная система, остальные варианты — реки.",{icon:"🧩"}),

      v4Q("v4-sci-scenario-1","Наука",1,"scenario","Ты оставил кубик льда на столе. Что произойдёт первым?","Он начнёт таять",["Он закипит","Он станет тяжелее","Он превратится в металл"],"При комнатной температуре лёд получает тепло и начинает таять.",{icon:"🧊"}),
      v4Q("v4-sci-scenario-2","Наука",2,"scenario","Автобус резко тормозит. Почему тебя по инерции тянет вперёд?","Тело стремится сохранить движение",["Гравитация исчезает","Воздух толкает вперёд","Масса тела уменьшается"],"По первому закону Ньютона движущееся тело стремится сохранять своё движение.",{icon:"🚌"}),
      v4Q("v4-sci-scenario-3","Наука",2,"scenario","Растение на несколько дней поставили в полную темноту. Что сильнее всего уменьшится?","Фотосинтез",["Гравитация","Магнитное поле","Масса Земли"],"Для фотосинтеза растению нужен свет.",{icon:"🌱"}),
      v4Q("v4-sci-scenario-4","Наука",3,"scenario","Почему широкие лыжи меньше проваливаются в снег?","Они уменьшают давление на снег",["Они уменьшают массу человека","Они выключают трение","Они увеличивают силу тяжести"],"При той же силе большая площадь опоры означает меньшее давление.",{icon:"🎿"}),
      v4Q("v4-sci-scenario-5","Наука",3,"scenario","Закрытую бутылку с воздухом нагрели. Что обычно происходит с частицами газа?","Они движутся быстрее",["Они исчезают","Они становятся тяжелее","Они прекращают сталкиваться"],"При повышении температуры средняя кинетическая энергия частиц растёт.",{icon:"🌡️"}),
      v4Q("v4-sci-scenario-6","Наука",4,"scenario","Почему металлическая ложка кажется холоднее деревянной при одной температуре?","Металл быстрее отводит тепло от руки",["Металл всегда холоднее воздуха","Дерево само нагревается","Металл не проводит тепло"],"Металл лучше проводит тепло и быстрее забирает его у кожи.",{icon:"🥄"}),

      v4Q("v4-hist-tf-1","История",2,"truefalse","Великая хартия вольностей была подписана раньше Декларации независимости США.","Правда",["Ложь"],"1215 год был раньше 1776 года.",{icon:"📜"}),
      v4Q("v4-hist-tf-2","История",2,"truefalse","Высадка людей на Луне произошла до Первой мировой войны.","Ложь",["Правда"],"Высадка на Луне была в 1969 году, а Первая мировая началась в 1914.",{icon:"🚀"}),
      v4Q("v4-hist-order-1","История",2,"timeline","Что произошло раньше?","Великая хартия вольностей",["Французская революция","Первый полёт человека в космос","Падение Берлинской стены"],"Великая хартия вольностей относится к 1215 году.",{icon:"🕰️"}),
      v4Q("v4-hist-order-2","История",3,"timeline","Что произошло позже остальных?","Падение Берлинской стены",["Французская революция","Открытие Суэцкого канала","Начало Первой мировой войны"],"Падение Берлинской стены произошло в 1989 году.",{icon:"🕰️"}),

      v4Q("v4-gen-life-1","Общие знания",1,"scenario","Тебе пришло сообщение: «Срочно введи пароль по этой ссылке». Что безопаснее сделать?","Не переходить по ссылке и проверить отправителя",["Сразу ввести пароль","Отправить пароль в ответ","Переслать сообщение всем"],"Неожиданные ссылки с просьбой о пароле — типичный признак фишинга.",{icon:"🔐"}),
      v4Q("v4-gen-life-2","Общие знания",2,"scenario","Телефон показывает 1% батареи, а тебе нужен навигатор. Что поможет дольше всего?","Включить энергосбережение и уменьшить яркость",["Включить максимальную яркость","Запустить игру","Включить фонарик"],"Экран и фоновые процессы заметно расходуют батарею.",{icon:"🔋"}),
      v4Q("v4-gen-life-3","Общие знания",3,"scenario","Две новости утверждают противоположное. Лучший первый шаг?","Проверить первоисточники и дату",["Выбрать ту, где больше лайков","Верить первой","Считать обе одинаково точными"],"Источник, дата и независимые подтверждения помогают оценить информацию.",{icon:"📰"}),

      v4Q("v4-phil-1","Философия",3,"think","Кто-то говорит: «Все так думают, значит это правда». Что здесь слабое место?","Популярность не доказывает истинность",["Большинство всегда ошибается","Спор делает фразу ложной","Нужно говорить громче"],"Количество людей, согласных с идеей, само по себе не является доказательством.",{icon:"◇"}),
      v4Q("v4-phil-2","Философия",3,"think","Какой вопрос лучше всего проверяет качество аргумента?","Какие есть доказательства?",["Кто сказал это первым?","Нравится ли мне вывод?","Красиво ли это звучит?"],"Сильный аргумент опирается на причины и доказательства.",{icon:"◇"}),

      v4Q("v4-eng-listen-1","Английский",2,"listen","Что означает слово, которое ты услышишь?","любопытный",["опасный","ленивый","громкий"],"Curious означает «любопытный».",{icon:"🎧",speechText:"curious",speechLang:"en"}),
      v4Q("v4-eng-listen-2","Английский",2,"listen","Что означает слово, которое ты услышишь?","надёжный",["редкий","медленный","временный"],"Reliable означает «надёжный».",{icon:"🎧",speechText:"reliable",speechLang:"en"}),
      v4Q("v4-eng-listen-3","Английский",3,"listen","Что означает слово, которое ты услышишь?","последствие",["доказательство","ограничение","подход"],"Consequence означает «последствие».",{icon:"🎧",speechText:"consequence",speechLang:"en"}),
      v4Q("v4-eng-listen-4","Английский",4,"listen","Что означает слово, которое ты услышишь?","неоднозначный",["очевидный","эффективный","неизбежный"],"Ambiguous означает «неоднозначный».",{icon:"🎧",speechText:"ambiguous",speechLang:"en"})
    ];

    for(var n=0;n<28;n++){
      var start=2+(n%8), step=2+(n%6);
      var vals=[start,start+step,start+step*2,start+step*3];
      var ans=start+step*4;
      out.push(v4Q("v4-math-seq-"+n,"Математика",1.5+(n%4)*.65,"sequence","Продолжи ряд: "+vals.join(", ")+", …",String(ans),[String(ans-step),String(ans+step),String(ans+2)],"Каждый раз прибавляем "+step+".",{icon:"🔢",family:"v4-math-seq"}));
    }
    for(var m=0;m<18;m++){
      var price=20+(m%7)*10, pct=[10,20,25,50][m%4], final=price*(100-pct)/100;
      out.push(v4Q("v4-math-shop-"+m,"Математика",2+(m%3)*.7,"scenario","В магазине вещь стоит "+price+" AED и на неё скидка "+pct+"%. Сколько она стоит после скидки?",String(final),[String(price-pct),String(price*pct/100),String(final+5)],"Сначала найди "+pct+"% от "+price+", затем вычти скидку.",{icon:"🛒",family:"v4-math-shop"}));
    }
    return out;
  }

  function inferKind(item){
    if(item.kind)return item.kind;
    var id=item.id||"", text=item.text||"";
    if(id.indexOf("eng-meaning-")===0)return "listen";
    if(item.category==="Математика" && /следующ|продолж|ряд/i.test(text))return "sequence";
    if(item.category==="Математика")return "number";
    if(item.category==="История")return "timeline";
    if(item.category==="География")return "map";
    if(item.category==="Наука")return "lab";
    if(item.category==="Философия")return "think";
    if(item.category==="Общие знания")return "puzzle";
    return "choice";
  }

  function familyKey(item){
    if(item.family)return item.family;
    var p=(item.id||"q").split("-");
    if(p[0]==="v4")return p.slice(0,3).join("-");
    return p.slice(0,2).join("-");
  }

  function enrich(item){
    item.kind=inferKind(item);
    item.family=familyKey(item);
    if(item.kind==="listen" && !item.speechText){
      var match=(item.text||"").match(/[“"]([^”"]+)[”"]/);
      if(match){item.speechText=match[1];item.speechLang="en";}
    }
    return item;
  }

  function kindChoices(cat){
    var map={
      "География":["odd","truefalse","map"],
      "Наука":["scenario","lab"],
      "История":["timeline","truefalse"],
      "Английский":["listen","choice"],
      "Математика":["sequence","scenario","number"],
      "Общие знания":["scenario","puzzle"],
      "Философия":["think","scenario"]
    };
    return map[cat]||["choice"];
  }

  function installSessionPicker(){
    makeSession=function(){
      var id=state.activeProfile, s=pstats(), date=todayKey();
      var key="v4|"+date+"|"+s.topic+"|"+s.challenge;
      if(s.sessions[key] && s.sessions[key].questions && s.sessions[key].questions.length===10)return s.sessions[key];
      var r=seeded("utro-v4|"+date+"|"+id+"|"+s.topic+"|"+s.challenge);
      var seen=new Set(s.seen||[]), used=new Set(), kindCount={}, famCount={};
      var plan=categoryPlan(r);
      var questions=plan.map(function(cat){
        var target=currentTarget(cat);
        var preferred=kindChoices(cat).slice().sort(function(a,b){return (kindCount[a]||0)-(kindCount[b]||0);})[0];
        var pool=bank.filter(function(x){return x.category===cat && !used.has(x.id) && !seen.has(x.id);});
        if(pool.length<3)pool=bank.filter(function(x){return x.category===cat && !used.has(x.id);});
        var scored=pool.map(function(x){
          var kindPenalty=x.kind===preferred?0:.32;
          var repeatKind=(kindCount[x.kind]||0)*.18;
          var repeatFamily=(famCount[x.family]||0)*1.3;
          return {q:x,score:Math.abs(x.difficulty-target)+kindPenalty+repeatKind+repeatFamily+r()*.42};
        }).sort(function(a,b){return a.score-b.score;});
        var src=(scored[0]&&scored[0].q)||bank[Math.floor(r()*bank.length)];
        used.add(src.id);kindCount[src.kind]=(kindCount[src.kind]||0)+1;famCount[src.family]=(famCount[src.family]||0)+1;
        var opts=shuffle([src.correct].concat(src.distractors),r).slice(0,src.kind==="truefalse"?2:4);
        return Object.assign({},src,{options:opts,correctIndex:opts.indexOf(src.correct)});
      });
      var session={key:key,date:date,profile:id,topic:s.topic,challenge:s.challenge,index:0,answers:[],questions:questions,finished:false,score:null,startedAt:Date.now()};
      s.sessions[key]=session;save();return session;
    };
  }

  function toast(text){
    var old=document.querySelector(".v4-toast");if(old)old.remove();
    var el=document.createElement("div");el.className="v4-toast";el.textContent=text;document.body.appendChild(el);
    setTimeout(function(){el.remove();},2600);
  }

  async function playTts(text,language,button){
    if(!text)return;
    var key=(language||"ru")+"|"+text;
    try{
      if(currentAudio){currentAudio.pause();currentAudio.currentTime=0;}
      if(button)button.classList.add("loading");
      var url=audioCache.get(key);
      if(!url){
        var response=await fetch("/api/speech",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:text,language:language||"ru"})});
        if(!response.ok)throw new Error("TTS "+response.status);
        var blob=await response.blob();
        url=URL.createObjectURL(blob);audioCache.set(key,url);
      }
      currentAudio=new Audio(url);
      await currentAudio.play();
    }catch(err){
      console.error(err);toast("Не удалось загрузить нейро-озвучку");
    }finally{
      if(button)button.classList.remove("loading");
    }
  }

  function voiceText(item){
    if(item.kind==="listen")return {text:item.speechText||item.correct,language:item.speechLang||"en"};
    var options=(item.options||[]).map(function(x,i){return ["A","B","C","D"][i]+": "+x;}).join(". ");
    return {text:item.text+". Варианты ответа. "+options,language:"ru"};
  }

  var KIND_META={
    listen:["🎧","НА СЛУХ"],truefalse:["⚡","ПРАВДА / ЛОЖЬ"],odd:["🧩","ЧТО ЛИШНЕЕ"],
    sequence:["🔢","ПРОДОЛЖИ РЯД"],scenario:["🧠","СИТУАЦИЯ"],timeline:["🕰️","ХРОНОЛОГИЯ"],
    number:["➗","БЫСТРЫЙ СЧЁТ"],map:["🧭","МИР"],lab:["🧪","НАУКА"],think:["◇","ПОДУМАЙ"],
    puzzle:["💡","ЛОГИКА"],choice:["✦","ВЫБОР"]
  };

  function installQuizRenderer(){
    renderQuiz=function(){
      view="quiz";
      var session=activeSession;if(!session){renderHome();return;}if(session.finished){renderResult();return;}
      var i=session.index,item=session.questions[i],answer=session.answers[i];
      selectedAnswer=Number.isInteger(answer)?answer:null;
      var answered=selectedAnswer!==null,correct=answered&&selectedAnswer===item.correctIndex;
      var km=KIND_META[item.kind]||KIND_META.choice;
      var progress=session.questions.map(function(x,n){
        var cls=n<i?(session.answers[n]===session.questions[n].correctIndex?"ok":"bad"):(n===i?"now":"");
        return "<i class=\""+cls+"\"></i>";
      }).join("");
      var answers=item.options.map(function(opt,n){
        var cls="";
        if(answered)cls=n===item.correctIndex?"correct":(n===selectedAnswer?"wrong":"muted");
        var icon=answered&&n===item.correctIndex?"✓":(answered&&n===selectedAnswer?"×":"");
        return "<button class=\"v4-answer "+cls+"\" data-answer=\""+n+"\" "+(answered?"disabled":"")+"><span>"+["A","B","C","D"][n]+"</span><b>"+esc(opt)+"</b><i>"+icon+"</i></button>";
      }).join("");
      var head;
      if(item.kind==="listen"){
        head="<div class=\"v4-listen\"><div class=\"emoji\">🎧</div><h1>Что означает слово, которое ты услышишь?</h1><p>Само слово спрятано — слушай и выбирай смысл.</p><button data-action=\"speak\">▶</button></div>";
      }else{
        head="<div class=\"v4-qintro\"><div class=\"v4-qicon\">"+(item.icon||km[0])+"</div><span>"+km[1].toLowerCase()+" · уровень "+item.difficulty+"/5</span></div><h1>"+esc(item.text)+"</h1>";
      }
      var feedback="";
      if(answered){
        feedback="<div class=\"feedback v4-feedback "+(correct?"good":"oops")+"\"><strong>"+(correct?"Да! Именно так.":"Не совсем.")+"</strong><p>"+(correct?"":"Правильный ответ: <b>"+esc(item.correct)+"</b>. ")+esc(item.explanation)+"</p></div><button class=\"continue-btn\" data-action=\"next\">"+(i===9?"Показать результат":"Следующий вопрос")+" <span>→</span></button>";
      }else{
        feedback="<p class=\"v4-note\">🔊 Нажми на динамик, чтобы вопрос прочитал нейро-голос.</p>";
      }
      app.innerHTML=shell("<main class=\"quiz-main\"><div class=\"quiz-toolbar\"><button class=\"back-link\" data-action=\"home\">← На главную</button><div class=\"quiz-person\"><span>"+esc(profile().letter)+"</span>"+esc(profile().name)+"</div></div><section class=\"quiz-card v4-quiz\"><div class=\"v4-quiz-stage kind-"+esc(item.kind)+"\"><div class=\"quiz-progress-head\"><div><span>Вопрос "+(i+1)+"</span><b>"+(i+1)+" / 10</b></div><div class=\"progress-line\">"+progress+"</div></div><div class=\"v4-question\"><div class=\"v4-quiz-head\"><div class=\"v4-tags\"><span class=\"v4-type\">"+km[0]+" "+km[1]+"</span><span class=\"v4-cat\">"+esc(item.category)+"</span></div><button class=\"v4-voice\" data-action=\"speak\" aria-label=\"Озвучить\">🔊</button></div>"+head+"<div class=\"v4-answers "+(item.options.length===2?"two":"")+"\">"+answers+"</div>"+feedback+"</div></div></section></main>");
      wireCommon();
      var home=app.querySelector("[data-action=home]");if(home)home.onclick=renderHome;
      app.querySelectorAll("[data-answer]").forEach(function(btn){btn.onclick=function(){answerQuestion(Number(btn.dataset.answer));};});
      app.querySelectorAll("[data-action=speak]").forEach(function(btn){btn.onclick=function(){var v=voiceText(item);playTts(v.text,v.language,btn);};});
      var next=app.querySelector("[data-action=next]");if(next)next.onclick=nextQuestion;
    };
  }

  function decorateHome(){
    var hero=document.querySelector(".hero-grid");if(!hero)return;
    hero.classList.add("v4-home-hero");
    var title=hero.querySelector(".hero-copy h1");if(title)title.innerHTML="Доброе утро, <em>"+esc(profile().name)+"</em>.<br>Сегодня без скучных вопросов.";
    var lead=hero.querySelector(".hero-lead");if(lead)lead.textContent="10 вопросов, но каждый может быть другим: на слух, логика, ситуация, хронология, быстрый счёт или обычный выбор.";
    var art=hero.querySelector(".hero-art");
    if(art)art.innerHTML="<div class=\"v4-stack\"><article class=\"v4-stack-card\"><small>НА СЛУХ</small><b>🎧</b><h3>Listen & choose</h3><p>Слово слышишь, но не видишь.</p></article><article class=\"v4-stack-card\"><small>ЛОГИКА</small><b>🧩</b><h3>Что здесь лишнее?</h3><p>Ищи связь, а не вспоминай факт.</p></article><article class=\"v4-stack-card\"><small>СИТУАЦИЯ</small><b>🧠</b><h3>Что произойдёт?</h3><p>Мини-задачи из жизни и науки.</p></article></div>";
    var today=hero.querySelector(".today-card");
    if(today&&!today.querySelector(".v4-voice-test")){
      var test=document.createElement("button");test.className="v4-voice-test";test.textContent="🔊 Голос";
      test.onclick=function(e){e.stopPropagation();playTts("Доброе утро, "+profile().name+". Нейро-озвучка работает. Готов к десяти вопросам?","ru",test);};
      today.appendChild(test);
    }
    var stats=document.querySelector(".stats-grid");
    if(stats&&!document.querySelector(".v4-mechanics")){
      var strip=document.createElement("div");strip.className="v4-mechanics";
      strip.innerHTML="<span>🎧 на слух</span><span>⚡ правда / ложь</span><span>🧩 что лишнее</span><span>🕰️ хронология</span><span>🛒 задачи из жизни</span><span>🧠 ситуации</span>";
      stats.parentNode.insertBefore(strip,stats);
    }
  }

  function installHome(){
    var baseHome=renderHome;
    renderHome=function(){baseHome();decorateHome();};
  }

  function boot(){
    if(booted)return;
    if(typeof bank==="undefined" || !bank || bank.length===0){setTimeout(boot,60);return;}
    booted=true;
    extraQuestions().forEach(function(item){if(!bank.some(function(x){return x.id===item.id;}))bank.push(item);});
    bank.forEach(enrich);
    bankById=new Map(bank.map(function(x){return [x.id,x];}));
    state.audio=state.audio||{provider:"ai-gateway"};
    installSessionPicker();
    installQuizRenderer();
    installHome();
    renderHome();
  }

  boot();
})();
