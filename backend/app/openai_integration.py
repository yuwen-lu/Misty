# backend/app/openai_integration.py
from openai import OpenAI
import base64
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file

ORGANIZATION_ID = os.getenv('ORGANIZATION_ID')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

MODEL = "gpt-4o"
    
def get_openai_response(text_message, base64_image=None, json_mode=False):
    
    # construct the message body based on whether there are images sent
    # start with the system prompt
    user_message_body = [{"role": "system", "content": "You are a senior professional UI/UX designer and developer. Your main job is to follow the user's instructions, help them understand design decisions and design options better, and create web UI development code that matches their requirements. Use React and TailwindCSS in your implementation. Be helpful in answer other design-related questions too. Be concise in your response. Be specific and avoid generic terms such as usability or user friendly. Do not provide information you are not asked about."}, ]
    
    # then append the text prompt
    if base64_image:
        user_message = {
            "role": "user", "content": [ 
                {"type": "text", "text": text_message},
                {"type": "image_url", 
                 "image_url": 
                    {"url": f"data:image/png;base64,{base64_image}"}
                }]}
    else:
        user_message = {"role": "user", "content": text_message}
        
    user_message_body.append(user_message)
    
    # print("Final user message (prompt): \n" + str(user_message_body))

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

    response = ""
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            content = chunk.choices[0].delta.content
            if content:
                yield content
    # print("Here is the response: " + response)
    # response = markdown.markdown(response)
    # print("Markdown processed response: " + response)
    # return response
