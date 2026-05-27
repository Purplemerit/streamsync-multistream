pipeline {
    agent any

    environment {
        APP_NAME = "streamsync"
        ENV_FILE = "/home/ubuntu/streamsync/.env"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        stage('Build Images') {
            steps {
                sh "docker build -t ${APP_NAME}-backend:latest ./backend"
                sh """
                    docker build \
                        --build-arg VITE_API_URL=\$(grep VITE_API_URL ${ENV_FILE} | cut -d= -f2) \
                        --build-arg VITE_GOOGLE_CLIENT_ID=\$(grep VITE_GOOGLE_CLIENT_ID ${ENV_FILE} | cut -d= -f2) \
                        -t ${APP_NAME}-frontend:latest ./frontend
                """
            }
        }

        stage('Test') {
            steps {
                sh "docker build --target builder -t ${APP_NAME}-frontend-test ./frontend"
                sh "docker run --rm ${APP_NAME}-frontend-test npm run lint"
            }
        }

        stage('Deploy') {
            steps {
                sh "docker compose --env-file ${ENV_FILE} up -d --force-recreate --remove-orphans"
            }
        }

        stage('Cleanup') {
            steps {
                sh "docker image prune -f"
            }
        }

    }

    post {
        success {
            echo "✅ ${APP_NAME} deployed successfully!"
        }
        failure {
            echo "❌ ${APP_NAME} deployment failed. Check the logs above."
        }
    }
}
