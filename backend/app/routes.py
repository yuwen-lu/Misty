from flask import Blueprint, request, Response
from openai import OpenAI
import base64
from dotenv import load_dotenv
import os
from datetime import datetime
import pytz  # Import pytz for time zone handling

main = Blueprint('main', __name__)

@main.route('/api/chat', methods=['POST'])
def chat():
    data = request.json  # Get the JSON data from the request
    message = data.get('message')
    image = data.get('image')
    json_mode = data.get('json_mode')

    load_dotenv()  # Load environment variables from .env file
    ORGANIZATION_ID = os.getenv('ORGANIZATION_ID')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    OPENAI_PROJECT_ID = os.getenv('OPENAI_PROJECT_ID')
    MODEL = "gpt-4o"

    # Strip the prefix of the base64 image
    if image:
        image = image.split("base64,")[-1]

    output_dir = "outputs"

    # Get the current timestamp in Pacific Time
    pacific_tz = pytz.timezone('America/Los_Angeles')
    timestamp = datetime.now(pacific_tz).strftime("%Y%m%d_%H%M%S")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    filename = os.path.join(output_dir, f"model_output_{timestamp}.txt")

    # SSE streaming response
    def generate():
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

        print("Final user message (prompt): \n" + str(user_message_body[0]))

        client = OpenAI(
            api_key=OPENAI_API_KEY,
        )

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
                print(content_chunk)
                output_chunks.append(content_chunk)
                yield content_chunk

        # Write the system and user prompts, followed by the accumulated output, to a timestamped text file
        with open(filename, "w") as file:
            print("saving file...")
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

    return Response(generate(), content_type='text/event-stream')
