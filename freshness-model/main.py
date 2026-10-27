
from fastapi import FastAPI
from pathlib import Path
import io
import pickle
import numpy as np
from PIL import Image
from fastapi import File, HTTPException, UploadFile

app = FastAPI(title="Food Verse AI Freshness API")


@app.get("/")
def home():
    return {
        "success": True,
        "message": "Food Verse AI Freshness API is running."
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "healthy"
    }

    from pathlib import Path
    
import io
import pickle

import numpy as np
from PIL import Image
from fastapi import File, HTTPException, UploadFile


MODEL_PATH = Path(__file__).parent / "apple_freshness_model.pkl"

with open(MODEL_PATH, "rb") as model_file:
    freshness_model = pickle.load(model_file)


def extract_features(image):
    image = image.convert("RGB").resize((64, 64))
    pixels = np.asarray(image, dtype=np.float32) / 255.0

    features = []
    features.extend(pixels.mean(axis=(0, 1)))
    features.extend(pixels.std(axis=(0, 1)))
    features.append(pixels.mean())
    features.append(pixels.max() - pixels.min())

    for channel in range(3):
        hist, _ = np.histogram(
            pixels[:, :, channel],
            bins=16,
            range=(0, 1),
            density=True
        )
        features.extend(hist)

    return np.asarray(features, dtype=np.float32)


@app.post("/predict")
async def predict_freshness(image: UploadFile = File(...)):
    if image.content_type not in (
        "image/jpeg", "image/png", "image/webp"
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WEBP image."
        )

    try:
        contents = await image.read()
        uploaded_image = Image.open(io.BytesIO(contents))
        features = extract_features(uploaded_image).reshape(1, -1)

        prediction = int(freshness_model.predict(features)[0])
        probabilities = freshness_model.predict_proba(features)[0]
        confidence = float(probabilities[prediction])

        label = "fresh" if prediction == 0 else "rotten"

        return {
            "success": True,
            "fruit": "apple",
            "predicted_class": label,
            "confidence_percent": round(confidence * 100, 2),
            "message": f"Model predicts {label}.",
            "safety_note": (
                "This experimental prediction cannot establish "
                "whether food is safe to eat."
            )
        }

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Could not process image: {error}"
        )

