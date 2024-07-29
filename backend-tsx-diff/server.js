const express = require('express');
const bodyParser = require('body-parser');
const babel = require('@babel/core');
const diff = require('diff');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

app.post('/compare', (req, res) => {
  const { tsx1, tsx2 } = req.body;

  if (!tsx1 || !tsx2) {
    return res.status(400).send('Both TSX strings are required.');
  }

  try {
    const ast1 = babel.parseSync(tsx1, { filename: 'file1.tsx' });
    const ast2 = babel.parseSync(tsx2, { filename: 'file2.tsx' });

    console.log("Parsing tsx...");
    console.log(ast1);
    console.log(typeof(ast1));
    // TODO The problem might be that ast1 and ast2 are not in json format
    const diffResult = diff.diffJson(ast1, ast2);

    return res.json(diffResult);
    // return [ast1, ast2];
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error parsing TSX strings.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
