from flask import Blueprint, request, Response, jsonify
from openai import OpenAI
import base64
from dotenv import load_dotenv
import os
from datetime import datetime
import pytz  # Import pytz for time zone handling
import logging
from flask_cors import CORS  # Import Flask-CORS

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

main = Blueprint('main', __name__)
CORS(main)  # Enable CORS for all routes in this blueprint

@main.route('/test', methods=['GET'])
def test():
    return jsonify({"status": "ok", "message": "Test endpoint working"}), 200

@main.route('/healthz', methods=['GET'])
def health_check():
    try:
        # Check if OpenAI API key is configured
        load_dotenv()
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return jsonify({
                'status': 'error',
                'message': 'OpenAI API key not configured'
            }), 500

        # Check if outputs directory exists and is writable
        output_dir = "outputs"
        if not os.path.exists(output_dir):
            try:
                os.makedirs(output_dir)
            except Exception as e:
                return jsonify({
                    'status': 'error',
                    'message': f'Cannot create outputs directory: {str(e)}'
                }), 500

        # If all checks pass
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now(pytz.UTC).isoformat()
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@main.route('/api/chat', methods=['POST'])
def chat():
    try:
        logger.info("Received chat request")
        data = request.json  # Get the JSON data from the request
        logger.info(f"Request data: {data}")
        
        if not data:
            logger.error("No JSON data received")
            return jsonify({"error": "No JSON data received"}), 400

        message = data.get('message')
        image = data.get('image')
        json_mode = data.get('json_mode')

        if not message:
            logger.error("No message provided")
            return jsonify({"error": "No message provided"}), 400

        load_dotenv()  # Load environment variables from .env file
        OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
        if not OPENAI_API_KEY:
            logger.error("OpenAI API key not configured")
            return jsonify({"error": "OpenAI API key not configured"}), 500

        MODEL = "gpt-4o"
        logger.info(f"Processing message: {message}")
        
        # Strip the prefix of the base64 image
        if image:
            image = image.split("base64,")[-1]
            logger.info("Image data received")

        output_dir = "outputs"

        # Get the current timestamp in Pacific Time
        pacific_tz = pytz.timezone('America/Los_Angeles')
        timestamp = datetime.now(pacific_tz).strftime("%Y%m%d_%H%M%S")

        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            logger.info(f"Created output directory: {output_dir}")

        filename = os.path.join(output_dir, f"model_output_{timestamp}.txt")

        # SSE streaming response
        def generate():
            try:
                # Accumulate output chunks
                output_chunks = []

                # System prompt
                system_prompt = {
                    "role": "system",
                    "content": "You are a senior professional UI/UX designer and developer. Your main job is to follow the user's instructions, help them create UI frontend code that matches their requirements. Use React and TailwindCSS in your implementation. Generate all of the that should be there, generate full code, DO NOT omit anything. Do not provide information you are not asked about."
                }

                # construct the message body based on whether there are images sent
                user_message_body = [system_prompt]

                # then append the text prompt
                if image:
                    user_message = {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": message},
                            {"type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{image}"}
                            }
                        ]
                    }
                else:
                    user_message = {"role": "user", "content": message}

                user_message_body.append(user_message)

                logger.info("Initializing OpenAI client")
                client = OpenAI(
                    api_key=OPENAI_API_KEY,
                )

                logger.info("Starting OpenAI stream")
                stream = client.chat.completions.create(
                    model=MODEL,
                    messages=user_message_body,
                    stream=True,
                    response_format={"type": "json_object"} if json_mode else {
                        "type": "text"},
                )

                for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        content_chunk = chunk.choices[0].delta.content
                        logger.debug(f"Received chunk: {content_chunk}")
                        output_chunks.append(content_chunk)
                        yield content_chunk

                # Write the system and user prompts, followed by the accumulated output, to a timestamped text file
                with open(filename, "w") as file:
                    logger.info(f"Saving output to file: {filename}")
                    # Log system prompt
                    file.write("System prompt:\n")
                    file.write(f"{system_prompt['content']}\n\n")

                    # Log user prompt
                    if image:
                        file.write(f"Message: {message}\n")
                        file.write(f"Image: data:image/png;base64,{image}\n\n")
                    else:
                        file.write(f"{message}\n\n")

                    # Log model output
                    file.write("Model output:\n")
                    file.write("".join(output_chunks))

            except Exception as e:
                logger.error(f"Error in generate function: {str(e)}")
                yield f"Error: {str(e)}"

        return Response(generate(), content_type='text/event-stream')

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500
