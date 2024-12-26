#!/bin/bash

# Source the conda setup script
source /home/ubuntu/miniconda3/etc/profile.d/conda.sh

# Activate the jupyter environment
echo "activating aws env..."
conda activate aws

# Verify the activation of the environment
if [ $? -eq 0 ]; then
    echo "activated aws env..."
else
    echo "failed to activate aws env"
    exit 1
fi

# Run the main.py script
/home/ubuntu/miniconda3/envs/aws/bin/python /home/ubuntu/christ-mom/backend/app.py
