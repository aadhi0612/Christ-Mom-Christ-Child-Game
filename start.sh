#!/bin/bash
# Filepath: /home/ubuntu/christ-mom/start-app.sh

# Start backend
echo "Starting backend..."
/home/ubuntu/christ-mom/start-backend.sh &

# Start frontend
echo "Starting frontend..."
/home/ubuntu/christ-mom/start-frontend.sh &

# Wait for both processes to finish
wait

