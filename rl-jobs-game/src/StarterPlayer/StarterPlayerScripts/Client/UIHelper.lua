--[[
	UIHelper.lua
	Маленькие помощники для создания интерфейса кодом.
	Чтобы не повторять одинаковый код при создании кнопок, рамок и текста.
]]

local UIHelper = {}

-- Общие цвета темы
UIHelper.Colors = {
	bg = Color3.fromRGB(24, 26, 33),
	panel = Color3.fromRGB(36, 39, 48),
	accent = Color3.fromRGB(86, 142, 255),
	accentDim = Color3.fromRGB(60, 70, 100),
	text = Color3.fromRGB(235, 238, 245),
	textDim = Color3.fromRGB(150, 156, 170),
	good = Color3.fromRGB(95, 200, 130),
	bad = Color3.fromRGB(220, 100, 100),
}

function UIHelper.corner(parent, radius)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, radius or 8)
	c.Parent = parent
	return c
end

function UIHelper.padding(parent, px)
	local p = Instance.new("UIPadding")
	p.PaddingTop = UDim.new(0, px)
	p.PaddingBottom = UDim.new(0, px)
	p.PaddingLeft = UDim.new(0, px)
	p.PaddingRight = UDim.new(0, px)
	p.Parent = parent
	return p
end

function UIHelper.frame(props)
	local f = Instance.new("Frame")
	f.BackgroundColor3 = props.color or UIHelper.Colors.panel
	f.Size = props.size or UDim2.fromScale(1, 1)
	f.Position = props.position or UDim2.fromScale(0, 0)
	f.AnchorPoint = props.anchor or Vector2.new(0, 0)
	f.BorderSizePixel = 0
	f.Visible = props.visible ~= false
	if props.parent then f.Parent = props.parent end
	if props.corner then UIHelper.corner(f, props.corner) end
	return f
end

function UIHelper.label(props)
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.Text = props.text or ""
	l.TextColor3 = props.color or UIHelper.Colors.text
	l.Font = props.font or Enum.Font.GothamMedium
	l.TextSize = props.textSize or 18
	l.TextWrapped = props.wrapped ~= false
	l.TextXAlignment = props.xAlign or Enum.TextXAlignment.Center
	l.TextYAlignment = props.yAlign or Enum.TextYAlignment.Center
	l.Size = props.size or UDim2.fromScale(1, 1)
	l.Position = props.position or UDim2.fromScale(0, 0)
	l.AnchorPoint = props.anchor or Vector2.new(0, 0)
	if props.parent then l.Parent = props.parent end
	return l
end

function UIHelper.button(props)
	local b = Instance.new("TextButton")
	b.BackgroundColor3 = props.color or UIHelper.Colors.accent
	b.Text = props.text or ""
	b.TextColor3 = props.textColor or UIHelper.Colors.text
	b.Font = props.font or Enum.Font.GothamBold
	b.TextSize = props.textSize or 18
	b.AutoButtonColor = true
	b.BorderSizePixel = 0
	b.Size = props.size or UDim2.new(1, 0, 0, 48)
	b.Position = props.position or UDim2.fromScale(0, 0)
	b.AnchorPoint = props.anchor or Vector2.new(0, 0)
	if props.parent then b.Parent = props.parent end
	UIHelper.corner(b, props.corner or 8)
	return b
end

function UIHelper.textbox(props)
	local t = Instance.new("TextBox")
	t.BackgroundColor3 = props.color or UIHelper.Colors.bg
	t.Text = ""
	t.PlaceholderText = props.placeholder or ""
	t.TextColor3 = UIHelper.Colors.text
	t.PlaceholderColor3 = UIHelper.Colors.textDim
	t.Font = Enum.Font.Gotham
	t.TextSize = props.textSize or 16
	t.ClearTextOnFocus = false
	t.TextXAlignment = Enum.TextXAlignment.Left
	t.TextWrapped = true
	t.MultiLine = props.multiline == true
	t.Size = props.size or UDim2.new(1, 0, 0, 44)
	t.BorderSizePixel = 0
	if props.parent then t.Parent = props.parent end
	UIHelper.corner(t, 8)
	UIHelper.padding(t, 10)
	return t
end

return UIHelper
