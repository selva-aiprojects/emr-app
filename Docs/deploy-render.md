# Deploying to Render

The easiest way to deploy is using the **Render Blueprint** included in this repository (`render.yaml`).

## Steps

1.  **Register/Login** at [render.com](https://render.com/).
2.  Click **New +** and select **Blueprint**.
3.  Connect your **GiLab/GitHub repository**.
4.  Render will auto-detect `render.yaml`.
5.  **Enter Environment Variables** when prompted:
    *   `DATABASE_URL`: (Copy from your `.env`)
    *   `JWT_SECRET`: (Copy from your `.env`)
6.  Click **Apply**.

## Manual Setup (If Blueprint fails)

1.  Create a **Web Service**.
2.  **Build Command:** `npm install && npm run build`
3.  **Start Command:** `npm start`
4.  **Environment Variables:**
    *   `DATABASE_URL`
    *   `JWT_SECRET`
    *   `JWT_EXPIRES_IN` = `7d`
    *   `NODE_VERSION` = `20`
