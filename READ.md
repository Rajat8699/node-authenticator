# Node.js Sequelize Authentication Application

A Node.js application using Sequelize for user authentication with features like email/password login, OTP login, Google OAuth, JWT-based authentication with optional refresh token rotation, session management, email/phone verification, role-based access control, password reset, magic link login, logout from all devices, and Swagger API documentation.

## Features
- User registration and login with email/password
- OTP-based login via email
- Google OAuth2 authentication
- JWT-based authentication with optional refresh token rotation (user-configurable)
- Session management with device tracking
- Email verification for new users
- Phone verification (if phone provided)
- Role-based access control (admin, user)
- Password reset via email
- Magic link login
- User profile management (update, delete, disable)
- Logout from all devices
- View active sessions
- Cron job to clean up disabled accounts
- Authentication guards on protected routes
- Swagger UI and OpenAPI documentation at `/api-docs`

## Prerequisites
- Node.js (v16 or higher)
- MySQL database
- GitHub account for repository hosting
- SMTP server (e.g., Gmail) for email sending
- SMS provider (optional, placeholder used)

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/auth-app.git
   cd auth-app