pipeline {
    agent any
    
    environment {
        DEPLOY_HOST = '192.168.8.10'
        DEPLOY_USER = 'dcsicsak'
        EPLOY_PATH = '/home/dcsicsak/portfolio'
        
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
                        # Test SSH connection
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "echo 'SSH connection successful'"
                        
                        # Deploy commands
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} << 'ENDSSH'
                        
                        # Navigate to deployment directory
                        cd ${DEPLOY_PATH}
                        
                        # Pull latest changes
                        echo "Pulling latest changes from repository..."
                        git pull origin main
                        
                        # Install dependencies (if needed)
                        # npm install
                        # pip install -r requirements.txt
                        
                        # Build (if needed)
                        # npm run build
                        # make build
                        
                        # Restart service (adjust based on your setup)
                        # sudo systemctl restart portfolio.service
                        # docker-compose up -d
                        # pm2 restart portfolio
                        
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
