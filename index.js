// // // index.js
// // const express = require('express');
// // const cors = require('cors');
// // const db = require('./db');

// // const app = express();
// // app.use(cors());
// // app.use(express.json());

// // // Example route
// // app.get('/api/holidays', (req, res) => {
// //   const sql = 'SELECT * FROM holidays ORDER BY sort_order ASC';
// //   db.query(sql, (err, results) => {
// //     if (err) return res.status(500).json({ error: err.message });
// //     res.json(results);
// //   });
// // });

// // const PORT = 5000;
// // app.listen(PORT, () => {
// //   console.log(`Server is running on port ${PORT}`);
// // });


// const express = require('express');
// const cors = require('cors');
// const mysql = require('mysql2');
// const bodyParser = require('body-parser');
// const app = express();
// const PORT = 5000;

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // MySQL connection
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root', // your MySQL username
//   password: '', // your MySQL password
//   database: 'holiday_management'
// });

// // Connect to MySQL
// db.connect(err => {
//   if (err) {
//     console.error("Database connection failed:", err);
//     return;
//   }
//   console.log("Connected to MySQL database.");
// });

// // 🆕 GET current max sort_order to auto-increment
// const getNextSortOrder = (callback) => {
//   const sql = 'SELECT MAX(sort_order) AS maxOrder FROM holidays';
//   db.query(sql, (err, results) => {
//     if (err) {
//       console.error("Error getting max sort_order:", err);
//       return callback(err, null);
//     }
//     const nextOrder = (results[0].maxOrder || 0) + 1;
//     callback(null, nextOrder);
//   });
// };

// // POST - Add a new holiday
// app.post('/api/holidays', (req, res) => {
//   const {
//     name_en, name_bn, date_en, date_bn,
//     type, sub_type, religion,
//     description_en, description_bn,
//     is_moon, year_en, year_bn
//   } = req.body;

//   // 🆕 Get next sort_order before inserting
//   getNextSortOrder((err, nextOrder) => {
//     if (err) {
//       return res.status(500).json({ error: 'Failed to determine sort order' });
//     }

//     const sql = `INSERT INTO holidays 
//       (name_en, name_bn, date_en, date_bn, type, sub_type, religion,
//        description_en, description_bn, sort_order, is_moon, year_en, year_bn)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//     db.query(sql, [
//       name_en, name_bn, date_en, date_bn,
//       type, sub_type, religion,
//       description_en, description_bn,
//       nextOrder, is_moon, year_en, year_bn
//     ], (err, result) => {
//       if (err) {
//         console.error("Error inserting holiday:", err);
//         return res.status(500).json({ error: 'Failed to add holiday' });
//       }
//       res.json({ id: result.insertId, sort_order: nextOrder, ...req.body });
//     });
//   });
// });

// // GET - Fetch all holidays
// app.get('/api/holidays', (req, res) => {
//   const sql = 'SELECT * FROM holidays ORDER BY sort_order ASC';

//   db.query(sql, (err, results) => {
//     if (err) {
//       console.error("Error fetching holidays:", err);
//       return res.status(500).json({ error: 'Failed to fetch holidays' });
//     }
//     res.json(results);
//   });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });



const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'holiday_management'
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("Connected to MySQL database.");
});

// Utility: Get next sort order
const getNextSortOrder = (callback) => {
  const sql = 'SELECT MAX(sort_order) AS maxOrder FROM holidays';
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error getting max sort_order:", err);
      return callback(err, null);
    }
    const nextOrder = (results[0].maxOrder || 0) + 1;
    callback(null, nextOrder);
  });
};

// POST: Add a holiday
app.post('/api/holidays', (req, res) => {
  const {
    name_en, name_bn, date_en, date_bn,
    type, sub_type, religion,
    description_en, description_bn,
    is_moon, year_en, year_bn
  } = req.body;

  getNextSortOrder((err, nextOrder) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to determine sort order' });
    }

    const insertSql = `
      INSERT INTO holidays 
      (name_en, name_bn, date_en, date_bn, type, sub_type, religion,
       description_en, description_bn, sort_order, is_moon, year_en, year_bn)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      name_en, name_bn, date_en, date_bn,
      type, sub_type, religion,
      description_en, description_bn,
      nextOrder, is_moon, year_en, year_bn
    ];

    db.query(insertSql, values, (err, result) => {
      if (err) {
        console.error("Error inserting holiday:", err);
        return res.status(500).json({ error: 'Failed to add holiday' });
      }

      // 🆕 Fetch the inserted row with the full data
      const insertedId = result.insertId;
      db.query('SELECT * FROM holidays WHERE id = ?', [insertedId], (err2, rows) => {
        if (err2) {
          console.error("Error retrieving inserted holiday:", err2);
          return res.status(500).json({ error: 'Failed to retrieve new holiday' });
        }
        res.status(201).json(rows[0]);
      });
    });
  });
});

// GET: All holidays
app.get('/api/holidays', (req, res) => {
  const sql = 'SELECT * FROM holidays ORDER BY sort_order ASC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching holidays:", err);
      return res.status(500).json({ error: 'Failed to fetch holidays' });
    }
    res.json(results);
  });
});

// DELETE: Remove a holiday
app.delete('/api/holidays/:id', (req, res) => {
  const holidayId = req.params.id;
  const sql = 'DELETE FROM holidays WHERE id = ?';

  db.query(sql, [holidayId], (err, result) => {
    if (err) {
      console.error("Error deleting holiday:", err);
      return res.status(500).json({ error: 'Failed to delete holiday' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    res.json({ message: 'Holiday deleted successfully', id: holidayId });
  });
});

// PUT: Update a holiday
app.put('/api/holidays/:id', (req, res) => {
  const holidayId = req.params.id;
  const {
    name_en, name_bn, date_en, date_bn,
    type, sub_type, religion,
    description_en, description_bn,
    is_moon, year_en, year_bn
  } = req.body;

  const updateSql = `
    UPDATE holidays SET
      name_en = ?, name_bn = ?, date_en = ?, date_bn = ?,
      type = ?, sub_type = ?, religion = ?,
      description_en = ?, description_bn = ?,
      is_moon = ?, year_en = ?, year_bn = ?
    WHERE id = ?`;

  const values = [
    name_en, name_bn, date_en, date_bn,
    type, sub_type, religion,
    description_en, description_bn,
    is_moon, year_en, year_bn,
    holidayId
  ];

  db.query(updateSql, values, (err, result) => {
    if (err) {
      console.error("Error updating holiday:", err);
      return res.status(500).json({ error: 'Failed to update holiday' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    res.json({ message: 'Holiday updated successfully', id: holidayId });
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
