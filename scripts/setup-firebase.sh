#!/bin/bash

# YugmiInspector Firebase Setup Script
# This script helps set up Firebase services for the YugmiInspector app

echo "🚀 YugmiInspector Firebase Setup"
echo "================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed"
    echo "Please install it by running: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI found"

# Login to Firebase
echo "🔐 Logging into Firebase..."
firebase login

# Initialize Firebase project
echo "🔧 Initializing Firebase project..."
firebase init firestore storage

# Deploy Firestore rules
echo "📋 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

# Deploy Firestore indexes
echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

# Deploy Storage rules
echo "🗂️ Deploying Storage security rules..."
firebase deploy --only storage

# Create initial collections (optional)
echo "🗃️ Setting up initial database structure..."

# You can add Firebase Admin SDK calls here to create initial data
# For example:
# node scripts/init-database.js

echo "✅ Firebase setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update src/lib/firebase.ts with your Firebase config"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm start' to start the development server"
echo ""
echo "🔍 Testing your setup:"
echo "1. Create a test user account"
echo "2. Take a photo to test media upload"
echo "3. Check Firebase Console to see the data"
echo ""
echo "📖 For detailed instructions, see README_FIREBASE.md"
