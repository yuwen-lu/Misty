# app/routes.py
from flask import Blueprint, request, jsonify
from .openai_integration import get_openai_response  # Assuming this function exists

main = Blueprint('main', __name__)

@main.route('/api/chat', methods=['POST'])
def chat():
    print("request: ", request)
    data = request.json  # Get the JSON data from the request
    username = data.get('username')
    text = data.get('text')
    
    # Log or process the received message data as needed
    print(f"Received message from {username}: {text}")

    # Call your OpenAI function or any other processing
    response = get_openai_response(text)  # Assuming get_openai_response processes the text and returns a response

    return jsonify({"message": response})


# Route for seeing a data
@main.route('/data')
def get_time():
    return {
        "message": "hello from backend"
    }