# misty

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Docker**: Ensure that Docker is installed on your machine. You can check this by running:
  ```bash
  docker --version
  ```
- **Docker Compose** (optional but recommended for multi-container setup): Check the installation by running:
  ```bash
  docker-compose --version
  ```

If you prefer to run the application without Docker, you will need the following:

- **Python 3.x**: Ensure that Python 3 is installed on your machine. You can check this by running:
  ```bash
  python3 --version
  ```
- **Pip3**: Ensure that pip3 (the package installer for Python) is installed. You can check this by running:
  ```bash
  pip3 --version
  ```
- **Node.js and npm**: Ensure that Node.js and npm (Node Package Manager) are installed. You can check this by running:
  ```bash
  node --version
  npm --version
  ```

## Setup Environment Variables

Before running the application, create a `.env` file under the `backend/` directory with the following environment variables:

```plaintext
ORGANIZATION_ID=your_organization_id_here
OPENAI_API_KEY=your_openai_api_key_here
```

Replace `your_organization_id_here` and `your_openai_api_key_here` with your actual values.

## Installation

### Option 1: Using Docker

#### **1. Build and Run the React Frontend**

1. **Navigate to the frontend directory**:
   ```bash
   cd ./frontend
   ```

2. **Build the Docker image**:
   ```bash
   docker build -t react-frontend .
   ```
   - `-t react-frontend`: Tags the image with the name `react-frontend`.
   - `.`: Refers to the current directory where the Dockerfile is located.

3. **Run the Docker container**:
   ```bash
   docker run -p 80:80 react-frontend
   ```
   - `-p 80:80`: Maps port 80 of the host to port 80 of the container, allowing you to access the React app via `http://localhost`.

#### **2. Build and Run the Python Backend**

1. **Navigate to the backend directory**:
   ```bash
   cd ./backend
   ```

2. **Build the Docker image**:
   ```bash
   docker build -t python-backend .
   ```
   - `-t python-backend`: Tags the image with the name `python-backend`.

3. **Run the Docker container**:
   ```bash
   docker run -p 5000:5000 python-backend
   ```
   - `-p 5000:5000`: Maps port 5000 of the host to port 5000 of the container, allowing you to access the backend service via `http://localhost:5000`.

### Option 2: Manual Setup

If you prefer to run the application manually without Docker, follow these steps:

#### Backend

1. Install the required Python dependencies:

   ```bash
   pip3 install -r requirements.txt
   ```

2. To run the backend:

   ```bash
   python3 run.py
   ```

#### Frontend

1. Navigate to the frontend directory and install the required Node.js dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. To run the React frontend, start the development server:

   ```bash
   npm start
   ```

   This will start the React development server, typically on `http://localhost:3000`. Open this URL in your web browser to view the application.

## Running the Application

### Using Docker

- To start both services with Docker Compose:

  ```bash
  docker-compose up
  ```

- To stop the services:

  ```bash
  docker-compose down
  ```

### Without Docker

Follow the manual setup steps outlined above for the backend and frontend.

## Troubleshooting

- If you encounter any issues with Docker, ensure that Docker and Docker Compose are installed and running correctly.
- For manual setup, ensure all prerequisites are installed, and environment paths are set correctly.