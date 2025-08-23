# College Event Management Admin Panel

A comprehensive admin panel for college administrators to manage events, workshops, combos, registrations, and attendance using React, TailwindCSS, and Supabase.

## 🚀 Features

- **Authentication & Authorization**: Supabase Auth with role-based access control
- **Dashboard**: KPI overview with charts and analytics
- **User Management**: CRUD operations, CSV import/export, role management
- **Event Management**: Create, edit, and manage events with photo uploads
- **Workshop Management**: Schedule workshops with speaker management
- **Combo Packages**: Create event/workshop bundles with pricing
- **Registration Management**: Handle registrations with payment status tracking
- **Attendance Tracking**: QR code scanning for attendance
- **Reports & Analytics**: Export data in CSV/Excel format
- **Responsive Design**: Mobile-friendly admin interface
- **Dark Mode**: Toggle between light and dark themes

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Charts**: Recharts
- **Icons**: Lucide React
- **QR Scanning**: HTML5-QRCode
- **Excel Export**: XLSX
- **Forms**: React Hook Form + Yup validation

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Modern web browser with camera access (for QR scanning)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd admin-panel
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

#### Run the Migration

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Execute the migration

#### Create Storage Buckets

Create the following storage buckets in Supabase:

```bash
profile-photos
event-photos
workshop-photos
combo-photos
```

Set bucket policies to allow authenticated users to upload files.

#### Run the Seed Data

1. In SQL Editor, copy and paste the contents of `supabase/seed.sql`
2. Execute the seed file

### 4. Create First Admin User

1. Go to Authentication > Users in Supabase
2. Create a new user with email: `admin@college.edu`
3. Copy the user's UUID
4. Update the users table:

```sql
UPDATE users 
SET id = 'your-auth-user-uuid' 
WHERE email = 'admin@college.edu';
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` and login with any of these accounts:

**Admin Access:**
- Email: `admin@college.edu` | Password: `admin123`

**Manager Access:**
- Email: `manager@college.edu` | Password: `manager123`

**Handler Access:**
- Email: `handler@college.edu` | Password: `handler123`

**Committee Access:**
- Email: `committee@college.edu` | Password: `committee123`

**Student Access:**
- Email: `john.doe@student.edu` | Password: `student123`

**Note:** The phone number field in the database contains the password for easy testing.

## 🗄️ Database Schema

### Core Tables

- **users**: User profiles with roles (admin, event_manager, event_handler, registration_committee, participant)
- **colleges**: College/institution information
- **fields**: Academic fields (CS, Engineering, etc.)
- **events**: Events with pricing, categories, and capacity
- **workshops**: Workshops with scheduling and speaker management
- **combos**: Event/workshop bundles
- **combo_items**: Links combos to events/workshops
- **registrations**: User registrations for events/workshops/combos
- **attendance**: Attendance logs from QR scanning

### Key Features

- **Polymorphic Relationships**: Registrations can target events, workshops, or combos
- **Automatic Child Registration**: Combo registrations automatically create child registrations
- **Row Level Security**: Comprehensive RLS policies for data security
- **Audit Trail**: Track all changes and actions

## 🔐 Security & RLS

### Row Level Security Policies

The system includes comprehensive RLS policies:

- **Users**: Admins can manage all, users can read their own data
- **Events**: Managers can manage their events, admins have full access
- **Registrations**: Users can read their own, admins/managers can read all
- **Attendance**: Admin-only access

### File Upload Security

- Maximum file size: 1MB
- Allowed formats: JPEG, JPG, PNG
- Client-side validation before upload
- Secure storage with RLS policies

## 📱 Usage Guide

### Dashboard

- View key metrics and KPIs
- Analyze registration trends
- Monitor payment status

### User Management

- Add/edit/delete users
- Assign roles and permissions
- Bulk import/export via CSV
- Photo upload for profiles

### Event Management

- Create tech/non-tech events
- Set pricing and capacity
- Assign managers and handlers
- Upload event photos

### Workshop Management

- Schedule workshops with time slots
- Manage speaker information
- Set capacity and fees
- Track registrations

### Combo Management

- Create event/workshop bundles
- Set combo pricing
- Automatic capacity checking
- Child registration management

### Registration Management

- View all registrations
- Update payment status
- Add transaction IDs
- Export filtered data

### Attendance Tracking

- Select active events/workshops
- QR code scanning interface
- Real-time attendance logging
- Export attendance reports

### Reports

- Generate various report types
- Apply filters and date ranges
- Export to Excel/CSV
- Financial analytics

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`

### Deploy to Netlify

1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify

### Environment Variables for Production

Set the same environment variables in your hosting platform:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 Edge Functions

### Combo Registration Function

The system includes an Edge Function example for transactional combo registration:

- **Location**: `supabase/functions/combo-registration/`
- **Purpose**: Handle combo registrations with capacity checking
- **Features**: Transaction safety, capacity validation, automatic child registration

To deploy:

```bash
supabase functions deploy combo-registration
```

## 📊 API Endpoints

### Supabase Client Usage

The application uses Supabase client for all operations:

```javascript
import { supabase } from './lib/supabase'

// Example: Fetch users
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'admin')
```

### Custom Functions

- **File Upload**: `uploadFile(bucket, file, path)`
- **User Validation**: `isAdmin(userId)`
- **Pagination**: `fetchWithPagination(table, page, filters)`

## 🎨 Customization

### Themes

- Light/dark mode toggle
- Customizable color scheme in `tailwind.config.js`
- Responsive design for all screen sizes

### Components

- Reusable UI components in `src/components/`
- Form components with validation
- Modal dialogs and notifications

### Styling

- TailwindCSS utility classes
- Custom component classes
- Responsive breakpoints

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure RLS policies are correctly set
2. **File Upload Failures**: Check storage bucket permissions
3. **Database Connection**: Verify environment variables
4. **QR Scanner Issues**: Ensure camera permissions are granted

### Debug Mode

Enable debug logging in the browser console for detailed error information.

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section
2. Review Supabase documentation
3. Open an issue in the repository

## 🔄 Updates

### Version History

- **v1.0.0**: Initial release with core functionality
- Complete admin panel with all CRUD operations
- QR scanning and attendance tracking
- Comprehensive reporting system

### Future Enhancements

- Real-time notifications
- Advanced analytics dashboard
- Mobile app companion
- Integration with payment gateways
- Advanced role management
- Audit logging system

---

**Built with ❤️ for college administrators**
