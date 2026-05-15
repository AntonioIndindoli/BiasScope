# BiasScope

BiasScope is an AI-powered news intelligence platform that aggregates articles from across the political spectrum, clusters related stories using semantic embeddings, and visualizes bias, sentiment, and narrative framing. It helps users understand how different outlets cover the same event, revealing patterns, angles, and media narratives.

---

## Features

* **News Scraping Pipeline**: Automatically fetches articles daily using RSS feeds.
* **Semantic Story Clustering**: Groups related articles using Hugging Face embeddings.
* **Bias & Sentiment Analysis**: Tags outlets by political leaning and computes sentiment/emotional tone.
* **Next.js Frontend Dashboard**: Visualizes coverage differences with D3.js / Recharts.
* **Redis Caching Layer**: Speeds up API responses.
* **Auth0/Firebase Authentication**: Secure user login, bookmarks, and personalized insights.
* **Dockerized Deployment**: Fully containerized for local development and cloud deployment.
* **Automated CI/CD**: GitHub Actions for testing and deployment.

---

## Tech Stack

### **Backend**

* Node.js (Express)
* PostgreSQL + pgvector
* Redis (caching)
* Hugging Face Transformers

### **Frontend**

* Next.js (React)
* Tailwind CSS
* D3.js / Recharts
* Auth0 or Firebase Auth

### **Infrastructure**

* Docker
* Render (deployment)
* GitHub Actions (CI/CD)
* CRON (scheduled scraping)

---

## Architecture Overview

```
[RSS/News Sources]
        |
        v
  [Scraper Service] --> [NLP Processing Pipeline] --> [PostgreSQL]
                                           |             ^
                                           v             |
                                        [Redis Cache]   |
                                           |             |
                                           v             |
                                       [Express API] ----
                                             |
                                             v
                                       [Next.js UI]
```

---

## 📦 Project Structure

```
BiasScope/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── db/
│   │   ├── utils/
│   │   └── workers/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── package.json
├── infra/
│   ├── docker-compose.yml
└── README.md
```

---

## Setup Instructions

### **1. Clone the Repository**

```
git clone https://github.com/yourname/BiasScope.git
cd BiasScope
```

### **2. Create Environment Files**

Copy `.env.example` in both **backend/** and **frontend/**.

### **3. Run with Docker**

```
docker-compose up --build
```

App will run at:

* Backend: `http://localhost:4000`
* Frontend: `http://localhost:3000`

---

##  Running the Scraper

The scraper runs automatically via CRON, but you can trigger it manually:

```
node scraper/rss-scraper.js
```

---

## Testing

```
curl http://localhost:4000/api/health
npm run test
```

---

## Deployment

BiasScope uses:

* **Render Web Service** for Backend
* **Render Background Worker** for Scraper
* **Render PostgreSQL + Redis** services
* **Vercel** for Frontend

Deploy easily with GitHub Actions CI/CD.

---
