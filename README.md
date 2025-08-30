# GCP Fullstack Monorepo

## Setup

Enable APIs:

```bash
gcloud services enable texttospeech.googleapis.com speech.googleapis.com translate.googleapis.com vision.googleapis.com videointelligence.googleapis.com aiplatform.googleapis.com
```

## Local Development

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to the backend URL when running or building the frontend.

## Deploy to Cloud Run

```bash
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/my-backend
gcloud run deploy my-backend --image gcr.io/$PROJECT_ID/my-backend --platform managed
```

Then build frontend with deployed backend URL:

```bash
cd frontend
VITE_API_BASE_URL=https://YOUR_BACKEND_URL npm run build
