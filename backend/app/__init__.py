# app/__init__.py
from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    CORS(app, resources={r"/*": {"origins": "http://ylu48-default.siri-interactive-vm.svc.kube.us-west-3b.k8s.cloud.apple.com"}})
    app.config['CORS_HEADERS'] = 'Content-Type'
    
    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app
