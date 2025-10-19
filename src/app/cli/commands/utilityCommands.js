import { regenReadMe } from '../../api/gemini.js';

export const geminiCommand = async () => {
  const res = await regenReadMe();
  console.log('CLI says:', res);
};

export const repodataCommand = async (owner, repo, token) => {
  try {
    const res = await fetch('https://us-central1-gitpolish.cloudfunctions.net/readmeGen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubtoken: token, repo: repo, owner: owner })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    console.log('CLI says:', data.summary);
  } catch (err) {
    console.error('Fetch error:', err);
  }
};