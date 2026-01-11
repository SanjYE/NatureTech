# Deployment Guide: NatureTech Mobile Dashboard

This document outlines the architecture, constraints, and step-by-step process used to deploy the NatureTech application to Google Cloud Platform (GCP).

## 🏗️ Architecture

*   **Frontend:** React (Vite) hosted on **Firebase Hosting** (Publicly accessible).
*   **Backend:** Node.js/Express API hosted on **Cloud Run** (Serverless).
*   **Database:** PostgreSQL hosted on **Cloud SQL** (Private IP only).
*   **Connectivity:** Cloud Run connects to Cloud SQL via **Direct VPC Egress**.

## 🚧 Organization Policies & Constraints

This deployment was designed to navigate specific security policies enforced by the organization (`terragrn.cloud`):

1.  **`constraints/sql.restrictPublicIp`**:
    *   **Constraint:** Cloud SQL instances cannot have a Public IP.
    *   **Solution:** We created the instance with **Private IP** only and used **Direct VPC Egress** in Cloud Run to connect securely via the internal network.

2.  **`constraints/iam.allowedPolicyMemberDomains`**:
    *   **Constraint:** IAM roles cannot be granted to `allUsers` (public), limiting access to organization members only.
    *   **Impact:** This initially prevented the Backend API from being public, causing 403 errors on the frontend.
    *   **Solution:** This policy had to be overridden at the Project level in the Google Cloud Console to allow public access.

---

## 🚀 Step 1: Backend Deployment

### 1.1 Prerequisites
Ensure you have the Google Cloud SDK installed and authenticated:
```bash
gcloud auth login
gcloud config set project nature-tech-484011
```

### 1.2 Database Setup (Cloud SQL)
Since public IPs are blocked, we use Private IP networking.

1.  **Enable APIs:** `servicenetworking.googleapis.com`, `sqladmin.googleapis.com`.
2.  **Configure Private Access:**
    ```bash
    gcloud compute addresses create google-managed-services-default \
        --global --purpose=VPC_PEERING --prefix-length=16 --network=default
    
    gcloud services vpc-peerings connect \
        --service=servicenetworking.googleapis.com \
        --ranges=google-managed-services-default \
        --network=default
    ```
3.  **Create Instance:**
    ```bash
    gcloud sql instances create naturetech-db-v2 \
        --database-version=POSTGRES_15 \
        --cpu=1 --memory=3840MiB --region=us-central1 \
        --no-assign-ip \
        --network=default
    ```

### 1.3 Build & Deploy API (Cloud Run)
We use **Direct VPC Egress** to connect to the private database without needing a complex Serverless VPC Connector.

1.  **Build Container:**
    ```bash
    cd server
    gcloud builds submit --tag gcr.io/nature-tech-484011/naturetech-backend
    ```

2.  **Deploy Service:**
    ```bash
    gcloud run deploy naturetech-backend \
      --image gcr.io/nature-tech-484011/naturetech-backend \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --network=default \
      --subnet=default \
      --vpc-egress=private-ranges-only \
      --set-env-vars "DATABASE_URL=postgresql://postgres:PASSWORD@10.17.0.3:5432/naturetech_db"
    ```
    *Note: `10.17.0.3` is the Private IP of the Cloud SQL instance.*

### 1.4 Resolving the Public Access Block
If `gcloud run deploy` warns that it cannot set IAM policy, or if the API returns 403 to external users:

1.  Go to **Google Cloud Console** > **IAM & Admin** > **Organization Policies**.
2.  Search for **"Domain restricted sharing"** (`iam.allowedPolicyMemberDomains`).
3.  Click **Edit** (Manage Policy).
4.  Select **Override parent's policy**.
5.  Add a rule: **Allow All**.
6.  Click **Save**.
7.  Run the binding command again:
    ```bash
    gcloud run services add-iam-policy-binding naturetech-backend \
        --region=us-central1 \
        --member=allUsers \
        --role=roles/run.invoker
    ```

---

## 🌐 Step 2: Frontend Deployment

### 2.1 Configuration
1.  **Update Environment:**
    Ensure `.env.production` points to the Cloud Run URL:
    ```
    VITE_API_BASE_URL=https://naturetech-backend-309364353096.us-central1.run.app
    ```

2.  **Firebase Config (`firebase.json`):**
    We configured Firebase to serve the `build` directory (default output of `vite build`).
    ```json
    {
      "hosting": {
        "site": "naturetech-app-v1",
        "public": "build",
        ...
      }
    }
    ```

### 2.2 Build & Deploy
```bash
# Install Dependencies
npm install

# Build for Production
npm run build

# Deploy to Firebase
npx firebase login
npx firebase deploy --only hosting
```

## 🔗 Final Links
*   **App URL:** [https://naturetech-app-v1.web.app](https://naturetech-app-v1.web.app)
*   **Backend Health Check:** [https://naturetech-backend-309364353096.us-central1.run.app/](https://naturetech-backend-309364353096.us-central1.run.app/)
