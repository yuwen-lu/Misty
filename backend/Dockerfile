# Use an official Python runtime as a parent image
FROM python:3.12

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port available to the world outside this container
EXPOSE $PORT

# Define environment variable
ENV PORT=10000

# Run the application with Gunicorn
CMD gunicorn run:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120
