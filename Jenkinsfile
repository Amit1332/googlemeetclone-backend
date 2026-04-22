pipeline {
    agent any

    tools {
        nodejs 'node20'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
       
         stage('Build Docker Image') {
            steps {
                bat 'docker build -t googlemeetclone-server .'
            }
        }

         stage('Run Container') {
            steps {
                bat '''
                docker ps -a --format "{{.Names}}" | findstr /i googlemeet-backend >nul
                if %ERRORLEVEL%==0 (
                    docker stop googlemeet-backend
                    docker rm googlemeet-backend
                ) else (
                    echo Container does not exist
                )

                docker run -d --name googlemeet-backend -p 3001:3001 googlemeetclone-server:latest
                '''
            }
        }
    }
}
