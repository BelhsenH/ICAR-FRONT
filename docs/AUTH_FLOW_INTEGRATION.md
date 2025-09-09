# Authentication Flow Integration Guide

## Overview

This document outlines the comprehensive authentication system integration between the auth script (`scripts/auth-script.tsx`) and the authentication pages in the `app/(auth)/` directory. The integration has been optimized for smooth user experience and robust error handling.

## Architecture

### Core Components

1. **AuthService** (`scripts/auth-script.tsx`)
   - Handles all API communications
   - Manages token storage and retrieval
   - Provides typed interfaces for all auth operations

2. **AuthFlowContext** (`contexts/AuthFlowContext.tsx`)
   - Manages authentication state globally
   - Provides smooth flow management between auth steps
   - Handles loading states and error management

3. **Authentication Pages** (`app/(auth)/`)
   - Individual pages for each auth step
   - Consistent UI/UX patterns
   - Proper navigation flow integration

## Authentication Flows

### 1. User Registration Flow

**Flow**: signup.tsx → verify.tsx → login.tsx → dashboard

```
User Registration → Phone Verification → Login → App Dashboard
```

**Key Integration Points:**
- `signup.tsx` uses AuthFlowContext for seamless registration
- Phone number stored in AsyncStorage for verification step
- Automatic navigation to verification page after successful signup
- Error handling for existing accounts

### 2. User Login Flow

**Flow**: login.tsx → dashboard

```
User Login → App Dashboard
```

**Key Integration Points:**
- Token automatically stored in AsyncStorage
- User profile fetched and stored in context
- Direct navigation to dashboard after successful login
- Enhanced error handling for wrong credentials

### 3. Phone Verification Flow

**Flow**: verify.tsx → login.tsx

```
Phone Verification → Login Page
```

**Key Integration Points:**
- Retrieves phone number from AsyncStorage
- Implements resend functionality with timer
- Automatic navigation to login after successful verification
- Error handling with shake animations

### 4. Password Reset Flow

**Flow**: forgot-password.tsx → reset-code.tsx → new-password.tsx → login.tsx

```
Forgot Password → Reset Code → New Password → Login
```

**Key Integration Points:**
- Phone number passed through AsyncStorage
- Reset code validation and storage
- Complete password reset with backend verification
- Automatic cleanup of temporary data after successful reset

## File-Level Integration Details

### signup.tsx
- **Line 155**: Fixed navigation to `/(auth)/verify`
- **Line 407**: Fixed login link to use `/(auth)/login`
- **AuthFlowContext Integration**: Uses context for registration state management

### login.tsx  
- **Line 83**: Fixed dashboard navigation route
- **Improved Error Handling**: Enhanced credential validation messages

### verify.tsx
- **Phone Storage**: Retrieves phone from AsyncStorage
- **Navigation**: Properly navigates to login after verification
- **Resend Logic**: Integrated with auth service resend functionality

### forgot-password.tsx
- **AsyncStorage**: Stores reset phone for next step
- **Navigation**: Routes to reset-code page after successful code send

### reset-code.tsx
- **Code Verification**: Now properly stores valid code for next step
- **Navigation**: Routes to new-password page after verification
- **Resend Integration**: Uses auth service for code resend

### new-password.tsx
- **Data Retrieval**: Gets phone and code from AsyncStorage
- **Password Reset**: Integrates with auth service reset endpoint
- **Cleanup**: Removes temporary data after successful reset
- **Error Handling**: Redirects to forgot-password on missing data

## State Management

### AsyncStorage Keys Used

| Key | Purpose | Set By | Used By |
|-----|---------|--------|---------|
| `@auth_token` | JWT authentication token | auth-script.tsx | All authenticated requests |
| `userPhone` | Phone awaiting verification | signup.tsx | verify.tsx |
| `resetPhone` | Phone in password reset flow | forgot-password.tsx | reset-code.tsx, new-password.tsx |
| `resetCode` | Verified reset code | reset-code.tsx | new-password.tsx |

### AuthFlowContext State

```typescript
interface AuthFlowState {
  currentUser: any | null;
  isAuthenticated: boolean;
  pendingVerification: string | null;
  resetFlowPhone: string | null;
  resetFlowCode: string | null;
  // Loading states
  isLoading: boolean;
  isRegistering: boolean;
  isLoggingIn: boolean;
  isVerifying: boolean;
  isResettingPassword: boolean;
}
```

## Navigation Patterns

### Consistent Route Structure
All auth pages use the `/(auth)/` prefix for proper Expo Router navigation:

