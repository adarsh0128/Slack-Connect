#!/bin/bash

echo "🚀 Initializing Git repository for Slack Connect..."

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Slack Connect app with OAuth, messaging, and scheduling features

- Full-stack TypeScript application
- React frontend with Tailwind CSS
- Express backend with SQLite database
- Slack OAuth 2.0 integration
- Message sending and scheduling functionality
- HTTPS support for OAuth compliance
- Comprehensive documentation and setup guide"

echo "✅ Git repository initialized!"
echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Add remote: git remote add origin <https://github.com/Shubh6665/SlackConnect.git>"
echo "3. Push to GitHub: git push -u origin main"
echo ""
echo "Don't forget to:"
echo "- Set up your Slack app (see README.md)"
echo "- Configure your .env files"
echo "- Generate HTTPS certificates"
echo ""
echo "Happy coding! 🎉"
