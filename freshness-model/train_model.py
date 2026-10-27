
from collections import Counter
from pathlib import Path
import pickle

import numpy as np
from datasets import load_dataset
from PIL import Image, ImageStat
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score


print("Loading apple images...")

dataset = load_dataset(
    "Project-AgML/fresh_rotten_fruit_classification",
    "raw",
    split="train"
)

apple_rows = [
    item for item in dataset
    if item["fruit_type"] == "apple"
]

print("Apple images:", len(apple_rows))

def extract_features(image):
    image = image.convert("RGB").resize((64, 64))
    pixels = np.asarray(image, dtype=np.float32) / 255.0

    features = []

    # Average red, green and blue values
    features.extend(pixels.mean(axis=(0, 1)))

    # Color variation
    features.extend(pixels.std(axis=(0, 1)))

    # Average brightness and color-channel differences
    features.append(pixels.mean())
    features.append(pixels.max() - pixels.min())

    # Coarse color distribution
    for channel in range(3):
        hist, _ = np.histogram(
            pixels[:, :, channel],
            bins=16,
            range=(0, 1),
            density=True
        )
        features.extend(hist)

    return np.asarray(features, dtype=np.float32)


print("Extracting image features...")
X = np.array([
    extract_features(item["image"])
    for item in apple_rows
])

y = np.array([item["label"] for item in apple_rows])

print("Class counts:", Counter(y))

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training model...")
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)
model.fit(X_train, y_train)

predictions = model.predict(X_test)

print("\nTest accuracy:", round(accuracy_score(y_test, predictions), 4))
print("\nClassification report:")
print(classification_report(
    y_test,
    predictions,
    labels=[0, 1],
    target_names=["fresh", "rotten"],
    zero_division=0
))

model_path = Path(__file__).parent / "apple_freshness_model.pkl"

with open(model_path, "wb") as file:
    pickle.dump(model, file)

print("\nModel saved to:", model_path)
print("Training and evaluation completed.")
