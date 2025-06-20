const express = require('express');
const app = express();
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});
module.exports = app;
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
