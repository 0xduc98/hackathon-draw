import express from 'express';
import cors from 'cors';
import db from './db.js';
import { uploadImageToS3 } from './s3Utils.js';

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
      // If slide doesn't exist, create it with default values
      const createQuery = `
        INSERT INTO slides (slide_id, title, countdown_time, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `;
      
      db.run(createQuery, [slideId, '', 0], function(err) {
        if (err) {
          console.error('Error creating slide:', err.message);
          console.error('Error details:', {
            code: err.code,
            errno: err.errno,
            sqlMessage: err.sqlMessage,
            sql: err.sql
          });
          return res.status(500).json({ 
            error: 'Failed to create slide',
            details: err.message
          });
        }
        
        // Return the newly created slide
        res.json({
          slide_id: slideId,
          title: '',
          countdown_time: 0,
          reference_image: null,
          created_at: new Date().toISOString()
        });
      });
      return;
    }
    
    // Ensure countdown_time is included in the response
    const response = {
      ...row,
      countdown_time: row.countdown_time || 0
    };
    
    res.json(response);
  });
});

// Save drawing submission
app.post('/api/drawings', (req, res) => {
  const { slideId, audienceId, audienceName, imageData } = req.body;

  if (!slideId || !audienceId || !audienceName || !imageData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Start a transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // First ensure the slide exists and update its data
    const updateSlideQuery = `
      INSERT OR REPLACE INTO slides (slide_id, title, countdown_time, created_at)
      VALUES (?, COALESCE((SELECT title FROM slides WHERE slide_id = ?), ''), 
             COALESCE((SELECT countdown_time FROM slides WHERE slide_id = ?), 0),
             COALESCE((SELECT created_at FROM slides WHERE slide_id = ?), datetime('now')))
    `;

    db.run(updateSlideQuery, [slideId, slideId, slideId, slideId], function(err) {
      if (err) {
        console.error('Error updating slide:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to update slide' });
      }

      // Then save the drawing
      const saveDrawingQuery = `
        INSERT INTO drawings (slide_id, audience_id, audience_name, image_data)
        VALUES (?, ?, ?, ?)
      `;

      db.run(saveDrawingQuery, [slideId, audienceId, audienceName, imageData], function(err) {
        if (err) {
          console.error('Error saving drawing:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to save drawing' });
        }

        // Commit the transaction
        db.run('COMMIT', function(err) {
          if (err) {
            console.error('Error committing transaction:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to commit transaction' });
          }

          // Return both the drawing and updated slide data
          db.get(`
            SELECT s.*, ri.image_data as reference_image
            FROM slides s
            LEFT JOIN reference_images ri ON s.slide_id = ri.slide_id
            WHERE s.slide_id = ?
          `, [slideId], (err, slide) => {
            if (err) {
              console.error('Error fetching updated slide:', err);
              return res.status(500).json({ error: 'Failed to fetch updated slide' });
            }

            res.json({
              drawing: {
                id: this.lastID,
                slideId,
                audienceId,
                audienceName,
                created_at: new Date().toISOString()
              },
              slide: {
                ...slide,
                countdown_time: slide.countdown_time || 0
              }
            });
          });
        });
      });
    });
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

// Update screen settings
app.post('/api/slides/:slideId/settings', (req, res) => {
  const { slideId } = req.params;
  const { title, countdownTime, referenceImage } = req.body;

  if (!slideId) {
    return res.status(400).json({ error: 'Slide ID is required' });
  }

  // First ensure the slide exists
  db.get('SELECT slide_id FROM slides WHERE slide_id = ?', [slideId], (err, slide) => {
    if (err) {
      console.error('Error checking slide:', err);
      return res.status(500).json({ error: 'Failed to check slide' });
    }

    if (!slide) {
      // If slide doesn't exist, create it first
      db.run('INSERT INTO slides (slide_id, title, countdown_time) VALUES (?, ?, ?)', 
        [slideId, title || null, countdownTime || null], 
        function(err) {
          if (err) {
            console.error('Error creating slide:', err);
            return res.status(500).json({ error: 'Failed to create slide' });
          }
          handleReferenceImage(slideId, referenceImage, title, countdownTime, res);
        }
      );
    } else {
      // Update existing slide
      const updateSlideQuery = `
        UPDATE slides 
        SET title = COALESCE(?, title),
            countdown_time = COALESCE(?, countdown_time)
        WHERE slide_id = ?
      `;

      db.run(updateSlideQuery, [title, countdownTime, slideId], function(err) {
        if (err) {
          console.error('Error updating slide settings:', err);
          return res.status(500).json({ error: 'Failed to update slide settings' });
        }
        handleReferenceImage(slideId, referenceImage, title, countdownTime, res);
      });
    }
  });
});

// Helper function to handle reference image updates
function handleReferenceImage(slideId, referenceImage, title, countdownTime, res) {
  if (referenceImage) {
    const updateImageQuery = `
      INSERT OR REPLACE INTO reference_images (slide_id, image_data)
      VALUES (?, ?)
    `;

    db.run(updateImageQuery, [slideId, referenceImage], function(err) {
      if (err) {
        console.error('Error updating reference image:', err);
        return res.status(500).json({ error: 'Failed to update reference image' });
      }
      res.json({ 
        id: this.lastID, 
        slideId, 
        title, 
        countdownTime,
        referenceImage 
      });
    });
  } else {
    res.json({ 
      slideId, 
      title, 
      countdownTime 
    });
  }
}

// Upload image to S3
app.post('/api/upload', async (req, res) => {
  try {
    const { imageData, fileName } = req.body;

    if (!imageData || !fileName) {
      return res.status(400).json({ error: 'Image data and file name are required' });
    }

    const imageUrl = await uploadImageToS3(imageData, fileName);
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Export the Express API
export default app;

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 