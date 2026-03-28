// Backend/server.js
import express from 'express';
import cors from 'cors';

const app = express();

// Secure backend to only accept local dev and specific production domains
const allowedOrigins = ['http://localhost:5173'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// بيانات تجريبية سنرسلها للواجهة
const data = [
  { id: 1, name: 'Hydro Project Alpha', status: 'Active' },
  { id: 2, name: 'Hydro Project Beta', status: 'Pending' }
];

app.get('/api/data', (req, res) => {
  res.json(data);
});

app.listen(5000, () => console.log('السيرفر يعمل على http://localhost:5000'));