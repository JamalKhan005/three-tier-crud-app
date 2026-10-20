pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Installing backend dependencies...'
                sh 'cd backend && npm install --omit=dev'
            }
        }

        stage('Test') {
            steps {
                echo 'Checking backend syntax...'
                sh 'node --check backend/server.js'
                sh 'test -f frontend/index.html'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying frontend and backend...'
                sh '''
                  rm -rf /opt/tasks-app/backend/*
                  cp -r backend/. /opt/tasks-app/backend/
                  cp frontend/index.html /var/www/tasks-app/index.html
                  sudo systemctl restart tasks-backend
                  sudo systemctl reload nginx
                '''
            }
        }

        stage('Verify') {
            steps {
                sh '''
                  for i in $(seq 1 15); do
                    if curl -sf http://localhost/api/health; then
                      echo ""
                      echo "Application is healthy"
                      exit 0
                    fi
                    echo "Waiting for app..."
                    sleep 3
                  done
                  echo "Health check failed"
                  exit 1
                '''
            }
        }
    }

    post {
        success { echo 'Pipeline succeeded. App is live on port 80.' }
    }
}
