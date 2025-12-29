#!/bin/bash

# Test script for the render-social endpoint
# Usage: ./test-render-social.sh

# Make sure your dev server is running: npm run dev

curl -X POST http://localhost:3000/api/render-social \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: 46d0f06a9aeed195fed06149d63f520d4c3d2b08b09ea41cc8d43272b8306ecf" \
  -d '{
    "backgroundImage": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1080&fit=crop",
    "width": 1080,
    "height": 1080,
    "textElements": [
      {
        "text": "Test Text from Airtable",
        "x": 100,
        "y": 200,
        "fontFamily": "Arial",
        "fontSize": 48,
        "color": "#000000",
        "textAlign": "center",
        "fontWeight": "bold"
      }
    ]
  }' | jq '.'

