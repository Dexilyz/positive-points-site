--[[
	DialogueController.lua
	Игровой интерфейс после начала жизни:
	- HUD сверху: имя, возраст, деньги, репутация.
	- Сцена детства: текст этапа + кнопки "Говорить" с доступными NPC.
	- Панель диалога: реплика NPC + поле, куда игрок САМ пишет ответ.
	- Экран итога детства при переходе во взрослую жизнь.

	Игрок никогда не видит JSON/цифры от тех. системы — только живые реплики
	и мягкие реакции.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Remotes = require(ReplicatedStorage.Shared.Remotes)
local Localization = require(ReplicatedStorage.Shared.Localization)

local UIHelper = require(script.Parent.UIHelper)
local C = UIHelper.Colors

local DialogueController = {}

local localPlayer = Players.LocalPlayer
local locale = localPlayer.LocaleId
local function L(key) return Localization.get(key, locale) end

-- имена NPC для кнопок (показываем по-русски через реестр на сервере не нужен —
-- сервер присылает npcName в ответах; для кнопок используем понятные подписи)
local NPC_LABELS = {
	parent = "Родитель", neighbor = "Сосед", friend = "Друг детства",
	teacher = "Учитель", classmate = "Одноклассник",
	employer = "Работодатель", restaurant_manager = "Менеджер ресторана",
}

local screen, hud, sceneFrame, dialogueFrame
local hudLabels = {}

--========================================================================
-- HUD
--========================================================================
local function buildHud(parent)
	hud = UIHelper.frame({ parent = parent, color = C.panel,
		size = UDim2.new(1, -20, 0, 50), position = UDim2.new(0, 10, 0, 10), corner = 10 })
	local layout = Instance.new("UIListLayout")
	layout.FillDirection = Enum.FillDirection.Horizontal
	layout.HorizontalAlignment = Enum.HorizontalAlignment.Left
	layout.VerticalAlignment = Enum.VerticalAlignment.Center
	layout.Padding = UDim.new(0, 18)
	layout.Parent = hud
	UIHelper.padding(hud, 12)

	local function stat(name)
		local l = UIHelper.label({ parent = hud, text = "", textSize = 15,
			font = Enum.Font.GothamMedium, size = UDim2.new(0, 130, 1, 0),
			xAlign = Enum.TextXAlignment.Left })
		hudLabels[name] = l
		return l
	end
	stat("name"); stat("age"); stat("money"); stat("reputation")
end

function DialogueController.updateState(state)
	if not hudLabels.name then return end
	hudLabels.name.Text = "👤 " .. (state.name or "—")
	hudLabels.age.Text = "🎂 " .. (state.age or 4) .. " лет"
	hudLabels.money.Text = "💵 $" .. (state.money or 0)
	local rep = state.reputation or 0
	hudLabels.reputation.Text = "⭐ " .. L("STAT_REPUTATION") .. ": " .. rep
end

--========================================================================
-- ПАНЕЛЬ ДИАЛОГА (свободный ответ)
--========================================================================
local function openDialogue(npcId)
	if dialogueFrame then dialogueFrame:Destroy() end
	dialogueFrame = UIHelper.frame({ parent = screen, color = C.panel,
		size = UDim2.new(0, 460, 0, 280),
		position = UDim2.fromScale(0.5, 0.7), anchor = Vector2.new(0.5, 0.5), corner = 12 })
	UIHelper.padding(dialogueFrame, 14)

	local nameLabel = UIHelper.label({ parent = dialogueFrame, text = NPC_LABELS[npcId] or "Собеседник",
		font = Enum.Font.GothamBold, textSize = 16, color = C.accent,
		xAlign = Enum.TextXAlignment.Left, size = UDim2.new(1, 0, 0, 20),
		position = UDim2.new(0, 0, 0, 0) })

	local replyLabel = UIHelper.label({ parent = dialogueFrame, text = "...",
		textSize = 16, xAlign = Enum.TextXAlignment.Left, yAlign = Enum.TextYAlignment.Top,
		size = UDim2.new(1, 0, 0, 110), position = UDim2.new(0, 0, 0, 28) })

	-- первая реплика NPC
	local intro = Remotes.get("StartDialogue"):InvokeServer(npcId)
	if intro then
		if intro.npcName then nameLabel.Text = intro.npcName end
		replyLabel.Text = intro.reply or "..."
	end

	-- поле ввода ответа игрока
	local box = UIHelper.textbox({ parent = dialogueFrame, multiline = true,
		placeholder = L("DIALOGUE_INPUT_PLACEHOLDER"),
		size = UDim2.new(1, 0, 0, 60), position = UDim2.new(0, 0, 0, 150) })
	box.Position = UDim2.new(0, 0, 1, -110)
	box.AnchorPoint = Vector2.new(0, 0)
	box.Size = UDim2.new(1, 0, 0, 56)

	local send = UIHelper.button({ parent = dialogueFrame, text = L("DIALOGUE_SEND"),
		size = UDim2.new(0.6, 0, 0, 40), position = UDim2.new(0, 0, 1, -46) })
	local close = UIHelper.button({ parent = dialogueFrame, text = "Закрыть",
		color = C.accentDim, size = UDim2.new(0.36, 0, 0, 40),
		position = UDim2.new(0.64, 0, 1, -46) })

	send.MouseButton1Click:Connect(function()
		local text = box.Text
		if #text == 0 then return end
		box.Text = ""
		local res = Remotes.get("SendDialogue"):InvokeServer(npcId, text)
		if res then
			if res.npcName then nameLabel.Text = res.npcName end
			replyLabel.Text = res.reply or L("NPC_FALLBACK_UNCLEAR")
		end
	end)
	close.MouseButton1Click:Connect(function()
		dialogueFrame:Destroy()
		dialogueFrame = nil
	end)
end

--========================================================================
-- СЦЕНА ДЕТСТВА
--========================================================================
local STAGE_TEXT = {
	child_4_6 = "Тебе 4 года. Сегодня начинается твоя история. Пообщайся с близкими во дворе.",
	child_7_10 = "Школьные годы. Учитель и одноклассники многое запомнят.",
	child_11_14 = "Ты взрослеешь. Появляются интересы и первые навыки.",
	teen_15_18 = "Подростковый возраст. Скоро взрослая жизнь и первая работа.",
}

function DialogueController.showScene(scene)
	if sceneFrame then sceneFrame:Destroy() end
	sceneFrame = UIHelper.frame({ parent = screen, color = C.bg,
		size = UDim2.new(0, 460, 0, 320),
		position = UDim2.fromScale(0.5, 0.42), anchor = Vector2.new(0.5, 0.5), corner = 12 })
	UIHelper.padding(sceneFrame, 16)
	local layout = Instance.new("UIListLayout")
	layout.Padding = UDim.new(0, 10)
	layout.Parent = sceneFrame

	local txt = (scene.stageId == "child_4_6") and L("CHILDHOOD_START")
		or (STAGE_TEXT[scene.stageId] or "")
	UIHelper.label({ parent = sceneFrame, text = txt, textSize = 16,
		yAlign = Enum.TextYAlignment.Top, size = UDim2.new(1, 0, 0, 90) })

	-- кнопки "Говорить" с доступными NPC этапа
	for _, npcId in ipairs(scene.npcs or {}) do
		local b = UIHelper.button({ parent = sceneFrame, size = UDim2.new(1, 0, 0, 42),
			text = L("DIALOGUE_TALK") .. ": " .. (NPC_LABELS[npcId] or npcId) })
		b.MouseButton1Click:Connect(function() openDialogue(npcId) end)
	end

	-- кнопка "Продолжить" -> просим сервер перейти на следующий этап.
	-- Сервер сам решит: показать следующую сцену или итог детства.
	local cont = UIHelper.button({ parent = sceneFrame, text = "Продолжить →",
		color = C.good, size = UDim2.new(1, 0, 0, 42) })
	cont.MouseButton1Click:Connect(function()
		Remotes.get("AdvanceStage"):FireServer()
	end)
end

--========================================================================
-- ИТОГ ДЕТСТВА
--========================================================================
function DialogueController.showSummary(data)
	if sceneFrame then sceneFrame:Destroy(); sceneFrame = nil end
	local f = UIHelper.frame({ parent = screen, color = C.bg,
		size = UDim2.new(0, 460, 0, 420),
		position = UDim2.fromScale(0.5, 0.5), anchor = Vector2.new(0.5, 0.5), corner = 12 })
	UIHelper.padding(f, 18)
	local layout = Instance.new("UIListLayout")
	layout.Padding = UDim.new(0, 8)
	layout.Parent = f

	UIHelper.label({ parent = f, text = L("CHILDHOOD_END"), font = Enum.Font.GothamBold,
		textSize = 18, size = UDim2.new(1, 0, 0, 60) })

	-- характеристики
	local statNames = {
		kindness = "STAT_KINDNESS", confidence = "STAT_CONFIDENCE",
		discipline = "STAT_DISCIPLINE", creativity = "STAT_CREATIVITY",
		streetSmart = "STAT_STREET_SMART", education = "STAT_EDUCATION",
		reputation = "STAT_REPUTATION",
	}
	for stat, key in pairs(statNames) do
		local v = (data.stats and data.stats[stat]) or 0
		UIHelper.label({ parent = f, text = L(key) .. ": " .. v, textSize = 14,
			xAlign = Enum.TextXAlignment.Left, size = UDim2.new(1, 0, 0, 18), color = C.textDim })
	end

	local jobs = {}
	for _, j in ipairs(data.availableJobs or {}) do
		table.insert(jobs, L("JOB_" .. string.upper(j)))
	end
	UIHelper.label({ parent = f, text = L("CHILDHOOD_AVAILABLE_JOBS") .. ": " .. table.concat(jobs, ", "),
		textSize = 15, color = C.good, size = UDim2.new(1, 0, 0, 40) })

	local ok = UIHelper.button({ parent = f, text = "Начать взрослую жизнь",
		color = C.good, size = UDim2.new(1, 0, 0, 44) })
	ok.MouseButton1Click:Connect(function() f:Destroy() end)
end

function DialogueController.init(playerGui)
	screen = Instance.new("ScreenGui")
	screen.Name = "GameHUD"
	screen.ResetOnSpawn = false
	screen.IgnoreGuiInset = true
	screen.Enabled = false
	screen.Parent = playerGui

	buildHud(screen)
	return DialogueController
end

function DialogueController.show() screen.Enabled = true end
function DialogueController.hide() screen.Enabled = false end

return DialogueController
