# System Components

- **Scraper Service:** Fetches articles from RSS feeds and websites.
- **Processing Pipeline:** Cleans text, generates embeddings, clusters articles, and enriches with bias/sentiment analysis.
- **Backend API (Express):** Serves data to the frontend, handles authentication, caching, and business logic.
- **Database (PostgreSQL):** Stores articles, embeddings, clusters, sources, and analytics.
- **Cache (Redis):** Speeds up frequent API queries and stores temporary computation results.
- **Frontend (Next.js):** User interface with visualizations for clusters, bias, sentiment, and story comparisons.
- **Auth (Auth0 or Firebase Auth):** Handles login, tokens, and user session management.
- **Infrastructure (Docker + Render):** Deployment environment for frontend, backend, and worker services.
- **CI/CD (GitHub Actions):** Automates testing and deployment.
- **Cron Jobs:** Trigger daily scraping and clustering tasks.

# Data Flow

1. Scraper pulls articles from RSS feeds.
2. Raw data is parsed, cleaned, and stored in PostgreSQL.
3. Embeddings are generated using Hugging Face models.
4. Clustering groups articles into related story groups.
5. Bias and sentiment analysis enriches clusters.
6. Express API serves data to the frontend with Redis caching.
7. Next.js frontend renders visualizations using D3.js or Recharts.
8. Auth service handles user login and personalization.

# Technology Stack

- **Backend:** Node.js, Express  
- **Database:** PostgreSQL (+ pgvector)  
- **Cache:** Redis  
- **ML/NLP:** Hugging Face Transformers  
- **Frontend:** Next.js, Tailwind CSS, D3.js / Recharts  
- **Auth:** Auth0 or Firebase Auth  
- **Infra:** Docker, Render  
- **CI/CD:** GitHub Actions  
- **Scheduler:** Cron jobs via Render  
