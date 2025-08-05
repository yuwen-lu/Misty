import { NextApiRequest, NextApiResponse } from 'next';

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  language?: string;
}

interface BraveSearchResponse {
  web: {
    results: BraveSearchResult[];
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { query, count = 3 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
    if (!BRAVE_API_KEY) {
      return res.status(500).json({ error: 'Brave Search API key not configured' });
    }

    console.log('🔍 Searching Brave for:', query);

    const searchUrl = `https://api.search.brave.com/res/v1/web/search?${new URLSearchParams({
      q: query,
      count: count.toString(),
      country: 'us',
      search_lang: 'en',
    })}`;

    const response = await fetch(searchUrl, {
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Brave API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `Brave Search API error: ${response.status}` 
      });
    }

    const data: BraveSearchResponse = await response.json();
    
    console.log('✅ Brave search results:', {
      query,
      resultsCount: data.web?.results?.length || 0,
      firstResult: data.web?.results?.[0]?.url
    });

    // Return the search results
    const results = data.web?.results?.map(result => ({
      title: result.title,
      url: result.url,
      description: result.description,
    })) || [];

    return res.status(200).json({ results });

  } catch (error) {
    console.error('Error in Brave search:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}