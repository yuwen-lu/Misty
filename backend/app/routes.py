# app/routes.py
from flask import Blueprint, request, Response
from .openai_integration import get_openai_response  # Assuming this function exists

main = Blueprint('main', __name__)

@main.route('/api/chat', methods=['POST'])
def chat():
    data = request.json  # Get the JSON data from the request
    message = data.get('message')
    image = data.get('image')
    json_mode = data.get('json_mode')
    
    # Strip the prefix of the base64 image
    if image:
        image = image.split("base64,")[-1]

    # SSE streaming response
    def generate():
        for chunk in get_openai_response(message, image, json_mode):
            if chunk:
                yield f"data: {chunk}\n\n"

    return Response(generate(), content_type='text/event-stream')