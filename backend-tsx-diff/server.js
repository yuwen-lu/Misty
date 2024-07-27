const express = require('express');
const bodyParser = require('body-parser');
const babel = require('@babel/core');
const diff = require('diff');

const app = express();
const PORT = 4000;

app.use(bodyParser.json());

app.post('/compare', (req, res) => {
  const { tsx1, tsx2 } = req.body;

  if (!tsx1 || !tsx2) {
    return res.status(400).send('Both TSX strings are required.');
  }

  try {
    const ast1 = babel.parseSync(tsx1, { filename: 'file1.tsx' });
    const ast2 = babel.parseSync(tsx2, { filename: 'file2.tsx' });

    const diffResult = diff.diffJson(ast1, ast2);

    return res.json(diffResult);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error parsing TSX strings.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
