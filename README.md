# 🧥 Closet - AI Smart Wardrobe

Closet is a premium, mobile-first web application designed to help you organize your wardrobe, coordinate outfits with an AI-driven styling engine, log daily outfits, and gain insights into your clothing habits.

---

## ✨ Features

- **📸 Visual Closet Cataloging**
  - Use your device's camera or upload photos to inventory your garments.
  - Categorize pieces as **Tops** (shirts, t-shirts, sweaters) or **Bottoms** (pants, trousers, shorts, skirts).
  - Add metadata including colors, patterns, and occasions.

- **📅 Daily Outfit Logger**
  - Keep track of what you wore and when.
  - Build a visual wearing history to understand your outfit rotations.

- **🔮 AI Stylist Consultant**
  - Get coordinate suggestions and compatibility match scores based on **Weather** (Mild, Cold, Hot) and **Occasion** (Casual, Business, Formal, Party, Sports).
  - Evaluates color harmony (Neutral Blend, Accent Pop, Monochromatic) and pattern conflicts.

- **📊 Wardrobe Insights**
  - Visualize your wardrobe composition ratios (Tops vs. Bottoms).
  - Receive automated shopping guide recommendations to fill structural gaps in your closet.

---

## 🛠️ Technology Stack

- **Frontend**: Semantic HTML5 & Modern CSS3 (featuring HSL variables, fluid layouts, glassmorphism elements, and micro-animations).
- **Logic**: Vanilla JavaScript (ES6+) with offline-first local storage persistence.
- **Camera Integration**: MediaDevices Web API for direct live capture fallbacks.

---

## 🚀 Getting Started

Since the app is built using vanilla technologies with no heavy build systems, running it is simple:

1. **Clone/Download** the repository:
   ```bash
   git clone https://github.com/jkishan783-ux/Closet.git
   cd Closet
   ```

2. **Open the Application**:
   - Double-click [index.html](file:///c:/Users/jkish/OneDrive/Desktop/Clothes/index.html) in your file explorer to run it directly in your web browser.
   - Alternatively, serve it locally using any static web server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js (npx)
     npx serve .
     ```

---

## 📂 Project Structure

- `index.html` — The main structure of the single-page application.
- `styles.css` — Modern responsive stylesheet with styling tokens and utilities.
- `app.js` — Core application logic, wardrobe database, and AI coordination algorithm.
