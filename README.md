# StockGuard

A modern, web-based inventory and sales tracking system designed for Ugandan small businesses. StockGuard helps business owners manage their inventory, track sales, and collaborate with workers seamlessly.

## Features

- 🎨 **Beautiful Design**: Modern UI with light/dark mode support
- 👥 **Role-Based Access**: Separate interfaces for Business Owners and Workers
- 📦 **Inventory Management**: Track products, quantities, and categories
- 💰 **Sales Tracking**: Log sales with automatic inventory updates
- 📊 **Analytics**: View sales data and business insights
- 🔐 **Secure Authentication**: Powered by Supabase Auth
- 📱 **Responsive**: Works perfectly on mobile, tablet, and desktop
- 🌙 **Theme Toggle**: Persistent light/dark mode with smooth transitions

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS with custom design system
- **Backend/Database**: Supabase (PostgreSQL + Auth)
- **State Management**: Zustand
- **Routing**: React Router v6
- **UI Components**: Headless UI
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd StoGuard
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:

   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Run the SQL script from `database/migration-fresh-install.sql` (see `START_HERE.md` for detailed instructions)
   - This will create all tables, functions, and RLS policies

5. Start the development server:

```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthLayout.jsx   # Authentication page layout
│   ├── Button.jsx       # Button component
│   ├── Card.jsx         # Card component
│   ├── DashboardLayout.jsx  # Main app layout
│   ├── Input.jsx        # Input field component
│   ├── Modal.jsx        # Modal dialog component
│   ├── ProtectedRoute.jsx   # Route protection
│   ├── Sidebar.jsx      # Navigation sidebar
│   └── ThemeToggle.jsx  # Theme switcher
├── context/             # React contexts
│   ├── AuthContext.jsx  # Authentication state
│   └── ThemeContext.jsx # Theme state
├── hooks/               # Custom React hooks
│   ├── useAuth.js       # Auth hook
│   └── useTheme.js      # Theme hook
├── pages/               # Page components
│   ├── Dashboard.jsx    # Owner dashboard
│   ├── Home.jsx         # Landing page
│   ├── Login.jsx        # Login page
│   ├── PlaceholderPage.jsx  # Placeholder for future pages
│   └── Signup.jsx       # Signup page
├── services/            # API services
│   ├── auth.service.js  # Authentication service
│   └── supabase.js      # Supabase client
├── App.jsx              # Main app component with routing
├── main.jsx             # App entry point
└── index.css            # Global styles
```

## Design System

### Color Scheme

**Light Mode:**

- Primary: Blue (#3B82F6)
- Secondary: Light Blue (#60A5FA)
- Background: White (#FFFFFF)
- Surface: Light Gray (#F9FAFB)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Error: Red (#EF4444)

**Dark Mode:**

- Primary: Purple (#A855F7)
- Secondary: Light Purple (#C084FC)
- Background: Very Dark Gray (#0F172A)
- Surface: Dark Gray (#1E293B)
- Success: Green (#34D399)
- Warning: Orange (#FBBF24)
- Error: Red (#F87171)

### Components

All components follow the design system and support both light and dark modes. Use the provided component classes:

- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.input-field` - Input fields
- `.card` - Card container
- `.stat-card` - Statistics card

## User Roles

### Business Owner

- Full access to all features
- Manage products and inventory
- View all sales and analytics
- Manage workers and invite codes
- Configure business settings

### Worker

- Log sales only
- View their own sales history
- Limited access to business data

## Database Schema

The database includes the following tables:

- `user_profiles` - User information and roles
- `products` - Product catalog
- `sales` - Sales transactions
- `subscriptions` - Subscription plans
- `business_workers` - Worker-owner relationships
- `invite_codes` - Worker invitation codes

All tables have Row Level Security (RLS) policies enabled for data protection.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

1. Create components in `src/components/`
2. Add pages in `src/pages/`
3. Update routes in `src/App.jsx`
4. Add services in `src/services/` if needed
5. Update database schema if needed

## Production Deployment

1. Build the project:

```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider (Vercel, Netlify, etc.)

3. Ensure environment variables are set in your hosting platform

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For support, email support@stoguard.com or open an issue in the repository.
