--[[
	DataManager.lua
	Хранение и загрузка данных игрока.

	Две структуры:
	1. Данные АККАУНТА (один на игрока): открыт ли Hard, прогресс total earned в Medium.
	   Открытие Hard действует на весь аккаунт и на будущие жизни.
	2. Данные СЛОТА (5 слотов): каждая жизнь отдельно.

	ВАЖНО: всё хранится на сервере. Клиент НЕ присылает значения денег и т.п.

	В Roblox Studio DataStore может не работать без включённого
	"Enable Studio Access to API Services". Поэтому есть память-fallback:
	данные не теряются в рамках сессии, но не сохраняются между запусками
	Studio. На реальном сервере используется настоящий DataStore.
]]

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local Config = require(game:GetService("ReplicatedStorage").Shared.Config)

local DataManager = {}

local ACCOUNT_STORE = "RlJobs_Account_v1"
local SLOTS_STORE = "RlJobs_Slots_v1"

-- Кэш в памяти на время сессии (ключ = userId)
local accountCache: { [number]: any } = {}
local slotsCache: { [number]: any } = {}

local accountStore, slotsStore
local datastoreOk = pcall(function()
	accountStore = DataStoreService:GetDataStore(ACCOUNT_STORE)
	slotsStore = DataStoreService:GetDataStore(SLOTS_STORE)
end)

--========================================================================
-- ШАБЛОНЫ ДАННЫХ
--========================================================================
local function newAccount()
	return {
		hardUnlocked = false,
		-- сколько всего заработано в Medium-жизнях суммарно (для открытия Hard)
		mediumTotalEarned = 0,
	}
end

-- Пустой набор слотов: 5 штук, каждый = nil (пусто)
local function newSlots()
	return { false, false, false, false, false } -- false = слот пуст
end

-- Шаблон новой жизни
function DataManager.newLifeData(name: string, difficulty: string, familyId: string, startMoney: number, stats)
	return {
		name = name,
		age = 4,
		difficulty = difficulty,
		family = familyId,

		money = startMoney,
		totalEarned = 0,
		totalSpent = 0,

		job = false,        -- текущая профессия (id) или false
		jobLevel = 1,
		jobXp = 0,

		stats = stats,      -- характеристики (таблица)
		reputation = stats.reputation or Config.Stats.reputation.default,

		relationships = {}, -- npcId -> { value = number, memories = { tag, ... } }
		childhoodChoices = {},
		memories = {},      -- общие важные воспоминания

		items = {},
		home = familyId,    -- стартовый дом зависит от семьи
		unlockedJobs = { "Courier", "RestaurantWorker" },
		completedQuests = {},

		lifeStage = "child_4_6", -- текущий этап
		progress = 0,
	}
end

--========================================================================
-- АККАУНТ
--========================================================================
function DataManager.getAccount(userId: number)
	if accountCache[userId] then
		return accountCache[userId]
	end
	local data = newAccount()
	if datastoreOk and accountStore then
		local ok, saved = pcall(function()
			return accountStore:GetAsync(userId)
		end)
		if ok and type(saved) == "table" then
			for k, v in pairs(saved) do
				data[k] = v
			end
		end
	end
	accountCache[userId] = data
	return data
end

function DataManager.saveAccount(userId: number)
	local data = accountCache[userId]
	if not data then return end
	if datastoreOk and accountStore then
		pcall(function()
			accountStore:SetAsync(userId, data)
		end)
	end
end

--========================================================================
-- СЛОТЫ
--========================================================================
function DataManager.getSlots(userId: number)
	if slotsCache[userId] then
		return slotsCache[userId]
	end
	local data = newSlots()
	if datastoreOk and slotsStore then
		local ok, saved = pcall(function()
			return slotsStore:GetAsync(userId)
		end)
		if ok and type(saved) == "table" then
			data = saved
		end
	end
	slotsCache[userId] = data
	return data
end

function DataManager.saveSlots(userId: number)
	local data = slotsCache[userId]
	if not data then return end
	if datastoreOk and slotsStore then
		pcall(function()
			slotsStore:SetAsync(userId, data)
		end)
	end
end

-- Записать жизнь в конкретный слот (1..5). Возвращает true/false.
function DataManager.setSlot(userId: number, slotIndex: number, lifeData)
	if slotIndex < 1 or slotIndex > Config.LIFE_SLOTS then
		return false, "Неверный номер слота"
	end
	local slots = DataManager.getSlots(userId)
	slots[slotIndex] = lifeData
	DataManager.saveSlots(userId)
	return true
end

function DataManager.getSlot(userId: number, slotIndex: number)
	local slots = DataManager.getSlots(userId)
	return slots[slotIndex]
end

-- Краткая сводка для UI выбора жизни
function DataManager.getSlotsSummary(userId: number)
	local slots = DataManager.getSlots(userId)
	local summary = {}
	for i = 1, Config.LIFE_SLOTS do
		local s = slots[i]
		if s and type(s) == "table" then
			summary[i] = {
				empty = false,
				name = s.name,
				age = s.age,
				difficulty = s.difficulty,
				family = s.family,
				job = s.job,
				money = s.money,
				reputation = s.reputation,
			}
		else
			summary[i] = { empty = true }
		end
	end
	return summary
end

--========================================================================
-- ЖИЗНЕННЫЙ ЦИКЛ
--========================================================================
Players.PlayerRemoving:Connect(function(player)
	local uid = player.UserId
	DataManager.saveAccount(uid)
	DataManager.saveSlots(uid)
	accountCache[uid] = nil
	slotsCache[uid] = nil
end)

game:BindToClose(function()
	for _, player in ipairs(Players:GetPlayers()) do
		DataManager.saveAccount(player.UserId)
		DataManager.saveSlots(player.UserId)
	end
end)

return DataManager
