# BigBite

A full-stack food ordering & discovery platform with  AI-powered recommendations, and Razorpay payments.

Built with **React + Vite** on the frontend and **Express + MongoDB** on the backend.

## Features

- **Restaurant Browsing** — search, filter, and explore restaurant menus
- **Cart & Checkout** — add items, apply coupons, pay via Razorpay
- **Order Tracking** — real-time order status and history
- **AI Recommendations** — powered by Gemini API for smart food suggestions
- **Auth System** — JWT-based signup/login with email verification & password reset
- **Restaurant Dashboard** — owners can manage menus, orders, and view insights
- **Cloudinary Uploads** — image hosting for food items and restaurant profiles

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Redux Toolkit, React Router, Tailwind CSS, Vite |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Payments | Razorpay |
| Media | Cloudinary |
| AI | Google Gemini API |
| Email | Nodemailer + Pug templates |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Cloudinary account
- Razorpay test keys
- Gemini API key

### Setup

```bash
# clone the repo
git clone https://github.com/SumedhPrabhu/BigBite
cd BigBite

# install all dependencies
npm run install:all

# configure environment variables
cp backend/config/config.env.example backend/config/config.env
# fill in your keys in config.env

# run both servers
npm run dev
```

Frontend runs on `http://localhost:5173` and backend on `http://localhost:4000`.

## Project Structure

```
Snackr/
├── backend/
│   ├── config/          # DB, Cloudinary, env config
│   ├── controllers/     # Route handlers
│   ├── middlewares/      # Auth, error handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API endpoints
│   ├── services/         # AI, recommendations, seeder
│   ├── utils/            # Helpers (email, tokens, seeder)
│   └── view/             # Pug email templates
├── frontend/
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # React components
│       ├── redux/        # Store, slices, actions
│       └── utils/        # API config
└── package.json          # Monorepo scripts
```

## License

MIT
