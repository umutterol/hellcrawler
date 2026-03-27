---
active: true
iteration: 1
max_iterations: 8
completion_promise: "GORE SETTINGS DONE"
started_at: "2026-01-06T11:50:01Z"
---

Add gore intensity setting to SettingsPanel.
Requirements:
- Off/Low/High toggle in SettingsPanel.ts
- Save to SettingsManager
- GoreManager reads setting and adjusts spawn counts
- 'Off' disables all gore effects
Check existing goreIntensity in GoreConfig.ts.
Output <promise>GORE SETTINGS DONE</promise> when toggle works.
