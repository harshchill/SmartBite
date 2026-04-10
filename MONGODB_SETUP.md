# SmartBite MongoDB Integration Guide

This project now uses **MongoDB** (via Mongoose) for persistent data storage.

## What is stored in MongoDB

- User accounts (signup/login)
- Orders (customer orders, status updates, admin deletion)

## Prerequisites

- Node.js installed
- MongoDB installed and running locally, or a MongoDB Atlas connection string

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` if needed:
   - `MONGODB_URI` (default: `mongodb://127.0.0.1:27017/smartbite`)
   - `PORT` (default: `3000`)

4. Start the app:
   ```bash
   npm start
   ```

5. Open in browser:
   - `http://localhost:3000`

## How to use

### User flow

1. Open `signup.html` and create an account.
2. Go to `login.html` and login with that account.
3. Place orders from the app.
4. Open `history.html` to see your own order history from MongoDB.

### Admin flow

1. Open `admin-login.html`.
2. Use the existing admin credentials from the page.
3. After login, `admin.html` loads all orders from MongoDB.
4. Admin can:
   - Mark an order as Delivered
   - Delete an order

## API endpoints used by frontend

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/orders`
- `GET /api/orders` (all orders, admin)
- `GET /api/orders?userId=<id>` (user order history)
- `PATCH /api/orders/:id/status`
- `DELETE /api/orders/:id`

## Notes

- Cart/session remains in browser `localStorage`.
- Account and order persistence are now database-backed.
- If MongoDB is not reachable, auth and order features will not work.
