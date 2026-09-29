--[[
	DialogueBackend.lua
	СКРЫТАЯ техническая система живых диалогов.

	ВАЖНО ДЛЯ ИГРОКА: он НИКОГДА не должен знать, что тут используется
	внешняя система генерации. Никаких слов "ИИ", "Gemini", "нейросеть".
	В коде имена нейтральные ("backend", "dialogue service").

	Что делает:
	- Принимает контекст диалога (сообщение игрока, возраст, сложность, семью,
	  характеристики, отношения, личность NPC, сцену, теги памяти, язык).
	- Возвращает СТРУКТУРИРОВАННЫЙ результат:
	      { npcReply, tone, kindnessChange, confidenceChange, ...,
	        relationshipChange, memoryTag, questSuggestion, safe }
	- Если внешний сервис недоступен/выключен/превысил лимит — отдаёт
	  локальный fallback на русском, и игра НЕ ломается.

	Экономику этот модуль НЕ трогает: деньги/опыт/Robux он не выдаёт.
	Возвращаемые числа потом ещё раз обрезаются сервером (StatsManager и т.д.).

	Настройка внешнего сервиса описана в docs/BACKEND.md.
	URL и ключ НЕ хранятся в этом файле и НЕ коммитятся в Git.
]]

local HttpService = game:GetService("HttpService")
local ServerStorage = game:GetService("ServerStorage")

local Localization = require(game:GetService("ReplicatedStorage").Shared.Localization)

local DialogueBackend = {}

--========================================================================
-- НАСТРОЙКА
--========================================================================
-- Конфиг лежит в ServerStorage (ModuleScript "BackendConfig"), НЕ в Git.
-- Шаблон см. docs/BACKEND.md. Если конфига нет — работаем только на fallback.
local function loadConfig()
	local cfg = ServerStorage:FindFirstChild("BackendConfig")
	if cfg and cfg:IsA("ModuleScript") then
		local ok, data = pcall(require, cfg)
		if ok and type(data) == "table" then
			return data
		end
	end
	return { enabled = false }
end

local config = loadConfig()

-- Кулдаун и кэш, чтобы не дёргать внешний сервис на каждую мелочь
local lastCallByUser: { [number]: number } = {}
local CALL_COOLDOWN = 1.5 -- секунд между вызовами на одного игрока
local cache: { [string]: any } = {}

--========================================================================
-- ЛОКАЛЬНАЯ ОЦЕНКА ТОНА (fallback без внешнего сервиса)
--========================================================================
-- Простой разбор по ключевым словам, чтобы детство работало даже офлайн.
local KIND_WORDS = { "помог", "добр", "извин", "спасибо", "пожалуйста", "вместе", "забот" }
local RUDE_WORDS = { "дурак", "ненавиж", "отстань", "заткн", "тупой", "глуп" }
local HONEST_WORDS = { "правд", "честно", "признаю", "виноват" }

local function containsAny(text: string, words): boolean
	local lower = string.lower(text)
	for _, w in ipairs(words) do
		if string.find(lower, w, 1, true) then
			return true
		end
	end
	return false
end

local function localTone(text: string)
	if containsAny(text, RUDE_WORDS) then
		return "rude", { kindnessChange = -2, relationshipChange = -3 }
	elseif containsAny(text, KIND_WORDS) then
		return "kind", { kindnessChange = 2, relationshipChange = 3 }
	elseif containsAny(text, HONEST_WORDS) then
		return "honest", { confidenceChange = 1, relationshipChange = 1 }
	end
	return "neutral", { relationshipChange = 1 }
end

