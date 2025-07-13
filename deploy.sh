#!/bin/bash

# Build the Docker image
echo "Building Docker image..."
docker build -t meetingrtc:latest .

# Run the container locally for testing (optional)
echo "To run locally, use:"
echo "docker run -p 5008:5008 meetingrtc:latest"

# For Vercel deployment, you can use:
echo ""
echo "For Vercel deployment:"
echo "1. Install Vercel CLI: npm i -g vercel"
echo "2. Run: vercel"
echo "3. Follow the prompts to deploy"
echo ""
echo "Or use the Vercel dashboard to connect your GitHub repository" 