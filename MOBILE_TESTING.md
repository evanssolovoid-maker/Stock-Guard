# Mobile Testing Guide for StockGuard

## How to Test on Your Mobile Device

### Method 1: Using Your Local Network (Recommended)

1. **Find Your Computer's IP Address**

   **Windows:**
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (usually something like `192.168.1.xxx`)

   **Mac/Linux:**
   ```bash
   ifconfig
   ```
   Look for `inet` under your active network interface

2. **Start the Dev Server with Network Access**

   The dev server should already be running. If not:
   ```bash
   npm run dev
   ```

   Vite will show you the local and network URLs:
   ```
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.1.xxx:5173/
   ```

3. **Access from Your Phone**

   - Make sure your phone is on the **same Wi-Fi network** as your computer
   - Open your phone's browser (Chrome, Safari, etc.)
   - Type the **Network URL** shown in the terminal (e.g., `http://192.168.1.xxx:5173`)
   - The app should load on your phone!

### Method 2: Using ngrok (For Testing from Anywhere)

1. **Install ngrok**
   - Download from: https://ngrok.com/download
   - Or use: `npm install -g ngrok`

2. **Start Your Dev Server**
   ```bash
   npm run dev
   ```

3. **Create ngrok Tunnel**
   ```bash
   ngrok http 5173
   ```

4. **Use the ngrok URL**
   - ngrok will give you a public URL like: `https://xxxx-xxxx.ngrok.io`
   - Open this URL on your phone (works from anywhere!)

### Method 3: Using Browser DevTools (Quick Test)

1. **Open Chrome DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)

2. **Enable Device Mode**
   - Click the device toggle icon (or press `Ctrl+Shift+M`)
   - Select a mobile device (iPhone, Android, etc.)

3. **Test the App**
   - The app will render in mobile view
   - You can test touch interactions
   - **Note**: Camera won't work in DevTools, but you can test the UI

## Testing Product Addition on Mobile

### Step-by-Step Test

1. **Access the App on Your Phone**
   - Use Method 1 or 2 above to open the app on your mobile device

2. **Login as Business Owner**
   - Sign in with your owner account credentials

3. **Navigate to Products**
   - Tap "Products" in the sidebar (or hamburger menu on mobile)

4. **Add a New Product**
   - Tap the "Add Product" button (top right)

5. **Test Image Upload**

   **Option A: Take Photo with Camera**
   - Tap the upload area
   - You should see two options: "Take Photo" and "Choose from Gallery"
   - Tap "Take Photo"
   - Your phone's camera should open
   - Take a photo
   - The photo should appear as a preview
   - Fill in product details and submit

   **Option B: Choose from Gallery**
   - Tap the upload area
   - Tap "Choose from Gallery"
   - Select a photo from your phone's gallery
   - The photo should appear as a preview
   - Fill in product details and submit

6. **Verify Upload**
   - After submitting, the product should appear in your products list
   - The image should be visible in both grid and table views

## What to Test

### ✅ Camera Functionality
- [ ] Camera opens when tapping "Take Photo"
- [ ] Photo preview appears after taking photo
- [ ] Photo can be removed before submission
- [ ] Photo uploads successfully to Supabase

### ✅ Gallery Functionality
- [ ] Gallery opens when tapping "Choose from Gallery"
- [ ] Can select existing photos from gallery
- [ ] Photo preview appears after selection
- [ ] Photo can be removed before submission
- [ ] Photo uploads successfully to Supabase

### ✅ Mobile UI/UX
- [ ] Upload area is easy to tap (large touch target)
- [ ] Options menu appears clearly on mobile
- [ ] Buttons are properly sized for mobile
- [ ] Form is easy to fill on mobile keyboard
- [ ] Product list displays well in mobile view

### ✅ Error Handling
- [ ] File size validation works (try uploading >2MB)
- [ ] File type validation works (try uploading non-image)
- [ ] Error messages display clearly
- [ ] Network errors are handled gracefully

## Troubleshooting

### Camera Not Opening
- **Check browser permissions**: Make sure the browser has camera permission
- **Use HTTPS**: Some browsers require HTTPS for camera access (use ngrok for this)
- **Try different browser**: Chrome, Safari, Firefox may behave differently

### Gallery Not Opening
- **Check browser permissions**: Make sure the browser has file access permission
- **Try different browser**: Some browsers handle file inputs differently

### Can't Access from Phone
- **Check firewall**: Windows Firewall might be blocking the connection
- **Check network**: Ensure phone and computer are on same Wi-Fi
- **Try different port**: If 5173 is blocked, Vite will use the next available port

### Images Not Uploading
- **Check Supabase Storage**: Make sure the `product-images` bucket exists
- **Check Storage Policies**: Verify all 4 policies are created
- **Check console**: Look for error messages in browser console

## Quick Test Checklist

1. ✅ App loads on mobile device
2. ✅ Can login successfully
3. ✅ Can navigate to Products page
4. ✅ "Add Product" button is visible and tappable
5. ✅ Upload area shows camera/gallery options on mobile
6. ✅ Camera opens and can take photos
7. ✅ Gallery opens and can select photos
8. ✅ Photo preview appears correctly
9. ✅ Can remove photo before submission
10. ✅ Product saves with image successfully
11. ✅ Image displays in product list

## Tips for Best Results

- **Use Chrome or Safari** on mobile for best camera support
- **Grant permissions** when browser asks for camera/gallery access
- **Test on real device** - emulators don't support camera
- **Use HTTPS** (via ngrok) for full camera functionality
- **Check network speed** - large images may take time to upload

