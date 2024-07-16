# app/routes.py
from flask import Blueprint, request, Response
from openai import OpenAI
import base64
from dotenv import load_dotenv
import os

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
    MODEL = "gpt-4o"
    
    # Strip the prefix of the base64 image
    if image:
        image = image.split("base64,")[-1]

    # SSE streaming response
    def generate():
        # construct the message body based on whether there are images sent
        # start with the system prompt
        user_message_body = [{"role": "system", "content": "You are a senior professional UI/UX designer and developer. Your main job is to follow the user's instructions, help them understand design decisions and design options better, and create web UI development code that matches their requirements. Use React and TailwindCSS in your implementation. Be helpful in answer other design-related questions too. Be concise in your response. Be specific and avoid generic terms such as usability or user friendly. Do not provide information you are not asked about."}, ]
        
        # then append the text prompt
        if image:
            user_message = {
                "role": "user", "content": [ 
                    {"type": "text", "text": message},
                    {"type": "image_url", 
                    "image_url": 
                        {"url": f"data:image/png;base64,{image}"}
                    }]}
        else:
            user_message = {"role": "user", "content": message}
            
        user_message_body.append(user_message)
        
        print("Final user message (prompt): \n" + str(user_message_body[0]))

        client = OpenAI(
            organization=os.getenv('ORGANIZATION_ID'),
            api_key=os.getenv('OPENAI_API_KEY'),
        )

        stream = client.chat.completions.create(
            model=MODEL,
            messages=user_message_body,
            stream=True,
            response_format= {"type": "json_object"} if json_mode else {},
        )

        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                print(chunk.choices[0].delta.content)
                yield chunk.choices[0].delta.content
        

    return Response(generate(), content_type='text/event-stream')