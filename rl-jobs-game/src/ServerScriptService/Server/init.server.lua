--[[
	init.server.lua
	ГЛАВНЫЙ серверный скрипт. Запускается автоматически при старте сервера.
	Здесь мы:
	- создаём сетевые каналы (Remotes);
	- подключаем обработчики меню/слотов/создания жизни;
	- инициализируем все менеджеры (диалоги, экономика, ресторан, курьер...).
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Remotes = require(ReplicatedStorage.Shared.Remotes)

-- менеджеры
local DataManager = require(script.DataManager)
local SessionManager = require(script.SessionManager)
local DifficultyManager = require(script.DifficultyManager)
local FamilyManager = require(script.FamilyManager)
local StatsManager = require(script.StatsManager)
local EconomyManager = require(script.EconomyManager)
local DialogueServer = require(script.DialogueServer)
local TransferManager = require(script.TransferManager)
local TipManager = require(script.TipManager)
local ChildhoodManager = require(script.ChildhoodManager)
local RestaurantManager = require(script.RestaurantManager)
local CourierManager = require(script.CourierManager)

-- 1) создаём каналы
Remotes.init()

--========================================================================
-- МЕНЮ И СОХРАНЕНИЯ
--========================================================================

-- Список 5 слотов для UI выбора жизни
Remotes.get("GetLifeSlots").OnServerInvoke = function(player)
	return DataManager.getSlotsSummary(player.UserId)
end

-- Информация об аккаунте (открыт ли Hard и т.п.)
Remotes.get("GetAccountInfo").OnServerInvoke = function(player)
	return {
		hardUnlocked = EconomyManager.isHardUnlocked(player.UserId),
		difficulties = DifficultyManager.getMenuData(player.UserId),
		gameName = Config.GAME_NAME,
	}
end

-- Создать новую жизнь в слоте
Remotes.get("CreateLife").OnServerInvoke = function(player, slotIndex, difficultyId, name)
	-- проверки
	if type(slotIndex) ~= "number" or slotIndex < 1 or slotIndex > Config.LIFE_SLOTS then
		return { ok = false, message = "Неверный слот." }
	end
	if not Config.Difficulties[difficultyId] then
		return { ok = false, message = "Неверная сложность." }
	end
	if not DifficultyManager.isPlayable(player.UserId, difficultyId) then
		return { ok = false, message = "Эта сложность пока недоступна." }
	end

	name = (type(name) == "string" and #name > 0) and string.sub(name, 1, 20) or "Игрок"

	-- случайная семья по сложности
	local familyId = FamilyManager.rollFamily(difficultyId)
	local startMoney = FamilyManager.getStartMoney(difficultyId, familyId)
	local stats = StatsManager.createStats(FamilyManager.getStatBonus(familyId))

	local life = DataManager.newLifeData(name, difficultyId, familyId, startMoney, stats)
	DataManager.setSlot(player.UserId, slotIndex, life)

	-- стартуем сессию и детство
	local locale = player.LocaleId -- язык аккаунта Roblox
	SessionManager.start(player, slotIndex, life, require(ReplicatedStorage.Shared.Localization).normalize(locale))
	ChildhoodManager.begin(player)

	return { ok = true, family = familyId }
end

-- Загрузить существующую жизнь
Remotes.get("LoadLife").OnServerInvoke = function(player, slotIndex)
	local life = DataManager.getSlot(player.UserId, slotIndex)
	if not life or type(life) ~= "table" then
		return { ok = false, message = "Слот пуст." }
	end
	local locale = require(ReplicatedStorage.Shared.Localization).normalize(player.LocaleId)
	SessionManager.start(player, slotIndex, life, locale)

	-- продолжаем с того места, где остановились
	if life.lifeStage == "adult" then
		-- взрослая жизнь: ничего показывать не надо, состояние уже отправлено
	else
		ChildhoodManager.pushScene(player)
	end
	return { ok = true, lifeStage = life.lifeStage }
end

--========================================================================
-- ИНИЦИАЛИЗАЦИЯ МЕНЕДЖЕРОВ
--========================================================================
DialogueServer.init()
TransferManager.init()
TipManager.init()
ChildhoodManager.init()
RestaurantManager.init()
CourierManager.init()

-- периодическое автосохранение активных жизней
task.spawn(function()
	while true do
		task.wait(60)
		for _, player in ipairs(game:GetService("Players"):GetPlayers()) do
			SessionManager.save(player)
		end
	end
end)

print("[Rl Jobs] Сервер запущен:", Config.GAME_NAME)
