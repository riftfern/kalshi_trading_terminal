# Manual Testing Guide

## Testing Drag & Drop

1. **Open** http://localhost:3002/vanilla.html in Brave browser

2. **Open Browser DevTools** (F12) and go to Console tab

3. **Test Dragging:**
   - Click and hold on any widget
   - You should see: `Drag started: widget-id` in console
   - Drag the widget around
   - You should see: `Drag over: ...` messages in console
   - Release to drop
   - You should see: `Drop: widget-id at grid position {x, y}` in console
   - Widget should move to new position

4. **Test Resizing:**
   - Hover over the **bottom-right corner** of any widget
   - You should see a resize cursor (arrow pointing diagonal)
   - Click and hold the corner
   - You should see: `Resize started: widget-id` in console
   - Drag to make widget bigger/smaller
   - Release
   - You should see: `Resized widget-id to w=X, h=Y` in console
   - Widget should change size

## What to Look For:

✅ **Working correctly:**
- Widget becomes semi-transparent when dragging
- Cyan dashed box (placeholder) shows where widget will drop
- Console logs show drag/resize events
- Widget moves/resizes when you release

❌ **Not working:**
- No console logs appear
- Widget doesn't move/resize
- No visual feedback (transparency, placeholder)

## Common Issues:

1. **Can't drag**: Make sure you're clicking on the widget itself, not on interactive content inside
2. **Can't resize**: Make sure you're clicking on the very bottom-right corner (20x20px area)
3. **No console logs**: Check if there are JavaScript errors in console (red text)

## Debug Mode:

To see all events, run this in the console:
```javascript
window.addEventListener('dragover', (e) => console.log('Global dragover', e.target));
window.addEventListener('drop', (e) => console.log('Global drop', e.target));
```

Then try dragging again and watch for events.
