
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const PORT = 5000;

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Please upload an image file.'));
    }
  },
});

// Sample recipe data
const recipes = [

    {
  id: 1,
  name: 'Creamy White Pasta',
  image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500',
  category: 'Italian',
  time: '25 min',
  emoji: '🍝',
  description: 'Creamy, comforting pasta for a cozy meal.',
  ingredients: ['Pasta', 'Milk', 'Garlic', 'Cheese'],
},

  {
    id: 2,
    name: 'Veggie Power Bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
    category: 'Healthy',
    time: '15 min',
    emoji: '🥗',
    description: 'A fresh, colourful bowl packed with goodness.',
    ingredients: ['Lettuce', 'Tomato', 'Corn', 'Paneer'],
  },
  {
    id: 3,
    name: 'Classic Masala Dosa',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500',
    category: 'Indian',
    time: '30 min',
    emoji: '🥞',
    description: 'A crispy South Indian favourite.',
    ingredients: ['Dosa batter', 'Potato', 'Onion', 'Spices'],
  },
  {
    id: 4,
    name: 'Chocolate Pancakes',
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=500',
    category: 'Dessert',
    time: '20 min',
    emoji: '🥞',
    description: 'Fluffy pancakes for your sweet cravings.',
    ingredients: ['Flour', 'Milk', 'Cocoa', 'Sugar'],
  },
];

// Welcome route

app.post('/api/preprocess-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image.',
      });
    }

    const processedImage = await sharp(req.file.buffer)
      .rotate()
      .resize(224, 224, { fit: 'inside', withoutEnlargement: true })
      .removeAlpha()
      .jpeg({ quality: 85 })
      .toBuffer();

    const metadata = await sharp(processedImage).metadata();

    const statistics = await sharp(processedImage)
      .stats();

    res.json({
      success: true,
      message: 'Image preprocessing completed.',
      image: {
        originalName: req.file.originalname,
        originalSizeBytes: req.file.size,
        processedSizeBytes: processedImage.length,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        channels: statistics.channels.length,
        averageBrightness: Math.round(
          (statistics.channels[0].mean +
            statistics.channels[1].mean +
            statistics.channels[2].mean) / 3
        ),
      },
    });
  } catch (error) {
    console.error('Image preprocessing error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not preprocess this image.',
    });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to FoodVerse AI Backend! 🍃');
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'FoodVerse AI API is working!',
  });
});

// Get all recipes
app.get('/api/recipes', (req, res) => {
  res.json({
    success: true,
    count: recipes.length,
    recipes: recipes,
  });
});

// Get one recipe by ID
app.get('/api/recipes/:id', (req, res) => {
  const recipeId = Number(req.params.id);

  const recipe = recipes.find((item) => item.id === recipeId);

  if (!recipe) {
    return res.status(404).json({
      success: false,
      message: 'Recipe not found',
    });
  }

  res.json({
    success: true,
    recipe: recipe,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`FoodVerse AI backend running at http://localhost:${PORT}`);
});
