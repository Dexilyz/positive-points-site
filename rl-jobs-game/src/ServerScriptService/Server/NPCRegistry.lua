--[[
	NPCRegistry.lua
	Справочник важных NPC (для MVP).
	У каждого: имя, роль, характер, fallback-приветствие, разрешённые задания.

	Характер (personality) передаётся в скрытый backend как контекст,
	чтобы NPC отвечали "в характере". Игрок этого не видит.
]]

local NPCRegistry = {}

NPCRegistry.npcs = {
	-- Детские NPC
	parent = {
		name = "Родитель",
		role = "parent",
		personality = "заботливый, иногда уставший, желает ребёнку добра",
		greeting = "Доброе утро. Сегодня ты впервые пойдёшь гулять во двор. Постарайся быть вежливым с соседями.",
		allowedQuests = { "be_polite" },
	},
	neighbor = {
		name = "Сосед",
		role = "neighbor",
		personality = "дружелюбный, помнит, кто ему помогал",
		greeting = "Ой, я никак не найду своего кота. Ты его случайно не видел?",
		allowedQuests = { "find_cat" },
	},
	friend = {
		name = "Друг детства",
		role = "friend",
		personality = "эмоциональный ребёнок, ценит поддержку",
		greeting = "Я упал и ушибся... (он чуть не плачет)",
		allowedQuests = { "help_friend" },
	},
	teacher = {
		name = "Учитель",
		role = "teacher",
		personality = "серьёзный, ценит честность и старание",
		greeting = "Ты не сделал домашнее задание. Что скажешь?",
		allowedQuests = { "homework_promise" },
	},
	classmate = {
		name = "Одноклассник",
		role = "classmate",
		personality = "обычный сверстник, иногда просит помощи",
		greeting = "Слушай, помоги мне с заданием, я не понял тему.",
		allowedQuests = { "help_classmate" },
	},

	-- Взрослые NPC
	employer = {
		name = "Работодатель",
		role = "employer",
		personality = "деловой, помнит репутацию и прошлое поведение игрока",
		greeting = "Ищешь работу? Расскажи, почему мне стоит дать тебе шанс.",
		allowedQuests = { "first_job" },
	},
	restaurant_manager = {
		name = "Менеджер ресторана",
		role = "restaurant_manager",
		personality = "профессиональный, помнит, как игрок вёл себя в ресторане раньше",
		greeting = "У нас всегда есть работа для надёжных людей. Что умеешь?",
		allowedQuests = { "restaurant_job" },
	},
}

function NPCRegistry.get(npcId: string)
	return NPCRegistry.npcs[npcId]
end

return NPCRegistry
