# Firebase Deployment Steps for AJU E&J LMS

## Prerequisites Completed ✅
- ✅ Firebase project created (aju-enj-lms)
- ✅ Build issues fixed (Tailwind CSS and Next.js configuration)
- ✅ npm run build successful
- ✅ firebase-tools installed globally

## Next Steps to Complete Deployment

### Step 1: Firebase Login (Manual)
Open a terminal/command prompt and run:
```bash
firebase login
```
- This will open a browser window
- Log in with your Google account that has access to the Firebase project
- Grant the necessary permissions

### Step 2: Initialize Firebase Hosting
After successful login, run:
```bash
firebase init hosting
```

When prompted, select:
1. **"Use an existing project"** → Select `aju-enj-lms`
2. **"What do you want to use as your public directory?"** → Type `out`
3. **"Configure as a single-page app?"** → Yes (y)
4. **"Set up automatic builds and deploys with GitHub?"** → No (n)
5. **"Overwrite out/404.html?"** → No (n)
6. **"Overwrite out/index.html?"** → No (n)

### Step 3: Deploy to Firebase
Run the deployment command:
```bash
npm run deploy
```

Or directly:
```bash
firebase deploy --only hosting
```

### Step 4: Access Your Deployed App
After successful deployment, you'll see:
```
✔ Deploy complete!
Project Console: https://console.firebase.google.com/project/aju-enj-lms/overview
Hosting URL: https://aju-enj-lms.web.app
```

Your app will be live at: **https://aju-enj-lms.web.app**

## Setting Up Admin Access

### Step 1: Create Admin Account
1. Visit your deployed app: https://aju-enj-lms.web.app
2. Sign in with Google
3. Complete the profile setup

### Step 2: Grant Admin Role
1. Go to [Firebase Console](https://console.firebase.google.com/project/aju-enj-lms/firestore)
2. Navigate to **Firestore Database** → **users** collection
3. Find your user document (by email)
4. Click on the document to edit
5. Change the `role` field from `"student"` to `"admin"`
6. Click **Update**

### Step 3: Access Admin Panel
1. Sign out and sign back in to refresh your permissions
2. Navigate to `/admin` to access the admin panel
3. You'll see "AJU E&J Admin Panel" in the header

## Troubleshooting

### If deployment fails with "out directory not found":
```bash
npm run build
```
Then retry deployment.

### If you see permission errors:
1. Check that you're logged into the correct Google account
2. Verify you have Editor or Owner role in Firebase Console
3. Try logging out and back in:
```bash
firebase logout
firebase login
```

### If the app shows 404 after deployment:
1. Ensure the build completed successfully
2. Check that `out` directory exists with content
3. Verify firebase.json has correct hosting configuration

## Deployment Commands Summary
```bash
# Complete deployment sequence
firebase login               # One-time setup
firebase init hosting       # One-time setup
npm run build              # Build the app
npm run deploy             # Deploy to Firebase
```

## Live URLs
- **Main App**: https://aju-enj-lms.web.app
- **Firebase Console**: https://console.firebase.google.com/project/aju-enj-lms
- **Hosting Dashboard**: https://console.firebase.google.com/project/aju-enj-lms/hosting

## Support
If you encounter any issues during deployment, check:
1. Firebase Status: https://status.firebase.google.com/
2. Firebase Documentation: https://firebase.google.com/docs/hosting
3. Next.js Deployment: https://nextjs.org/docs/deployment