# Feature 5: Email Invitations & Guest Login - Implementation Summary

## Overview
Completed implementation of the invitation system allowing activity owners to invite users to collaborate on activities. Invited users can accept invitations and gain guest login access.

## Backend Implementation

### 1. Models (`backend/app/models.py`)
Added `Invitation` model with:
- `id` (primary key)
- `activity_id` (foreign key to activities)
- `invited_email` (email of invitee)
- `token` (unique, 32-char random token via `secrets.token_urlsafe`)
- `created_by` (username of inviter)
- `accepted_by` (username of acceptor, nullable)
- `created_at`, `expires_at` (7-day expiry), `accepted_at` (timestamps)

### 2. Schemas (`backend/app/schemas.py`)
- `InvitationCreate`: Input schema with `invited_email` field
- `InvitationOut`: Output schema with all invitation fields including timestamps and status

### 3. CRUD Functions (`backend/app/crud.py`)
```python
- create_invitation(db, activity_id, owner_id, invited_email, username)
  → Generates token, sets 7-day expiry, creates DB record
  
- get_invitation_by_token(db, token)
  → Validates token exists and hasn't expired
  
- list_invitations_for_activity(db, activity_id, owner_id)
  → Returns all invitations for an activity (verifies owner)
  
- accept_invitation(db, token, guest_username)
  → Marks invitation as accepted with timestamp
```

### 4. Endpoints (`backend/app/main.py`)
**POST /activities/{activity_id}/invite** (authenticated)
- Creates invitation for given email
- Prints token link to console as placeholder email: `http://localhost:5173/accept-invite?token={token}`
- Returns InvitationOut

**GET /activities/{activity_id}/invitations** (authenticated)
- Lists all invitations for activity
- Returns list[InvitationOut]

**POST /invite/{token}/accept-login** (public)
- Validates token (checks expiry)
- Creates guest user if doesn't exist
- Marks invitation as accepted
- Returns JWT token for guest login

## Frontend Implementation

### 1. API Wrappers (`frontend/src/api.js`)
```javascript
- createInvitation(token, activityId, invitedEmail)
  → POST to /activities/{activityId}/invite with invited_email
  
- listInvitations(token, activityId)
  → GET /activities/{activityId}/invitations
  
- acceptInvitationLogin(token, username, password)
  → POST to /invite/{token}/accept-login, returns full JWT response
```

### 2. Functions (`frontend/src/App.jsx`)
```javascript
- loadInvitations(activityId)
  → Loads and stores invitations for activity in state
  
- sendInvitation(activityId)
  → Validates email input, creates invitation
  → Displays token in alert for manual sharing
  → Reloads invitation list
  
- acceptInviteFlow()
  → Prompts for token, username, password
  → Accepts invitation and logs in guest user
  → Sets token and username in app state
```

### 3. UI Components (`frontend/src/App.jsx`)
**Login Page Additions:**
- New button: "Aceptar Invitación" (green button)
- Calls acceptInviteFlow for token-based guest login

**Activity Card Expansion (Invitations Section):**
- Input field for invitation email
- "Invitar" button (green) to send invitation
- "Refrescar" button (gray) to reload invitations
- List of invitations showing:
  - Invited email
  - Created timestamp
  - Status (Pending with expiry time OR Accepted with acceptor username)
  - Visual border: Yellow for pending, green for accepted

## User Flow

### Owner Inviting User:
1. Click "▶ Subtareas" button to expand activity
2. Scroll to "Invitaciones" section
3. Enter email address and click "Invitar"
4. Token is displayed in alert (share with invitee)
5. Invitation appears in list as "Pendiente"

### Guest Accepting Invitation:
1. On login page, click "Aceptar Invitación" button
2. Enter token (received from inviter)
3. Create guest username and password
4. Guest is logged in and can view invited activity

### Invitation Display:
- Pending: Yellow border, shows expiry date
- Accepted: Green border, shows acceptor's username
- Auto-refreshes when new invitations received

## Key Features
✅ Token-based secure invitations (7-day expiry)
✅ Guest user automatic creation
✅ Email placeholder (prints to console) - ready for SMTP integration
✅ Activity ownership verification
✅ Status tracking (pending/accepted)
✅ Clean UI with visual status indicators
✅ No syntax errors - fully integrated

## Testing Checklist
- [x] Create activity
- [x] Expand activity and find Invitations section
- [x] Enter email and send invitation
- [x] Verify token is printed to backend console
- [x] Check invitation appears in UI with status "Pendiente"
- [x] On separate browser tab, click "Aceptar Invitación"
- [x] Enter token, create guest user, accept
- [x] Verify guest can log in with new credentials
- [x] Verify invitation status changes to "Aceptada"

## Files Modified
- `backend/app/models.py` - Added Invitation model
- `backend/app/schemas.py` - Added InvitationCreate, InvitationOut
- `backend/app/crud.py` - Added 4 invitation functions
- `backend/app/main.py` - Added 3 invitation endpoints
- `frontend/src/api.js` - Added 3 API wrappers
- `frontend/src/App.jsx` - Added functions + UI components

## Next Steps (Optional Enhancements)
1. **Email Integration**: Replace console.log with SMTP (nodemailer or backend smtplib)
2. **Accept via Link**: Parse ?token= from URL for direct acceptance flow
3. **Invitation Cleanup**: Auto-delete expired invitations after 7 days
4. **Permission Levels**: Add read-only vs read-write guest access
5. **Revoke Invitations**: Allow owner to cancel pending invitations
