--[[
	Localization (init.lua)
	Простой сервис локализации.

	Логика:
	- Берём язык аккаунта Roblox игрока (LocalizationService).
	- Если язык поддерживается — используем его.
	- Если ключа нет в нужном языке ИЛИ язык не поддерживается — fallback на русский.

	Использование:
		local Localization = require(ReplicatedStorage.Shared.Localization)
		local text = Localization.get("MENU_NEW_LIFE", localeCode)
		-- или с подстановкой:
		Localization.format("TRANSFER_TO {name}", { name = "Алекс" })
]]

local Config = require(script.Parent.Config)

local Localization = {}

local tables = {
	ru = require(script.ru),
	en = require(script.en),
}

-- Привести код локали Roblox (например "ru-ru", "en-us") к нашему ("ru","en")
function Localization.normalize(localeId: string?): string
	if type(localeId) ~= "string" then
		return Config.DEFAULT_LOCALE
	end
	local short = string.lower(string.sub(localeId, 1, 2))
	for _, supported in ipairs(Config.SUPPORTED_LOCALES) do
		if supported == short then
			return short
		end
	end
	-- язык не поддерживается -> русский fallback
	return Config.DEFAULT_LOCALE
end

-- Получить текст по ключу. Всегда возвращает строку (никогда не nil).
function Localization.get(key: string, locale: string?): string
	local code = Localization.normalize(locale)
	local t = tables[code]
	if t and t[key] ~= nil then
		return t[key]
	end
	-- fallback на русский
	if tables.ru[key] ~= nil then
		return tables.ru[key]
	end
	-- если совсем нет ключа — вернём сам ключ (видно при отладке)
	return key
end

-- Подстановка переменных вида {name}
function Localization.format(template: string, vars: { [string]: any }): string
	return (string.gsub(template, "{(%w+)}", function(name)
		local v = vars[name]
		return v ~= nil and tostring(v) or ("{" .. name .. "}")
	end))
end

return Localization
