# ■ GoQuest Transit
**GoQuest Transit** is an integrated **travel discovery and last-mile connectivity platform** that
helps users **plan trips, discover attractions, and connect with local transport options** — all in one
place. It combines **AI-driven itinerary generation**, **multimodal route planning**, and **real-time
price comparison** to make travel planning smarter and more efficient.
---
## ■ Project Overview
GoQuest Transit bridges the gap between **travel exploration** (GoQuest) and **urban mobility**
(Transit). Our mission is to build a system that not only suggests where to go — but also **how to
get there efficiently**, covering **last-mile transportation** and **cost optimization**.
The platform aims to: 
- Discover top destinations and POIs for a chosen city or theme. 
- Generate optimized multi-stop itineraries based on time, distance, and user preferences. 
- Provide multimodal transport routes (metro, bus, cab, bike, walk). 
- Compare prices and estimated travel times across options. 
- Integrate last-mile route recommendations to complete each journey.

---
## ■ Key Features Implemented So Far
| Module | Description | Status | 
|--------|--------------|--------| 
| ■■ Travel Discovery (GoQuest) | Fetches city-based POIs and attractions dynamically using public APIs. | ■ Completed | 
| ■ AI-Based Itinerary Generation | Suggests multi-day itineraries and optimized order of visits. | ■ Completed | 
| ■ Transit & Last-Mile Module | Models last-mile connectivity (e.g., cab, rickshaw,bike-share). | ■ In Progress | 
| ■ Price Comparison Engine | Aggregates fare data from multiple travel APIs. | ■ In Progress | 
| ■■ Backend Integration (Flask) | API layer connecting AI module,data layer, and frontend. | ■ Completed | 
| ■ Frontend (React + Vite) | Dynamic UI with search, results, and itinerary visualization. | ■ In Progress | 
| ■ Data Generation Utility (Python) | Random travel and user data generator for testing. | ■ Completed | 
| ■ Documentation & Report | Full technical report and research references. | ■ Ongoing |
---

## ■ Tech Stack
Frontend: React.js (Vite), TailwindCSS, Axios 
Backend: Flask (Python), REST API 
Database: SQLite / JSON (prototype phase), PostgreSQL
AI/ML Layer: Python (OpenAI API integration planned) 
Mapping & Routing: Google Maps API / OpenStreetMap 
Version Control: Git & GitHub
---
## ■ System Architecture
Frontend (React + Vite) → Flask Backend (API Layer) → Itinerary Engine → Routing & Price APIs
→ Database
---
## ■ Research & Reference Papers
We’ve reviewed 20+ academic papers covering: - AI-based Itinerary Generation - Multimodal Route
Optimization - Last-Mile Connectivity Models - POI Recommendation Algorithms - Travel Time
Prediction using ML
---
## ■■ Roadmap & Future Scope
| Milestone | Description | Target | 
|------------|--------------|--------| 
| ■ AI Integration | Integrate LLM-based recommendation for itinerary personalization. | Nov 2025 | 
| ■ Dynamic Routing | Add multi-modal route computation using open-source routing engines (e.g., Valhalla / OTP). | Dec 2025 | 
| ■ Price Aggregation | Real-time fare comparison across cabs, metro, and bus APIs. | Dec 2025 |
| ■ Mobile Version | React Native / Flutter app prototype. | Jan 2026 | 
| ■ Real-Time Updates | Include live traffic and weather API integration. | Jan 2026 | 
| ■ Authentication | Add user accounts, saved trips, and secure login. | Feb 2026 |
---
## ■■ Setup Instructions
1. Clone Repository git clone https://github.com//GoQuest-Transit.git cd GoQuest-Transit
2. Run Backend (Flask) cd backend pip install -r requirements.txt python app.py
3. Run Frontend (React) cd frontend npm install npm run dev
4. Test Data Generator cd data-generator python generate_users.py
---
## ■ Key Learnings
- Integrated AI itinerary logic with API-driven travel data 
- Designed a scalable Flask + React architecture 
- Learned about multimodal routing and last-mile connectivity problems 
- Implemented mock datasets for realistic testing 
- Understood research techniques behind tourism recommender systems

---
## ■ Contributors
| Name | Role | Area | 
|------|------|------| 
| Viha Bhat | Project Lead | Full-Stack + AI Integration |
---
## ■ License
This project is licensed under the MIT License — free to use and modify with credit.
---
## ■ Acknowledgments
Special thanks to: - Faculty mentors for guidance and evaluation - OpenTripPlanner, Valhalla, and
public data APIs for inspiration - Academic research community for foundational work on
multimodal routing & itinerary planning