- `/(auth)/signup`
- `/(auth)/login`
- `/(auth)/verify`
- `/(auth)/forgot-password`
- `/(auth)/reset-code`
- `/(auth)/new-password`

### Navigation Methods
- **Push**: For forward navigation in flows
- **Replace**: For final navigation (login → dashboard)
- **Back**: For backward navigation with proper state cleanup

## Error Handling

### Centralized Error Messages
- Consistent error message patterns across all pages
- User-friendly error descriptions
- Automatic retry suggestions where appropriate

### Loading States
- Individual loading states for each operation
- Disabled UI during operations
- Loading indicators on buttons and forms

### Validation
- Client-side validation before API calls
- Server-side validation error handling
- Real-time form validation feedback

## Security Considerations

1. **Token Management**
   - Secure storage in AsyncStorage
   - Automatic token inclusion in requests
   - Proper token cleanup on logout

2. **Data Cleanup**
   - Automatic cleanup of sensitive temporary data
   - Proper logout flow with complete data clearing
   - Reset flow data cleanup after completion

3. **Validation**
   - Strong password requirements
   - Phone number format validation
   - Email format validation

## Integration Checklist

✅ **Authentication Script**
- [x] All endpoints properly defined
- [x] Token management implemented
- [x] Error handling standardized
- [x] TypeScript interfaces provided

✅ **Context Integration**
- [x] AuthFlowContext created
- [x] Global state management
- [x] Loading states managed
- [x] Navigation flow coordination

✅ **Page Integrations**
- [x] signup.tsx: Fixed navigation and context integration
- [x] login.tsx: Fixed dashboard route
- [x] verify.tsx: Proper phone retrieval and navigation
- [x] forgot-password.tsx: AsyncStorage integration
- [x] reset-code.tsx: Code verification and storage
- [x] new-password.tsx: Complete reset flow with cleanup

✅ **Navigation Flow**
- [x] All routes use proper auth folder structure
- [x] Forward navigation implemented
- [x] Backward navigation with state cleanup
- [x] Error navigation handled

✅ **Error Handling**
- [x] User-friendly error messages
- [x] Proper error propagation
- [x] Validation error handling
- [x] Network error handling

## Usage Instructions

### For Developers

1. **Using AuthFlowContext**:
   ```tsx
   import { useAuthFlow } from '../../contexts/AuthFlowContext';
   
   const { register, login, isRegistering, isLoggingIn } = useAuthFlow();
   ```

2. **Adding New Auth Pages**:
   - Place in `app/(auth)/` directory
   - Import and use AuthFlowContext
   - Follow consistent navigation patterns
   - Implement proper error handling

3. **Extending Auth Service**:
   - Add new methods to `scripts/auth-script.tsx`
   - Update TypeScript interfaces
   - Add corresponding context methods
   - Update documentation

### For Testing

1. **Registration Flow**:
   - Start at signup page
   - Complete form and submit
   - Verify navigation to verify page
   - Complete verification
   - Confirm navigation to login

2. **Login Flow**:
   - Start at login page
   - Enter credentials
   - Verify navigation to dashboard
   - Confirm authentication state

3. **Password Reset Flow**:
   - Start at forgot-password page
   - Enter phone number
   - Navigate through reset-code page
   - Complete on new-password page
   - Verify navigation back to login

## Troubleshooting

### Common Issues

1. **Navigation Not Working**
   - Ensure using `/(auth)/` prefix
   - Check router import and usage
   - Verify page exists in correct directory

2. **AsyncStorage Data Missing**
   - Check data is being set properly
   - Verify keys match between pages
   - Ensure data isn't being cleared prematurely

3. **Context Not Available**
   - Ensure AuthFlowProvider wraps app
   - Check useAuthFlow hook usage
   - Verify proper import paths

4. **API Errors**
   - Check network connectivity
   - Verify API endpoint URLs
   - Check request/response formats

### Debug Steps

1. Check browser/debugger console for errors
2. Verify AsyncStorage contents using React Native Debugger
3. Test API endpoints independently
4. Use context dev tools to inspect state
5. Check navigation logs in router

## Future Enhancements

1. **Biometric Authentication**
   - Face ID / Touch ID integration
   - Secure hardware token storage

2. **Multi-Factor Authentication**
   - SMS + Email verification
   - Authenticator app support

3. **Social Login**
   - Google, Facebook, Apple login
   - OAuth2 integration

4. **Session Management**
   - Token refresh automation
   - Session timeout handling
   - Multiple device management

This integration provides a robust, user-friendly authentication system with proper error handling, state management, and smooth navigation flows between all authentication steps.