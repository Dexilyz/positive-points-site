--[[
	MenuController.lua
	Главное меню, экран 5 слотов и выбор сложности. Всё на русском.
	Никаких упоминаний тех. систем — только игровые слова.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Remotes = require(ReplicatedStorage.Shared.Remotes)
local Localization = require(ReplicatedStorage.Shared.Localization)
local Config = require(ReplicatedStorage.Shared.Config)

local UIHelper = require(script.Parent.UIHelper)
local C = UIHelper.Colors

local MenuController = {}

local localPlayer = Players.LocalPlayer
local locale = localPlayer.LocaleId

local function L(key)
	return Localization.get(key, locale)
end

local screen, root
local onLifeStarted -- callback, когда жизнь начата (скрыть меню)

-- Очистить контейнер
local function clear(container)
	for _, child in ipairs(container:GetChildren()) do
		if not child:IsA("UIListLayout") and not child:IsA("UIPadding") then
			child:Destroy()
		end
	end
end

--========================================================================
-- ЭКРАН ВЫБОРА СЛОЖНОСТИ
--========================================================================
local function showDifficulty(slotIndex)
	clear(root)
	UIHelper.label({ parent = root, text = L("DIFFICULTY_TITLE"),
		textSize = 26, font = Enum.Font.GothamBold, size = UDim2.new(1, 0, 0, 40) })

	local info = Remotes.get("GetAccountInfo"):InvokeServer()

	local descKeys = {
		Easy = "DIFFICULTY_EASY_DESC",
		Medium = "DIFFICULTY_MEDIUM_DESC",
		Hard = "DIFFICULTY_HARD_DESC",
	}
	local nameKeys = {
		Easy = "DIFFICULTY_EASY", Medium = "DIFFICULTY_MEDIUM",
		Hard = "DIFFICULTY_HARD", Impossible = "DIFFICULTY_IMPOSSIBLE",
	}

	for _, d in ipairs(info.difficulties) do
		local btn = UIHelper.button({
			parent = root,
			size = UDim2.new(1, 0, 0, 70),
			color = d.available and C.accent or C.accentDim,
			text = "",
		})
		UIHelper.label({ parent = btn, text = L(nameKeys[d.id]),
			textSize = 20, font = Enum.Font.GothamBold,
			position = UDim2.fromScale(0.5, 0.28), size = UDim2.new(1, -20, 0, 24) })

		local sub
		if d.comingSoon then
			sub = L("DIFFICULTY_IMPOSSIBLE_COMING_SOON")
		elseif d.locked then
			sub = L("DIFFICULTY_HARD_LOCKED")
		else
			sub = L(descKeys[d.id] or "")
		end
		UIHelper.label({ parent = btn, text = sub, textSize = 13, color = C.text,
			position = UDim2.fromScale(0.5, 0.68), size = UDim2.new(1, -20, 0, 30) })

		if d.available then
			btn.MouseButton1Click:Connect(function()
				local res = Remotes.get("CreateLife"):InvokeServer(slotIndex, d.id, localPlayer.DisplayName)
				if res and res.ok then
					if onLifeStarted then onLifeStarted() end
				else
					warn("[Меню]", res and res.message or "ошибка создания жизни")
				end
			end)
		end
	end

	-- кнопка назад
	local back = UIHelper.button({ parent = root, text = "Назад",
		color = C.accentDim, size = UDim2.new(1, 0, 0, 40) })
	back.MouseButton1Click:Connect(function()
		MenuController.showSlots()
	end)
end

--========================================================================
-- ЭКРАН 5 СЛОТОВ
--========================================================================
function MenuController.showSlots()
	clear(root)
	UIHelper.label({ parent = root, text = L("SLOT_CHOOSE"),
		textSize = 26, font = Enum.Font.GothamBold, size = UDim2.new(1, 0, 0, 40) })

	local slots = Remotes.get("GetLifeSlots"):InvokeServer()

	for i = 1, Config.LIFE_SLOTS do
		local s = slots[i]
		local btn = UIHelper.button({
			parent = root, size = UDim2.new(1, 0, 0, 64),
			color = C.panel, text = "",
		})

		local title = ("Слот %d"):format(i)
		if s and s.empty then
			UIHelper.label({ parent = btn, text = title .. ": " .. L("SLOT_EMPTY"),
				xAlign = Enum.TextXAlignment.Left, position = UDim2.new(0, 14, 0, 0),
				size = UDim2.new(1, -28, 1, 0), color = C.textDim })
			btn.MouseButton1Click:Connect(function()
				showDifficulty(i)
			end)
		else
			local money = s.money and ("$" .. tostring(s.money)) or "$0"
			local jobName = s.job and L("JOB_" .. string.upper(s.job)) or L("SLOT_NO_JOB")
			local line1 = ("%s: %s, %d лет"):format(title, s.name or "—", s.age or 4)
			local line2 = ("%s • %s • %s"):format(L("DIFFICULTY_" .. string.upper(s.difficulty or "MEDIUM")), jobName, money)
			UIHelper.label({ parent = btn, text = line1, font = Enum.Font.GothamBold, textSize = 16,
				xAlign = Enum.TextXAlignment.Left, position = UDim2.new(0, 14, 0, 8),
				size = UDim2.new(1, -28, 0, 22) })
			UIHelper.label({ parent = btn, text = line2, textSize = 13, color = C.textDim,
				xAlign = Enum.TextXAlignment.Left, position = UDim2.new(0, 14, 0, 32),
				size = UDim2.new(1, -28, 0, 20) })
			btn.MouseButton1Click:Connect(function()
				local res = Remotes.get("LoadLife"):InvokeServer(i)
				if res and res.ok and onLifeStarted then onLifeStarted() end
			end)
		end
	end

	local back = UIHelper.button({ parent = root, text = "Назад",
		color = C.accentDim, size = UDim2.new(1, 0, 0, 40) })
	back.MouseButton1Click:Connect(function()
		MenuController.showMain()
	end)
end

--========================================================================
-- ГЛАВНОЕ МЕНЮ
--========================================================================
function MenuController.showMain()
	clear(root)
	UIHelper.label({ parent = root, text = L("MENU_TITLE"),
		textSize = 30, font = Enum.Font.GothamBold, size = UDim2.new(1, 0, 0, 60) })

	local b1 = UIHelper.button({ parent = root, text = L("MENU_NEW_LIFE") })
	b1.MouseButton1Click:Connect(function() MenuController.showSlots() end)

	local b2 = UIHelper.button({ parent = root, text = L("MENU_LOAD_LIFE"), color = C.accentDim })
	b2.MouseButton1Click:Connect(function() MenuController.showSlots() end)

	local b3 = UIHelper.button({ parent = root, text = L("MENU_SETTINGS"), color = C.accentDim })
	b3.MouseButton1Click:Connect(function()
		-- базовые настройки появятся позже; язык берётся из аккаунта Roblox
	end)
end

function MenuController.show()
	screen.Enabled = true
	MenuController.showMain()
end

function MenuController.hide()
	screen.Enabled = false
end

function MenuController.init(playerGui, lifeStartedCallback)
	onLifeStarted = lifeStartedCallback

	screen = Instance.new("ScreenGui")
	screen.Name = "MainMenu"
	screen.ResetOnSpawn = false
	screen.IgnoreGuiInset = true
	screen.Parent = playerGui

	UIHelper.frame({ parent = screen, color = C.bg, size = UDim2.fromScale(1, 1) })

	-- центральная панель со списком
	root = UIHelper.frame({
		parent = screen, color = C.bg,
		size = UDim2.new(0, 420, 0, 520),
		position = UDim2.fromScale(0.5, 0.5),
		anchor = Vector2.new(0.5, 0.5),
	})
	local layout = Instance.new("UIListLayout")
	layout.Padding = UDim.new(0, 10)
	layout.SortOrder = Enum.SortOrder.LayoutOrder
	layout.Parent = root
	UIHelper.padding(root, 16)

	return MenuController
end

return MenuController
