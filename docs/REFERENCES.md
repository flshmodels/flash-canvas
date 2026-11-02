# Related workflows

[Flipbook](https://github.com/flipbook-labs/flipbook) and [UI Labs](https://github.com/PepeElToro41/ui-labs) isolate Roblox UI components in Studio. They are the better fit for executing Roblox UI stories with the engine. Flash Canvas instead previews a small declarative JSON subset in a browser and exports instance-building Luau. It does not support their story files or require their libraries.

[Rojo](https://rojo.space/docs/) connects external-editor projects to Studio. Flash Canvas does not replace that sync pipeline; an exported module can be placed into a Rojo project after generation.

[Roblox UI positioning](https://create.roblox.com/docs/ui/position-and-size) documents the Scale/Offset and AnchorPoint model used here. Browser fonts and rendering are approximations, so the workbench does not claim pixel-identical output.

These sources informed the scope and workflow comparison. No code or assets were copied from those projects. The implementation has no runtime dependencies on them.
