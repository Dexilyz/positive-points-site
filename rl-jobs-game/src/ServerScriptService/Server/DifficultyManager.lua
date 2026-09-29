--[[
	DifficultyManager.lua
	Проверка доступности сложностей и подготовка данных для UI.

	Easy и Medium — доступны сразу.
	Hard — заблокирован, пока не открыт на аккаунте (через total earned в Medium).
	Impossible — "Скоро", в первой версии не играбелен.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Shared.Config)

local EconomyManager = require(script.Parent.EconomyManager)

local DifficultyManager = {}

-- Можно ли начать жизнь на этой сложности
function DifficultyManager.isPlayable(userId: number, difficultyId: string): boolean
	local def = Config.Difficulties[difficultyId]
	if not def then return false end
	if def.comingSoon then
		return false -- Impossible пока нельзя
	end
	if not def.locked then
		return true -- Easy / Medium
	end
	if difficultyId == "Hard" then
		return EconomyManager.isHardUnlocked(userId)
	end
	return false
end

-- Данные о сложностях для меню выбора
function DifficultyManager.getMenuData(userId: number)
	local hardUnlocked = EconomyManager.isHardUnlocked(userId)
	return {
		{ id = "Easy", available = true, locked = false, comingSoon = false },
		{ id = "Medium", available = true, locked = false, comingSoon = false },
		{ id = "Hard", available = hardUnlocked, locked = not hardUnlocked, comingSoon = false },
		{ id = "Impossible", available = false, locked = true, comingSoon = true },
	}
end

return DifficultyManager
