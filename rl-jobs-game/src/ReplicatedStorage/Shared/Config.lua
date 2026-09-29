--[[
	Config.lua
	Центральная конфигурация игры "Rl Jobs- Real life Jobs".
	Здесь хранятся все числа и правила, чтобы их было легко менять в одном месте.

	ВАЖНО: это общий модуль (ReplicatedStorage), его видят и сервер, и клиент.
	Но менять важные значения (деньги, опыт) имеет право ТОЛЬКО сервер.
]]

local Config = {}

-- Название игры. НЕ переименовывать без явной просьбы.
Config.GAME_NAME = "Rl Jobs- Real life Jobs"

-- Основной язык. Если язык аккаунта Roblox не поддерживается — используем его.
Config.DEFAULT_LOCALE = "ru"
Config.SUPPORTED_LOCALES = { "ru" } -- английский добавим позже: "en"

-- Сколько слотов жизни у игрока
Config.LIFE_SLOTS = 5

--========================================================================
-- СЛОЖНОСТИ
--========================================================================
-- locked = true означает, что режим надо открыть.
-- Hard открывается на АККАУНТ после total earned >= HARD_UNLOCK_AMOUNT в Medium.
Config.HARD_UNLOCK_AMOUNT = 1000000

Config.Difficulties = {
	Easy = {
		id = "Easy",
		order = 1,
		locked = false,
		startMoneyMultiplier = 1.5,
		penaltyMultiplier = 0.5,    -- меньше штрафы
		timerMultiplier = 1.5,      -- длиннее таймеры заданий
		npcForgiveness = 1.5,       -- NPC мягче к ошибкам
		-- шансы типов семей (мягче, добрее)
		familyWeights = { Poor = 1, Normal = 4, Rich = 3, Strict = 1, Creative = 2, Difficult = 0 },
	},
	Medium = {
		id = "Medium",
		order = 2,
		locked = false,
		startMoneyMultiplier = 1.0,
		penaltyMultiplier = 1.0,
		timerMultiplier = 1.0,
		npcForgiveness = 1.0,
		-- сбалансированный случайный старт
		familyWeights = { Poor = 2, Normal = 3, Rich = 2, Strict = 2, Creative = 2, Difficult = 1 },
		-- именно в этом режиме считается прогресс к открытию Hard
		countsTowardHardUnlock = true,
	},
	Hard = {
		id = "Hard",
		order = 3,
		locked = true, -- открывается через EconomyManager
		startMoneyMultiplier = 0.5,
		penaltyMultiplier = 1.4,
		timerMultiplier = 0.7,      -- короче таймеры
		npcForgiveness = 0.6,       -- NPC меньше доверяют
		familyWeights = { Poor = 4, Normal = 2, Rich = 1, Strict = 3, Creative = 1, Difficult = 3 },
	},
	Impossible = {
		id = "Impossible",
		order = 4,
		locked = true,
		comingSoon = true, -- в первой версии НЕ реализуем, только "Скоро"
	},
}

--========================================================================
-- ТИПЫ СЕМЕЙ
--========================================================================
-- statBonus — стартовые бонусы к характеристикам.
-- startMoney — базовые стартовые деньги (потом умножаются на множитель сложности).
Config.Families = {
	Poor = {
		id = "Poor",
		startMoney = 150,
		statBonus = { streetSmart = 2, discipline = 1 },
		jobAffinity = { Courier = 1, Taxi = 1, Mechanic = 1, RestaurantWorker = 1 },
	},
	Normal = {
		id = "Normal",
		startMoney = 500,
		statBonus = {},
		jobAffinity = {},
	},
	Rich = {
		id = "Rich",
		startMoney = 2500,
		statBonus = { confidence = 2, education = 1 },
		jobAffinity = { BusinessOwner = 1, Office = 1 },
	},
	Strict = {
		id = "Strict",
		startMoney = 600,
		statBonus = { discipline = 3, education = 2 },
		jobAffinity = { Doctor = 1, Police = 1, Lawyer = 1, Teacher = 1, Office = 1 },
	},
	Creative = {
		id = "Creative",
		startMoney = 450,
		statBonus = { creativity = 3 },
		jobAffinity = { Blogger = 1, Cook = 1, Designer = 1, BusinessOwner = 1 },
	},
	Difficult = {
		-- Сложная семья: тяжелее, но БЕЗ слишком мрачного контента (это Roblox).
		id = "Difficult",
		startMoney = 100,
		statBonus = { streetSmart = 3 },
		jobAffinity = { Courier = 1, RestaurantWorker = 1 },
	},
}

--========================================================================
-- ХАРАКТЕРИСТИКИ
--========================================================================
-- Базовые значения и пределы. Диалог не может менять их за пределы шага.
Config.Stats = {
	kindness = { default = 5, min = 0, max = 100 },
	confidence = { default = 5, min = 0, max = 100 },
	discipline = { default = 5, min = 0, max = 100 },
	creativity = { default = 5, min = 0, max = 100 },
	streetSmart = { default = 5, min = 0, max = 100 },
	education = { default = 5, min = 0, max = 100 },
	reputation = { default = 5, min = 0, max = 100 },
}

-- Максимальное изменение характеристики/отношения за ОДИН диалог.
-- Защита от абуза: даже если backend вернёт большое число, сервер обрежет.
Config.MAX_STAT_CHANGE_PER_DIALOGUE = 3
Config.MAX_RELATIONSHIP_CHANGE_PER_DIALOGUE = 5

--========================================================================
-- ЭКОНОМИКА: ПЕРЕВОДЫ И ЧАЕВЫЕ
--========================================================================
Config.Transfer = {
	bankFeePercent = 0.05,   -- комиссия банка 5%
	minAmount = 1,
	dailyLimit = 50000,      -- дневной лимит переводов
	cooldownSeconds = 5,     -- кулдаун против спама
	minCharacterAge = 16,    -- переводить можно с 16+ лет персонажа
}

Config.Tips = {
	presets = { 5, 10, 25 },
	maxCustom = 1000, -- лимит на "другую сумму"
}

--========================================================================
-- РАБОТЫ (для MVP — курьер и работник ресторана/повар)
--========================================================================
Config.Jobs = {
	Courier = {
		id = "Courier",
		basePay = 40,
		baseXp = 10,
	},
	RestaurantWorker = {
		id = "RestaurantWorker",
		basePay = 35,
		baseXp = 8,
	},
	Cook = {
		id = "Cook",
		basePay = 45,
		baseXp = 12,
	},
}

return Config
