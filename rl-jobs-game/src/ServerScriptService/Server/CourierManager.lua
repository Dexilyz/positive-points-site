--[[
	CourierManager.lua
	Курьер — одна из первых взрослых профессий.

	Поток:
	1. Заказ на доставку приходит из ресторана (или напрямую).
	2. Если есть игрок-курьер — заказ отдаётся ему (он принимает и доставляет).
	3. Если игрока-курьера нет — доставляет NPC автоматически.
	4. Успешная доставка: деньги, опыт, репутация; клиент может дать чаевые.

	Сложность доставки влияет на таймер и оплату (через множители Config).
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local Config = require(ReplicatedStorage.Shared.Config)
local Remotes = require(ReplicatedStorage.Shared.Remotes)

local EconomyManager = require(script.Parent.EconomyManager)
local SessionManager = require(script.Parent.SessionManager)
local StatsManager = require(script.Parent.StatsManager)

local CourierManager = {}

-- активные доставки: orderId -> { courierUserId, order }
local deliveries = {}

-- Передать доставку курьеру (игроку или NPC)
function CourierManager.dispatch(orderId: number, order)
	local RestaurantManager = require(script.Parent.RestaurantManager)
	local courier = RestaurantManager.getWorker("courier")

	if courier then
		-- есть игрок-курьер: предлагаем ему заказ
		deliveries[orderId] = { courierUserId = courier.UserId, order = order }
		Remotes.get("OrderNotify"):FireClient(courier, {
			orderId = orderId,
			role = "courier",
			delivery = true,
		})
	else
		-- NPC-курьер доставляет сам (мгновенно для MVP)
		CourierManager.finishDelivery(nil, orderId)
	end
end

-- Завершить доставку. courier = игрок или nil (NPC).
function CourierManager.finishDelivery(courier: Player?, orderId: number)
	local entry = deliveries[orderId]

	if courier then
		local jobDef = Config.Jobs.Courier
		local life = SessionManager.get(courier)
		local mult = 1
		if life then
			local diff = Config.Difficulties[life.difficulty]
			-- в Hard платят чуть больше за сложность (уважение за успех)
			if diff and diff.id == "Hard" then mult = 1.3 end
		end
		EconomyManager.earn(courier, math.floor(jobDef.basePay * mult), "delivery")
		EconomyManager.addJobXp(courier, jobDef.baseXp)
		StatsManager.applyChange(courier, "reputation", 1)
	end

	deliveries[orderId] = nil
	return true
end

function CourierManager.init()
	-- курьер принимает заказ
	Remotes.get("AcceptOrder").OnServerInvoke = function(player, orderId)
		local entry = deliveries[orderId]
		if not entry or entry.courierUserId ~= player.UserId then
			return { ok = false, message = "Этот заказ не твой." }
		end
		return { ok = true, orderId = orderId, quest = Config and "deliver" }
	end

	-- Завершение доставки идёт через общий канал CompleteOrder с role="courier"
	-- (его обрабатывает RestaurantManager, который начисляет оплату/опыт).
	-- NPC-курьер доставляет автоматически через CourierManager.finishDelivery.
end

return CourierManager
