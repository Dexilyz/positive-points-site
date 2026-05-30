--[[
	EconomyManager.lua
	Все деньги и опыт проходят ТОЛЬКО через этот модуль (на сервере).

	Ключевые правила:
	- total earned (всего заработано) растёт только при ДОХОДЕ, не при балансе.
	- Если игрок заработал >= $1,000,000 всего в Medium — открываем Hard
	  на весь АККАУНТ (и для будущих жизней).
	- Если игрок потом потратит деньги — Hard всё равно остаётся открытым,
	  потому что считаем именно заработанное, а не текущий баланс.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Shared.Config)

local DataManager = require(script.Parent.DataManager)
local SessionManager = require(script.Parent.SessionManager)

local EconomyManager = {}

-- Начислить доход (зарплата, чаевые, перевод полученный и т.п.)
-- reason — для истории/отладки.
function EconomyManager.earn(player: Player, amount: number, reason: string?)
	if type(amount) ~= "number" or amount <= 0 then return false end
	local life = SessionManager.get(player)
	if not life then return false end

	life.money += amount
	life.totalEarned += amount

	-- Прогресс к открытию Hard считается только в Medium
	if life.difficulty == "Medium" then
		local account = DataManager.getAccount(player.UserId)
		account.mediumTotalEarned += amount
		if not account.hardUnlocked and account.mediumTotalEarned >= Config.HARD_UNLOCK_AMOUNT then
			account.hardUnlocked = true
			DataManager.saveAccount(player.UserId)
			-- здесь позже можно показать уведомление "Открыт Сложный режим"
		end
	end

	SessionManager.pushState(player)
	return true
end

-- Списать деньги (покупка, комиссия, отправленный перевод).
-- Возвращает true если хватило денег.
function EconomyManager.spend(player: Player, amount: number, reason: string?)
	if type(amount) ~= "number" or amount <= 0 then return false end
	local life = SessionManager.get(player)
	if not life then return false end
	if life.money < amount then
		return false, "not_enough"
	end
	life.money -= amount
	life.totalSpent += amount
	SessionManager.pushState(player)
	return true
end

function EconomyManager.getMoney(player: Player): number
	local life = SessionManager.get(player)
	return life and life.money or 0
end

-- Открыт ли Hard на аккаунте
function EconomyManager.isHardUnlocked(userId: number): boolean
	local account = DataManager.getAccount(userId)
	return account.hardUnlocked == true
end

-- Начислить опыт текущей профессии
function EconomyManager.addJobXp(player: Player, xp: number)
	local life = SessionManager.get(player)
	if not life or not life.job then return end
	life.jobXp += xp
	-- простая формула повышения уровня
	local needed = life.jobLevel * 100
	while life.jobXp >= needed do
		life.jobXp -= needed
		life.jobLevel += 1
		needed = life.jobLevel * 100
	end
	SessionManager.pushState(player)
end

return EconomyManager
