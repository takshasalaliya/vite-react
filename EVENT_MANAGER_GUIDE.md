# 🎯 Event Manager Panel - Complete Guide

## 📋 Overview

The Event Manager Panel is a specialized interface for event managers to efficiently manage events, assign handlers, and track detailed participation information. This panel provides comprehensive tools for event management with real-time data and analytics.

## 🚀 Features Implemented

### 1. **Event Management**
- ✅ **Add New Events**: Create events with detailed information
- ✅ **Edit Events**: Modify existing event details
- ✅ **Delete Events**: Remove events from the system
- ✅ **Toggle Event Status**: Activate/deactivate events
- ✅ **Event Categories**: Tech and Non-Tech categorization
- ✅ **Event Photos**: Support for event images
- ✅ **Pricing**: Set event prices
- ✅ **Capacity Management**: Set maximum participants

### 2. **Event Handler Management**
- ✅ **Add Event Handlers**: Create new handler accounts
- ✅ **Handler Assignment**: Assign handlers to specific events
- ✅ **Handler Details**: Name, email, phone, specialization
- ✅ **Handler Role**: Automatic role assignment as 'event_handler'

### 3. **Participation Analytics**
- ✅ **Real-time Statistics**: Total, paid, and pending registrations
- ✅ **Detailed Participant List**: Complete participant information
- ✅ **Payment Status Tracking**: Approved, pending, and failed payments
- ✅ **Export Functionality**: Download participant data as CSV
- ✅ **Registration Dates**: Track when participants registered
- ✅ **Contact Information**: Email and phone numbers

### 4. **Advanced Filtering & Search**
- ✅ **Search Events**: Find events by name or description
- ✅ **Category Filter**: Filter by Tech or Non-Tech events
- ✅ **Status Filter**: Show only active events
- ✅ **Clear Filters**: Reset all filters quickly

### 5. **User Interface**
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Dark Mode Support**: Consistent with the main admin panel
- ✅ **Loading States**: Smooth loading indicators
- ✅ **Empty States**: Helpful messages when no data exists
- ✅ **Modal Dialogs**: Clean forms for data entry

## 🛠️ Technical Implementation

### **Database Structure**
- **Events Table**: Core event information
- **Users Table**: Event handlers with 'event_handler' role
- **Registrations Table**: Participant data with polymorphic relationships

### **Key Functions**
- `fetchEvents()`: Retrieves events with handler and participation data
- `fetchHandlers()`: Gets all event handlers
- `handleEventSubmit()`: Creates or updates events
- `handleHandlerSubmit()`: Adds new event handlers
- `handleViewParticipation()`: Shows detailed participant information
- `exportParticipationData()`: Exports data to CSV format

### **Data Relationships**
- Events → Handlers (via handler_id)
- Events → Registrations (via target_type='event' and target_id)
- Registrations → Users (participant information)

## 📱 How to Use

### **Accessing the Panel**
1. Login to the admin panel
2. Navigate to "Event Manager" in the sidebar
3. The panel will load with all available events

### **Adding a New Event**
1. Click "Add Event" button
2. Fill in the event details:
   - Event Name (required)
   - Description
   - Price (required)
   - Category (Tech/Non-Tech)
   - Handler (optional)
   - Max Participants (optional)
   - Active status
3. Click "Create Event"

### **Adding an Event Handler**
1. Click "Add Handler" button
2. Fill in handler details:
   - Name (required)
   - Email (required)
   - Phone (required)
   - Specialization (optional)
3. Click "Add Handler"

### **Viewing Participation Details**
1. Find the event in the grid
2. Click "View Details" button
3. See comprehensive participant information:
   - Total participants
   - Paid vs pending registrations
   - Individual participant details
   - Export to CSV option

### **Managing Events**
- **Edit**: Click the edit icon on any event card
- **Delete**: Click the delete icon (with confirmation)
- **Toggle Status**: Click the eye icon to activate/deactivate
- **Filter**: Use search and filter options to find specific events

## 📊 Data Export

### **CSV Export Features**
- Participant names and contact information
- Payment status and amounts
- Registration dates
- Formatted for easy analysis

### **Export Process**
1. Open participation details for an event
2. Click "Export CSV" button
3. File downloads automatically with event name

## 🔧 Database Setup

### **Required SQL Scripts**
Run these scripts in your Supabase SQL Editor:

1. **add-event-handlers.sql**: Creates test event handlers
2. **add-test-data.sql**: Adds sample events and data

### **Database Tables Used**
- `users` (for event handlers)
- `events` (event information)
- `registrations` (participant data)

## 🎨 UI Components

### **Event Cards**
- Event name and description
- Category badges (Tech/Non-Tech)
- Price display
- Handler information
- Registration statistics
- Action buttons

### **Modals**
- **Event Modal**: Add/edit event form
- **Handler Modal**: Add handler form
- **Participation Modal**: Detailed participant table

### **Statistics Dashboard**
- Total participants count
- Paid registrations
- Pending registrations
- Visual indicators

## 🔒 Security & Permissions

### **Access Control**
- Only admin users can access the panel
- Protected routes ensure proper authentication
- Role-based access control for handlers

### **Data Validation**
- Required field validation
- Email format validation
- Phone number validation
- Price validation

## 🚀 Future Enhancements

### **Potential Additions**
- **Email Notifications**: Notify handlers of new assignments
- **Calendar Integration**: Sync with external calendars
- **Advanced Analytics**: Charts and graphs
- **Bulk Operations**: Mass event management
- **Template System**: Pre-defined event templates
- **Attendance Tracking**: Real-time attendance monitoring

## 📞 Support

### **Troubleshooting**
- Check browser console for error messages
- Verify database connections
- Ensure proper user permissions
- Check network connectivity

### **Common Issues**
- **Events not loading**: Check database connection
- **Handlers not appearing**: Verify role assignments
- **Export not working**: Check browser download settings
- **Modal not opening**: Verify JavaScript is enabled

---

## 🎉 Success!

The Event Manager Panel is now fully functional and ready for use. Event managers can efficiently manage their events, track participation, and generate detailed reports for better decision-making.