-- Сформировать fallback-результат (всегда на русском, всегда безопасный)
local function buildFallback(ctx)
	local tone, changes = localTone(ctx.playerMessage or "")

	-- подобрать реплику NPC под тон
	local reply
	if tone == "kind" then
		reply = Localization.get("REACTION_LIKED", "ru")
	elseif tone == "rude" then
		reply = Localization.get("REACTION_REMEMBER", "ru")
	else
		reply = Localization.get("NPC_FALLBACK_GENERIC", "ru")
	end

	return {
		npcReply = reply,
		tone = tone,
		kindnessChange = changes.kindnessChange or 0,
		confidenceChange = changes.confidenceChange or 0,
		disciplineChange = 0,
		creativityChange = 0,
		streetSmartChange = 0,
		educationChange = 0,
		reputationChange = 0,
		relationshipChange = changes.relationshipChange or 0,
		memoryTag = "none",
		questSuggestion = "none",
		safe = true,
		source = "fallback",
	}
end

--========================================================================
-- ОСНОВНОЙ ВЫЗОВ
--========================================================================
-- ctx = {
--   userId, playerMessage, age, lifeStage, difficulty, family,
--   stats, npcId, npcPersonality, scene, memories (list), locale,
--   allowedQuests (list)
-- }
-- Возвращает структурированный результат (см. buildFallback для полей).
function DialogueBackend.process(ctx)
	-- 1. Если внешний сервис выключен — сразу fallback
	if not config.enabled or not config.url then
		return buildFallback(ctx)
	end

	-- 2. Кулдаун на пользователя
	local now = os.clock()
	local last = lastCallByUser[ctx.userId] or 0
	if now - last < CALL_COOLDOWN then
		return buildFallback(ctx)
	end
	lastCallByUser[ctx.userId] = now

	-- 3. Кэш по (npc + сцена + сообщение) — экономим лимиты
	local cacheKey = string.format("%s|%s|%s", ctx.npcId or "", ctx.scene or "", ctx.playerMessage or "")
	if cache[cacheKey] then
		return cache[cacheKey]
	end

	-- 4. Запрос к внешнему сервису. Контракт: сервис возвращает наш JSON.
	local requestBody = {
		locale = ctx.locale or "ru",
		message = ctx.playerMessage,
		age = ctx.age,
		stage = ctx.lifeStage,
		difficulty = ctx.difficulty,
		family = ctx.family,
		stats = ctx.stats,
		npcId = ctx.npcId,
		npcPersonality = ctx.npcPersonality,
		scene = ctx.scene,
		memories = ctx.memories,
		allowedQuests = ctx.allowedQuests,
	}

	local ok, response = pcall(function()
		return HttpService:RequestAsync({
			Url = config.url,
			Method = "POST",
			Headers = {
				["Content-Type"] = "application/json",
				["X-Api-Key"] = config.apiKey or "",
			},
			Body = HttpService:JSONEncode(requestBody),
		})
	end)

	if not ok or not response or not response.Success then
		return buildFallback(ctx)
	end

	local decoded
	local decodeOk = pcall(function()
		decoded = HttpService:JSONDecode(response.Body)
	end)

	if not decodeOk or type(decoded) ~= "table" or not decoded.npcReply then
		return buildFallback(ctx)
	end

	-- нормализуем поля (на случай отсутствующих)
	local result = {
		npcReply = tostring(decoded.npcReply),
		tone = decoded.tone or "neutral",
		kindnessChange = tonumber(decoded.kindnessChange) or 0,
		confidenceChange = tonumber(decoded.confidenceChange) or 0,
		disciplineChange = tonumber(decoded.disciplineChange) or 0,
		creativityChange = tonumber(decoded.creativityChange) or 0,
		streetSmartChange = tonumber(decoded.streetSmartChange) or 0,
		educationChange = tonumber(decoded.educationChange) or 0,
		reputationChange = tonumber(decoded.reputationChange) or 0,
		relationshipChange = tonumber(decoded.relationshipChange) or 0,
		memoryTag = decoded.memoryTag or "none",
		questSuggestion = decoded.questSuggestion or "none",
		safe = decoded.safe ~= false,
		source = "backend",
	}

	cache[cacheKey] = result
	return result
end

return DialogueBackend
