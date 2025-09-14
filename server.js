const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// خدمة الملفات الثابتة داخل مجلد public
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/code_entry.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'code_entry.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
