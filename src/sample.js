globalThis.FlashCanvasSample = {
  "version": 1,
  "name": "WalletDemo",
  "viewport": {
    "width": 800,
    "height": 450
  },
  "root": {
    "id": "Wallet",
    "type": "Frame",
    "position": [
      0,
      24,
      1,
      -24
    ],
    "size": [
      0,
      280,
      0,
      108
    ],
    "anchor": [
      0,
      1
    ],
    "background": "#252d28",
    "corner": 8,
    "stroke": {
      "color": "#52624f",
      "thickness": 1
    },
    "children": [
      {
        "id": "Title",
        "type": "TextLabel",
        "position": [
          0,
          16,
          0,
          10
        ],
        "size": [
          1,
          -32,
          0,
          22
        ],
        "text": "WALLET",
        "textSize": 12,
        "textColor": "#b9c8b2"
      },
      {
        "id": "Balance",
        "type": "TextLabel",
        "position": [
          0,
          16,
          0,
          34
        ],
        "size": [
          0,
          160,
          0,
          42
        ],
        "text": "$8,000",
        "textSize": 30,
        "font": "SourceSansSemibold"
      },
      {
        "id": "Open",
        "type": "TextButton",
        "position": [
          1,
          -16,
          0.5,
          0
        ],
        "size": [
          0,
          76,
          0,
          34
        ],
        "anchor": [
          1,
          0.5
        ],
        "background": "#d0ddc7",
        "corner": 5,
        "text": "Open",
        "textSize": 15,
        "textColor": "#263023",
        "align": "Center"
      }
    ]
  }
};
