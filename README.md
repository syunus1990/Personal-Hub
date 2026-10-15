# Personal Hub (Listok Edition)

A cross-platform mobile application combining personal finance, tasks, notes, wishlists, and debt management into the clean, minimalist, pastel design language of **Listok: To Do List & Notes**.

---

## 🎨 Listok UI/UX Design System
- **Theme**: Minimalist, soft pastel tones (`lavender`, `mint`, `peach`, `sky`, `butter`, `slate`), supporting automatic Dark & Light modes.
- **Glassmorphism**: Frosted glass (`backdrop-blur-xl`, `glass-card`, `glass-panel`) styling on cards, dialogs, and navigation inspired by iOS widgets.
- **Navigation**: Fixed bottom tab bar (Home, Money, Notes, Follow-ups, Wishlists) with top summaries inside every tab.
- **FAB**: Floating Action Button with soft glow for contextual additions.
- **Zero-Scroll Instant Editing**: Auto-focused input fields for immediate editing without scroll fatigue.
- **Android Back Button Integration**: Intercepts `popstate` to dismiss active sheets or return to Dashboard rather than abruptly exiting the app.
- **Full-screen Mode**: Hides system status bar (time, battery, signal) inside the app.
- **Haptic Tactility**: Native device vibrations (`navigator.vibrate`) on key actions with toggle in Settings.

---

## 🚀 Core Features

### 1. 📊 Dashboard
- Master summary card showing Net Worth, Monthly Inflow, Outflow, and Net Remaining balance.
- Module cards for **Money**, **Notes**, **Follow-ups**, **Wishlists**, and **Loans**.
- Quick action ribbon to record transactions, notes, follow-ups, or wishlist items with one tap.

### 2. 💰 Money & Finance Module
- **Accounts**: Manage multiple accounts (Bank, Physical Cash, Digital Wallets, Savings, Credit Cards).
- **Opening & Updated Balances**: Tracks initial balances and automatically computes real-time updated balances.
- **Automatic Remaining Balance**: Computes net remaining balance (`Income - Expenses +/- Transfers`).
- **Income, Expense, Transfers**: Filterable transactions ledger with quick recording.
- **Loans Sub-section**: Direct access to Loans and Debt within the Money module.
- **SAR ⇄ INR Conversion**: Converts from Saudi Riyal (SAR) to Indian Rupee (INR) with adjustable manual exchange rate (e.g. 1 SAR = 22.45 INR) and 1-tap currency toggle.

### 3. 📝 Notes Module
- Soft pastel color-coded cards matching Listok's signature aesthetic.
- Category filters (Personal, Finance, Ideas, Work, etc.).
- Pin important notes to the top.
- Full-text search and instant zero-scroll editing.

### 4. ⏰ Follow-ups & Action Items
- Priority tags: **High**, **Medium**, **Low**.
- Due dates with status badges: **Overdue**, **Due Today**, **Upcoming**.
- Quick toggle check-off with celebratory confetti on high-priority tasks.
- Category filters and reminder times.

### 5. 🎁 Wishlists & Goals
- Items with target price, saved amount progress bar, and funding percentage.
- **+ Add Savings**: Allocate savings toward the goal directly with optional account deduction.
- Priority tiers (Must Have, Nice to Have, Dream).

### 6. 🤝 Loans & Debt Ledger
- Segregated into **"I Lent" (Receivable)** and **"I Borrowed" (Payable)**.
- Counterparty contact details, due dates, repayment progress.
- Record partial or full repayments with audit history.

### 7. 📑 Excel Import & Export
- Multi-sheet Excel workbook generation (`Money_Accounts`, `Money_Transactions`, `Follow_Ups`, `Notes`, `Loans`, `Wishlists`).
- Downloadable clean Excel template (`Personal_Hub_Template.xlsx`) with sample rows.
- File upload parser supporting **Merge** or **Replace** modes with automatic schema validation.

### 8. ⚙️ Settings & System
- Light / Dark / System theme switcher.
- SAR to INR exchange rate setting.
- Haptics and Fullscreen mode toggles.
- Data Reset: Clear all data or restore demo seed data.

---

## 📱 Mobile APK & Installation Guide

### Method 1: Android WebAPK (Recommended)
1. Open this app in **Google Chrome** or **Samsung Internet** on your Android device.
2. Tap the browser menu (three dots `⋮`) and select **Install app** or **Add to Home screen**.
3. Android automatically generates a native WebAPK icon on your home screen with full offline access and fullscreen immersion.

### Method 2: Convert to Standalone APK via PWABuilder
1. Deploy your app to Vercel, Cloud Run, or GitHub Pages.
2. Visit [PWABuilder.com](https://www.pwabuilder.com/).
3. Paste the URL and click **Build My PWA**.
4. Choose **Android** -> **Generate Package** to download your signed `.apk` or `.aab` file ready for sideloading or Google Play.

### Method 3: Wrap with Capacitor / Cordova
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Personal Hub" "com.personalhub.app"
npm run build
npx cap add android
npx cap open android
```
In Android Studio, select **Build > Build Bundle(s) / APK(s) > Build APK(s)** to produce `app-debug.apk` or `app-release.apk`.

---

## 🛠️ Local Development & Build

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run TypeScript and production build
npm run build
```
