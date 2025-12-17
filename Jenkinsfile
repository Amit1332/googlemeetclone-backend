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
                docker stop googlemeet-backend || exit 0
                docker rm googlemeet-backend || exit 0
                docker run -d -p 3001:3001 --name googlemeet-backend googlemeetclone-server
                '''
            }
        }
    }
}
