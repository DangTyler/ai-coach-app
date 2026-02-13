# RevenueCat dashboard setup & production keys

This app uses **RevenueCat** for in-app subscriptions. The SDK is already integrated; you need to configure the dashboard and add production API keys for real IAP.

---

## 1. Dashboard setup (app.revenuecat.com)

### 1.1 Create or open your project

- Go to [RevenueCat](https://app.revenuecat.com) and sign in.
- Create a project (e.g. “AI Coach App”) or open the one you use for the test key.

### 1.2 Connect app stores

- **Project → Apps → + New**
- Add your **iOS app** (bundle ID must match your Xcode/Expo app, e.g. `com.yourapp.aicoach`).
- Add your **Android app** (package name must match, e.g. `com.yourapp.aicoach`).
- Follow the prompts to connect **App Store Connect** (Shared Secret, In‑App Purchases) and **Google Play** (service account, in-app products).

### 1.3 Create entitlement

- **Project → Entitlements → + New**
- **Identifier:** `AI Coach App Pro` (must match exactly — it’s used in code as `PRO_ENTITLEMENT_ID`).
- Save.

### 1.4 Add products (store side first)

**iOS (App Store Connect):**

- **App → In-App Purchases → +**  
  Create subscription products, e.g.:
  - **Monthly** (subscription, 1 month)
  - **Yearly** (subscription, 1 year)
  - **Lifetime** (non-consumable or non-renewing subscription, depending on your choice)

Note the **Product IDs** (e.g. `monthly`, `yearly`, `lifetime`).

**Android (Google Play Console):**

- **Monetize → Products → Subscriptions**  
  Create the same products and use the same (or matching) product IDs.

### 1.5 Add products in RevenueCat

- **Project → Products → + New**
- For each store (Apple / Google), add the product and enter the **Product ID** from that store.
- Attach each product to the entitlement **AI Coach App Pro**.

### 1.6 Create offering

- **Project → Offerings → + New**
- Create an offering (e.g. **Default**).
- Add **Packages**: e.g. **Monthly**, **Yearly**, **Lifetime**, each linked to the correct product and entitlement.
- Set one offering as **Current** (used when the app calls `presentPaywall()` with no specific offering).

### 1.7 Design paywall

- **Project → Paywalls → + New**
- Use the paywall editor to choose template, copy, and which packages to show (Monthly, Yearly, Lifetime).
- Attach the paywall to your **Current** offering (or the offering you use in the app).

---

## 2. Production API keys

- **Project → Project Settings → API Keys**
- You’ll see:
  - **Public app-specific API key** for **Apple** (iOS)
  - **Public app-specific API key** for **Google** (Android)
- Copy each key and put it in your app’s environment.

### 2.1 In this repo

- Open **`.env`** in the project root.
- Set (replace with your real keys from the dashboard):

```env
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_xxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_xxxxxxxxxxxx
```

- Keep **`EXPO_PUBLIC_REVENUECAT_API_KEY`** as a fallback/test key if you want; the app uses the iOS/Android key when present for that platform.

### 2.2 EAS / production builds

- In **EAS** (or your CI), set the same env vars for the build:
  - `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`
  - `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`
- So production builds use production keys; local `.env` can keep the test key for dev.

---

## 3. How the app picks the key

- **iOS:** uses `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` if set, else `EXPO_PUBLIC_REVENUECAT_API_KEY`.
- **Android:** uses `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` if set, else `EXPO_PUBLIC_REVENUECAT_API_KEY`.
- So you can set only the production keys in production and leave the single key for local/testing.

---

## 4. Quick checklist

| Step | Where | What |
|------|--------|------|
| 1 | Dashboard | Create entitlement **AI Coach App Pro** |
| 2 | App Store Connect / Play Console | Create products (Monthly, Yearly, Lifetime) |
| 3 | Dashboard → Products | Add those products and attach to **AI Coach App Pro** |
| 4 | Dashboard → Offerings | Create offering (e.g. Default) and add packages |
| 5 | Dashboard → Paywalls | Create paywall and attach to offering |
| 6 | Dashboard → API Keys | Copy iOS and Android public keys |
| 7 | `.env` / EAS | Set `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` and `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` |

After this, the in-app paywall and Customer Center will use your real products and production keys on device.
