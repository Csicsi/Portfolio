pipeline {
    agent any
    
    environment {
        DEPLOY_HOST = '192.168.8.10'
        DEPLOY_USER = 'dcsicsak'
        DEPLOY_PATH = '/home/dcsicsak/portfolio'
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
                        
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} bash << 'ENDSSH'
                        
# Create directory if needed
mkdir -p ${DEPLOY_PATH}
cd ${DEPLOY_PATH}

# Clone or pull
if [ -d .git ]; then
    echo "Repository exists, pulling latest changes..."
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/Csicsi/Portfolio.git .
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Rebuild and start containers
echo "Building and starting containers..."
docker-compose up -d --build

echo "Deployment completed successfully!"
ENDSSH
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
