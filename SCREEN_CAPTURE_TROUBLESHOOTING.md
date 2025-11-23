# Screen Capture Troubleshooting

## Black Screen Issue

If you're seeing a black screen when capturing, this is usually due to hardware acceleration or DRM protection. Here are solutions:

### Solution 1: Select "Entire Screen" Instead of Window
When prompted for screen capture:
1. Choose "Entire Screen" or "Screen 1" instead of selecting the Overwatch window specifically
2. Windows hardware-accelerated applications often show as black when captured by window

### Solution 2: Disable Hardware Acceleration (Overwatch)
1. In Overwatch, go to Options > Video
2. Look for hardware acceleration or GPU scheduling settings
3. Try disabling if available
4. Restart the game

### Solution 3: Disable Hardware Acceleration (Browser)
For Chrome/Edge:
1. Go to Settings > System
2. Disable "Use hardware acceleration when available"
3. Restart browser
4. Re-enable after capturing if needed for performance

For Firefox:
1. Go to Settings > General > Performance
2. Uncheck "Use recommended performance settings"
3. Uncheck "Use hardware acceleration when available"
4. Restart browser

### Solution 4: Run in Windowed Mode
1. In Overwatch settings, switch to Borderless Window or Windowed mode
2. This often makes screen capture work better
3. Full screen exclusive mode can cause capture issues

### Solution 5: Use Browser Flags (Chrome/Edge)
Try enabling these experimental features in `chrome://flags/`:
- `#enable-webrtc-capture-multi-channel-audio`
- Try different values for `#webrtc-capture-screen-behavior`

## Verifying Capture Works

Once you enable screen capture, check the debug info panel:
- **Video Ready**: Should show ✓
- **Video Size**: Should show your screen resolution (e.g., 1920x1080), NOT 0x0
- **Video Playing**: Should show ✓

If any of these show ✗ or 0x0, the capture isn't working properly.

## How to Use

1. Click "Enable Screen Capture"
2. Select your entire screen or the Overwatch window
3. Launch Overwatch (or switch to it if already running)
4. Press TAB to show the scoreboard
5. Click "Capture Now" or enable Auto-Capture
6. The preview image should show your current screen
7. The system will detect the scoreboard and heroes automatically

## Technical Details

The black screen issue occurs because:
- Hardware-accelerated games (DirectX, Vulkan) render to protected surfaces
- Browsers can't capture protected content for security reasons
- Capturing the entire screen works because the compositor has already rendered it
- Window-specific capture tries to read directly from the protected surface

## Alternative: Manual Entry

If screen capture doesn't work on your system:
- You can still manually select heroes using the dropdowns
- The screen capture feature is optional
- All core functionality works without it

