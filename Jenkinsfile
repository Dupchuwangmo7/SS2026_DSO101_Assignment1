pipeline {
    agent any

    tools {
        nodejs 'NodeJS'   // Must match the NodeJS name configured under Manage Jenkins > Tools
    }

    environment {
        DOCKER_HUB_USER = 'dupchuuw'        // Your Docker Hub username
        STUDENT_ID      = '02230282'        // Used as the image tag
    }

    stages {
        // Stage 1: Checkout source from GitHub
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Dupchuwangmo7/SS2026_DSO101_Assignment1.git',
                    credentialsId: 'github-creds'
            }
        }

        // Stage 2: Install dependencies for both backend and frontend
        stage('Install Dependencies') {
            parallel {
                stage('Backend npm install') {
                    steps {
                        dir('backend') {
                            sh 'npm install'
                        }
                    }
                }
                stage('Frontend npm install') {
                    steps {
                        dir('frontend') {
                            sh 'npm install'
                        }
                    }
                }
            }
        }

        // Stage 3: Build the frontend (backend is plain Node.js, no build step)
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'CI=false npm run build'
                }
            }
        }

        // Stage 4: Run unit tests on the backend; publish JUnit results
        stage('Test') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
            post {
                always {
                    junit 'backend/junit.xml'
                }
            }
        }

        // Stage 5: Build Docker images and push to Docker Hub
        stage('Docker Build & Push') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-creds') {
                        def beImage = docker.build("${DOCKER_HUB_USER}/be-todo:${STUDENT_ID}", "./backend")
                        beImage.push()
                        beImage.push('latest')

                        def feImage = docker.build("${DOCKER_HUB_USER}/fe-todo:${STUDENT_ID}", "./frontend")
                        feImage.push()
                        feImage.push('latest')
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded — images pushed: ${DOCKER_HUB_USER}/be-todo:${STUDENT_ID} and ${DOCKER_HUB_USER}/fe-todo:${STUDENT_ID}"
        }
        failure {
            echo 'Pipeline failed — see stage logs above.'
        }
        always {
            cleanWs()
        }
    }
}
