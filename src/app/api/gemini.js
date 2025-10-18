import { GoogleGenAI } from "@google/genai";

const GITHUB_API = 'https://api.github.com';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default async function geminiExample() {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Explain how AI works in a few words",
    });
    return(response.text);
}

export async function getRepoData(owner, repo, token) {
    const headers = { Authorization: `token ${token}` };

    console.log(token);

  const treeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees/main?recursive=1`, { headers });
  const { tree } = await treeRes.json();

  console.log(`fetched tree: ${tree}`)

  const files = await Promise.all(tree
    .filter(f => f.type === 'blob' && !f.path.includes('node_modules'))
    .map(async f => {
      const contentRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${f.path}`, { headers });
      const contentJson = await contentRes.json();
      return {
        path: f.path,
        content: Buffer.from(contentJson.content, 'base64').toString('utf8'),
      };
    })
  );

  return files;
}