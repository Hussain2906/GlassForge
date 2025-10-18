# Admin Organization Settings

## Overview

A comprehensive admin settings page has been created for the Glass ERP application, allowing administrators to manage all aspects of their organization settings from a single, well-organized interface.

## Features Implemented

### ✅ Core Settings Tabs

1. **General Settings**
   - Organization name and contact information
   - Address details
   - Maximum user limits
   - Organization statistics overview

2. **Users Management**
   - View all organization members
   - Invite new users with role assignment
   - Update user roles (Admin, Staff, Viewer)
   - Deactivate users
   - User limit tracking

3. **Billing & Plans**
   - Current plan overview with usage statistics
   - Available plans comparison (Free, Professional, Enterprise)
   - Usage tracking (users, storage, API calls)
   - Plan upgrade functionality
   - Billing history and invoice downloads

4. **Security Settings**
   - Two-factor authentication toggle
   - Password policy configuration
   - Session timeout settings
   - IP whitelist management
   - Audit logging controls
   - Login notifications

5. **Placeholder Tabs** (Ready for future implementation)
   - Notifications
   - Branding
   - Data Management
   - API Keys
   - Webhooks
   - Workflows
   - Analytics
   - Audit Logs

## Technical Implementation

### Frontend Structure
```
frontend/src/
├── app/(app)/admin/settings/
│   └── page.tsx                    # Main settings page with tabs
├── components/admin/
│   ├── GeneralSettings.tsx         # Organization info management
│   ├── UsersManagement.tsx         # User invitation and role management
│   ├── BillingSettings.tsx         # Plan and billing management
│   ├── SecuritySettings.tsx        # Security configuration
│   └── index.tsx                   # Placeholder components
└── components/ui/
    ├── tabs.tsx                    # Tab navigation component
    ├── switch.tsx                  # Toggle switches
    ├── progress.tsx                # Progress bars for usage
    └── [other UI components]
```

### Backend API Endpoints
```
GET    /api/v1/admin/organization          # Get organization details
PUT    /api/v1/admin/organization          # Update organization
GET    /api/v1/admin/users                 # Get organization users
POST   /api/v1/admin/users/invite          # Invite new user
PUT    /api/v1/admin/users/:id/role        # Update user role
PUT    /api/v1/admin/users/:id/deactivate  # Deactivate user
GET    /api/v1/admin/billing               # Get billing information
POST   /api/v1/admin/billing/upgrade       # Initiate plan upgrade
GET    /api/v1/admin/security              # Get security settings
PUT    /api/v1/admin/security              # Update security settings
```

## Navigation

The admin settings page is accessible through:
- **Topbar Navigation**: Admin dropdown → "Organization Settings"
- **Direct URL**: `/admin/settings`

## Key Features

### Responsive Design
- Mobile-friendly tabbed interface
- Responsive grid layouts
- Optimized for various screen sizes

### User Experience
- Intuitive tab-based navigation
- Real-time form validation
- Success/error notifications
- Loading states and skeletons

### Security & Permissions
- Admin role required for access
- Organization-scoped data access
- Secure API endpoints with authentication

### Data Management
- Form state management with React hooks
- API integration with error handling
- Optimistic updates for better UX

## Usage Examples

### Updating Organization Information
1. Navigate to Admin → Organization Settings
2. Go to "General" tab
3. Update organization name, contact details, or user limits
4. Click "Save Changes"

### Managing Users
1. Go to "Users" tab
2. Click "Invite User" to add new team members
3. Select appropriate role (Admin, Staff, Viewer)
4. Use dropdown to change existing user roles
5. Click "Deactivate" to remove users

### Viewing Billing Information
1. Go to "Billing" tab
2. View current plan and usage statistics
3. Compare available plans
4. Click "Upgrade" to change plans
5. Download invoices from billing history

### Configuring Security
1. Go to "Security" tab
2. Toggle two-factor authentication
3. Set password policy requirements
4. Configure session timeout
5. Add IP whitelist restrictions
6. Click "Save Security Settings"

## Future Enhancements

The placeholder tabs are ready for implementation:

- **Notifications**: Email/SMS notification preferences
- **Branding**: Logo upload, color schemes, custom themes
- **Data Management**: Import/export tools, data retention policies
- **API Keys**: Generate and manage API access keys
- **Webhooks**: Configure real-time event notifications
- **Workflows**: Custom business process automation
- **Analytics**: Advanced reporting and insights
- **Audit Logs**: Detailed activity tracking and compliance

## Technical Notes

- Uses Radix UI components for accessibility
- Tailwind CSS for styling
- React Hook Form for form management
- Zod for validation
- Sonner for notifications
- Prisma for database operations
- TypeScript for type safety

## Testing

To test the admin settings:

1. Log in as an admin user
2. Navigate to Admin → Organization Settings
3. Test each tab's functionality
4. Verify form submissions and API responses
5. Check responsive behavior on different screen sizes

The implementation provides a solid foundation for comprehensive organization management while maintaining excellent user experience and code quality.