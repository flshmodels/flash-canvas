local roblox = require("@lune/roblox")
local fs = require("@lune/fs")
local luau = require("@lune/luau")
local function load(name)
    return luau.load(fs.readFile("examples/" .. name .. ".luau"), { environment = {
        Instance = roblox.Instance, UDim2 = roblox.UDim2, UDim = roblox.UDim, Vector2 = roblox.Vector2,
        Color3 = roblox.Color3, Enum = roblox.Enum,
    } })()
end
local parent = roblox.Instance.new("ScreenGui")
local make = load("WalletDemo")
local root = make(parent)
assert(root.Name == "Wallet" and root.Parent == parent and root.Size.X.Offset == 280)
assert(root:FindFirstChild("Balance").Text == "$8,000")
assert(root:FindFirstChild("Open").AnchorPoint == roblox.Vector2.new(1, 0.5))
assert(root:FindFirstChildOfClass("UIStroke").ApplyStrokeMode == roblox.Enum.ApplyStrokeMode.Border)
assert(make(parent) ~= root, "each mount must create a fresh tree")
assert(not pcall(function() make(roblox.Instance.new("Part")) end))
local unicode = load("UnicodeDemo")(parent)
assert(unicode:FindFirstChild("Text").Text == string.char(34) .. "safe" .. string.char(34, 10) .. "🍃 café " .. string.char(92))
print("Generated UI functions compile, mount distinct trees and preserve properties and UTF-8 text.")
