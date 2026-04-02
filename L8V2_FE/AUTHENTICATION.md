# Authentication System

This document describes the JWT-based authentication system implemented in the L8v2 frontend application.

## Overview

The authentication system provides:
- JWT token validation and storage
- Automatic redirect to login when no valid token is present
- Token expiration handling
- Logout functionality
- Protected routes

## Components

### 1. useAuth Hook (`src/hooks/useAuth.ts`)
- Manages authentication state
- Validates JWT tokens
- Handles login/logout operations
- Provides authentication status

### 2. AuthContext (`src/contexts/AuthContext.tsx`)
- Provides authentication state throughout the app
- Wraps the application with authentication context

### 3. PrivateRoute Component (`src/App.tsx`)
- Protects routes that require authentication
- Redirects to login if no valid token is present
- Shows loading spinner during authentication check

### 4. API Service (`src/services/api.ts`)
- Automatically includes JWT token in API requests
- Handles 401/403 responses by redirecting to login
- Clears invalid tokens

## Authentication Flow

1. **Login**: User enters credentials → API validates → JWT token stored → Redirect to admin
2. **Protected Routes**: Check for valid token → Show content or redirect to login
3. **API Requests**: Include JWT token in Authorization header
4. **Token Expiration**: Automatically redirect to login when token expires
5. **Logout**: Clear token → Redirect to login

## Usage

### Login Page
```typescript
const { login, isAuthenticated } = useAuth();

// After successful API response
if (data.token) {
  login(data.token);
  navigate('/admin');
}
```

### Protected Routes
```typescript
<Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
```

### Logout
```typescript
const { logout } = useAuth();
logout(); // Clears token and redirects to login
```

## Security Features

- **Token Validation**: Checks JWT expiration on app load and route changes
- **Automatic Cleanup**: Removes invalid tokens from localStorage
- **Hard Redirects**: Uses `window.location.href` for authentication redirects to ensure clean state
- **Error Handling**: Graceful handling of network errors and authentication failures

## Configuration

The authentication system uses the following environment variables:
- `VITE_API_URL`: Backend API URL (defaults to `http://localhost:3000/api`)

## Testing

To test the authentication system:

1. Start the backend server
2. Navigate to `/login`
3. Enter valid credentials
4. Should redirect to `/admin`
5. Try accessing `/admin` directly without login (should redirect to login)
6. Test logout functionality
7. Test token expiration by manually clearing localStorage 