# Register Owner Endpoint Fix

## Issue
The `/auth/register-owner` endpoint was returning a 400 error due to validation issues with optional fields and empty strings.

## Root Cause
1. **Zod Validation**: The validation schema was too strict for optional fields
2. **Empty String Handling**: Empty strings from the frontend were not being handled properly
3. **Email/URL Validation**: Optional email and website fields were failing validation when empty

## Fixes Applied

### 1. Backend Validation Schema (`backend/src/routes/auth.ts`)

#### Before:
```typescript
email: z.string().email().optional(),
website: z.string().url().optional(),
address: z.object({...}).optional(),
```

#### After:
```typescript
email: z.string().optional().refine((val) => !val || val === '' || z.string().email().safeParse(val).success, {
  message: "Invalid email format"
}),
website: z.string().optional().refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
  message: "Invalid URL format"
}),
address: z.object({...}).optional().nullable(),
```

### 2. Data Processing Improvements

#### Enhanced Empty String Handling:
```typescript
// Only add fields that have actual values (not empty strings)
if (body.organization.email && body.organization.email.trim() && body.organization.email !== '') {
  orgData.email = body.organization.email;
}
```

### 3. Better Error Handling

#### Improved Error Messages:
```typescript
function zodError(res: any, e: unknown) {
  if (e instanceof z.ZodError) {
    console.error('Validation error:', e.flatten());
    const firstError = e.errors[0];
    const errorMessage = firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Invalid request data';
    return res.status(400).json({ 
      error: errorMessage,
      details: e.flatten() 
    });
  }
  return null;
}
```

#### Database Error Handling:
```typescript
// Check for specific database errors
if (e instanceof Error) {
  if (e.message.includes('Unique constraint')) {
    return res.status(409).json({ error: 'Organization name or email already exists' });
  }
  if (e.message.includes('Foreign key constraint')) {
    return res.status(400).json({ error: 'Invalid data provided' });
  }
}
```

## Testing

### 1. Manual Testing
Use the provided test script:
```bash
cd backend
node test-register-owner.js
```

### 2. Frontend Testing
1. Navigate to `/register-owner`
2. Fill out the form with various combinations:
   - Required fields only
   - All fields filled
   - Some optional fields empty
   - Invalid email/website formats

### 3. Expected Behavior
- ✅ Registration succeeds with minimal required data
- ✅ Registration succeeds with all fields filled
- ✅ Registration handles empty optional fields gracefully
- ✅ Proper error messages for validation failures
- ✅ Proper error messages for duplicate emails/organizations

## Validation Rules

### Required Fields:
- `user.email` - Valid email format
- `user.password` - Minimum 8 characters
- `user.displayName` - Minimum 1 character
- `organization.name` - Minimum 2 characters

### Optional Fields:
- All other organization fields are optional
- Empty strings are treated as undefined
- Invalid email/URL formats in optional fields are rejected
- Address object is optional and can be null

## Error Responses

### 400 - Validation Error:
```json
{
  "error": "organization.email: Invalid email format",
  "details": { ... }
}
```

### 409 - Conflict:
```json
{
  "error": "Email already registered"
}
```

### 500 - Server Error:
```json
{
  "error": "Registration failed. Please try again."
}
```

## Success Response:
```json
{
  "token": "jwt_token_here",
  "defaultOrgId": "org_id",
  "orgs": [...],
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "displayName": "User Name"
  },
  "organization": {
    "id": "org_id",
    "name": "Organization Name",
    "slug": "organization-slug"
  }
}
```

## Additional Improvements

1. **Logging**: Added detailed error logging for debugging
2. **Type Safety**: Maintained full TypeScript support
3. **Database Safety**: Proper handling of optional fields in Prisma operations
4. **User Experience**: Clear error messages for frontend display

The endpoint should now handle all edge cases properly and provide a smooth registration experience.