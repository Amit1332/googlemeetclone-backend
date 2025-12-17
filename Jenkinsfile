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

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Build (if applicable)') {
            steps {
                bat 'npm run build'
            }
        }

        stage('Start Application') {
            steps {
                bat 'npm start'
            }
        }
    }
}
