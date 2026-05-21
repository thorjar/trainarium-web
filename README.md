# Trainarium - Gamified Data Labeling Platform

Trainarium is a collaborative web platform for labeling and verifying training data for machine learning models. It provides a clean, intuitive interface inspired by AWS dashboards where teams can upload data, label it collaboratively, and verify quality.

## Features

### 🚀 Core Features

- **User Authentication**: Secure sign-up and login with email/password or Google OAuth
- **Data Upload**: Import CSV, JSON, and Excel files with automatic parsing
- **Collaborative Labeling**: Team members can label data with progress tracking
- **Quality Verification**: Review and verify labels before using for training
- **Dashboard**: AWS-like interface showing projects, statistics, and progress
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🎯 Three Main Workflows

1. **Upload Data** - Import raw datasets and organize them into projects
2. **Label Data** - Contribute labels to datasets with progress tracking
3. **Verify Labels** - Review labeled data and ensure quality

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL (Neon.tech recommended)
- **Authentication**: NextAuth.js with Google OAuth & Credentials
- **ORM**: Prisma
- **UI Components**: Lucide React icons, custom Tailwind components

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (Neon.tech recommended)
- Google OAuth credentials (optional for social login)

### Installation

1. **Clone and install dependencies**

   ```bash
   cd trainarium-web
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your configuration:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/trainarium"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

3. **Set up the database**

   ```bash
   npm run prisma:push  # This will be available after adding Prisma scripts
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
trainarium-web/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication routes
│   │   └── datasets/       # Dataset endpoints
│   ├── auth/               # Authentication pages (login, signup)
│   ├── dashboard/          # Dashboard pages
│   │   ├── upload/         # Data upload
│   │   ├── label/          # Label data
│   │   └── verify/         # Verify labels
│   ├── auth.ts            # NextAuth configuration
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # Reusable UI components
│   ├── header.tsx         # Navigation header
│   └── sidebar.tsx        # Dashboard sidebar
├── lib/
│   ├── prisma.ts          # Prisma client
│   └── auth-utils.ts      # Authentication utilities
├── prisma/
│   └── schema.prisma      # Database schema
├── public/                # Static assets
└── package.json           # Dependencies
```

## Database Schema

The database includes the following main entities:

- **User**: User accounts with authentication details
- **Dataset**: Collections of data items to label
- **DataItem**: Individual items within a dataset
- **Label**: Labels created by users for data items
- **Verification**: Verification records for labeled data

See `prisma/schema.prisma` for the complete schema.

## Available Scripts

Add these to your `package.json` scripts:

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run linting
npm run prisma:push # Sync database schema
npm run prisma:studio # Open Prisma Studio
```

## Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

### Neon.tech Database Setup

1. Create account at [neon.tech](https://neon.tech)
2. Create a new PostgreSQL database
3. Copy connection string to `DATABASE_URL` in `.env.local`
4. Ensure SSL mode is enabled: `?sslmode=require`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth routes

### Datasets

- `GET /api/datasets` - List user's datasets
- `POST /api/datasets/upload` - Upload new dataset

### Labeling (coming soon)

- `POST /api/datasets/:id/labels` - Create label
- `GET /api/datasets/:id/items` - Get items to label

### Verification (coming soon)

- `POST /api/datasets/:id/verify` - Verify label
- `GET /api/datasets/:id/verification-queue` - Get items to verify

## File Upload Specifications

### Supported Formats

- **CSV**: Tab or comma-separated with headers
- **JSON**: Array of objects
- **Excel**: `.xlsx` files

### Guidelines

- Maximum file size: 100MB
- CSV/Excel must include column headers
- Each row represents one data item
- Consistent data types across columns recommended

## Security

- Passwords are hashed using bcryptjs (10 salt rounds)
- NextAuth.js for session management
- JWT tokens with 30-day expiration
- Environment variables for sensitive data
- Prisma adapter for database security

## Performance Considerations

- CSV parsing done client-side with papaparse
- Pagination for large datasets (implement as needed)
- Database indexing on commonly queried fields
- Caching strategy using Next.js ISR (implement as needed)

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall/network settings
- For Neon.tech: verify project is active

### Authentication Issues

- Ensure `NEXTAUTH_SECRET` is set
- Verify Google OAuth credentials
- Check callback URL configuration
- Clear browser cookies and try again

### File Upload Issues

- Check file format is supported
- Verify file size < 100MB
- Ensure proper CSV/JSON structure
- Check browser console for parse errors

## Future Enhancements

- [ ] Team collaboration features
- [ ] Leaderboards and gamification
- [ ] Advanced data filtering and search
- [ ] Batch operations for labeling
- [ ] Export labeled data to various formats
- [ ] Integration with ML training pipelines
- [ ] Real-time collaboration updates
- [ ] Custom label schemes and validation rules

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check existing documentation
- Review FAQ section

## Acknowledgments

- Inspired by AWS Dashboard design
- Built with Next.js and Prisma
- Icons from Lucide React
- Styling with Tailwind CSS
