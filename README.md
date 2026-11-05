# 🎨 Draw & Learn! — Graphics for Kids

A playful, interactive website that teaches children about **shapes, colors, drawing and a fun quiz**.
No build tools, no dependencies — just open it and play.

## Run it

Just open `index.html` in any modern browser, or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What's inside

| Section | What kids do |
|---------|--------------|
| 🏠 **Home** | Pick an activity from four big colorful cards |
| 🔷 **Shapes** | Tap 8 shape friends to hear their names, and watch shapes bounce on a canvas (tap to add more!) |
| 🌈 **Colors** | Tap the rainbow bands, then mix two colors together in the Color Mixer |
| ✏️ **Draw** | A magic drawing pad with 8 colors, 3 brush sizes, eraser, clear and save-as-PNG |
| 🎯 **Quiz** | 8 random questions mixing shapes and colors, with stars, sounds and confetti |

## Files

- `index.html` — page structure and sections
- `styles.css` — bright, rounded, kid-friendly styling (responsive for phones)
- `app.js` — all interactivity: navigation, canvas playground, drawing pad, quiz and confetti

## Accessibility & friendliness

- Big touch-friendly buttons that work with mouse, touch or stylus
- Sound effects are generated in the browser (no audio files) and can be muted with the 🔊 button
- Shape and color names are also spoken aloud using the browser's speech synthesis

Made with ❤️ for little artists.
