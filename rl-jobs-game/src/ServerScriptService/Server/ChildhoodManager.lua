--[[
	ChildhoodManager.lua
	Детство как ПРОЛОГ жизни (первые 20–30 минут), а не отдельный туториал.
	Детские выборы реально влияют на взрослую жизнь.

	Возраст идёт не в реальном времени, а ГЛАВАМИ/СЦЕНАМИ.
	Этапы:
		child_4_6   — дом, двор, первые NPC, первые выборы
		child_7_10  — школа, учитель, одноклассники
		child_11_14 — интересы и первые навыки
		teen_15_18  — подработка, выбор направления
		adult       — взрослая жизнь
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Remotes = require(ReplicatedStorage.Shared.Remotes)
local Localization = require(ReplicatedStorage.Shared.Localization)

local SessionManager = require(script.Parent.SessionManager)

local ChildhoodManager = {}

-- Порядок этапов и возраст в начале каждого
local STAGES = {
	{ id = "child_4_6", age = 4, npcs = { "parent", "neighbor", "friend" } },
	{ id = "child_7_10", age = 7, npcs = { "teacher", "classmate" } },
	{ id = "child_11_14", age = 11, npcs = { "neighbor", "friend" } },
	{ id = "teen_15_18", age = 15, npcs = { "parent", "restaurant_manager" } },
	{ id = "adult", age = 18, npcs = {} },
}

local function stageIndex(stageId: string): number
	for i, s in ipairs(STAGES) do
		if s.id == stageId then return i end
	end
	return 1
end

-- Отправить клиенту текущую сцену детства
function ChildhoodManager.pushScene(player: Player)
	local life = SessionManager.get(player)
	if not life then return end
	local idx = stageIndex(life.lifeStage)
	local stage = STAGES[idx]

	Remotes.get("ShowChildhoodScene"):FireClient(player, {
		stageId = stage.id,
		age = life.age,
		npcs = stage.npcs,
		isAdult = stage.id == "adult",
	})
end

-- Перейти к следующему этапу (вызывается, когда игрок прошёл сцены этапа)
function ChildhoodManager.advanceStage(player: Player)
	local life = SessionManager.get(player)
	if not life then return end

	local idx = stageIndex(life.lifeStage)
	if idx >= #STAGES then
		return -- уже взрослый
	end

	local nextStage = STAGES[idx + 1]
	life.lifeStage = nextStage.id
	life.age = nextStage.age
	life.progress = idx
	SessionManager.save(player)
	SessionManager.pushState(player)

	if nextStage.id == "adult" then
		ChildhoodManager.enterAdultLife(player)
	else
		ChildhoodManager.pushScene(player)
	end
end

-- Какие первые работы доступны (зависит от детства)
function ChildhoodManager.computeAvailableJobs(life)
	local jobs = { "Courier", "RestaurantWorker" } -- базовые всегда доступны
	-- пример влияния детства: высокая дисциплина/образование откроет больше позже
	return jobs
end

-- Итог детства + вход во взрослую жизнь
function ChildhoodManager.enterAdultLife(player: Player)
	local life = SessionManager.get(player)
	if not life then return end

	local availableJobs = ChildhoodManager.computeAvailableJobs(life)
	life.unlockedJobs = availableJobs
	SessionManager.save(player)

	Remotes.get("ShowChildhoodSummary"):FireClient(player, {
		family = life.family,
		stats = life.stats,
		reputation = life.reputation,
		memories = life.memories,
		availableJobs = availableJobs,
	})
end

-- Начать детство для свежесозданной жизни
function ChildhoodManager.begin(player: Player)
	local life = SessionManager.get(player)
	if not life then return end
	life.lifeStage = "child_4_6"
	life.age = 4
	SessionManager.pushState(player)
	ChildhoodManager.pushScene(player)
end

function ChildhoodManager.init()
	-- клиент сообщает, что закончил сцены текущего этапа -> идём дальше
	Remotes.get("AdvanceStage").OnServerEvent:Connect(function(player)
		local life = SessionManager.get(player)
		if life and life.lifeStage ~= "adult" then
			ChildhoodManager.advanceStage(player)
		end
	end)
end

ChildhoodManager.STAGES = STAGES
return ChildhoodManager
