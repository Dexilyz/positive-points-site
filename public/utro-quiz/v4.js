
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
    if(item.kind==="listen")return {text:item.speechText||item.correct,language:item.speechLang||"en"};
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
    var seq=++carSequence;
    var item=activeSession.questions[activeSession.index];
    setCarStatus("speaking","Читаю вопрос…","");
    if(item.kind==="listen"){
      await playTts("Вопрос "+(activeSession.index+1)+". Слушай английское слово.","ru");
      if(!carMode||seq!==carSequence)return;
      await playTts(item.speechText||item.correct,item.speechLang||"en");
      if(!carMode||seq!==carSequence)return;
      var n=["Первый","Второй","Третий","Четвёртый"];
      var opts=item.options.map(function(x,i){return n[i]+": "+x;}).join(". ");
      await playTts("Что оно означает? "+opts,"ru");
    }else{
      var v=voiceText(item);
      await playTts("Вопрос "+(activeSession.index+1)+". "+v.text,v.language);
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
    await playTts("Не расслышал. Скажи первый, второй, третий, четвёртый, букву варианта или сам ответ.","ru");
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

  async function startCarMode(button){
    var SR=speechRecognitionCtor();
    if(!SR){toast("Голосовое управление не поддерживается этим браузером");return;}
    try{
      if(button)button.classList.add("loading");
      await requestMicrophone();
      carMode=true;carSequence++;
      document.body.classList.add("v4-car-mode");
      activeSession=makeSession();
      renderQuiz();
    }catch(err){
      console.error(err);toast("Разреши доступ к микрофону для режима в машине");
    }finally{if(button)button.classList.remove("loading");}
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
      var carBanner=carMode?"<div class=\"v4-car-banner\" id=\"v4-car-banner\" data-state=\"idle\"><div class=\"v4-car-orb\"><span>🎙️</span><i></i><i></i><i></i></div><div><strong data-car-status>Голосовой режим включён</strong><small data-car-heard>Экран можно не трогать</small></div><button data-action=\"car-stop\" aria-label=\"Остановить голосовой режим\">×</button></div>":"";
      app.innerHTML=shell("<main class=\"quiz-main\"><div class=\"quiz-toolbar\"><button class=\"back-link\" data-action=\"home\">← На главную</button><div class=\"quiz-person\"><span>"+esc(profile().letter)+"</span>"+esc(profile().name)+"</div></div>"+carBanner+"<section class=\"quiz-card v4-quiz\"><div class=\"v4-quiz-stage kind-"+esc(item.kind)+"\"><div class=\"quiz-progress-head\"><div><span>Вопрос "+(i+1)+"</span><b>"+(i+1)+" / 10</b></div><div class=\"progress-line\">"+progress+"</div></div><div class=\"v4-question\"><div class=\"v4-quiz-head\"><div class=\"v4-tags\"><span class=\"v4-type\">"+km[0]+" "+km[1]+"</span><span class=\"v4-cat\">"+esc(item.category)+"</span></div><button class=\"v4-voice\" data-action=\"speak\" aria-label=\"Озвучить\">🔊</button></div>"+head+"<div class=\"v4-answers "+(item.options.length===2?"two":"")+"\">"+answers+"</div>"+feedback+"</div></div></section></main>");
      wireCommon();
      var home=app.querySelector("[data-action=home]");if(home)home.onclick=renderHome;
      app.querySelectorAll("[data-answer]").forEach(function(btn){btn.onclick=function(){var n=Number(btn.dataset.answer);if(carMode)handleCarAnswer(n);else answerQuestion(n);};});
      app.querySelectorAll("[data-action=speak]").forEach(function(btn){btn.onclick=function(){var v=voiceText(item);playTts(v.text,v.language,btn);};});
      var next=app.querySelector("[data-action=next]");if(next)next.onclick=nextQuestion;
      var stop=app.querySelector("[data-action=car-stop]");if(stop)stop.onclick=function(){stopCarMode();renderHome();};
      if(carMode&&!answered)setTimeout(carAskCurrent,260);
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
    if(today&&!document.querySelector(".v4-drive-card")){
      var drive=document.createElement("button");drive.className="v4-drive-card";
      drive.innerHTML="<span class=\"v4-drive-icon\">🚗</span><span><b>Режим в машине</b><small>Один раз нажми — дальше только слушай и отвечай голосом</small></span><em>hands-free →</em>";
      drive.onclick=function(){startCarMode(drive);};
      today.insertAdjacentElement("afterend",drive);
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
    renderHome=function(){if(carMode)stopCarMode(true);baseHome();decorateHome();};
  }

  function boot(){
    if(booted)return;
    if(typeof bank==="undefined" || !bank || bank.length===0){setTimeout(boot,60);return;}
    booted=true;
    extraQuestions().forEach(function(item){if(!bank.some(function(x){return x.id===item.id;}))bank.push(item);});
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
