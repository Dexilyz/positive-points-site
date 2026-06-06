--[[
	TransferManager.lua
	Перевод ИГРОВЫХ денег между игроками. Только внутриигровая валюта, не Robux.

	Серверные проверки:
	- хватает ли денег (с учётом комиссии);
	- сумма >= минимума и <= дневного лимита;
	- кулдаун против спама;
	- возраст персонажа >= минимального;
	- получатель существует и это не сам игрок.
	Клиент НЕ решает итоговые суммы.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local Config = require(ReplicatedStorage.Shared.Config)
local Localization = require(ReplicatedStorage.Shared.Localization)
local Remotes = require(ReplicatedStorage.Shared.Remotes)

local EconomyManager = require(script.Parent.EconomyManager)
local SessionManager = require(script.Parent.SessionManager)

local TransferManager = {}

-- userId -> { lastTime = number, todayTotal = number, dayStamp = number }
local limits: { [number]: any } = {}

local function getLimit(userId)
	local today = math.floor(os.time() / 86400)
	local l = limits[userId]
	if not l or l.dayStamp ~= today then
		l = { lastTime = 0, todayTotal = 0, dayStamp = today }
		limits[userId] = l
	end
	return l
end

-- Вычислить комиссию
local function feeFor(amount: number): number
	return math.floor(amount * Config.Transfer.bankFeePercent)
end

-- amount — сумма, которую ПОЛУЧИТ адресат. Комиссия берётся сверху с отправителя.
local function doTransfer(sender: Player, targetUserId: number, amount: number)
	local locale = SessionManager.getLocale(sender)
	local senderLife = SessionManager.get(sender)
	if not senderLife then
		return { ok = false, message = "Сначала начни жизнь." }
	end

	amount = math.floor(tonumber(amount) or 0)
	if amount < Config.Transfer.minAmount then
		return { ok = false, message = "Слишком маленькая сумма." }
	end

	-- возраст персонажа
	if (senderLife.age or 0) < Config.Transfer.minCharacterAge then
		return { ok = false, message = Localization.get("TRANSFER_FAIL_AGE", locale) }
	end

	-- кулдаун
	local lim = getLimit(sender.UserId)
	if os.time() - lim.lastTime < Config.Transfer.cooldownSeconds then
		return { ok = false, message = Localization.get("TRANSFER_FAIL_COOLDOWN", locale) }
	end

	-- дневной лимит
	if lim.todayTotal + amount > Config.Transfer.dailyLimit then
		return { ok = false, message = Localization.get("TRANSFER_FAIL_LIMIT", locale) }
	end

	local fee = feeFor(amount)
	local totalCost = amount + fee

	-- получатель должен быть онлайн и с активной жизнью (для MVP)
	local target = Players:GetPlayerByUserId(targetUserId)
	if not target or target == sender or not SessionManager.get(target) then
		return { ok = false, message = "Получатель недоступен." }
	end

	-- списываем у отправителя (вместе с комиссией)
	local spent = EconomyManager.spend(sender, totalCost, "transfer_out")
	if not spent then
		return { ok = false, message = Localization.get("TRANSFER_FAIL_FUNDS", locale) }
	end

	-- начисляем получателю (комиссия остаётся "банку" — просто сгорает)
	EconomyManager.earn(target, amount, "transfer_in")

	-- обновляем лимиты
	lim.lastTime = os.time()
	lim.todayTotal += amount

	return {
		ok = true,
		message = Localization.get("TRANSFER_DONE", locale),
		amount = amount,
		fee = fee,
		total = totalCost,
		to = target.Name,
	}
end

function TransferManager.init()
	-- клиент присылает {targetUserId, amount}; сервер сам считает комиссию
	Remotes.get("RequestTransfer").OnServerInvoke = function(sender, targetUserId, amount)
		return doTransfer(sender, targetUserId, amount)
	end
end

-- Утилита для UI: показать комиссию заранее
function TransferManager.previewFee(amount: number)
	amount = math.floor(tonumber(amount) or 0)
	local fee = feeFor(amount)
	return { amount = amount, fee = fee, total = amount + fee }
end

return TransferManager
