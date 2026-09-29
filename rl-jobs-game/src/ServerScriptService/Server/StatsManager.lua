--[[
	StatsManager.lua
	Изменение характеристик игрока в безопасных пределах.
	Диалоговая система НЕ может менять характеристики сильнее, чем разрешено.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Shared.Config)

local SessionManager = require(script.Parent.SessionManager)

local StatsManager = {}

-- Создать стартовый набор характеристик с учётом бонусов семьи
function StatsManager.createStats(familyBonus)
	local stats = {}
	for name, def in pairs(Config.Stats) do
		stats[name] = def.default
	end
	if familyBonus then
		for name, bonus in pairs(familyBonus) do
			if stats[name] then
				stats[name] = StatsManager.clamp(name, stats[name] + bonus)
			end
		end
	end
	return stats
end

function StatsManager.clamp(name: string, value: number): number
	local def = Config.Stats[name]
	if not def then return value end
	return math.clamp(value, def.min, def.max)
end

-- Применить изменение характеристики с защитой от абуза.
-- delta обрезается до MAX_STAT_CHANGE_PER_DIALOGUE (в обе стороны).
function StatsManager.applyChange(player: Player, statName: string, delta: number)
	local life = SessionManager.get(player)
	if not life or not Config.Stats[statName] then return end

	local maxStep = Config.MAX_STAT_CHANGE_PER_DIALOGUE
	delta = math.clamp(delta, -maxStep, maxStep)

	life.stats[statName] = StatsManager.clamp(statName, (life.stats[statName] or 0) + delta)

	-- репутация хранится отдельным полем для удобства UI
	if statName == "reputation" then
		life.reputation = life.stats.reputation
	end

	SessionManager.pushState(player)
end

return StatsManager
