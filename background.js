// Fluent System Icons Viewer
// Copyright 2boom, 2026
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error init sidebar:", error));