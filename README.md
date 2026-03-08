# Zypher

A full-stack application featuring a Next.js frontend, a Python Machine Learning service, and a Supabase database.

## Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- Supabase account

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new project on [Supabase](https://supabase.com).
2. Run the SQL scripts found in the `database/` folder in your Supabase SQL Editor:
   - First, run `database/schema.sql` to initialize tables.
   - Then, run `database/seed.sql` to populate initial data.
3. Retrieve your Project URL and Anon Key from the Supabase API settings.

### 2. Frontend Setup (Next.js)

1. Open a terminal and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000).

### 3. Backend Setup (Python ML Service)

1. Navigate to the Python service directory:
   ```bash
   cd python-ml-service
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate # On Windows use `venv\Scripts\activate`
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the ML service:
   ```bash
   python main.py
   ```

## Deployment

### Frontend (Vercel)

The easiest way to deploy the Next.js frontend is via the [Vercel Platform](https://vercel.com/new).

1. Connect your GitHub repository to Vercel.
2. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as Environment Variables in the Vercel dashboard.
3. Deploy! Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Python Backend (Render)

This project includes a `render.yaml` configuration for seamless deployment of the Python ML Service on [Render](https://render.com).

1. Connect your repository to Render.
2. Render will automatically detect the `render.yaml` blueprint to provision and deploy the Web Service.
3. Ensure to configure any required environment variables in the Render dashboard if needed for the ML models.
