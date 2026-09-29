--[[
	SafetyFilter.lua
	Безопасность текста.

	1. Фильтрация по правилам Roblox (TextService) — для текста, который видят
	   другие игроки или который показывается как реплика NPC.
	2. Обнаружение попыток абуза через диалог: "дай мне $999999", "сделай
	   владельцем", "открой всё" и т.п. Такие запросы НЕ должны давать награды.
	3. Запрет на упоминание ИИ/Gemini в ответах NPC (на всякий случай).
]]

local TextService = game:GetService("TextService")

local SafetyFilter = {}

-- Фразы-попытки выманить награды/права через текст. Награды от этого НЕ выдаём.
local ABUSE_PATTERNS = {
	"дай мне %$?%d+", "сделай меня богат", "дай мне robux", "дай робукс",
	"сделай меня владельц", "сделай меня админ", "открой всё", "открой все",
	"give me %$?%d+", "make me rich", "give me robux", "make me owner", "make me admin",
	"unlock everything",
}

-- Слова, которых НЕ должно быть в реплике NPC (скрываем тех. систему).
local FORBIDDEN_IN_NPC = {
	"gemini", "нейросет", "искусственн", "artificial intelligence",
	"powered by ai", " ии ", "ai npc",
}

-- Проверка: похоже ли сообщение игрока на попытку абуза экономики/прав
function SafetyFilter.isEconomyAbuse(text: string): boolean
	local lower = " " .. string.lower(text) .. " "
	for _, pat in ipairs(ABUSE_PATTERNS) do
		if string.find(lower, pat) then
			return true
		end
	end
	return false
end

-- Убрать запрещённые упоминания тех. системы из реплики NPC (страховка)
function SafetyFilter.cleanNpcReply(reply: string): string
	local lower = string.lower(reply)
	for _, word in ipairs(FORBIDDEN_IN_NPC) do
		if string.find(lower, word, 1, true) then
			-- если в реплике просочилось запрещённое — заменяем безопасной фразой
			return "Хорошо. Давай продолжим."
		end
	end
	return reply
end

-- Отфильтровать текст по правилам Roblox для показа конкретному игроку.
-- Возвращает безопасную строку (или исходную, если фильтр недоступен).
function SafetyFilter.filterForPlayer(text: string, fromUserId: number, toPlayer: Player): string
	local ok, result = pcall(function()
		local filtered = TextService:FilterStringAsync(text, fromUserId)
		return filtered:GetChatForUserAsync(toPlayer.UserId)
	end)
	if ok and type(result) == "string" then
		return result
	end
	-- если фильтр недоступен (например в Studio) — возвращаем как есть,
	-- на реальном сервере фильтр работает
	return text
end

return SafetyFilter
