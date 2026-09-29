--[[
	SessionManager.lua
	Держит "активную жизнь" каждого игрока, пока он играет.

	Когда игрок загружает/создаёт жизнь — её данные кладутся сюда.
	Другие менеджеры (экономика, диалоги, работа) меняют данные через сессию,
	а сервер периодически и при выходе сохраняет их в нужный слот.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Remotes = require(ReplicatedStorage.Shared.Remotes)

local DataManager = require(script.Parent.DataManager)

local SessionManager = {}

-- userId -> { slotIndex = number, life = table, locale = string }
local sessions: { [number]: any } = {}

function SessionManager.start(player: Player, slotIndex: number, lifeData, locale: string)
	sessions[player.UserId] = {
		slotIndex = slotIndex,
		life = lifeData,
		locale = locale or "ru",
	}
	SessionManager.pushState(player)
end

function SessionManager.get(player: Player)
	local s = sessions[player.UserId]
	return s and s.life or nil
end

function SessionManager.getLocale(player: Player): string
	local s = sessions[player.UserId]
	return s and s.locale or "ru"
end

function SessionManager.getSlotIndex(player: Player): number?
	local s = sessions[player.UserId]
	return s and s.slotIndex or nil
end

-- Сохранить активную жизнь обратно в её слот
function SessionManager.save(player: Player)
	local s = sessions[player.UserId]
	if not s then return end
	DataManager.setSlot(player.UserId, s.slotIndex, s.life)
end

-- Отправить клиенту актуальное состояние (деньги, характеристики и т.п.)
function SessionManager.pushState(player: Player)
	local life = SessionManager.get(player)
	if not life then return end
	local payload = {
		name = life.name,
		age = life.age,
		money = life.money,
		totalEarned = life.totalEarned,
		stats = life.stats,
		reputation = life.reputation,
		job = life.job,
		jobLevel = life.jobLevel,
		jobXp = life.jobXp,
		lifeStage = life.lifeStage,
	}
	Remotes.get("StateUpdate"):FireClient(player, payload)
end

function SessionManager.stop(player: Player)
	SessionManager.save(player)
	sessions[player.UserId] = nil
end

return SessionManager
