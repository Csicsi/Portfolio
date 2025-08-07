pipeline {
  agent any

  environment {
    COMPOSE_FILE = 'docker-compose.yml'
  }

  stages {
    stage('Clone') {
      steps {
        checkout scm
      }
    }

    stage('Build and Deploy with Compose') {
      steps {
        script {
          sh "docker-compose -f ${COMPOSE_FILE} down"
          sh "docker-compose -f ${COMPOSE_FILE} up -d --build"
        }
      }
    }
  }

  post {
    always {
      cleanWs()
    }
  }
}
