pipeline {
    agent any
    
    environment {
        DEPLOY_HOST = '192.168.8.10'
        DEPLOY_USER = 'dcsicsak'
        SSH_CREDENTIAL_ID = 'main-node-deploy'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Webhook triggered - repository checked out automatically'
            }
        }
        
        stage('Deploy to Main Node') {
            steps {
                sshagent(credentials: [env.SSH_CREDENTIAL_ID]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "echo 'SSH connection successful'"
                        
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} 'bash -s' << 'EOF'
cd /home/dcsicsak

if [ -d portfolio/.git ]; then
    echo "Repository exists, pulling latest changes..."
    cd portfolio
    git pull origin main
else
    echo "Cloning repository..."
    rm -rf portfolio
    git clone https://github.com/Csicsi/Portfolio.git portfolio
    cd portfolio
fi

echo "Stopping existing containers..."
docker compose down 2>/dev/null || true

echo "Building and starting containers..."
docker compose up -d --build

echo "Deployment completed successfully!"
EOF
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment completed successfully!'
        }
        failure {
            echo 'Deployment failed. Check the logs above.'
        }
    }
}
