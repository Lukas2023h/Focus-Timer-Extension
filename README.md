# 🧩 Focus Timer - Chrome Extension

> A powerful Chrome Extension designed to eliminate digital distractions through a synchronized Website Blocker and an engaging Statistics Dashboard.

---

## 🛠 Technologies
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![Chrome](https://img.shields.io/badge/Chrome_Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)
![ExtPay](https://img.shields.io/badge/Payments-ExtPay.js-blueviolet?style=for-the-badge&logo=stripe&logoColor=white)

---

## 🦄 Features

* **Adjustable Core Timer** – A fully customizable timer that serves as the central tracking engine of the application.
* **Engagement Statistics** – Features an immersive analytics page to boost user retention and track progress locally.
* **Smart Website Blocker** – Automatically blocks attention-grabbing websites (like Instagram) to ensure you stay in the flow.
* **Premium Integration** – Leverages `ExtPay.js` for secure payment processing, offering a subscription and one-time purchase model for advanced features.

---

## 👩🏽‍🍳 Development Process

### 1. Project Initiation
I focused on core utility: solving digital distractions. My initial goal was to create a functional synergy between a `Customizable Timer` and an `Active Website Blocker`, tied directly to the timer's state.

### 2. Key Implementation Steps
Once the core engine was running, I prioritized **User Retention**. I built a `Statistics Page` to transform raw tracking data into visual progress, allowing users to see their long-term growth.

### 3. Technical Decisions & Monetization
I chose to implement a **Premium Tier** using `ExtPay.js`. This allowed me to learn how to bridge the gap between free and paid software by integrating an external payment provider into the extension's ecosystem.

### 4. Finalization and Testing
I conducted alpha testing personally and with friends to understand how "normal" users interact with the timer and ensured the local data persistence was reliable across sessions.

---

## 📚 What I Learned

### 🧠 Concept / Topic
* **Extension Architecture:** Gained a deep understanding of `Service Workers` and how they handle background tasks and event-driven logic.
* **Data Lifecycle:** Learned to balance data persistence with storage limits by implementing an automatic purge system for records older than 30 days.

### 📏 Technical Skill
* **Local Data Persistence:** Mastered using `chrome.storage.local` to store user-specific statistics directly in the browser, ensuring privacy and fast access without an external database.
* **Storage Optimization:** Implemented logic to prevent storage overflow by cleaning up old entries, ensuring a smooth experience during long-term usage.

### 🎣 Framework / Tool
* **ExtPay.js & Stripe:** Successfully integrated `ExtPay.js` to handle secure `Stripe` checkouts. This simplified the process as the library manages user licenses and payment status automatically.
* **Documentation Research:** Learned to implement features by analyzing official documentation and testing provided boilerplate code.

---

## 🚦 Getting Started

### For Users
The easiest way to use the Focus Timer is to install it directly from the **Chrome Web Store**:
👉 [**Coming soon to the Chrome Web Store**](#)
