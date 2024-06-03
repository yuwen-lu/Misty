# backend/app/openai_integration.py
from openai import OpenAI
import base64
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file

ORGANIZATION_ID = os.getenv('ORGANIZATION_ID')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

MODEL = "gpt-4o"
# IMAGE_PATH = "img/otterai.png"

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")
    
def get_openai_response(user_message):
    # base64_image = encode_image(IMAGE_PATH)

    client = OpenAI(
        organization=os.getenv('ORGANIZATION_ID'),
        api_key=os.getenv('OPENAI_API_KEY'),
    )

    stream = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": user_message}
        ],
        stream=True,
    )

    response = ""
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            response += chunk.choices[0].delta.content
    return response
