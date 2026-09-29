
(function(){
  var booted=false;
  var audioCache=new Map();
  var currentAudio=null;
  var carMode=false;
  var recognition=null;
  var listening=false;
  var recognitionHandled=false;
  var carSequence=0;

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

  function matchQuestion(id,category,difficulty,title,pairs,explanation){
    return {
      id:id,category:category,difficulty:difficulty,text:title,correct:"Готово",distractors:[],
      explanation:explanation||"Все пары соединены правильно.",kind:"match",family:"match-"+category,
      icon:"🔗",pairs:pairs.map(function(p){return {left:String(p[0]),right:String(p[1])};})
    };
  }

  function matchingQuestions(){
    var out=[];
    for(var g=0;g<6;g++){
      var gp=countries.slice(g*4,g*4+4);
      if(gp.length===4)out.push(matchQuestion("v4-match-geo-"+g,"География",2,"Соедини страну и столицу",gp.map(function(x){return [x[0],x[1]];}),"Страны соединены со своими столицами."));
    }
    for(var s=0;s<6;s++){
      var ep=elements.slice(s*4,s*4+4);
      if(ep.length===4)out.push(matchQuestion("v4-match-sci-"+s,"Наука",2.5,"Соедини элемент и символ",ep.map(function(x){return [x[1],x[0]];}),"Каждый химический элемент соединён со своим символом."));
    }
    for(var e=0;e<8;e++){
      var wp=englishWords.slice(e*4,e*4+4);
      if(wp.length===4)out.push(matchQuestion("v4-match-eng-"+e,"Английский",2.5,"Соедини слово и значение",wp.map(function(x){return [x[0],x[1]];}),"Английские слова соединены с переводом."));
    }
    for(var h=0;h<6;h++){
      var hp=events.slice(h*4,h*4+4);
      if(hp.length===4)out.push(matchQuestion("v4-match-hist-"+h,"История",3,"Соедини событие и год",hp.map(function(x){return [x[0],String(x[1])];}),"События соединены с годами."));
    }
    for(var m=0;m<8;m++){
      var base=3+m;
      out.push(matchQuestion("v4-match-math-"+m,"Математика",2,"Соедини выражение и результат",[
        [base+" × 2",String(base*2)],[base+" + 7",String(base+7)],[(base+8)+" − 3",String(base+5)],[String(base*3)+" ÷ 3",String(base)]
      ],"Каждое выражение соединено со своим результатом."));
    }
    var general=[
      [["CPU","процессор"],["RAM","оперативная память"],["URL","адрес страницы"],["VPN","защищённое сетевое соединение"]],
      [["JPEG","формат изображения"],["MP3","формат аудио"],["PDF","формат документа"],["ZIP","архив"]],
      [["Bluetooth","беспроводная связь рядом"],["Wi‑Fi","беспроводная сеть"],["GPS","определение местоположения"],["NFC","связь на очень близком расстоянии"]]
    ];
    general.forEach(function(pairs,i){out.push(matchQuestion("v4-match-gen-"+i,"Общие знания",2.5,"Соедини термин и значение",pairs,"Термины соединены с их значениями."));});
    var philosophy=[
      [["Факт","можно проверить"],["Мнение","личная оценка"],["Аргумент","причина в поддержку вывода"],["Доказательство","данные в поддержку утверждения"]],
      [["Причина","то, что вызывает результат"],["Следствие","результат причины"],["Предположение","идея без полной проверки"],["Вывод","итог рассуждения"]]
    ];
    philosophy.forEach(function(pairs,i){out.push(matchQuestion("v4-match-phil-"+i,"Философия",3,"Соедини понятие и смысл",pairs,"Понятия соединены с определениями."));});
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

  function ensureModes(){
    state.v4=Object.assign({
      questionMode:"both",
      inputMode:"both",
      answerMode:"mix"
    },state.v4||{});
    return state.v4;
  }

  function modes(){return ensureModes();}

  function setMode(key,value){
    ensureModes()[key]=value;save();
  }

  function applyPreset(name){
    var cfg=ensureModes();
    if(name==="handsfree"){cfg.questionMode="audio";cfg.inputMode="voice";cfg.answerMode="open";}
    else if(name==="classic"){cfg.questionMode="screen";cfg.inputMode="touch";cfg.answerMode="choices";}
    else if(name==="mixed"){cfg.questionMode="both";cfg.inputMode="both";cfg.answerMode="mix";}
    save();
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
      var id=state.activeProfile, s=pstats(), date=todayKey(), cfg=modes();
      var key="v5|"+date+"|"+s.topic+"|"+s.challenge+"|"+cfg.questionMode+"|"+cfg.inputMode+"|"+cfg.answerMode;
      if(s.sessions[key] && s.sessions[key].questions && s.sessions[key].questions.length===10)return s.sessions[key];
      var r=seeded("utro-v5|"+date+"|"+id+"|"+s.topic+"|"+s.challenge+"|"+cfg.questionMode+"|"+cfg.inputMode+"|"+cfg.answerMode);
      var seen=new Set(s.seen||[]), used=new Set(), kindCount={}, famCount={};
      var plan=categoryPlan(r);
      var questions=plan.map(function(cat,pos){
        var target=currentTarget(cat);
        var wantsMatch=cfg.answerMode==="match" || (cfg.answerMode==="mix" && cfg.inputMode!=="voice" && pos===4);
        var preferred=kindChoices(cat).slice().sort(function(a,b){return (kindCount[a]||0)-(kindCount[b]||0);})[0];
        var pool=bank.filter(function(x){
          if(x.category!==cat||used.has(x.id)||seen.has(x.id))return false;
          if(wantsMatch)return x.kind==="match";
          return x.kind!=="match";
        });
        if(pool.length<2)pool=bank.filter(function(x){
          if(x.category!==cat||used.has(x.id))return false;
          if(wantsMatch)return x.kind==="match";
          return x.kind!=="match";
        });
        if(pool.length<1 && wantsMatch)pool=bank.filter(function(x){return x.kind==="match"&&!used.has(x.id);});
        if(pool.length<1)pool=bank.filter(function(x){return x.category===cat&&x.kind!=="match"&&!used.has(x.id);});
        var scored=pool.map(function(x){
          var kindPenalty=wantsMatch?0:(x.kind===preferred?0:.32);
          var repeatKind=(kindCount[x.kind]||0)*.18;
          var repeatFamily=(famCount[x.family]||0)*1.3;
          return {q:x,score:Math.abs(x.difficulty-target)+kindPenalty+repeatKind+repeatFamily+r()*.42};
        }).sort(function(a,b){return a.score-b.score;});
        var src=(scored[0]&&scored[0].q)||bank[Math.floor(r()*bank.length)];
        used.add(src.id);kindCount[src.kind]=(kindCount[src.kind]||0)+1;famCount[src.family]=(famCount[src.family]||0)+1;

        if(src.kind==="match"){
          return Object.assign({},src,{answerStyle:"match",correctIndex:0,options:[],matchSeed:Math.floor(r()*1e9)});
        }
        var opts=shuffle([src.correct].concat(src.distractors),r).slice(0,src.kind==="truefalse"?2:4);
        var style=cfg.answerMode;
        if(style==="mix"){
          if(src.kind==="truefalse")style="choices";
          else style=r()<.34?"open":"choices";
        }
        if(style==="match")style="choices";
        return Object.assign({},src,{options:opts,correctIndex:opts.indexOf(src.correct),answerStyle:style});
      });
      var session={key:key,date:date,profile:id,topic:s.topic,challenge:s.challenge,index:0,answers:[],questions:questions,finished:false,score:null,startedAt:Date.now(),v4:Object.assign({},cfg)};
      s.sessions[key]=session;save();return session;
    };
  }


  function toast(text){
    var old=document.querySelector(".v4-toast");if(old)old.remove();
    var el=document.createElement("div");el.className="v4-toast";el.textContent=text;document.body.appendChild(el);
    setTimeout(function(){el.remove();},2600);
  }

  async function playTts(text,language,button){
    if(!text)return false;
    stopListening();
    var profileId=(typeof state!=="undefined"&&state.activeProfile)||"elisey";
    var key=profileId+"|"+(language||"ru")+"|"+text;
    try{
      if(currentAudio){currentAudio.pause();currentAudio.currentTime=0;}
      if(button)button.classList.add("loading");
      if(carMode)setCarStatus("speaking","Говорю…","");
      var url=audioCache.get(key);
      if(!url){
        var response=await fetch("/api/speech",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:text,language:language||"ru",profile:profileId})});
        if(!response.ok)throw new Error("TTS "+response.status);
        var blob=await response.blob();
        url=URL.createObjectURL(blob);audioCache.set(key,url);
      }
      currentAudio=new Audio(url);
      await new Promise(function(resolve,reject){
        currentAudio.onended=resolve;
        currentAudio.onerror=function(){reject(new Error("audio playback"));};
        var p=currentAudio.play();if(p&&p.catch)p.catch(reject);
      });
      return true;
    }catch(err){
      console.error(err);toast("Не удалось загрузить нейро-озвучку");
      return false;
    }finally{
      if(button)button.classList.remove("loading");
    }
  }

  function voiceText(item){
    var style=item.answerStyle||modes().answerMode;
    if(item.kind==="listen"){
      if(style==="open")return {text:item.speechText||item.correct,language:item.speechLang||"en"};
      return {text:item.speechText||item.correct,language:item.speechLang||"en"};
    }
    if(style==="open"||style==="match")return {text:item.text,language:"ru"};
    var names=["Первый вариант","Второй вариант","Третий вариант","Четвёртый вариант"];
    var options=(item.options||[]).map(function(x,i){return names[i]+": "+x;}).join(". ");
    return {text:item.text+". "+options,language:"ru"};
  }

  function speechRecognitionCtor(){
    return window.SpeechRecognition||window.webkitSpeechRecognition||null;
  }

  function normalizeSpoken(value){
    return String(value||"").toLowerCase().replace(/ё/g,"е").replace(/[.,!?;:()[\]{}"'«»]/g," ").replace(/\s+/g," ").trim();
  }

  function tokenScore(a,b){
    a=normalizeSpoken(a);b=normalizeSpoken(b);
    if(!a||!b)return 0;
    if(a===b)return 1;
    if(a.length>3&&b.indexOf(a)>=0)return .92;
    if(b.length>3&&a.indexOf(b)>=0)return .92;
    var aa=new Set(a.split(" ").filter(function(x){return x.length>1;}));
    var bb=new Set(b.split(" ").filter(function(x){return x.length>1;}));
    var hit=0;aa.forEach(function(x){if(bb.has(x))hit++;});
    return hit/Math.max(1,Math.min(aa.size,bb.size));
  }

  function parseSpoken(transcripts,item){
    var all=(transcripts||[]).map(normalizeSpoken).filter(Boolean);
    var joined=all.join(" | ");
    if(/\b(стоп|остановись|закончить|завершить|выход)\b/.test(joined))return {command:"stop"};
    if(/\b(повтори|повторить|еще раз|ещё раз|снова)\b/.test(joined))return {command:"repeat"};
    if(/\b(дальше|следующий|следующая|пропустить|пропусти)\b/.test(joined))return {command:"next"};

    var direct=[
      ["а","a","эй","вариант а","первый","первая","первое","один","1"],
      ["б","бэ","b","би","вариант б","второй","вторая","второе","два","2"],
      ["в","вэ","с","си","c","цэ","вариант в","вариант с","третий","третья","третье","три","3"],
      ["г","гэ","д","дэ","d","ди","вариант г","вариант д","четвертый","четвертая","четвертое","четвертый вариант","четыре","4"]
    ];
    for(var t=0;t<all.length;t++){
      var phrase=all[t];
      for(var i=0;i<Math.min(4,item.options.length);i++){
        if(direct[i].some(function(x){return phrase===x||phrase==="вариант "+x;}))return {answer:i,heard:phrase};
      }
      if(item.kind==="truefalse"){
        if(/^(да|правда|верно|правильно)$/.test(phrase)){
          var pi=item.options.findIndex(function(x){return normalizeSpoken(x)==="правда";});
          if(pi>=0)return {answer:pi,heard:phrase};
        }
        if(/^(нет|ложь|неправда|не верно|неверно)$/.test(phrase)){
          var li=item.options.findIndex(function(x){return normalizeSpoken(x)==="ложь";});
          if(li>=0)return {answer:li,heard:phrase};
        }
      }
    }
    var best={answer:-1,score:0,heard:all[0]||""};
    all.forEach(function(phrase){
      item.options.forEach(function(opt,i){
        var score=tokenScore(phrase,opt);
        if(score>best.score)best={answer:i,score:score,heard:phrase};
      });
    });
    return best.score>=.56?best:{answer:-1,heard:all[0]||""};
  }

  function setCarStatus(kind,text,heard){
    var el=document.querySelector("#v4-car-banner");
    if(!el)return;
    el.dataset.state=kind||"idle";
    var main=el.querySelector("[data-car-status]");if(main)main.textContent=text||"";
    var sub=el.querySelector("[data-car-heard]");if(sub)sub.textContent=heard||"";
  }

  function stopListening(){
    listening=false;
    if(recognition){
      try{recognition.onend=null;recognition.onerror=null;recognition.onresult=null;recognition.stop();}catch(e){}
      recognition=null;
    }
  }

  async function requestMicrophone(){
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return true;
    var stream=await navigator.mediaDevices.getUserMedia({audio:true});
    stream.getTracks().forEach(function(t){t.stop();});
    return true;
  }

  function startListening(){
    if(!carMode||!activeSession)return;
    var SR=speechRecognitionCtor();
    if(!SR){toast("На этом браузере нет распознавания речи");stopCarMode();return;}
    stopListening();
    recognitionHandled=false;
    recognition=new SR();
    recognition.lang="ru-RU";
    recognition.interimResults=false;
    recognition.continuous=false;
    recognition.maxAlternatives=5;
    recognition.onstart=function(){listening=true;setCarStatus("listening","Слушаю ответ…","Можно сказать букву, номер или сам ответ");};
    recognition.onresult=function(event){
      recognitionHandled=true;listening=false;
      var alternatives=[];
      var result=event.results[event.results.length-1];
      for(var i=0;i<result.length;i++)alternatives.push(result[i].transcript);
      handleSpoken(alternatives);
    };
    recognition.onerror=function(event){
      listening=false;
      if(!carMode)return;
      if(event.error==="not-allowed"||event.error==="service-not-allowed"){
        toast("Нужен доступ к микрофону");stopCarMode();return;
      }
      if(event.error!=="aborted")setTimeout(function(){if(carMode)startListening();},500);
    };
    recognition.onend=function(){
      listening=false;
      if(carMode&&!recognitionHandled)setTimeout(function(){if(carMode)startListening();},450);
    };
    try{recognition.start();}catch(e){setTimeout(function(){if(carMode)startListening();},500);}
  }

  async function carAskCurrent(){
    if(!carMode||!activeSession||activeSession.finished)return;
    var seq=++carSequence,item=activeSession.questions[activeSession.index],cfg=modes();
    if(cfg.questionMode==="screen"){
      setCarStatus("listening","Слушаю ответ…","Вопрос на экране");
      startListening();return;
    }
    setCarStatus("speaking","Читаю вопрос…","");
    if(item.kind==="listen"){
      await playTts("Вопрос "+(activeSession.index+1)+". Слушай английское слово.","ru");
      if(!carMode||seq!==carSequence)return;
      await playTts(item.speechText||item.correct,item.speechLang||"en");
      if(!carMode||seq!==carSequence)return;
      if(item.answerStyle==="choices"){
        var n=["Первый","Второй","Третий","Четвёртый"];
        var opts=item.options.map(function(x,i){return n[i]+": "+x;}).join(". ");
        await playTts("Что оно означает? "+opts,"ru");
      }else{
        await playTts("Что оно означает? Скажи ответ своими словами.","ru");
      }
    }else{
      var v=voiceText(item);
      await playTts("Вопрос "+(activeSession.index+1)+". "+v.text,v.language);
      if(item.answerStyle==="open"){
        await playTts("Ответь своими словами.","ru");
      }
    }
    if(carMode&&seq===carSequence)startListening();
  }


  async function handleSpoken(transcripts){
    if(!carMode||!activeSession)return;
    var item=activeSession.questions[activeSession.index];
    var parsed=parseSpoken(transcripts,item);
    var heard=parsed.heard||transcripts[0]||"";
    if(parsed.command==="stop"){await playTts("Останавливаю голосовой режим.","ru");stopCarMode();renderHome();return;}
    if(parsed.command==="repeat"){setCarStatus("speaking","Повторяю…",heard);carAskCurrent();return;}
    if(parsed.command==="next"){
      setCarStatus("speaking","Пропускаю вопрос…",heard);
      await playTts("Хорошо, пропускаю.","ru");
      if(!carMode)return;
      activeSession.answers[activeSession.index]=-1;save();
      nextQuestion();
      return;
    }
    if(Number.isInteger(parsed.answer)&&parsed.answer>=0){
      setCarStatus("thinking","Понял: "+item.options[parsed.answer],heard);
      await handleCarAnswer(parsed.answer);
      return;
    }
    setCarStatus("listening","Не расслышал ответ","Я услышал: "+heard);
    await playTts(item.answerStyle==="open"?"Не расслышал. Повтори сам ответ ещё раз.":"Не расслышал. Скажи первый, второй, третий, четвёртый, букву варианта или сам ответ.","ru");
    if(carMode)startListening();
  }

  async function handleCarAnswer(index){
    if(!carMode||!activeSession)return;
    var session=activeSession,item=session.questions[session.index],last=session.index===9;
    var correct=index===item.correctIndex;
    answerQuestion(index);
    var phrase=correct
      ? "Правильно. "+item.explanation
      : "Нет. Правильный ответ: "+item.correct+". "+item.explanation;
    await playTts(phrase,"ru");
    if(!carMode)return;
    if(last){
      nextQuestion();
      var score=activeSession&&activeSession.score!=null?activeSession.score:session.answers.filter(function(a,i){return a===session.questions[i].correctIndex;}).length;
      await playTts("Раунд закончен. "+score+" из десяти. Можно сказать стоп или посмотреть результат.","ru");
      carMode=false;stopListening();return;
    }
    nextQuestion();
  }

  function stopCarMode(silent){
    carMode=false;carSequence++;stopListening();
    if(currentAudio){try{currentAudio.pause();currentAudio.currentTime=0;}catch(e){}}
    currentAudio=null;
    document.body.classList.remove("v4-car-mode");
    if(!silent)toast("Голосовой режим выключен");
  }

  function aiStore(){
    var s=pstats();
    s.aiHistoryConcepts=s.aiHistoryConcepts||[];
    s.aiHistoryTexts=s.aiHistoryTexts||[];
    s.aiDaily=s.aiDaily||{};
    return s;
  }

  function rememberAiQuestions(questions){
    var s=aiStore(), concepts=new Set(s.aiHistoryConcepts), texts=new Set(s.aiHistoryTexts);
    (questions||[]).forEach(function(q){
      if(q.conceptKey)concepts.add(String(q.conceptKey).toLowerCase());
      if(q.text)texts.add(String(q.text).trim());
    });
    s.aiHistoryConcepts=Array.from(concepts);
    s.aiHistoryTexts=Array.from(texts);
    save();
  }

  function aiQuestionToSession(q,r){
    var kind=q.kind||"choices", opts=(q.options||[]).map(String);
    var style=modes().answerMode;
    if(kind==="match")style="match";
    else if(kind==="multiple")style="multiple";
    else if(kind==="order")style="order";
    else if(["open","fill","clues"].indexOf(kind)>=0)style="open";
    else if(kind==="listen"&&opts.length<2)style="open";
    else if(style==="mix")style=(opts.length>=2&&r()>.30)?"choices":"open";
    if(style==="match"&&kind!=="match")style=opts.length>=2?"choices":"open";
    var correct=String(q.correct||"");
    var correctIndex=opts.indexOf(correct);
    if(style==="choices"&&correctIndex<0&&opts.length){
      opts=[correct].concat(opts.filter(function(x){return x!==correct;})).slice(0,4);
      opts=shuffle(opts,r);correctIndex=opts.indexOf(correct);
    }
    return Object.assign({},q,{
      id:q.id||("ai-"+Math.random().toString(36).slice(2)),
      family:"ai-"+(q.conceptKey||kind),
      answerStyle:style,
      options:opts,
      correct:correct,
      correctIndex:(style==="match"||style==="multiple"||style==="order")?1:correctIndex,
      matchSeed:Math.floor(r()*1e9),
      hints:Array.isArray(q.hints)?q.hints:[],
      acceptedAnswers:Array.isArray(q.acceptedAnswers)?q.acceptedAnswers:[]
    });
  }

  async function prepareAiSession(){
    var s=aiStore(),cfg=modes(),date=todayKey();
    var cacheKey=[date,state.activeProfile,s.topic,s.challenge,cfg.questionMode,cfg.inputMode,cfg.answerMode].join("|");
    if(s.aiDaily[cacheKey]&&s.aiDaily[cacheKey].length>=10){
      var cached=s.aiDaily[cacheKey],r0=seeded("ai-session|"+cacheKey);
      return buildAiSession(cached,r0,cacheKey);
    }
    try{
      var response=await fetch("/api/generate-quiz",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          profile:profile().name,
          age:profile().age,
          topic:s.topic,
          challenge:s.challenge,
          count:10,
          usedConcepts:s.aiHistoryConcepts,
          usedTexts:s.aiHistoryTexts
        })
      });
      if(!response.ok)throw new Error("AI "+response.status);
      var data=await response.json();
      if(!data.questions||data.questions.length<5)throw new Error("AI returned too few questions");
      var qs=data.questions.slice(0,10);
      s.aiDaily[cacheKey]=qs;
      rememberAiQuestions(qs);
      var r=seeded("ai-session|"+cacheKey);
      return buildAiSession(qs,r,cacheKey);
    }catch(err){
      console.warn("Gemini unavailable, using local bank",err);
      return null;
    }
  }

  function buildAiSession(rawQuestions,r,cacheKey){
    var s=pstats(),cfg=modes();
    var questions=rawQuestions.slice(0,10).map(function(q){return aiQuestionToSession(q,r);});
    while(questions.length<10){
      var fallback=bank[Math.floor(r()*bank.length)];
      if(!questions.some(function(x){return x.id===fallback.id;})){
        var opts=shuffle([fallback.correct].concat(fallback.distractors||[]),r).slice(0,4);
        questions.push(Object.assign({},fallback,{options:opts,correctIndex:opts.indexOf(fallback.correct),answerStyle:"choices"}));
      }
    }
    var key="ai|"+cacheKey;
    var session={key:key,date:todayKey(),profile:state.activeProfile,topic:s.topic,challenge:s.challenge,index:0,answers:[],questions:questions,finished:false,score:null,startedAt:Date.now(),v4:Object.assign({},cfg),ai:true,hints:{}};
    s.sessions[key]=session;save();return session;
  }

  function fallbackHints(item){
    if(item.kind==="clues"&&item.clueLines&&item.clueLines.length)return item.clueLines.slice(0,3);
    if(item.hints&&item.hints.length)return item.hints.slice(0,3);
    var h1="Обрати внимание на ключевые слова в вопросе.";
    var h2=item.options&&item.options.length>1?"Попробуй сначала исключить вариант, который точно не подходит.":"Разбей задачу на один маленький шаг.";
    var h3="Свяжи вопрос с темой «"+item.category+"» и вспомни главное правило или факт.";
    return [h1,h2,h3];
  }

  function hintLevel(){
    if(!activeSession)return 0;
    activeSession.hints=activeSession.hints||{};
    return Number(activeSession.hints[activeSession.index]||0);
  }

  function revealHint(){
    if(!activeSession)return;
    activeSession.hints=activeSession.hints||{};
    var level=Number(activeSession.hints[activeSession.index]||0);
    if(level<3)activeSession.hints[activeSession.index]=level+1;
    save();renderQuiz();
  }

  async function startVoiceControl(button){
    var cfg=modes(),needsMic=cfg.inputMode==="voice"||cfg.inputMode==="both";
    try{
      if(button){button.classList.add("loading");button.dataset.oldText=button.innerHTML;button.innerHTML="Готовлю новые вопросы…";}
      if(needsMic){
        var SR=speechRecognitionCtor();
        if(!SR){toast("На этом браузере нет голосового распознавания");return;}
        await requestMicrophone();
        carMode=true;carSequence++;document.body.classList.add("v4-car-mode");
      }else{
        carMode=false;document.body.classList.remove("v4-car-mode");
      }
      activeSession=await prepareAiSession();
      if(!activeSession)activeSession=makeSession();
      renderQuiz();
    }catch(err){
      console.error(err);toast("Не удалось запустить режим");
    }finally{
      if(button){button.classList.remove("loading");if(button.dataset.oldText)button.innerHTML=button.dataset.oldText;}
    }
  }

  var KIND_META={
    listen:["🎧","НА СЛУХ"],truefalse:["⚡","ПРАВДА / ЛОЖЬ"],odd:["🧩","ЧТО ЛИШНЕЕ"],
    sequence:["🔢","ПРОДОЛЖИ РЯД"],scenario:["🧠","СИТУАЦИЯ"],timeline:["🕰️","ХРОНОЛОГИЯ"],
    number:["➗","БЫСТРЫЙ СЧЁТ"],map:["🧭","МИР"],lab:["🧪","НАУКА"],think:["◇","ПОДУМАЙ"],
    puzzle:["💡","ЛОГИКА"],match:["🔗","СОЕДИНИ ПАРЫ"],choices:["✦","ВЫБОР"],
    open:["💬","БЕЗ ВАРИАНТОВ"],clues:["🕵️","УГАДАЙ ПО ПОДСКАЗКАМ"],closest:["🎯","БЛИЖЕ ВСЕГО"],
    multiple:["☑️","НЕСКОЛЬКО ОТВЕТОВ"],order:["↕️","ПО ПОРЯДКУ"],fill:["✍️","ВСТАВЬ ПРОПУСК"],
    compare:["⚖️","СРАВНИ"],rapid:["⚡","БЛИЦ"],estimate:["📏","ОЦЕНИ"],category:["🗂️","КЛАССИФИКАЦИЯ"],
    "two-step":["🧠","ДВА ШАГА"],reverse:["↩️","ОТВЕТ НАОБОРОТ"],memory:["👁️","ПАМЯТЬ"],choice:["✦","ВЫБОР"]
  };

  var matchState=null;
  var multiState={};
  var orderState={};
  var lastAutoQuestionKey="";

  function openAnswerIndex(item,value){
    var phrase=normalizeSpoken(value);
    if(!phrase)return -1;
    var accepted=[item.correct].concat(item.acceptedAnswers||[]);
    if(accepted.some(function(x){return tokenScore(phrase,x)>.72;}))return item.correctIndex>=0?item.correctIndex:0;
    var best={index:-1,score:0};
    (item.options||[]).forEach(function(opt,i){
      var score=tokenScore(phrase,opt);
      if(score>best.score)best={index:i,score:score};
    });
    return best.score>.58?best.index:-1;
  }

  function renderMatching(item,answered){
    var seed=seeded("match-ui|"+item.id+"|"+item.matchSeed);
    var rights=shuffle(item.pairs.map(function(p){return p.right;}),seed);
    if(!matchState||matchState.id!==item.id)matchState={id:item.id,left:null,done:[],mistakes:0};
    var left=item.pairs.map(function(p,i){
      var done=matchState.done.indexOf(i)>=0;
      return "<button class=\"v4-match-item left "+(done?"done":"")+" "+(matchState.left===i?"selected":"")+"\" data-match-left=\""+i+"\" "+(done||answered?"disabled":"")+">"+esc(p.left)+"</button>";
    }).join("");
    var right=rights.map(function(value){
      var pi=item.pairs.findIndex(function(p){return p.right===value;});
      var done=matchState.done.indexOf(pi)>=0;
      return "<button class=\"v4-match-item right "+(done?"done":"")+"\" data-match-right=\""+pi+"\" "+(done||answered?"disabled":"")+">"+esc(value)+"</button>";
    }).join("");
    return "<div class=\"v4-match\"><div class=\"v4-match-col\"><span>СЛЕВА</span>"+left+"</div><div class=\"v4-match-lines\">↔</div><div class=\"v4-match-col\"><span>СПРАВА</span>"+right+"</div></div>";
  }

  function handleMatchLeft(index){
    if(!activeSession)return;
    matchState.left=index;renderQuiz();
  }

  function handleMatchRight(index){
    if(matchState.left==null)return toast("Сначала выбери карточку слева");
    if(matchState.left===index){
      if(matchState.done.indexOf(index)<0)matchState.done.push(index);
      matchState.left=null;
      if(matchState.done.length===activeSession.questions[activeSession.index].pairs.length){
        var s=activeSession,q=s.questions[s.index];
        s.answers[s.index]=0;updateSkill(q,true);pstats().seen.push(q.id);pstats().seen=pstats().seen.slice(-240);save();renderQuiz();
      }else renderQuiz();
    }else{
      matchState.mistakes++;matchState.left=null;toast("Не эта пара — попробуй ещё");renderQuiz();
    }
  }

  function specialKey(item){return (activeSession?activeSession.key:"")+"|"+(activeSession?activeSession.index:0)+"|"+item.id;}

  function renderMultiple(item,answered){
    var key=specialKey(item),selected=multiState[key]||[];
    return "<div class=\"v4-multiple\">"+(item.options||[]).map(function(opt,i){
      var on=selected.indexOf(i)>=0;
      return "<button class=\"v4-multi-option "+(on?"selected":"")+"\" data-multi=\""+i+"\" "+(answered?"disabled":"")+"><span>"+(on?"✓":"")+"</span><b>"+esc(opt)+"</b></button>";
    }).join("")+"</div>"+(!answered?"<button class=\"v4-check-special\" data-action=\"check-multiple\">Проверить выбранные</button>":"");
  }

  function toggleMultiple(index){
    var item=activeSession.questions[activeSession.index],key=specialKey(item),arr=multiState[key]||[];
    var pos=arr.indexOf(index);if(pos>=0)arr.splice(pos,1);else arr.push(index);
    multiState[key]=arr;renderQuiz();
  }

  function checkMultiple(){
    var s=activeSession,item=s.questions[s.index],key=specialKey(item),selected=(multiState[key]||[]).map(function(i){return normalizeSpoken(item.options[i]);}).sort();
    var expected=(item.multipleCorrect||[]).map(normalizeSpoken).sort();
    if(!selected.length)return toast("Выбери хотя бы один вариант");
    var correct=selected.length===expected.length&&selected.every(function(x,i){return x===expected[i];});
    s.answers[s.index]=correct?1:0;updateSkill(item,correct);pstats().seen.push(item.id);save();renderQuiz();
  }

  function renderOrder(item,answered){
    var key=specialKey(item),seed=seeded("order-ui|"+item.id+"|"+item.matchSeed);
    var pool=shuffle((item.items||[]).slice(),seed),chosen=orderState[key]||[];
    var remaining=pool.filter(function(x){return chosen.indexOf(x)<0;});
    var chosenHtml=chosen.map(function(x,i){return "<button class=\"v4-order-chip chosen\" data-order-remove=\""+i+"\" "+(answered?"disabled":"")+"><span>"+(i+1)+"</span>"+esc(x)+"</button>";}).join("");
    var poolHtml=remaining.map(function(x){return "<button class=\"v4-order-chip\" data-order-add=\""+esc(x).replace(/"/g,"&quot;")+"\" "+(answered?"disabled":"")+">"+esc(x)+"</button>";}).join("");
    return "<div class=\"v4-order\"><div class=\"v4-order-title\">ТВОЙ ПОРЯДОК</div><div class=\"v4-order-picked\">"+(chosenHtml||"<small>Нажимай элементы снизу по порядку</small>")+"</div><div class=\"v4-order-pool\">"+poolHtml+"</div></div>"+(!answered?"<button class=\"v4-check-special\" data-action=\"check-order\">Проверить порядок</button>":"");
  }

  function addOrder(value){var item=activeSession.questions[activeSession.index],key=specialKey(item);orderState[key]=orderState[key]||[];if(orderState[key].indexOf(value)<0)orderState[key].push(value);renderQuiz();}
  function removeOrder(index){var item=activeSession.questions[activeSession.index],key=specialKey(item);orderState[key]=orderState[key]||[];orderState[key].splice(index,1);renderQuiz();}
  function checkOrder(){
    var s=activeSession,item=s.questions[s.index],key=specialKey(item),chosen=orderState[key]||[],expected=item.correctOrder||[];
    if(chosen.length!==expected.length)return toast("Расставь все элементы");
    var correct=chosen.every(function(x,i){return normalizeSpoken(x)===normalizeSpoken(expected[i]);});
    s.answers[s.index]=correct?1:0;updateSkill(item,correct);pstats().seen.push(item.id);save();renderQuiz();
  }

  function submitOpenAnswer(value){
    var s=activeSession,item=s.questions[s.index];
    var idx=openAnswerIndex(item,value);
    if(idx<0){toast("Не смог понять ответ — попробуй ещё раз");return;}
    if(carMode)handleCarAnswer(idx);else answerQuestion(idx);
  }

  function maybeAutoSpeak(item,answered){
    if(answered||carMode)return;
    var cfg=modes(),key=activeSession.key+"|"+activeSession.index;
    if(cfg.questionMode==="screen"||lastAutoQuestionKey===key)return;
    lastAutoQuestionKey=key;
    setTimeout(async function(){
      if(!activeSession||activeSession.finished)return;
      if(item.kind==="listen"){
        await playTts("Слушай английское слово.","ru");
        await playTts(item.speechText||item.correct,item.speechLang||"en");
        if(item.answerStyle==="choices"){
          var opts=item.options.map(function(x,i){return ["Первый","Второй","Третий","Четвёртый"][i]+": "+x;}).join(". ");
          await playTts("Что оно означает? "+opts,"ru");
        }else await playTts("Что оно означает?","ru");
      }else{
        var v=voiceText(item);await playTts(v.text,v.language);
      }
    },220);
  }

  function installQuizRenderer(){
    renderQuiz=function(){
      view="quiz";
      var session=activeSession;if(!session){renderHome();return;}if(session.finished){renderResult();return;}
      var cfg=modes(),i=session.index,item=session.questions[i],answer=session.answers[i];
      selectedAnswer=Number.isInteger(answer)?answer:null;
      var answered=selectedAnswer!==null,correct=answered&&selectedAnswer===item.correctIndex,style=item.answerStyle||cfg.answerMode;
      var km=KIND_META[item.kind]||KIND_META.choice;
      var progress=session.questions.map(function(x,n){
        var cls=n<i?(session.answers[n]===session.questions[n].correctIndex?"ok":"bad"):(n===i?"now":"");
        return "<i class=\""+cls+"\"></i>";
      }).join("");

      var showText=cfg.questionMode!=="audio" || item.kind==="listen";
      var head;
      if(item.kind==="listen"){
        head="<div class=\"v4-listen\"><div class=\"emoji\">🎧</div><h1>Что означает слово, которое ты услышишь?</h1><p>"+(cfg.questionMode==="screen"?"Нажми ▶, чтобы услышать слово.":"Слово прозвучит автоматически.")+"</p><button data-action=\"speak\">▶</button></div>";
      }else if(showText){
        head="<div class=\"v4-qintro\"><div class=\"v4-qicon\">"+(item.icon||km[0])+"</div><span>"+km[1].toLowerCase()+" · уровень "+item.difficulty+"/5</span></div><h1>"+esc(item.text)+"</h1>";
      }else{
        head="<div class=\"v4-audio-only\"><span>🎧</span><h1>Слушай вопрос</h1><p>Текст специально скрыт в режиме «только слушать».</p><button data-action=\"speak\">Повторить 🔊</button></div>";
      }

      var answerArea="";
      if(style==="match"){
        answerArea=renderMatching(item,answered);
      }else if(style==="multiple"){
        answerArea=renderMultiple(item,answered);
      }else if(style==="order"){
        answerArea=renderOrder(item,answered);
      }else if(style==="open"){
        answerArea=answered?"":("<form class=\"v4-open-answer\" data-open-form><input type=\"text\" autocomplete=\"off\" placeholder=\"Напиши или скажи ответ…\" aria-label=\"Ответ\"><button type=\"submit\">Ответить</button></form>");
      }else{
        answerArea="<div class=\"v4-answers "+(item.options.length===2?"two":"")+"\">"+item.options.map(function(opt,n){
          var cls="";if(answered)cls=n===item.correctIndex?"correct":(n===selectedAnswer?"wrong":"muted");
          var icon=answered&&n===item.correctIndex?"✓":(answered&&n===selectedAnswer?"×":"");
          return "<button class=\"v4-answer "+cls+"\" data-answer=\""+n+"\" "+(answered?"disabled":"")+"><span>"+["A","B","C","D"][n]+"</span><b>"+esc(opt)+"</b><i>"+icon+"</i></button>";
        }).join("")+"</div>";
      }

      var hintHtml="";
      if(!answered&&style!=="match"){
        var hints=fallbackHints(item),hl=hintLevel();
        var shown=hints.slice(0,hl).map(function(h,n){return "<div class=\"v4-hint-line\"><b>💡 "+(n+1)+"</b><span>"+esc(h)+"</span></div>";}).join("");
        hintHtml="<div class=\"v4-hints\">"+shown+(hl<Math.min(3,hints.length)?"<button data-action=\"hint\">💡 Подсказка "+(hl+1)+"/3</button>":"")+"</div>";
      }

      var feedback="";
      if(answered){
        var wrongPrefix=item.category==="Математика"?"":"Правильный ответ: <b>"+esc(item.correct)+"</b>. ";
        feedback="<div class=\"feedback v4-feedback "+(correct?"good":"oops")+"\"><strong>"+(correct?"Да! Именно так.":"Не совсем.")+"</strong><p>"+(correct?"":wrongPrefix)+esc(item.explanation)+"</p></div><button class=\"continue-btn\" data-action=\"next\">"+(i===9?"Показать результат":"Следующий вопрос")+" <span>→</span></button>";
      }else{
        var hint=style==="open"?"Напиши ответ или скажи его голосом.":style==="match"?"Соедини каждую карточку слева с правильной справа.":style==="multiple"?"Здесь может быть больше одного правильного варианта.":style==="order"?"Нажимай элементы в правильной последовательности.":"Можно выбрать кнопку или сказать букву/сам ответ.";
        feedback="<p class=\"v4-note\">"+hint+"</p>";
      }

      var voiceBanner=carMode?"<div class=\"v4-car-banner\" id=\"v4-car-banner\" data-state=\"idle\"><div class=\"v4-car-orb\"><span>🎙️</span><i></i><i></i><i></i></div><div><strong data-car-status>Голосовое управление включено</strong><small data-car-heard>Можно отвечать, говорить «повтори», «дальше» или «стоп»</small></div><button data-action=\"car-stop\" aria-label=\"Остановить голосовой режим\">×</button></div>":"";
      app.innerHTML=shell("<main class=\"quiz-main\"><div class=\"quiz-toolbar\"><button class=\"back-link\" data-action=\"home\">← На главную</button><div class=\"quiz-person\"><span>"+esc(profile().letter)+"</span>"+esc(profile().name)+"</div></div>"+voiceBanner+"<section class=\"quiz-card v4-quiz\"><div class=\"v4-quiz-stage kind-"+esc(item.kind)+"\"><div class=\"quiz-progress-head\"><div><span>Вопрос "+(i+1)+"</span><b>"+(i+1)+" / 10</b></div><div class=\"progress-line\">"+progress+"</div></div><div class=\"v4-question\"><div class=\"v4-quiz-head\"><div class=\"v4-tags\"><span class=\"v4-type\">"+km[0]+" "+km[1]+"</span><span class=\"v4-cat\">"+esc(item.category)+"</span></div><button class=\"v4-voice\" data-action=\"speak\" aria-label=\"Озвучить\">🔊</button></div>"+head+answerArea+hintHtml+feedback+"</div></div></section></main>");

      wireCommon();
      var home=app.querySelector("[data-action=home]");if(home)home.onclick=function(){if(carMode)stopCarMode(true);renderHome();};
      app.querySelectorAll("[data-answer]").forEach(function(btn){btn.onclick=function(){var n=Number(btn.dataset.answer);if(carMode)handleCarAnswer(n);else answerQuestion(n);};});
      app.querySelectorAll("[data-action=speak]").forEach(function(btn){btn.onclick=function(){var v=voiceText(item);playTts(v.text,v.language,btn);};});
      var form=app.querySelector("[data-open-form]");if(form)form.onsubmit=function(e){e.preventDefault();submitOpenAnswer(form.querySelector("input").value);};
      app.querySelectorAll("[data-match-left]").forEach(function(btn){btn.onclick=function(){handleMatchLeft(Number(btn.dataset.matchLeft));};});
      app.querySelectorAll("[data-match-right]").forEach(function(btn){btn.onclick=function(){handleMatchRight(Number(btn.dataset.matchRight));};});
      app.querySelectorAll("[data-multi]").forEach(function(btn){btn.onclick=function(){toggleMultiple(Number(btn.dataset.multi));};});
      var multiCheck=app.querySelector("[data-action=check-multiple]");if(multiCheck)multiCheck.onclick=checkMultiple;
      app.querySelectorAll("[data-order-add]").forEach(function(btn){btn.onclick=function(){addOrder(btn.dataset.orderAdd);};});
      app.querySelectorAll("[data-order-remove]").forEach(function(btn){btn.onclick=function(){removeOrder(Number(btn.dataset.orderRemove));};});
      var orderCheck=app.querySelector("[data-action=check-order]");if(orderCheck)orderCheck.onclick=checkOrder;
      app.querySelectorAll("[data-action=hint]").forEach(function(btn){btn.onclick=revealHint;});
      var next=app.querySelector("[data-action=next]");if(next)next.onclick=nextQuestion;
      var stop=app.querySelector("[data-action=car-stop]");if(stop)stop.onclick=function(){stopCarMode();renderHome();};
      if(carMode&&!answered)setTimeout(carAskCurrent,260);else maybeAutoSpeak(item,answered);
    };
  }


  function modeButton(group,value,label,active){
    return "<button class=\"v4-mode-option "+(active?"active":"")+"\" data-mode-group=\""+group+"\" data-mode-value=\""+value+"\">"+label+"</button>";
  }

  function decorateHome(){
    var hero=document.querySelector(".hero-grid");if(!hero)return;
    var cfg=modes();
    hero.classList.add("v4-home-hero");
    var title=hero.querySelector(".hero-copy h1");if(title)title.innerHTML="Доброе утро, <em>"+esc(profile().name)+"</em>.<br>Выбери, как играть сегодня.";
    var lead=hero.querySelector(".hero-lead");if(lead)lead.textContent="Можно просто смотреть, только слушать, отвечать голосом, без вариантов, соединять пары — или всё смешать.";

    var art=hero.querySelector(".hero-art");
    if(art)art.innerHTML="<div class=\"v4-stack\"><article class=\"v4-stack-card\"><small>БЕЗ ПОДСКАЗОК</small><b>💬</b><h3>Скажи сам</h3><p>Никаких A‑B‑C‑D.</p></article><article class=\"v4-stack-card\"><small>СОЕДИНИ</small><b>🔗</b><h3>Найди пары</h3><p>Страна ↔ столица, слово ↔ значение.</p></article><article class=\"v4-stack-card\"><small>ГОЛОС</small><b>🎙️</b><h3>Можно без рук</h3><p>Слушай и отвечай вслух.</p></article></div>";

    var today=hero.querySelector(".today-card");
    if(today){
      var start=today.querySelector("[data-action=start]");
      if(start)start.onclick=function(){startVoiceControl(start);};
      var existing=today.querySelector(".v4-voice-test");if(existing)existing.remove();
      var test=document.createElement("button");test.className="v4-voice-test";test.textContent="🔊 Голос";
      test.onclick=function(e){e.stopPropagation();playTts("Привет, "+profile().name+". Проверка нового нейро голоса.","ru",test);};
      today.appendChild(test);
    }

    var old=hero.querySelector(".v4-drive-card");if(old)old.remove();
    var oldBuilder=hero.querySelector(".v4-mode-builder");if(oldBuilder)oldBuilder.remove();
    if(today){
      var builder=document.createElement("div");builder.className="v4-mode-builder";
      builder.innerHTML=
        "<div class=\"v4-presets\"><button data-preset=\"handsfree\">🎙️ Без рук</button><button data-preset=\"classic\">👆 Классика</button><button data-preset=\"mixed\" class=\"active\">✨ Микс</button></div>"+
        "<div class=\"v4-mode-row\"><span><b>Вопрос</b><small>как получать вопрос</small></span><div>"+
          modeButton("questionMode","screen","👀 Смотреть",cfg.questionMode==="screen")+
          modeButton("questionMode","audio","🔊 Слушать",cfg.questionMode==="audio")+
          modeButton("questionMode","both","👀🔊 Оба",cfg.questionMode==="both")+
        "</div></div>"+
        "<div class=\"v4-mode-row\"><span><b>Управление</b><small>как отвечать</small></span><div>"+
          modeButton("inputMode","touch","👆 Руками",cfg.inputMode==="touch")+
          modeButton("inputMode","voice","🎙️ Голосом",cfg.inputMode==="voice")+
          modeButton("inputMode","both","👆🎙️ Оба",cfg.inputMode==="both")+
        "</div></div>"+
        "<div class=\"v4-mode-row\"><span><b>Формат</b><small>какой тип ответа</small></span><div>"+
          modeButton("answerMode","mix","🎲 Микс",cfg.answerMode==="mix")+
          modeButton("answerMode","choices","🔤 A‑B‑C‑D",cfg.answerMode==="choices")+
          modeButton("answerMode","open","💬 Без вариантов",cfg.answerMode==="open")+
          modeButton("answerMode","match","🔗 Соедини",cfg.answerMode==="match")+
        "</div></div>";
      today.insertAdjacentElement("afterend",builder);
      builder.querySelectorAll("[data-mode-group]").forEach(function(btn){
        btn.onclick=function(){setMode(btn.dataset.modeGroup,btn.dataset.modeValue);renderHome();};
      });
      builder.querySelectorAll("[data-preset]").forEach(function(btn){
        btn.onclick=function(){applyPreset(btn.dataset.preset);renderHome();};
      });
    }

    var stats=document.querySelector(".stats-grid");
    if(stats&&!document.querySelector(".v4-mechanics")){
      var strip=document.createElement("div");strip.className="v4-mechanics";
      strip.innerHTML="<span>💬 свободный ответ</span><span>🔗 соедини пары</span><span>☑️ несколько ответов</span><span>↕️ по порядку</span><span>🕵️ угадай по подсказкам</span><span>🎯 ближе всего</span><span>✍️ вставь пропуск</span><span>⚖️ сравни</span><span>⚡ блиц</span><span>📏 оцени</span><span>🗂️ классификация</span><span>🧠 два шага</span><span>↩️ наоборот</span><span>👁️ память</span><span>🎧 только слушать</span><span>🎙️ голосом</span><span>✅ правда / ложь</span><span>🧩 что лишнее</span>";
      stats.parentNode.insertBefore(strip,stats);
    }
  }


  function installHome(){
    var baseHome=renderHome;
    renderHome=function(){if(carMode)stopCarMode(true);baseHome();decorateHome();};
  }

  function boot(){
    if(booted)return;
    if(typeof bank==="undefined" || !bank || bank.length===0){setTimeout(boot,60);return;}
    booted=true;
    extraQuestions().concat(matchingQuestions()).forEach(function(item){if(!bank.some(function(x){return x.id===item.id;}))bank.push(item);});
    ensureModes();
    bank.forEach(enrich);
    bankById=new Map(bank.map(function(x){return [x.id,x];}));
    state.audio=state.audio||{provider:"microsoft-neural"};
    installSessionPicker();
    installQuizRenderer();
    installHome();
    renderHome();
  }

  boot();
})();
