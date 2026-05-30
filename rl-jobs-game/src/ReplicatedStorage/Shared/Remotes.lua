--[[
	Remotes.lua
	Единая точка для всех сетевых каналов между клиентом и сервером.

	На сервере: Remotes.init() создаёт нужные RemoteEvent/RemoteFunction.
	На клиенте: Remotes.get("Имя") дожидается и возвращает канал.

	Так клиент и сервер всегда используют одинаковые имена и не ошибаются.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Remotes = {}

-- Список каналов и их тип. true = RemoteFunction (ждём ответ), false = RemoteEvent.
local DEFINITIONS = {
	-- Меню и сохранения
	GetLifeSlots = true,        -- клиент просит список из 5 слотов
	CreateLife = true,          -- создать новую жизнь (слот, сложность)
	LoadLife = true,            -- загрузить жизнь из слота
	GetAccountInfo = true,      -- открыт ли Hard и т.п.

	-- Диалоги (свободный текст)
	SendDialogue = true,        -- игрок пишет ответ NPC -> получает реакцию NPC
	StartDialogue = true,       -- начать диалог с NPC (получить первую фразу)

	-- Детство
	AdvanceStage = false,       -- игрок нажал "Продолжить" -> следующий этап

	-- Состояние игрока (push с сервера на клиент)
	StateUpdate = false,        -- сервер шлёт обновлённые деньги/характеристики
	ShowChildhoodScene = false, -- сервер шлёт сцену детства
	ShowChildhoodSummary = false,

	-- Экономика
	RequestTransfer = true,     -- перевод денег другому игроку
	GiveTip = true,             -- чаевые работнику

	-- Работа / город
	TakeJob = true,             -- занять рабочее место (заменить NPC)
	LeaveJob = false,           -- закончить смену
	AcceptOrder = true,         -- курьер/повар принимает заказ
	CompleteOrder = true,       -- заказ выполнен
	OrderNotify = false,        -- сервер сообщает работнику о новом заказе
}

local FOLDER_NAME = "RlJobsRemotes"

local function getFolder(): Instance
	local folder = ReplicatedStorage:FindFirstChild(FOLDER_NAME)
	if not folder and RunService:IsServer() then
		folder = Instance.new("Folder")
		folder.Name = FOLDER_NAME
		folder.Parent = ReplicatedStorage
	end
	return folder
end

-- Вызывается ОДИН раз на сервере при старте.
function Remotes.init()
	assert(RunService:IsServer(), "Remotes.init() можно вызывать только на сервере")
	local folder = getFolder()
	for name, isFunction in pairs(DEFINITIONS) do
		if not folder:FindFirstChild(name) then
			local remote = Instance.new(isFunction and "RemoteFunction" or "RemoteEvent")
			remote.Name = name
			remote.Parent = folder
		end
	end
end

-- Получить канал по имени (работает и на клиенте, и на сервере).
function Remotes.get(name: string): Instance
	assert(DEFINITIONS[name] ~= nil, "Неизвестный канал: " .. tostring(name))
	local folder = getFolder()
	if RunService:IsServer() then
		return folder:WaitForChild(name)
	else
		local f = ReplicatedStorage:WaitForChild(FOLDER_NAME)
		return f:WaitForChild(name)
	end
end

return Remotes
