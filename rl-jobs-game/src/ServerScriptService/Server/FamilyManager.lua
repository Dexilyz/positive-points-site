--[[
	FamilyManager.lua
	Случайный выбор семьи в зависимости от сложности.

	Богатая семья — не автопобеда (есть минусы), бедная — не наказание (есть плюсы).
	Шансы типов семей задаются весами в Config.Difficulties[difficulty].familyWeights.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Shared.Config)

local FamilyManager = {}

local rng = Random.new()

-- Выбрать тип семьи по весам для данной сложности
function FamilyManager.rollFamily(difficultyId: string): string
	local def = Config.Difficulties[difficultyId]
	local weights = (def and def.familyWeights) or Config.Difficulties.Medium.familyWeights

	-- собираем суммарный вес
	local total = 0
	for _, w in pairs(weights) do
		total += w
	end
	if total <= 0 then
		return "Normal"
	end

	local pick = rng:NextNumber(0, total)
	local acc = 0
	for familyId, w in pairs(weights) do
		acc += w
		if pick <= acc then
			return familyId
		end
	end
	return "Normal"
end

-- Стартовые деньги с учётом семьи и множителя сложности
function FamilyManager.getStartMoney(difficultyId: string, familyId: string): number
	local family = Config.Families[familyId] or Config.Families.Normal
	local diff = Config.Difficulties[difficultyId] or Config.Difficulties.Medium
	local mult = diff.startMoneyMultiplier or 1
	return math.floor(family.startMoney * mult)
end

-- Бонусы характеристик от семьи
function FamilyManager.getStatBonus(familyId: string)
	local family = Config.Families[familyId] or Config.Families.Normal
	return family.statBonus or {}
end

return FamilyManager
