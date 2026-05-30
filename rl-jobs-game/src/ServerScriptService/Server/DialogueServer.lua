--[[
	DialogueServer.lua
	Оркестратор свободных диалогов. Связывает всё вместе:

	1. NPC говорит фразу (StartDialogue).
	2. Игрок ПИШЕТ свой ответ (не только кнопки) -> SendDialogue.
	3. Сервер собирает контекст из сессии и зовёт скрытый backend.
	4. Сервер ПРОВЕРЯЕТ результат (безопасность, лимиты, абуз).
	5. Применяет только безопасные изменения характеристик/отношений/памяти.
	6. Возвращает игроку ТОЛЬКО реплику NPC (никакого JSON, никаких цифр насильно).

	Деньги/опыт/Robux/предметы тут НЕ выдаются — это делает серверная логика
	работы и экономики отдельно.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Remotes = require(ReplicatedStorage.Shared.Remotes)
local Localization = require(ReplicatedStorage.Shared.Localization)

local SessionManager = require(script.Parent.SessionManager)
local StatsManager = require(script.Parent.StatsManager)
local RelationshipManager = require(script.Parent.RelationshipManager)
local DialogueBackend = require(script.Parent.DialogueBackend)
local SafetyFilter = require(script.Parent.SafetyFilter)
local NPCRegistry = require(script.Parent.NPCRegistry)

local DialogueServer = {}

-- Соответствие "имя поля изменения" -> "имя характеристики"
local STAT_FIELDS = {
	kindnessChange = "kindness",
	confidenceChange = "confidence",
	disciplineChange = "discipline",
	creativityChange = "creativity",
	streetSmartChange = "streetSmart",
	educationChange = "education",
	reputationChange = "reputation",
}

-- Начать диалог: вернуть приветствие NPC (с учётом памяти/репутации)
local function onStartDialogue(player: Player, npcId: string)
	local npc = NPCRegistry.get(npcId)
	if not npc then
		return { reply = Localization.get("NPC_FALLBACK_BUSY", SessionManager.getLocale(player)) }
	end

	local greeting = npc.greeting

	-- взрослые NPC реагируют на прошлое (простые примеры памяти)
	if npcId == "employer" then
		local rep = (SessionManager.get(player) or {}).reputation or 0
		if rep >= 7 then
			greeting = "Я слышал, ты ответственный. Могу дать тебе шанс."
		elseif rep <= 3 then
			greeting = "Не уверен, что тебе можно доверять. Начнёшь с самых простых заданий."
		end
	elseif npcId == "neighbor" and RelationshipManager.hasMemory(player, "neighbor", "found_cat") then
		greeting = "Я тебя помню. Ты когда-то помог мне найти кота. Рад видеть, что ты вырос нормальным человеком."
	end

	return { npcName = npc.name, reply = greeting }
end

-- Игрок прислал свободный текст
local function onSendDialogue(player: Player, npcId: string, playerText: string)
	local locale = SessionManager.getLocale(player)
	local life = SessionManager.get(player)
	local npc = NPCRegistry.get(npcId)

	if not life or not npc then
		return { reply = Localization.get("NPC_FALLBACK_BUSY", locale) }
	end

	-- базовая проверка текста
	if type(playerText) ~= "string" or #playerText == 0 or #playerText > 300 then
		return { reply = Localization.get("NPC_FALLBACK_UNCLEAR", locale) }
	end

	-- попытка абуза экономики через текст -> игнорируем награды, нейтральный ответ
	local abuse = SafetyFilter.isEconomyAbuse(playerText)

	-- собираем контекст для скрытого backend
	local ctx = {
		userId = player.UserId,
		playerMessage = playerText,
		age = life.age,
		lifeStage = life.lifeStage,
		difficulty = life.difficulty,
		family = life.family,
		stats = life.stats,
		npcId = npcId,
		npcPersonality = npc.personality,
		scene = life.lifeStage,
		memories = RelationshipManager.getMemories(player, npcId),
		allowedQuests = npc.allowedQuests,
		locale = locale,
	}

	local result = DialogueBackend.process(ctx)

	-- если backend пометил небезопасно или это абуз — не применяем изменения
	local applyChanges = result.safe and not abuse

	if applyChanges then
		-- применяем изменения характеристик (StatsManager сам обрежет до лимитов)
		for field, statName in pairs(STAT_FIELDS) do
			local delta = result[field]
			if type(delta) == "number" and delta ~= 0 then
				StatsManager.applyChange(player, statName, delta)
			end
		end
		-- отношения
		if type(result.relationshipChange) == "number" and result.relationshipChange ~= 0 then
			RelationshipManager.applyChange(player, npcId, result.relationshipChange)
		end
		-- память
		if result.memoryTag and result.memoryTag ~= "none" then
			RelationshipManager.addMemory(player, npcId, result.memoryTag)
		end
	end

	-- чистим реплику от запрещённых слов и фильтруем по правилам Roblox
	local reply = SafetyFilter.cleanNpcReply(result.npcReply or "")
	reply = SafetyFilter.filterForPlayer(reply, player.UserId, player)

	if abuse then
		-- мягко уводим в сторону, ничего не выдаём
		reply = Localization.get("NPC_FALLBACK_GENERIC", locale)
	end

	-- сохраним прогресс жизни
	SessionManager.save(player)

	-- игрок видит ТОЛЬКО реплику (плюс, опционально, имя NPC)
	return { npcName = npc.name, reply = reply }
end

function DialogueServer.init()
	Remotes.get("StartDialogue").OnServerInvoke = function(player, npcId)
		return onStartDialogue(player, npcId)
	end
	Remotes.get("SendDialogue").OnServerInvoke = function(player, npcId, text)
		return onSendDialogue(player, npcId, text)
	end
end

return DialogueServer
