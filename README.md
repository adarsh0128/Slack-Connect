# 🚀 Slack Connect - Message Scheduling App

Slack Connect is a full-stack TypeScript application that allows you to connect your Slack workspace, send immediate messages, and schedule messages for future delivery.

## ✨ Features

- 🔐 **Secure Slack OAuth 2.0 Integration**
- 💬 **Send Immediate Messages** to any channel or DM
- ⏰ **Schedule Messages** for future delivery
- 📋 **Manage Scheduled Messages** (view, cancel)
- 🔄 **Token Refresh** for continuous authentication
- 🛡️ **Security** with rate limiting and HTTPS

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite
- **Authentication**: Slack OAuth 2.0
- **Scheduling**: Node-cron

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Slack workspace (free tier works)

## 🎯 Complete Setup Guide

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd SlackConnect

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 2: Create Slack App

#### 2.1 Go to Slack API Dashboard

1. Visit https://api.slack.com/apps

2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter App Name: `"Slack Connect"` (or any name you like)
5. Select your Slack workspace
6. Click **"Create App"**

#### 2.2 Configure OAuth & Permissions

1. In your app dashboard, go to **"OAuth & Permissions"** (left sidebar)
2. Scroll down to **"Scopes"** section
3. Under **"Bot Token Scopes"**, click **"Add an OAuth Scope"**
4. Add these scopes:
   - `channels:read` - View basic information about public channels
   - `chat:write` - Send messages as your app
   - `users:read` - View people in workspace
   - `groups:read` - View basic information about private channels
   - `im:read` - View basic information about direct messages
   - `mpim:read` - View basic information about group direct messages

#### 2.3 Set Redirect URLs

1. Still in **"OAuth & Permissions"**
2. Scroll up to **"Redirect URLs"**
3. Click **"Add New Redirect URL"**

4. Enter: `https://localhost:3001/api/auth/slack/callback`

5. Click **"Add"**
6. Click **"Save URLs"**

#### 2.4 Get App Credentials

1. Go to **"Basic Information"** (left sidebar)
2. Scroll down to **"App Credentials"**
3. Copy these values:
   - **App ID**
   - **Client ID**
   - **Client Secret**
   - **Signing Secret**

### Step 3: Environment Configuration

#### 3.1 Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your Slack app credentials:

```bash
# Slack OAuth Configuration
SLACK_CLIENT_ID=your_client_id_here
SLACK_CLIENT_SECRET=your_client_secret_here
SLACK_APP_ID=your_app_id_here
SLACK_STATE_SECRET=random_secret_string_here

# Server Configuration
PORT=3001
NODE_ENV=development

FRONTEND_URL=http://localhost:3000

BACKEND_URL=https://localhost:3001

# Database Configuration
DATABASE_PATH=./slack_connect.db
```

#### 3.2 Frontend Environment

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```bash

VITE_API_BASE_URL=https://localhost:3001/api
```

### Step 4: Run the Application

#### 4.1 Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

You should see:

```
HTTPS Server is running on port 3001
🔐 You need to accept the self-signed certificate!
```

#### 4.2 Accept HTTPS Certificate

1. Open browser and go to: `https://localhost:3001/api/health`

2. You'll see a security warning ⚠️
3. Click **"Advanced"** or **"Show Details"**
4. Click **"Proceed to localhost (unsafe)"** or **"Accept the risk"**
5. You should see: `{"status":"OK","timestamp":"..."}`

#### 4.3 Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

You should see:

```
➜  Local:   http://localhost:3000/
```

### Step 5: Install App to Slack Workspace

#### 5.1 Install to Your Workspace

1. In your Slack app dashboard, go to **"Install App"** (left sidebar)
2. Click **"Install to Workspace"**
3. Review permissions and click **"Allow"**
4. Copy the **"Bot User OAuth Token"** (starts with `xoxb-`)
5. You can also find this in **"OAuth & Permissions"** section

#### 5.2 Test the Connection

1. Open http://localhost:3000 in your browser

2. Click **"Connect to Slack"**
3. You should be redirected to Slack for authorization
4. Click **"Allow"** to authorize the app
5. You should be redirected back to the app dashboard

## 🎉 Usage

### Send Immediate Message

1. Go to Dashboard
2. Select a channel or DM
3. Type your message
4. Click **"Send Now"**

### Schedule Message

1. Go to Dashboard
2. Select a channel or DM
3. Type your message
4. Set date and time
5. Click **"Schedule Message"**

### Manage Scheduled Messages

1. Go to **"Scheduled Messages"** page
2. View all your scheduled messages
3. Cancel any pending message

## 🔧 Troubleshooting

### Common Issues

#### 1. "redirect_uri did not match" Error

- Make sure your Slack app redirect URL is: `https://localhost:3001/api/auth/slack/callback`

- Ensure you're using HTTPS (not HTTP)

#### 2. "Certificate Error" in Browser

- You must accept the self-signed certificate first

- Go to `https://localhost:3001/api/health` and accept the security warning

#### 3. "Failed to connect to Slack" Error

- Check if backend is running on port 3001
- Verify your Slack app credentials in `.env`
- Make sure all required OAuth scopes are added

#### 4. Messages Not Sending

- Ensure your bot is added to the channel
- Check if your OAuth token is valid
- Verify the channel ID is correct

### Development Tips

#### Reset Database

```bash
cd backend
rm slack_connect.db
npm run dev  # Database will be recreated
```

#### Check Logs

Backend logs show important information:

- OAuth flow details
- Database operations
- Message sending status

#### HTTPS in Development

This app uses HTTPS in development because Slack requires it for OAuth redirects. The self-signed certificate is automatically generated.

## 📝 API Endpoints

### Authentication

- `GET /api/auth/slack` - Start OAuth flow
- `GET /api/auth/slack/callback` - Handle OAuth callback
- `GET /api/auth/status` - Check auth status

### Messages

- `GET /api/messages/channels` - Get available channels
- `POST /api/messages/send` - Send immediate message
- `POST /api/messages/schedule` - Schedule message
- `GET /api/messages/scheduled` - Get scheduled messages
- `DELETE /api/messages/scheduled/:id` - Cancel scheduled message

## 🚀 Deployment

### Environment Variables for Production

```bash
NODE_ENV=production
BACKEND_URL=https://your-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

### Deploy to Railway/Render/Heroku

1. Update Slack app redirect URL to your production URL
2. Set environment variables in your hosting platform
3. Deploy backend and frontend separately

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🆘 Need Help?

- Check the troubleshooting section above
- Create an issue on GitHub
- Review Slack API documentation: https://api.slack.com/

---

**Happy Scheduling! 🎯**

#
