# Visit Dzaleka

A modern visitor management and tour booking platform.

## About

Visit Dzaleka is a comprehensive web application designed to streamline tour bookings, visitor coordination, and guide management. Built with a focus on user experience and operational efficiency.

## Features

- **Tour Booking System** - Schedule and manage guided tours with flexible pricing
- **Guide Management** - Coordinate tour guides with availability scheduling
- **Multi-Role Access** - Role-based dashboards for admins, guides, and visitors
- **Security Module** - Visitor check-in/out and incident tracking
- **Analytics Dashboard** - Track bookings, revenue, and visitor engagement
- **Email Notifications** - Automated booking confirmations and updates
- **Mobile Responsive** - Optimized for all device sizes

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, PostgreSQL
- **Authentication**: Session-based with bcrypt encryption
- **Email**: Transactional email integration

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Email service credentials (optional)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following:

```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
RESEND_API_KEY=your_email_api_key (optional)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Sync database schema |

## Project Structure

```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
├── server/          # Express backend
│   ├── routes.ts    # API routes
│   ├── storage.ts   # Database layer
│   └── lib/         # Server utilities
├── shared/          # Shared types/schemas
└── dist/            # Production build
```

## License

Private - All rights reserved.

## Links

- [Book a Tour](https://services.dzaleka.com/visit/)
- [Privacy Policy](https://services.dzaleka.com/privacy/)
- [Terms of Service](https://services.dzaleka.com/terms/)
