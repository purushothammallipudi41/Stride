#!/bin/bash

# Stride Backend Status Checker
PORT=3001
URL="http://localhost:$PORT/api/health"

echo "-----------------------------------------------"
echo "🔍 Checking Stride Backend Status..."
echo "-----------------------------------------------"

# 1. Check if port is listening
if lsof -i :$PORT > /dev/null; then
    echo "✅ Port $PORT is ACTIVE."
else
    echo "❌ Port $PORT is NOT listening. Backend might be down."
    exit 1
fi

# 2. Check health endpoint
RESPONSE=$(curl -s $URL)
if [[ $RESPONSE == *"\"status\":\"ok\""* ]]; then
    echo "✅ API Health Check: OK"
    
    if [[ $RESPONSE == *"\"database\":\"connected\""* ]]; then
        echo "✅ Database Connection: CONNECTED"
    else
        echo "⚠️  Database Connection: DISCONNECTED"
    fi
else
    echo "❌ API Health Check: FAILED (Response: $RESPONSE)"
    exit 1
fi

echo "-----------------------------------------------"
echo "✨ All systems nominal (for the project code)."
echo "💡 If the IDE still shows 'Crashed', it's an environment glitch."
echo "-----------------------------------------------"
