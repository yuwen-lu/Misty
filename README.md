# misty

Misty is an interactive canvas, where UI/UX designers and developers can blend inspirational design screenshots into their own work-in-progress code.

Imagine Cursor and Claude Code for UI, but on a canvas where you can freely explore.

We imagine it to be an alternative to writing prompts. No need to come up with a description of what you want, just drag and drop it.

AI that catches up to the speed of your intuition, not your articulation.

[Watch the demo](https://x.com/yuwen_lu_/status/1850574331539276198)

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

Create a `.env.local` file in the root directory with the following environment variables:

```plaintext
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Replace `your_openai_api_key_here` with your actual OpenAI API key and `your_anthropic_api_key_here` with your actual Anthropic API key.

## Installation

### Option 1: Using Docker

1. **Build the Docker image**:
   ```bash
   docker build -t misty-app .
   ```
   - `-t misty-app`: Tags the image with the name `misty-app`.
   - `.`: Refers to the current directory where the Dockerfile is located.

2. **Run the Docker container**:
   ```bash
   docker run -p 3000:3000 misty-app
   ```
   - `-p 3000:3000`: Maps port 3000 of the host to port 3000 of the container, allowing you to access the app via `http://localhost:3000`.

### Option 2: Manual Setup

If you prefer to run the application manually without Docker, follow these steps:

1. Install the required Node.js dependencies:

   ```bash
   npm install
   ```

2. To run the Next.js application in development mode:

   ```bash
   npm run dev
   ```

   This will start the Next.js development server on `http://localhost:3000`. Open this URL in your web browser to view the application.

3. For production:

   ```bash
   npm run build
   npm start
   ```

## Running the Application

### Using Docker

Follow the Docker installation steps above to build and run the application.

### Without Docker

Follow the manual setup steps outlined above.

## API Endpoints

The application now includes the following API endpoints:

- `GET /api/test` - Test endpoint to verify the API is working
- `GET /api/healthz` - Health check endpoint
- `POST /api/chat` - Main chat endpoint for OpenAI interactions with streaming support
- `POST /api/design-chat` - Design assistant endpoint using Claude (Anthropic) with streaming support

## Troubleshooting

- If you encounter any issues with Docker, ensure that Docker is installed and running correctly.
- For manual setup, ensure all prerequisites are installed, and environment paths are set correctly.
- Make sure to set both `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` environment variables in your `.env.local` file.

## Design Education Pedagogy

- Bauhaus Method
- Constructive Critique
- Double Diamond Process