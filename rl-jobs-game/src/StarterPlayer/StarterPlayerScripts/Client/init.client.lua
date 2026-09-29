--[[
	init.client.lua
	ГЛАВНЫЙ клиентский скрипт. Запускается у каждого игрока.
	Связывает меню и игровой интерфейс, слушает сообщения сервера.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Remotes = require(ReplicatedStorage.Shared.Remotes)

local MenuController = require(script.MenuController)
local DialogueController = require(script.DialogueController)

local localPlayer = Players.LocalPlayer
local playerGui = localPlayer:WaitForChild("PlayerGui")

-- создаём интерфейсы
DialogueController.init(playerGui)
MenuController.init(playerGui, function()
	-- когда жизнь начата: прячем меню, показываем игровой HUD
	MenuController.hide()
	DialogueController.show()
end)

MenuController.show()

--========================================================================
-- СЛУШАЕМ СЕРВЕР
--========================================================================

-- обновление состояния (деньги, возраст, характеристики)
Remotes.get("StateUpdate").OnClientEvent:Connect(function(state)
	DialogueController.updateState(state)
end)

-- показать сцену детства
Remotes.get("ShowChildhoodScene").OnClientEvent:Connect(function(scene)
	DialogueController.show()
	MenuController.hide()
	DialogueController.showScene(scene)
end)

-- показать итог детства / переход во взрослую жизнь
Remotes.get("ShowChildhoodSummary").OnClientEvent:Connect(function(data)
	DialogueController.showSummary(data)
end)

-- уведомление о новом заказе (повар/курьер)
Remotes.get("OrderNotify").OnClientEvent:Connect(function(info)
	-- для MVP просто пишем в консоль; UI заказов добавим в следующей версии
	print("[Заказ] новый заказ для роли:", info.role, "#", info.orderId)
end)

print("[Rl Jobs] Клиент запущен")
