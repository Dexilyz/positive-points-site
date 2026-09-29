--[[
	RelationshipManager.lua
	Отношения игрока с NPC и ПАМЯТЬ NPC о поступках.

	У каждого важного NPC:
	- value: число (насколько хорошо относится к игроку)
	- memories: список тегов важных поступков ("helped_friend", "lied_to_parent" ...)

	Память используется и в детстве, и во взрослой жизни:
	взрослые NPC реагируют на прошлое игрока.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Shared.Config)

local SessionManager = require(script.Parent.SessionManager)

local RelationshipManager = {}

local function getRel(life, npcId: string)
	if not life.relationships[npcId] then
		life.relationships[npcId] = { value = 0, memories = {} }
	end
	return life.relationships[npcId]
end

-- Изменить отношения с NPC (с защитой от абуза)
function RelationshipManager.applyChange(player: Player, npcId: string, delta: number)
	local life = SessionManager.get(player)
	if not life then return end
	local maxStep = Config.MAX_RELATIONSHIP_CHANGE_PER_DIALOGUE
	delta = math.clamp(delta, -maxStep, maxStep)
	local rel = getRel(life, npcId)
	rel.value = math.clamp(rel.value + delta, -100, 100)
end

-- Добавить тег памяти (NPC запомнил поступок)
function RelationshipManager.addMemory(player: Player, npcId: string, memoryTag: string)
	if type(memoryTag) ~= "string" or memoryTag == "" or memoryTag == "none" then
		return
	end
	local life = SessionManager.get(player)
	if not life then return end
	local rel = getRel(life, npcId)
	-- не дублируем один и тот же тег
	for _, m in ipairs(rel.memories) do
		if m == memoryTag then return end
	end
	table.insert(rel.memories, memoryTag)

	-- важные воспоминания дублируем в общий список жизни
	table.insert(life.memories, { npc = npcId, tag = memoryTag })
end

function RelationshipManager.getValue(player: Player, npcId: string): number
	local life = SessionManager.get(player)
	if not life then return 0 end
	return getRel(life, npcId).value
end

function RelationshipManager.hasMemory(player: Player, npcId: string, memoryTag: string): boolean
	local life = SessionManager.get(player)
	if not life then return false end
	local rel = getRel(life, npcId)
	for _, m in ipairs(rel.memories) do
		if m == memoryTag then return true end
	end
	return false
end

-- Список тегов памяти NPC (передаётся в backend как контекст)
function RelationshipManager.getMemories(player: Player, npcId: string)
	local life = SessionManager.get(player)
	if not life then return {} end
	return getRel(life, npcId).memories
end

return RelationshipManager
