# app/routes.py
from flask import Blueprint, request, jsonify
from .openai_integration import get_openai_response  # Assuming this function exists

main = Blueprint('main', __name__)

@main.route('/api/chat', methods=['POST'])
def chat():
    print("request: ", request)
    data = request.json  # Get the JSON data from the request
    message = data.get('message')
    image = data.get('image')
    # strip the prefix of the base64 image
    image = image.split("base64,")[-1]
    
    # Log or process the received message data as needed
    print(f"Received message: {message}")
    if image:
        print("Here's the beginning of base64 image: ", image[:50])
        print("length of base64: " + str(len(image)))
    else:
        print("no image received.")

    # Call your OpenAI function or any other processing
    response = get_openai_response(message, image)  # Assuming get_openai_response processes the text and returns a response

    return jsonify({"response": response})


# Route for seeing a data
@main.route('/data')
def get_time():
    return {
        "response": "hello from backend"
    }