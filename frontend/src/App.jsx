
import { useEffect, useState } from 'react';
import './App.css';
import { pipeline } from '@huggingface/transformers';


const features = [
  {
    icon: '🥗',
    title: 'Food Recognition',
    description: 'Identify food items and explore nutritional values.',
    button: 'Analyze Food',
  },
  {
    icon: '🍎',
    title: 'Freshness Detection',
    description: 'Look for visible signs of spoilage in food images.',
    button: 'Check Freshness',
  },
  {
    icon: '🧑‍🍳',
    title: 'Kitchen Hygiene',
    description: 'Review visible hygiene concerns in kitchen images.',
    button: 'Check Hygiene',
  },
  {
    icon: '🍳',
    title: 'Cooking Assistant',
    description: 'Discover recipes using ingredients you have.',
    button: 'Explore Recipes',
  },
  {
    icon: '📅',
    title: 'Meal Planner',
    description: 'Plan meals around your preferences and goals.',
    button: 'Plan Meals',
  },
];

// Approximate nutrition values per 100 g
const nutritionData = {
  Rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  Roti: { calories: 120, protein: 3, carbs: 20, fat: 3 },
  Pizza: { calories: 266, protein: 11, carbs: 33, fat: 10 },
  Pasta: { calories: 157, protein: 5.8, carbs: 31, fat: 0.9 },
  Salad: { calories: 50, protein: 2, carbs: 10, fat: 0.5 },
  Apple: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  Banana: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
};

function calculateHealthScore(food, nutrition) {
  if (!nutrition) return null;

  // Simple demo scoring, not a medical assessment
  let score = 50;

  if (nutrition.protein >= 5) score += 15;
  if (nutrition.carbs <= 20) score += 10;
  if (nutrition.fat <= 5) score += 10;
  if (nutrition.calories <= 150) score += 10;

  if (food === 'Salad' || food === 'Apple' || food === 'Banana') {
    score += 5;
  }

  return Math.min(score, 100);
}


export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [showFoodRecognition, setShowFoodRecognition] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFood, setSelectedFood] = useState("Pasta");
  const [foodName, setFoodName] = useState('');
  const [nutrition, setNutrition] = useState(null);
  const [freshnessResult, setFreshnessResult] = useState(null);
const [freshnessLoading, setFreshnessLoading] = useState(false);
const [freshnessError, setFreshnessError] = useState('');
  const [recipeError, setRecipeError] = useState('');

  useEffect(() => {
    fetch('/api/recipes')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load recipes');
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          setRecipes(data.recipes);
          setBackendStatus('Connected');
        } else {
          setBackendStatus('Error');
          setRecipeError('The backend did not return recipes.');
        }
      })
      .catch((error) => {
        console.error('Error fetching recipes:', error);
        setBackendStatus('Disconnected');
        setRecipeError('Could not load recipes. Check your backend server.');
      });
  }, []);

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (file) {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }

      setSelectedImage(URL.createObjectURL(file));
      setNutrition(null);
    }
  }

  
async function checkFreshness() {
  if (!selectedImage) {
    setFreshnessError('Please upload a food image first.');
    return;
  }

  setFreshnessLoading(true);
  setFreshnessError('');
  setFreshnessResult(null);

  try {
    const response = await fetch(selectedImage);
    const imageBlob = await response.blob();

    const formData = new FormData();
    formData.append('image', imageBlob, 'food-image.jpg');

    const result = await fetch('/api/preprocess-image', {
      method: 'POST',
      body: formData,
    });

    const data = await result.json();

    if (!result.ok || !data.success) {
      throw new Error(data.message || 'Image preprocessing failed.');
    }

    setFreshnessResult(data.image);
  } catch (error) {
    console.error('Freshness preprocessing error:', error);
    setFreshnessError(error.message || 'Could not process the image.');
  } finally {
    setFreshnessLoading(false);
  }
}

  



