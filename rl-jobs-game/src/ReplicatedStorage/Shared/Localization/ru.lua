--[[
	ru.lua — русская локализация (ОСНОВНОЙ язык игры).
	Ключи на латинице (удобно для кода), значения — на русском (видит игрок).
	Никаких упоминаний ИИ/Gemini/нейросетей.
]]

return {
	-- Меню
	MENU_NEW_LIFE = "Новая жизнь",
	MENU_LOAD_LIFE = "Загрузить жизнь",
	MENU_SETTINGS = "Настройки",
	MENU_TITLE = "Rl Jobs- Real life Jobs",

	-- Слоты жизни
	SLOT_CHOOSE = "Выбери жизнь",
	SLOT_EMPTY = "Пусто",
	SLOT_NAME = "Имя",
	SLOT_AGE = "Возраст",
	SLOT_DIFFICULTY = "Сложность",
	SLOT_FAMILY = "Семья",
	SLOT_JOB = "Работа",
	SLOT_MONEY = "Деньги",
	SLOT_REPUTATION = "Репутация",
	SLOT_NO_JOB = "Нет работы",

	-- Сложности
	DIFFICULTY_TITLE = "Выбери сложность",
	DIFFICULTY_EASY = "Лёгкий",
	DIFFICULTY_EASY_DESC = "Лёгкий старт. Подходит для первой жизни.",
	DIFFICULTY_MEDIUM = "Обычный",
	DIFFICULTY_MEDIUM_DESC = "Обычная жизнь. Твои решения имеют значение.",
	DIFFICULTY_HARD = "Сложный",
	DIFFICULTY_HARD_LOCKED = "Заблокировано. Заработай $1,000,000 всего в Обычном режиме, чтобы открыть.",
	DIFFICULTY_HARD_DESC = "Тяжело, но честно. За успех — больше уважения.",
	DIFFICULTY_IMPOSSIBLE = "Невозможный",
	DIFFICULTY_IMPOSSIBLE_COMING_SOON = "Скоро.",

	-- Типы семей (как показывать игроку)
	FAMILY_POOR = "Бедная",
	FAMILY_NORMAL = "Обычная",
	FAMILY_RICH = "Богатая",
	FAMILY_STRICT = "Строгая",
	FAMILY_CREATIVE = "Творческая",
	FAMILY_DIFFICULT = "Сложная",

	-- Стартовые тексты семей (детство)
	FAMILY_INTRO_POOR = "Ты родился в семье, где денег всегда было мало. С ранних лет тебе приходилось быть самостоятельнее других.",
	FAMILY_INTRO_NORMAL = "Ты родился в обычной жизни. У тебя нет огромных преимуществ, но и всё не решено заранее. Твои решения будут менять твоё будущее.",
	FAMILY_INTRO_RICH = "Ты родился в обеспеченной семье. У тебя есть возможности, но и ожидания тоже высокие.",
	FAMILY_INTRO_STRICT = "Ты родился в строгой семье. Дисциплина и учёба здесь на первом месте.",
	FAMILY_INTRO_CREATIVE = "Ты родился в творческой семье. Здесь ценят идеи, фантазию и необычные решения.",
	FAMILY_INTRO_DIFFICULT = "Ты родился в семье, где было непросто. Тебе рано пришлось рассчитывать на себя. Это тяжело, но именно это может сделать тебя сильнее.",

	-- Характеристики
	STAT_KINDNESS = "Доброта",
	STAT_CONFIDENCE = "Уверенность",
	STAT_DISCIPLINE = "Дисциплина",
	STAT_CREATIVITY = "Креативность",
	STAT_STREET_SMART = "Жизненная смекалка",
	STAT_EDUCATION = "Образование",
	STAT_REPUTATION = "Репутация",

	-- Детство
	CHILDHOOD_START = "Тебе 4 года.\nТы почти ничего не помнишь до этого момента.\nСегодня начинается твоя история.",
	CHILDHOOD_END = "Твоё детство закончилось.\nТеперь начинается самостоятельная жизнь.",
	CHILDHOOD_SUMMARY_TITLE = "Итог детства",
	CHILDHOOD_AVAILABLE_JOBS = "Доступные первые работы",

	-- Диалоги
	DIALOGUE_INPUT_PLACEHOLDER = "Напиши ответ...",
	DIALOGUE_SEND = "Ответить",
	DIALOGUE_TALK = "Говорить",

	-- Работы
	-- (есть и "красивый" ключ, и алиас без подчёркивания — потому что в коде
	--  иногда ключ строится через string.upper(id), напр. "RestaurantWorker")
	JOB_COURIER = "Курьер",
	JOB_RESTAURANT_WORKER = "Работник ресторана",
	JOB_RESTAURANTWORKER = "Работник ресторана",
	JOB_COOK = "Повар",

	-- Экономика / переводы
	TRANSFER_TITLE = "Перевод игроку",
	TRANSFER_AMOUNT = "Сумма",
	TRANSFER_FEE = "Комиссия банка",
	TRANSFER_TOTAL = "Всего спишется",
	TRANSFER_CONFIRM = "Подтвердить",
	TRANSFER_CANCEL = "Отмена",
	TRANSFER_DONE = "Перевод выполнен.",
	TRANSFER_FAIL_FUNDS = "Недостаточно денег.",
	TRANSFER_FAIL_LIMIT = "Превышен дневной лимит переводов.",
	TRANSFER_FAIL_COOLDOWN = "Слишком часто. Подожди немного.",
	TRANSFER_FAIL_AGE = "Переводы доступны с 16 лет.",

	-- Чаевые
	TIP_TITLE = "Чаевые",
	TIP_CUSTOM = "Другая сумма",
	TIP_DONE = "Спасибо за чаевые!",

	-- Заказы / ресторан / курьер
	ORDER_ACCEPT = "Принять заказ",
	QUEST_DELIVER_FOOD = "Доставь еду из ресторана в ближайший дом.",
	ORDER_NEW = "Новый заказ!",
	DELIVERY_DONE = "Доставка выполнена.",

	-- Fallback-фразы NPC (когда живой ответ недоступен)
	NPC_FALLBACK_BUSY = "Извини, я сейчас занят. Подойди позже.",
	NPC_FALLBACK_UNCLEAR = "Я не совсем понял, что ты имеешь в виду, но давай продолжим.",
	NPC_FALLBACK_GENERIC = "Хорошо. Удачи тебе.",

	-- Мягкие реакции (вместо сухих цифр)
	REACTION_LIKED = "Похоже, ему понравился твой ответ.",
	REACTION_DISLIKED = "Кажется, он это запомнит.",
	REACTION_REMEMBER = "Он это запомнит.",
}
