# ✨ VibeRoom — Collaborative AI Trip War Room

**VibeRoom** is a full-stack, real-time collaborative trip planning web application ("War Room") where travel squads can create shared rooms using unique invite codes, generate AI-curated itineraries, vote on stays/activities/food, lock or unlock final plans, chat in real time, and automatically split trip expenses per person.

---

## 🚀 Key Features

- **🔐 Authentication & Squad Rooms:** Register/login securely and create or join collaborative trip rooms via unique 6-character invite codes (`WAR-XXXXXX`).
- **✨ AI Itinerary Generator:** One-click smart itinerary generation tailored to destination, dates, and group budget across _Stay_, _Activity_, and _Food_ categories.
- **🗳️ Democratic Voting & Lock/Unlock Polls:** Real-time upvote (`▲`) and downvote (`▼`) system with toggleable **Lock / Unlock** controls so squads can finalize or revisit plans anytime.
- **💸 Automatic Squad Expense Split Tracker:** Live expense logging that dynamically calculates total spend and auto-splits per-person cost as new members join the room.
- **💬 Live Squad Chat:** Real-time room messaging with live sync across multiple connected users.
- **🐳 Dockerized Architecture:** Ready-to-run multi-container setup (`docker-compose.yml`) orchestrating Spring Boot and MySQL 8.0.

---

## 🛠️ Tech Stack

- **Backend:** Java, Spring Boot 3.2.5, Spring Data JPA, Spring Security, REST APIs, Maven
- **Database:** MySQL 8.0
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript (Fetch API & Live Polling)
- **DevOps / Containerization:** Docker & Docker Compose

---

## 📂 Project Structure

```text
Internmo/
├── backend/
│   ├── src/main/java/com/airbnb/backend/
│   │   ├── config/        # Security & CORS Configuration
│   │   ├── controller/    # REST API Controllers (Auth, Trip, Itinerary, Expense, Chat, AI)
│   │   ├── model/         # JPA Entities (User, Trip, TripMember, ItineraryItem, Expense, ChatMessage)
│   │   └── repository/    # Spring Data JPA Repositories
│   ├── pom.xml
│   └── Dockerfile
├── Frontend/
│   ├── index.html         # Glassmorphism Dark UI
│   └── app.js             # Frontend State, API Integration & Live Polling
├── docker-compose.yml     # Multi-container Spring Boot + MySQL Setup
└── README.md
```
