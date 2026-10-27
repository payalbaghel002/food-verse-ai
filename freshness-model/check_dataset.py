
from datasets import load_dataset
from collections import Counter

print("Loading dataset for class distribution...")

dataset = load_dataset(
    "Project-AgML/fresh_rotten_fruit_classification",
    "raw",
    split="train"
)

label_names = dataset.features["label"].names

print("\nFreshness class distribution:")
label_counts = Counter(dataset["label"])

for label_id, count in sorted(label_counts.items()):
    print(f"{label_names[label_id]}: {count}")

print("\nFruit type distribution:")
fruit_counts = Counter(dataset["fruit_type"])

for fruit, count in sorted(fruit_counts.items()):
    print(f"{fruit}: {count}")

print("\nFreshness counts for apples:")
apple_rows = [
    item for item in dataset
    if item["fruit_type"] == "apple"
]
apple_counts = Counter(item["label"] for item in apple_rows)

for label_id, count in sorted(apple_counts.items()):
    print(f"{label_names[label_id]}: {count}")

print("\nDistribution check complete.")
