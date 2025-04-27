import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root route - Get user information
app.get('/', (req, res) => {
  const userInfo = {
    name: "Hackathon Draw User",
    version: "1.0.0",
    status: "active",
    endpoints: {
      slides: "/api/slides",
      drawings: "/api/drawings"
    }
  };
  res.json(userInfo);
});

// Create or update a slide
app.post('/api/slides', (req, res) => {
  const { slideId, title } = req.body;

  if (!slideId) {
    return res.status(400).json({ error: 'Slide ID is required' });
  }

  const query = `
    INSERT OR REPLACE INTO slides (slide_id, title)
    VALUES (?, ?)
  `;

  db.run(query, [slideId, title], function(err) {
    if (err) {
      console.error('Error creating/updating slide:', err);
      return res.status(500).json({ error: 'Failed to create/update slide' });
    }
    res.json({ id: this.lastID, slideId, title });
  });
});

// Save reference image for a slide
app.post('/api/slides/:slideId/image', (req, res) => {
  const { slideId } = req.params;
  const { imageData } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  // First ensure the slide exists
  db.get('SELECT slide_id FROM slides WHERE slide_id = ?', [slideId], (err, slide) => {
    if (err) {
      console.error('Error checking slide:', err);
      return res.status(500).json({ error: 'Failed to check slide' });
    }

    if (!slide) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    // Save or update the reference image
    const query = `
      INSERT OR REPLACE INTO reference_images (slide_id, image_data)
      VALUES (?, ?)
    `;

    db.run(query, [slideId, imageData], function(err) {
      if (err) {
        console.error('Error saving reference image:', err);
        return res.status(500).json({ error: 'Failed to save reference image' });
      }
      res.json({ id: this.lastID, slideId });
    });
  });
});

// Get slide with reference image
app.get('/api/slides/:slideId', (req, res) => {
  const { slideId } = req.params;

  const query = `
    SELECT s.*, ri.image_data as reference_image
    FROM slides s
    LEFT JOIN reference_images ri ON s.slide_id = ri.slide_id
    WHERE s.slide_id = ?
  `;

  db.get(query, [slideId], (err, row) => {
    if (err) {
      console.error('Error fetching slide:', err);
      return res.status(500).json({ error: 'Failed to fetch slide' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Slide not found' });
    }
    res.json(row);
  });
});

// Save drawing submission
app.post('/api/drawings', (req, res) => {
  const { slideId, audienceId, audienceName, imageData } = req.body;

  if (!slideId || !audienceId || !audienceName || !imageData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    INSERT INTO drawings (slide_id, audience_id, audience_name, image_data)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [slideId, audienceId, audienceName, imageData], function(err) {
    if (err) {
      console.error('Error saving drawing:', err);
      return res.status(500).json({ error: 'Failed to save drawing' });
    }
    res.json({ id: this.lastID });
  });
});

// Get drawings for a slide
app.get('/api/drawings/:slideId', (req, res) => {
  const { slideId } = req.params;

  const query = `
    SELECT * FROM drawings 
    WHERE slide_id = ? 
    ORDER BY created_at DESC
  `;

  db.all(query, [slideId], (err, rows) => {
    if (err) {
      console.error('Error fetching drawings:', err);
      return res.status(500).json({ error: 'Failed to fetch drawings' });
    }
    res.json(rows);
  });
});

// Export the Express API
export default app;

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 