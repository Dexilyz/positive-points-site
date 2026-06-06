--[[
	TipManager.lua
	Чаевые работнику (официанту, повару, курьеру, позже таксисту).
	Только игровые деньги. Серверная проверка суммы и баланса.

	Чаевые:
	- списываются у клиента;
	- начисляются работнику как доход (растёт total earned работника);
	- немного поднимают репутацию работника.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local Config = require(ReplicatedStorage.Shared.Config)
local Localization = require(ReplicatedStorage.Shared.Localization)
local Remotes = require(ReplicatedStorage.Shared.Remotes)

local EconomyManager = require(script.Parent.EconomyManager)
local SessionManager = require(script.Parent.SessionManager)
local StatsManager = require(script.Parent.StatsManager)

local TipManager = {}

local function giveTip(client: Player, workerUserId: number, amount: number)
	local locale = SessionManager.getLocale(client)
	amount = math.floor(tonumber(amount) or 0)

	-- лимит на "другую сумму"
	if amount <= 0 or amount > Config.Tips.maxCustom then
		return { ok = false, message = "Недопустимая сумма чаевых." }
	end

	local worker = Players:GetPlayerByUserId(workerUserId)
	if not worker or worker == client or not SessionManager.get(worker) then
		return { ok = false, message = "Работник недоступен." }
	end

	local spent = EconomyManager.spend(client, amount, "tip_out")
	if not spent then
		return { ok = false, message = Localization.get("TRANSFER_FAIL_FUNDS", locale) }
	end

	EconomyManager.earn(worker, amount, "tip_in")
	-- чаевые слегка поднимают репутацию работника
	StatsManager.applyChange(worker, "reputation", 1)

	return { ok = true, message = Localization.get("TIP_DONE", locale), amount = amount }
end

function TipManager.init()
	Remotes.get("GiveTip").OnServerInvoke = function(client, workerUserId, amount)
		return giveTip(client, workerUserId, amount)
	end
end

return TipManager
