# Manual checks

1. Open index.html directly from disk, without a server. Check the initial sample and browser console. The tool should request no external resources.
2. On Windows, use Open Preview.cmd. Check that it opens VS Code from a standard install and the browser preview, without installing software or starting a server. VS Code's own workspace trust prompts remain unchanged.
3. Change text, anchors and viewport size. Confirm the preview geometry, JSON download and Luau export match the last valid render. Invalid drafts must disable export and mark the previous preview stale.
4. Load a valid JSON file, invalid JSON, invalid UTF-8 and an oversized file. Check for readable errors without a page crash.
5. Test literal markup text, Unicode, multiline text and overlapping nodes. Text should remain data.
6. Import an export into a separate Studio test place. Check sizes, clipping, fonts, strokes and button events on desktop/mobile emulation. Test cleanup by destroying the returned root.

Browser QA and generated-instance tests do not replace the Studio rendering check. Record the environment and date when running this checklist; no live Studio pass is claimed.
