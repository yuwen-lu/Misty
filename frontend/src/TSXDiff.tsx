import React, { useState } from 'react';
import { BookList } from './components/renderCode/BookList';
import { BookListTest } from './components/renderCode/BookListTest';

interface DiffResult {
  added?: boolean;
  removed?: boolean;
  value: string;
}

const TSXDiff: React.FC = () => {
  const [tsx1, setTsx1] = useState<string>(BookList);
  const [tsx2, setTsx2] = useState<string>(BookListTest);
  const [diffResult, setDiffResult] = useState<DiffResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tsx1, tsx2 }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result: DiffResult[] = await response.json();
      console.log("diff result:\n" + result);
      setDiffResult(result);
    } catch (error) {
      console.log("Error: " + error);
    }
  };

  return (
    <div>
      <h1>TSX Diff Tool</h1>
      <textarea
        value={tsx1}
        onChange={(e) => setTsx1(e.target.value)}
        rows={10}
        cols={50}
      />
      <textarea
        value={tsx2}
        onChange={(e) => setTsx2(e.target.value)}
        rows={10}
        cols={50}
      />
      <button onClick={handleCompare}>Compare</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {diffResult && (
        <div>
          <h2>Differences:</h2>
          <pre>{JSON.stringify(diffResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TSXDiff;
