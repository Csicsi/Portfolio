pipeline {
    agent any

    stages {

        stage('Clone') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker compose down
                    docker compose up -d --build
                '''
            }
        }
    }

    post {
        success {
            echo "Site deployed successfully!"
        }
        failure {
            echo "Deployment failed!"
        }
    }
}
