# ProjectGo - Complete Backend Development & Frontend Integration Walkthrough

We have successfully built a complete production-ready backend for the **ProjectGo** application and integrated it with the frontend. All mock database calls, Firebase SDK imports, and local storage state fallbacks have been replaced with secure REST APIs communicating with a Node.js + Express backend service connected to your MongoDB Atlas cloud cluster.

---

## 🏗️ Architecture Design & Directories

The backend adheres strictly to clean architecture and is structured across the following layers:

```text
backend/
├── server.js               # Express application configuration & endpoint bindings
├── package.json            # Node project dependency definitions
├── .env                    # Environment configuration file (JWT, SMTP, Client & MongoDB URL)
├── config/
│   └── db.js               # Mongoose MongoDB Atlas connection logic
├── models/
│   ├── User.js             # User accounts, verify flags, reset & profile state schemas
│   ├── Workspace.js        # Workspace mapping (owner, members list arrays)
│   ├── Task.js             # Sprint tasks, subtasks, checklists & attachment objects
│   ├── Comment.js          # Task feedback comments mapping
│   └── Notification.js     # User notification mapping
├── middleware/
│   ├── authMiddleware.js   # JWT verification and req.user population
│   ├── errorMiddleware.js  # Global Express catch-all standard JSON formatter
│   ├── uploadMiddleware.js # Stub for file upload interfaces
│   └── validateMiddleware.js # Intercepts validation errors and returns ApiError payloads
├── controllers/
│   ├── authController.js   # Verification email triggers, registration & session handlers
│   ├── workspaceController.js # Workspace creation and configuration queries
│   ├── taskController.js   # Kanban task CRUD queries
│   ├── commentController.js # Comments creation and retrieval queries
│   └── userController.js   # Profile updates & global directories queries
├── routes/
│   ├── authRoutes.js       # Authentication & user profile endpoints
│   ├── workspaceRoutes.js  # Workspace CRUD routing
│   ├── taskRoutes.js       # Kanban task routing
│   ├── commentRoutes.js    # Task feedback routing
│   └── invitationRoutes.js # Invite teammates & accept auto-join routing
├── services/
│   ├── authService.js      # Password hash, salt checks, token verifiers & registration logic
│   ├── workspaceService.js # Workspace operations and cascade deletors
│   ├── taskService.js      # Task status, checklists, subtasks updates
│   ├── invitationService.js # Invites verification, acceptance and member pushes
│   └── emailService.js     # HTML templates email dispatch logic
├── utils/
│   ├── ApiError.js         # Custom API error formatting standard
│   ├── ApiResponse.js      # Structured HTTP response formatter
│   ├── asyncHandler.js     # Express routes async wrapper to handle exceptions
│   ├── generateOTP.js      # Numeric OTP generator helper
│   ├── generateToken.js    # JWT payload token signer
│   └── sendEmail.js        # SMTP email dispatcher utilizing Nodemailer
├── templates/
│   ├── verifyEmail.html    # Signup account activation email template
│   ├── resetPassword.html  # Password reset URL email template
│   └── inviteWorkspace.html # Teammate workspace invite template
└── uploads/                # Local uploads path structures
```

---

## 🔒 Implemented Features

### 1. Robust JWT Authentication & Password Complexity (SaaS Flow)
- Handled secure signups verifying password matching constraints (including Full Name, Email, Password, and Confirm Password fields).
- Enforced password requirements: 8 to 32 characters, uppercase letter, lowercase letter, number, and special character.
- Hashed passwords using `bcrypt` and saved new records with `emailVerified: false` and `isVerified: false`.
- Dispatched secure verification tokens via email. Active links toggle `emailVerified` to `true`, delete the verification token, and redirect to `/login`.
- Implemented SaaS manual login sequence:
  - If user is not found: return `"Account not found."`
  - If user is unverified: return `"Please verify your email before signing in."`
  - If password fails: return `"Invalid email or password"`
  - Sets secure HTTP-only cookies on successful login.

### 2. Google OAuth 2.0 Integration (Passport.js)
- Search MongoDB by Google email address:
  - If user exists: update `lastLogin` timestamp, ensure `provider` is `'google'`, and issue session JWT cookie.
  - If user is new: auto-generate initials avatar photo, create document record mapping name, email, `provider: 'google'`, `emailVerified: true`, `isVerified: true`, and issue session JWT cookie.
- Prevent duplicate accounts and bypass password checking for Google sign-in profiles.

### 3. Account Deletion & Permanent Purge (Danger Zone)
- Added **Delete Account** trigger inside Profile Settings.
- Launches a secure confirmation modal requiring the user to type `DELETE` to authorize.
- Destroys user document from MongoDB, cascade deletes all owned workspaces, tasks, comments, and invitations, pulls the user from all member lists of external workspaces, clears the cookie, and logs the user out.

### 4. Profile Customizations & Image Uploads
- Enabled updating `fullName`, `nickname`, `bio`, `phone`, `photoURL`, and `coverPhoto`.
- Decodes base64 profile and cover photo payloads, saves them locally to on-disk folders under `/uploads/profiles/`, and persists file paths in the MongoDB schema.
- Re-fetches the user model instantly to refresh frontend context states.

### 2. Workspace Management & Member Isolation
- Supported workspaces creation, edits, and deletion (deletions cascade to delete all tasks/comments).
- Restrained workspace access exclusively to members, raising `403 Forbidden` errors for unauthorized request scopes.
- Supported adding team members via an invitation link sent to their emails. When clicked, authenticated users automatically join the workspace and redirect to the Kanban board. Unauthenticated users are redirected to login/signup with the token appended.

### 3. Task Board & Comments Syncing
- Saved tasks, checklists, subtasks, priorities, point indicators, and status updates directly in Mongoose schema subdocuments.
- Linked comments to tasks, allowing users to write comments that sync to the MongoDB database and show up in the feed.
- Allowed task attachments to be uploaded as Base64 Data URL payloads and saved to the task document database records.

---

## 🎨 Frontend Integration Details

The Vite client was fully integrated with the new REST APIs:
- Refactored `src/contexts/AuthContext.jsx` to communicate with `/api/auth` (maintains active session via cookie).
- Refactored `src/contexts/WorkspaceContext.jsx` and `src/contexts/TaskContext.jsx` to consume workspaces/tasks endpoints.
- Updated `src/pages/TaskView.jsx` details sidebar to push checklist, subtask, attachment, and comment changes to the database.
- Integrated `src/pages/TeamMembers.jsx` to query members of the active workspace rather than showing the global app list.
- All layouts, animations, transitions, and hover effects are completely preserved.

---

## 🚀 How to Run & Verify

1. **Configure Environment Variables**:
   In `backend/.env`, your cloud MongoDB Atlas connection is configured:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://projectgo_admin:Projecttest@2521@projectgocluster.maximps.mongodb.net/projectgo?appName=ProjectGoCluster
   JWT_SECRET=super_secret_jwt_key_projectgo_2026
   CLIENT_URL=http://localhost:5173
   ```

2. **Launch Express API Server**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Launch Vite Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Verify the Application**:
   Navigate to `http://localhost:5173/`, register an account, check the terminal output logs for the email verification link (if SMTP credentials are not filled, it falls back to console printing), and click the link to activate your account. Log in and start using ProjectGo!
