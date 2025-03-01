import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import io
import base64

class HandwritingRecognitionModel(nn.Module):
    def __init__(self):
        super(HandwritingRecognitionModel, self).__init__()
        self.cnn = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        self.fc = nn.Linear(64 * 7 * 7, 128)
        self.output = nn.Linear(128, 62)  # 62 classes: 0-9, A-Z, a-z

    def forward(self, x):
        x = self.cnn(x)
        x = x.view(x.size(0), -1)
        x = torch.relu(self.fc(x))
        x = self.output(x)
        return x

def get_model():
    model = HandwritingRecognitionModel()
    # In production, you would load pre-trained weights here
    # For now, we'll use the model without pre-trained weights
    model.eval()
    return model

def process_image(base64_image):
    try:
        # Decode base64 image
        image_data = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_data))
        
        # Preprocess image
        transform = transforms.Compose([
            transforms.Grayscale(),
            transforms.Resize((28, 28)),
            transforms.ToTensor(),
        ])
        
        image_tensor = transform(image).unsqueeze(0)
        return image_tensor
    except Exception as e:
        raise Exception(f"Error processing image: {str(e)}")

def recognize_text(base64_image):
    try:
        # Get model and process image
        model = get_model()
        image_tensor = process_image(base64_image)
        
        # Perform inference
        with torch.no_grad():
            output = model(image_tensor)
        
        # Convert output to text
        characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        _, predicted = torch.max(output, 1)
        recognized_char = characters[predicted.item()]
        
        return recognized_char
    except Exception as e:
        raise Exception(f"Error recognizing text: {str(e)}")
