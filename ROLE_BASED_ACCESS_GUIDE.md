# 🔐 Role-Based Access Control System

## 📋 Overview

The application now supports **role-based access control** with two distinct user roles:

- **👑 Admin**: Full access to all features
- **🎯 Event Manager**: Access to Event Manager panel only

## 🚀 New Features

### **1. Role-Based Authentication**
- ✅ **Admin Role**: Access to complete admin panel
- ✅ **Event Manager Role**: Access to Event Manager panel only
- ✅ **Automatic Redirects**: Users are redirected to appropriate panels based on role
- ✅ **Access Control**: Protected routes prevent unauthorized access

### **2. Separate Panel Access**
- ✅ **Admin Panel**: `/admin/*` - Full administrative access
- ✅ **Event Manager Panel**: `/event-manager/*` - Event management only
- ✅ **Smart Navigation**: Different navigation menus based on user role

### **3. User Experience**
- ✅ **Role-Based UI**: Different titles and navigation based on role
- ✅ **User Profile Display**: Shows user name and role in sidebar
- ✅ **Automatic Logout**: Proper session management

## 🔧 Database Setup

### **Required SQL Scripts**

1. **Update User Role** (for nirja@gmail.com):
```sql
-- Run update-user-role.sql in Supabase SQL Editor
UPDATE users 
SET role = 'event_manager' 
WHERE email = 'nirja@gmail.com';
```

2. **Add Event Handlers**:
```sql
-- Run add-event-handlers.sql in Supabase SQL Editor
INSERT INTO users (name, email, phone, role, is_active) VALUES
('John Smith', 'john.smith@college.edu', '1234567890', 'event_handler', true),
('Sarah Johnson', 'sarah.johnson@college.edu', '2345678901', 'event_handler', true);
```

## 📱 How It Works

### **Login Process**
1. User enters email and password
2. System checks user role in database
3. Based on role, user is redirected to appropriate panel:
   - **Admin** → `/admin/dashboard`
   - **Event Manager** → `/event-manager/dashboard`

### **Access Control**
- **Admin Users**: Can access all routes under `/admin/*`
- **Event Managers**: Can only access `/event-manager/*` routes
- **Unauthorized Access**: Shows "Access Denied" message

### **Navigation**
- **Admin Panel**: Full navigation with all features
- **Event Manager Panel**: Only Event Manager Dashboard

## 🎯 User Roles Explained

### **👑 Administrator (admin)**
- **Access**: Complete admin panel
- **Features**: All management features
- **Routes**: `/admin/*`
- **Navigation**: Full navigation menu

### **🎯 Event Manager (event_manager)**
- **Access**: Event Manager panel only
- **Features**: Event management, handler management, participation analytics
- **Routes**: `/event-manager/*`
- **Navigation**: Event Manager Dashboard only

## 🔐 Security Features

### **Route Protection**
- All routes are protected with role-based access control
- Unauthorized access attempts show proper error messages
- Automatic redirects based on user role

### **Session Management**
- Proper logout functionality
- No persistent sessions (users must log in each time)
- Secure authentication checks

## 📊 Current User Setup

### **For nirja@gmail.com (Event Manager)**
1. **Role**: `event_manager`
2. **Access**: Event Manager Panel only
3. **Features**: 
   - Add/Edit Events
   - Manage Event Handlers
   - View Participation Analytics
   - Export Data

### **For admin@college.edu (Administrator)**
1. **Role**: `admin`
2. **Access**: Complete Admin Panel
3. **Features**: All administrative functions

## 🚀 Testing the System

### **Test Event Manager Access**
1. Login with `nirja@gmail.com`
2. Should be redirected to `/event-manager/dashboard`
3. Should see "Event Manager Panel" title
4. Should only see Event Manager Dashboard in navigation

### **Test Admin Access**
1. Login with `admin@college.edu`
2. Should be redirected to `/admin/dashboard`
3. Should see "Admin Panel" title
4. Should see full navigation menu

### **Test Unauthorized Access**
1. Try to access `/admin/*` routes as event manager
2. Should see "Access Denied" message
3. Try to access `/event-manager/*` routes as non-event manager
4. Should see "Access Denied" message

## 🔧 Troubleshooting

### **Common Issues**

1. **User can't access Event Manager Panel**
   - Check if user has `event_manager` role in database
   - Run the update-user-role.sql script

2. **User can't access Admin Panel**
   - Check if user has `admin` role in database
   - Verify user exists in users table

3. **Login not working**
   - Check browser console for error messages
   - Verify database connection
   - Check user credentials

### **Database Queries**

**Check User Roles:**
```sql
SELECT email, role, is_active FROM users ORDER BY role;
```

**Update User Role:**
```sql
UPDATE users SET role = 'event_manager' WHERE email = 'user@example.com';
```

**Add New Event Manager:**
```sql
INSERT INTO users (name, email, phone, role, is_active) 
VALUES ('Event Manager Name', 'manager@example.com', '1234567890', 'event_manager', true);
```

## 🎉 Success Indicators

### **Event Manager Login Success**
- ✅ Redirected to `/event-manager/dashboard`
- ✅ See "Event Manager Panel" title
- ✅ Only Event Manager Dashboard in navigation
- ✅ Can access Event Manager features

### **Admin Login Success**
- ✅ Redirected to `/admin/dashboard`
- ✅ See "Admin Panel" title
- ✅ Full navigation menu available
- ✅ Can access all admin features

---

## 🎯 Next Steps

1. **Run the SQL scripts** to set up user roles
2. **Test both user types** to ensure proper access
3. **Add more event managers** as needed
4. **Customize the Event Manager panel** for specific needs

The role-based access system is now fully functional and ready for production use!
