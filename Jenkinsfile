pipeline {
  agent any

  environment {
    IMAGE_NAME = 'dcsicsak/portfolio'
  }

  stages {
    stage('Clone') {
      steps {
        checkout scm
      }
    }

    stage('Build Docker Image') {
      steps {
        script {
          sh "docker build -t ${IMAGE_NAME}:latest -f Dockerfile.prod ."
        }
      }
    }

    stage('Push to Docker Hub') {
      when {
        expression { return env.DOCKERHUB_PUSH == 'true' }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          script {
            sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
            sh "docker push ${IMAGE_NAME}:latest"
          }
        }
      }
    }

    stage('Deploy Container') {
      steps {
        script {
          sh """
            docker rm -f vite-site || true
            docker run -d --name vite-site -p 8888:80 ${IMAGE_NAME}:latest
          """
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
