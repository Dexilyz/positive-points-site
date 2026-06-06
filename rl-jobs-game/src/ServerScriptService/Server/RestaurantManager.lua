--[[
	RestaurantManager.lua
	Ресторан — первая связанная система профессий.

	Роли (слоты) для MVP: cashier (кассир), cook (повар), courier (курьер).
	Правило живого города:
	- По умолчанию каждую роль выполняет NPC -> город работает даже без игроков.
	- Игрок может ЗАНЯТЬ роль (TakeJob) -> NPC уходит со смены.
	- Игрок уходит/выходит из игры (LeaveJob) -> NPC возвращается.
	- Нельзя выгнать другого игрока: если слот занят игроком — занять нельзя.

	Поток заказа (упрощённо для MVP):
	1. Клиент (игрок или NPC) создаёт заказ.
	2. Заказ идёт игроку-повару, если он есть; иначе готовит NPC.
	3. Если доставка — заказ передаётся курьеру (см. CourierManager).
	4. Выполнение даёт работнику деньги и опыт (через EconomyManager).
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local Config = require(ReplicatedStorage.Shared.Config)
local Remotes = require(ReplicatedStorage.Shared.Remotes)

local EconomyManager = require(script.Parent.EconomyManager)
local SessionManager = require(script.Parent.SessionManager)

local RestaurantManager = {}

-- Один ресторан на сервер для MVP. Слот: занят игроком (UserId) или NPC (false).
local slots = {
	cashier = false, -- false = работает NPC
	cook = false,
	courier = false,
}

local ROLE_TO_JOB = {
	cashier = "RestaurantWorker",
	cook = "Cook",
	courier = "Courier",
}

-- Активные заказы: orderId -> { ... }
local orders = {}
local nextOrderId = 1

-- Кто сейчас работает на роли (игрок или NPC)?
function RestaurantManager.getWorker(role: string)
	local userId = slots[role]
	if userId then
		return Players:GetPlayerByUserId(userId)
	end
	return nil -- nil = NPC
end

-- Игрок пытается занять роль
local function takeJob(player: Player, role: string)
	if not slots[role] and slots[role] ~= false then
		return { ok = false, message = "Такой роли нет." }
	end
	if ROLE_TO_JOB[role] == nil then
		return { ok = false, message = "Такой роли нет." }
	end
	local life = SessionManager.get(player)
	if not life then
		return { ok = false, message = "Сначала начни жизнь." }
	end
	if life.lifeStage ~= "adult" then
		return { ok = false, message = "Сначала нужно повзрослеть." }
	end

	local current = slots[role]
	if current and current ~= player.UserId then
		-- занято другим игроком — нельзя выгнать
		return { ok = false, message = "Это место занято другим игроком. Выбери другую роль." }
	end

	-- освобождаем прошлую роль игрока, если была
	for r, uid in pairs(slots) do
		if uid == player.UserId then
			slots[r] = false
		end
	end

	slots[role] = player.UserId   -- игрок занял -> NPC ушёл со смены
	life.job = ROLE_TO_JOB[role]
	SessionManager.pushState(player)

	return { ok = true, role = role, job = life.job }
end

-- Игрок уходит со смены -> NPC возвращается
function RestaurantManager.leave(player: Player)
	for role, uid in pairs(slots) do
		if uid == player.UserId then
			slots[role] = false -- NPC снова работает
		end
	end
	local life = SessionManager.get(player)
	if life then
		life.job = false
		SessionManager.pushState(player)
	end
end

-- Создать заказ. customer — игрок-клиент (или nil для NPC-клиента).
-- delivery — нужна ли доставка курьером.
function RestaurantManager.createOrder(customer: Player?, delivery: boolean)
	local orderId = nextOrderId
	nextOrderId += 1
	orders[orderId] = {
		id = orderId,
		customerUserId = customer and customer.UserId or nil,
		delivery = delivery == true,
		stage = "cooking", -- cooking -> ready -> delivering -> done
	}

	-- уведомить игрока-повара, если он есть (иначе готовит NPC мгновенно)
	local cook = RestaurantManager.getWorker("cook")
	if cook then
		Remotes.get("OrderNotify"):FireClient(cook, { orderId = orderId, role = "cook" })
	else
		-- NPC-повар готовит автоматически
		RestaurantManager.completeStage(nil, orderId, "cook")
	end
	return orderId
end

-- Завершить этап заказа конкретным работником (или NPC, если worker = nil)
function RestaurantManager.completeStage(worker: Player?, orderId: number, role: string)
	local order = orders[orderId]
	if not order then return false end

	-- начисляем оплату/опыт игроку-работнику (NPC ничего не получает)
	if worker then
		local jobId = ROLE_TO_JOB[role]
		local jobDef = Config.Jobs[jobId]
		if jobDef then
			EconomyManager.earn(worker, jobDef.basePay, "job_" .. role)
			EconomyManager.addJobXp(worker, jobDef.baseXp)
		end
	end

	if role == "cook" then
		order.stage = order.delivery and "delivering" or "done"
		if order.delivery then
			-- передаём курьеру (игроку или NPC) через CourierManager
			local CourierManager = require(script.Parent.CourierManager)
			CourierManager.dispatch(orderId, order)
		else
			order.stage = "done"
			orders[orderId] = nil
		end
	elseif role == "courier" then
		order.stage = "done"
		orders[orderId] = nil
	end

	return true
end

function RestaurantManager.getOrder(orderId: number)
	return orders[orderId]
end

function RestaurantManager.init()
	Remotes.get("TakeJob").OnServerInvoke = function(player, role)
		return takeJob(player, role)
	end
	Remotes.get("LeaveJob").OnServerEvent:Connect(function(player)
		RestaurantManager.leave(player)
	end)
	Remotes.get("CompleteOrder").OnServerInvoke = function(player, orderId, role)
		-- проверяем, что игрок реально на этой роли (нельзя жульничать)
		if slots[role] ~= player.UserId then
			return { ok = false, message = "Ты не на этой смене." }
		end
		local ok = RestaurantManager.completeStage(player, orderId, role)
		return { ok = ok }
	end

	-- освободить слоты при выходе игрока -> NPC возвращается
	Players.PlayerRemoving:Connect(function(player)
		RestaurantManager.leave(player)
	end)
end

RestaurantManager.slots = slots
return RestaurantManager
