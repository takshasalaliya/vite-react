# 🎭 INNOSTRA'25 Event Management System

> **Welcome to the Upside Down of Event Management!** 

A revolutionary, Stranger Things-themed event management system built with React, Supabase, and advanced UI/UX design. This system manages college events, workshops, registrations, and provides role-based access control for different user types.

## 🌟 Features

### 🎨 **Advanced UI/UX Design**
- **Stranger Things Theme**: Complete with 3D animations, floating elements, and portal effects
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Animations**: Particle systems, character floating, and success animations
- **Dark Mode**: Cinematic dark theme with purple and red accents

### 👥 **Role-Based Access Control**
- **Admin**: Full system access and user management
- **Event Manager**: Create and manage events/workshops
- **Event Handler**: Handle specific events and track attendance
- **Registration Coordinator**: Manage participant registrations
- **Participant**: Register for events and view personal dashboard

### 🎪 **Event Management**
- **Technical & Non-Technical Events**: Categorized event system
- **Workshops**: Specialized workshop management with capacity limits
- **Combo Packages**: Bundle events and workshops at discounted rates
- **Real-time Pricing**: Dynamic price calculation with combo discounts

### 📝 **Registration System**
- **Advanced Registration Form**: Stranger Things themed with real-time validation
- **Unique Field Validation**: Email, phone, enrollment number, and transaction ID
- **Photo Upload**: Profile photo management
- **Payment Tracking**: Transaction ID and amount validation
- **Combo Conflict Prevention**: Automatic event/workshop removal when combos are selected

### 🏫 **College & Field Management**
- **Multi-College Support**: Manage multiple colleges
- **Field Categories**: IT, Electrical, Computer, Chemical, Mechanical
- **Semester Tracking**: 1st to 6th semester support

### 📊 **Dashboard & Analytics**
- **Role-Specific Dashboards**: Customized views for each user type
- **Registration Analytics**: Track participation and revenue
- **Attendance Management**: Real-time attendance tracking
- **Reports**: Comprehensive reporting system

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/wisteria-25-event-system.git
   cd wisteria-25-event-system
   ```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   Fill in your Supabase credentials in `.env.local`

4. **Set up the database**
```bash
   # Run the database setup script
   npm run setup-db
   ```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🗄️ Database Setup

### Manual Setup
1. Create a new Supabase project
2. Run the SQL scripts in `supabase/migrations/001_initial_schema.sql`
3. Insert sample data using `supabase/seed.sql`
4. Configure Row Level Security (RLS) policies

### Automated Setup
Use the provided setup scripts:
- `setup-database.sql` - Complete database setup
- `quick-setup.sql` - Quick initialization
- `add-test-data.sql` - Sample data insertion

## 🎯 Key Components

### Frontend Architecture
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **React Router**: Client-side routing

### Backend Services
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **Real-time Database**: Live updates and subscriptions
- **Authentication**: Built-in auth with role management
- **Storage**: File upload for profile photos
- **Row Level Security**: Database-level access control

### Key Features Implementation
- **RegistrationForm.jsx**: Advanced form with real-time validation
- **Home.jsx**: Stranger Things themed landing page
- **AuthContext.jsx**: Global authentication state management
- **Role-based Routing**: Protected routes based on user roles

## 🎨 Theme & Design

### Stranger Things Elements
- **3D Tree Branches**: Animated background elements
- **Floating Characters**: Ghost, Eye, Zap, Skull, Moon, Star icons
- **Portal Effects**: Gradient radial animations
- **Particle Systems**: Dynamic particle animations
- **Success Animations**: Celebratory animations on form submission

### Color Scheme
- **Primary**: Purple (#8B5CF6) and Red (#EF4444)
- **Secondary**: Blue (#3B82F6), Green (#10B981), Orange (#F97316)
- **Background**: Dark grays and blacks
- **Accents**: Yellow (#F59E0B) for highlights

## 🔧 Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Configuration
- **Tables**: users, events, workshops, combos, registrations, colleges, fields
- **RLS Policies**: Role-based access control
- **Triggers**: Automatic timestamp updates
- **Indexes**: Optimized for performance

## 📱 Mobile Responsiveness

The system is fully responsive with:
- **Mobile-first design**: Optimized for small screens
- **Touch-friendly interfaces**: Large buttons and touch targets
- **Adaptive layouts**: Grid systems that work on all devices
- **Mobile-specific animations**: Optimized animations for mobile performance

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Input Validation**: Real-time form validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Sanitized inputs and outputs
- **Authentication**: Secure user authentication

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

### Manual Deployment
```bash
npm run build
# Upload dist folder to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stranger Things**: Inspiration for the unique theme
- **Supabase**: Amazing backend-as-a-Service platform
- **React Community**: Excellent documentation and support
- **Tailwind CSS**: Beautiful utility-first CSS framework

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the setup guides in the root directory

---

**Welcome to the Upside Down of Event Management! 🎭✨**

*"Friends don't lie, but this UI will definitely surprise!"*
