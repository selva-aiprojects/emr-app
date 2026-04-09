import express from 'express';
const app = express();
const PORT = 4001;

app.get('/', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`Server test on ${PORT}`);
});