async function analyzeFood() {
  if (!selectedImage) {
    alert('Please upload an image first.');
    return;
  }

  try {
    setFoodName('Loading AI model...');
    setNutrition(null);

    const classifier = await pipeline(
      'zero-shot-image-classification',
      'Xenova/clip-vit-base-patch32'
    );

    setFoodName('Analyzing image...');

    const results = await classifier(selectedImage, [
      'a photo of rice',
      'a photo of roti',
      'a photo of pizza',
      'a photo of pasta',
      'a photo of salad',
      'a photo of an apple',
      'a photo of a banana'
    ]);

    console.log('AI classification results:', results);

    if (!results || results.length === 0) {
      setFoodName('');
      alert('The AI model returned no predictions.');
      return;
    }

    const label = results[0].label;
    const matchedFood = Object.keys(nutritionData).find(
      (food) => label.toLowerCase().includes(food.toLowerCase())
    );

    setFoodName(matchedFood || label);

    if (matchedFood) {
      setNutrition(nutritionData[matchedFood]);
    } else {
      setNutrition(null);
      alert(`AI prediction: ${label}. Nutrition data is not available for this result yet.`);
    }
  } catch (error) {
    console.error('Food classification error:', error);
    setFoodName('');
    alert(`AI classification failed: ${error.message}`);
  }
}




  return (
    <div className="app">
      <header className="navbar">
        <a href="#home" className="brand">
          🥑 Food Verse <span>AI</span>
        </a>
        <span className="tagline">Your smart food companion</span>
      </header>

      <main className="container" id="home">
        <section className="hero">
          <p className="eyebrow">
            YOUR MULTIMODAL FOOD INTELLIGENCE AGENT
          </p>

          <p>Backend Status: {backendStatus}</p>

          <h1>
            Understand your food.
            <br />
            <span>Eat smarter.</span>
          </h1>

          <p className="hero-text">
            Discover nutrition, explore recipes, assess visible
            freshness signs, and create personalized meal plans.
          </p>
        </section>

        <section className="features">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPLORE FOOD VERSE</p>
              <h2>Your AI tools</h2>
            </div>
            <span className="feature-count">05 FEATURES</span>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>

                <button
                  className="feature-button"
                  onClick={() => {
                    if (feature.title === 'Food Recognition') {
                      setShowFoodRecognition(true);
                    } else if (feature.title === 'Cooking Assistant') {
                      document.getElementById('recipes')?.scrollIntoView({
                        behavior: 'smooth',
                      });
                    } else {
                      alert(
                        `${feature.title} will be added in a future step.`
                      );
                    }
                  }}
                >
                  {feature.button} <span>→</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        {showFoodRecognition && (
          <section className="food-recognition-section">
            <p className="eyebrow">FOOD ANALYSIS</p>
            <h2>Recognize Your Food 🥗</h2>
            <p>Select a food image to get started.</p>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            {selectedImage && (
              <div className="food-image-preview">
                <img
                  src={selectedImage}
                  alt="Selected food"
                  style={{
                    maxWidth: '300px',
                    width: '100%',
                    borderRadius: '12px',
                    display: 'block',
                    margin: '20px auto',
                  }}
                />
              </div>
              
              
            )}

            
<button
  className="feature-button"
  onClick={checkFreshness}
  disabled={freshnessLoading}
>
  {freshnessLoading
    ? 'Processing Image...'
    : 'Check Image Preprocessing →'}
</button>

{freshnessError && (
  <p style={{ color: 'red' }}>{freshnessError}</p>
)}

{freshnessResult && (
  <div className="recipe-card" style={{ marginTop: '20px' }}>
    <h3>Image Preprocessing Results</h3>
    <p>Original file: {freshnessResult.originalName}</p>
    <p>Original size: {freshnessResult.originalSizeBytes} bytes</p>
    <p>Processed size: {freshnessResult.processedSizeBytes} bytes</p>
    <p>Width: {freshnessResult.width}px</p>
    <p>Height: {freshnessResult.height}px</p>
    <p>Format: {freshnessResult.format}</p>
    <p>Color channels: {freshnessResult.channels}</p>
    <p>Average brightness: {freshnessResult.averageBrightness}</p>
    <small>
      These are basic image statistics, not a confirmed freshness diagnosis.
    </small>
  </div>
)}


            <label
              htmlFor="food-name"
              style={{ display: 'block', marginTop: '20px' }}
            >
              Select the food in your image:
            </label>

            <select
              id="food-name"
              value={foodName}
              onChange={(event) => {
                setFoodName(event.target.value);
                setNutrition(null);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                marginTop: '10px',
                borderRadius: '8px',
              }}
            >
              <option value="">Choose a food</option>
              <option value="Rice">Rice</option>
              <option value="Roti">Roti</option>
              <option value="Pizza">Pizza</option>
              <option value="Pasta">Pasta</option>
              <option value="Salad">Salad</option>
              <option value="Apple">Apple</option>
              <option value="Banana">Banana</option>
            </select>

            <button
              className="feature-button"
              onClick={analyzeFood}
            >
              Analyze Selected Food →
            </button>

            {nutrition && (
              <div
                className="recipe-card"
                style={{ marginTop: '20px' }}
              >
                <h3>Nutrition Estimate: {foodName}</h3>
                {(() => {
  const score = calculateHealthScore(foodName, nutrition);

  const rating =
    score >= 75
      ? 'Healthy'
      : score >= 55
      ? 'Moderate'
      : 'Less Balanced';

  return (
    <div>
      <h3>Health Score: {score}/100</h3>
      <div
  style={{
    width: '100%',
    height: '12px',
    backgroundColor: '#e5e7eb',
    borderRadius: '10px',
    overflow: 'hidden',
    margin: '12px 0',
  }}
>
  <div
    style={{
      width: `${score}%`,
      height: '100%',
      backgroundColor:
        score >= 75 ? '#22c55e' : score >= 55 ? '#eab308' : '#ef4444',
      borderRadius: '10px',
      transition: 'width 0.4s ease',
    }}
  />
</div>
      <p>Food Rating: {rating}</p>
    </div>
  );
})()}
                <p>Calories: {nutrition.calories} kcal / 100 g</p>
                <p>Protein: {nutrition.protein} g / 100 g</p>
                <p>Carbohydrates: {nutrition.carbs} g / 100 g</p>
                <p>Fat: {nutrition.fat} g / 100 g</p>
                <p>
                  <small>
                    These are approximate reference values for the
                    selected food, not results from automatic image
                    recognition. Actual nutrition varies by recipe
                    and preparation.
                  </small>
                </p>
              </div>

              
            )}

            <button
              className="feature-button"
              onClick={() => {
                setShowFoodRecognition(false);
                setSelectedImage(null);
                setFoodName('');
                setNutrition(null);
              }}
            >
              Close
            </button>
          </section>
        )}

        <section className="recipes-section" id="recipes">
          <p className="eyebrow">FRESH IDEAS FOR YOU</p>
          <h2>Explore Recipes 🍽️</h2>

          {recipeError ? (
            <p>{recipeError}</p>
          ) : recipes.length === 0 ? (
            <p>Loading recipes...</p>
          ) : (
            <div className="recipe-grid">
              {recipes.map((recipe) => {
  const images = {
    1: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500',
    2: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
    3: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500',
    4: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=500',
  };

  return (
    <article className="recipe-card" key={recipe.id}>
      <img
        src={images[recipe.id]}
        alt={recipe.name}
        className="recipe-image"
      />

      <h3>{recipe.emoji || '🍽️'} {recipe.name}</h3>
      <p>{recipe.description}</p>
      <p>Category: {recipe.category}</p>
      <p>Cooking time: {recipe.time}</p>

      {recipe.ingredients && (
        <p>
          Ingredients:{' '}
          {Array.isArray(recipe.ingredients)
            ? recipe.ingredients.join(', ')
            : recipe.ingredients}
        </p>
      )}
    </article>
  );
})}
            </div>
          )}
        </section>

        <footer>
          Food Verse AI · Your food intelligence companion
        </footer>
      </main>
    </div>
  );
}
