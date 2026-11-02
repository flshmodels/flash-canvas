# Flash Canvas

A local layout workbench for small Roblox-style interfaces. Open a JSON layout, preview supported elements at different sizes, and export a Luau function that builds the GUI.

## Open it

On Windows, extract the repository and double-click **Open Preview.cmd**. It opens the workspace in VS Code if VS Code is installed in a standard user/system location, then opens `index.html` in your default browser. It installs nothing. You can also open the workspace and HTML file yourself on Windows, macOS or Linux.

No server, npm install, account or extension is required for the browser preview. Files are processed locally; the tool has no network calls or automatic storage. Local-only is not an operating-system sandbox.

## Use it

Edit the JSON in the workbench and click **Render layout** (Ctrl/Cmd+Enter also works). **Open JSON** reads a selected local file. **Resize** updates the design viewport and renders it again. Export is disabled after edits until a valid render succeeds.

**Save JSON** downloads the normalized layout. **Export Luau** downloads a ModuleScript source file. Local disk edits in VS Code are not watched automatically; reopen the JSON or paste the updated text into the editor.

The sample is a small wallet panel. Its button has no browser game behavior. The exported button is a real TextButton; add your own Roblox event handlers.

## Use the export in Roblox

Copy the export into a ModuleScript named `WalletLayout` in ReplicatedStorage. In a LocalScript under StarterPlayerScripts:

```lua
local Players = game:GetService("Players")
local makeLayout = require(game:GetService("ReplicatedStorage"):WaitForChild("WalletLayout"))
local screen = Instance.new("ScreenGui")
screen.Name = "WalletDemo"
screen.ResetOnSpawn = false
screen.Parent = Players.LocalPlayer:WaitForChild("PlayerGui")
local root = makeLayout(screen)
root.Open.Activated:Connect(function()
    print("Connect your own wallet behavior here")
end)
```

The function creates a fresh tree each time and returns its root Frame. Pass a GuiObject or LayerCollector parent. The JSON viewport is for previewing; the export uses UDim2 against its actual Roblox parent, without forcing a screen resolution.

## Layout format

Version 1 supports Frame, TextLabel and TextButton, with a Frame root. Position and Size are `[xScale, xOffset, yScale, yOffset]`. Anchor is `[x, y]`. Supported fields include background color/transparency, pixel corner radius, border stroke, clipping, visibility and nested children. Text supports size, color, alignment, wrapping and three font choices. See [the sample](examples/wallet.json).

Bounds: 1 MiB UTF-8 JSON; 200 nodes; 8 child levels; distinct ASCII IDs; viewport 240–1920 × 200–1080; scales -2–2 for positions and 0–2 for sizes; offsets -4096–4096. Resolved sizes must not be negative at the design viewport. Text is limited to 1000 JavaScript UTF-16 code units per node. Unsupported fields, external images, script nodes, invalid colors and isolated Unicode surrogates are refused.

**This does not run arbitrary Luau, import a Roblox place, or render with Roblox's engine.** Fonts, clipping, strokes, wrapping, device insets and layout behavior can differ. There is no UIListLayout, UIGradient, RichText, animation, image support, auto-fit or game logic. Verify the export in Studio.

## Code and checks

`src/layout.js` is shared by the browser and Node: `parse(text)`, `normalize(layout)`, `geometry(layout)` and `generate(layout)`. Generated names/text use quoted UTF-8 byte escapes; layout files are data, never evaluated as code. `src/app.js` renders with DOM elements and textContent.

Optional CLI and tests require Node 22+; there are no dependencies:

```sh
npm test
node tools/export.cjs examples/wallet.json WalletDemo.generated.luau
```

CLI input is strict UTF-8 and bounded to 1 MiB. Input/output must be different paths and output must end in `.luau`. Validation finishes before output is written. Existing output is replaced on success; filesystem write errors are reported with exit 1. Browser downloads and the CLI do not execute the export.

CI runs Node checks, regenerates committed examples and uses Lune to compile/mount the exports with Roblox datatypes. That checks instance properties and text, not real Studio rendering. See [research and limits](docs/REFERENCES.md) and [manual checks](docs/CHECKS.md).

MIT licensed. See [LICENSE](LICENSE).
