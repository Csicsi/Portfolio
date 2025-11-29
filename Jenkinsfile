pipeline {
    agent any
    stages {
        stage('Clone') {
            steps {
                checkout scm
            }
        }
        stage('Test') {
            steps {
                sh 'echo "Run your tests here"'
            }
        }
        stage('Deploy') {
            steps {
                sh 'echo "Deploy your app here"'
            }
        }
    }
}