import dedent from "dedent";

export const formatPrompt = dedent(`

Design a dark-themed mobile event ticketing app using React Native or Flutter that allows users to search for and manage tickets for events. Focus on an intuitive user experience with smooth transitions, elegant filtering, and modern visual style. Use bright accent colors (such as yellow) for emphasis and interactivity.


### 📱 Screens & Features

#### 1. Search & Filter Screen

* Search bar at the top with a filter icon (opens filter drawer or modal).
* Event Category Selector with horizontally scrollable icons (e.g., All, Music, Tour, Education, Sports).
* Ticket Price Range displayed as a bar chart histogram with adjustable sliders.
* Event Location Selector with dropdown city selector.
* Distance Range Filter using double slider (e.g., from 10 km to 50 km).
* Reset and Apply buttons at the bottom, styled with glowing accent buttons (bg-yellow-400, rounded-full, etc.).

#### 2. Ticket Detail Screen

* Event Photo Banner on top with rounded corners.
* Event details:

  * Title: *Oliver Tree Concert: Indonesia*
  * Date: *29 December 2024*
  * Time: *10:00 PM*
  * Venue: *Gelora Vang Karno*
  * Seat: *No Seat*
* Barcode / QR code section styled like a real ticket.
* Bottom action buttons:

  * Get a Ticket (bright call-to-action)
  * QR Code (for scan-ready ticket access)

---

### 🛠 Tech Stack Suggestions

* React Native (Expo) or Flutter
* Use Tailwind-like utility classes (e.g., NativeWind or custom styles) for consistent spacing and styling
* Ensure gesture navigation support and animation transitions between screens
* Components should be modular and reusable

---

### 🌗 Design Style

* Dark theme background (#121212 or #0f0f0f)
* Neon or soft yellow accent color (#FFD600)
* Smooth sliders and interactive icons
* Rounded UI elements and drop shadows for depth

`);