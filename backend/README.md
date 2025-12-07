# StockGuard Backend

Backend server for SMS notifications using Africa's Talking API.

## Features

- ✅ Automatic SMS notifications when new sales are made
- ✅ Multi-item sales support with smart message formatting
- ✅ SMS threshold support (only send for sales above a certain amount)
- ✅ Test SMS endpoint for configuration verification
- ✅ Comprehensive error handling and logging

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_africas_talking_username
FRONTEND_URL=http://localhost:5173
PORT=3000
```

3. Run server:
```bash
npm run dev
```

### Deployment

See [SMS_SETUP_GUIDE.md](./SMS_SETUP_GUIDE.md) for detailed deployment instructions.

## Environment Variables

- `SUPABASE_URL` - Your Supabase project URL (required)
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key (required)
- `AT_API_KEY` - Africa's Talking API key (required for SMS)
- `AT_USERNAME` - Africa's Talking username (required for SMS)
- `FRONTEND_URL` - Your frontend URL (default: http://localhost:5173)
- `PORT` - Server port (Railway sets this automatically)

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/notify-owner` - Send SMS notification for new sale (called by database trigger)
- `POST /api/test-sms` - Send test SMS from frontend

See [SMS_SETUP_GUIDE.md](./SMS_SETUP_GUIDE.md) for detailed API documentation.

## Database Setup

After deploying, you need to set up the database trigger:

1. Update the URL in `database/notification-trigger.sql` with your Railway deployment URL
2. Run the SQL script in Supabase SQL Editor

This trigger automatically calls the backend when a new sale is created.

## Documentation

For complete setup instructions, troubleshooting, and API details, see:
- **[SMS_SETUP_GUIDE.md](./SMS_SETUP_GUIDE.md)** - Complete setup guide

## License

MIT
