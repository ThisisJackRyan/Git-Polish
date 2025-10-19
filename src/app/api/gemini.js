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

export async function regenReadMe(readmeContent, suggestionsText) {
  const prompt =
    `Using the provided readme content and suggestions, update the ` +
    `readme based on the suggestions; remember to maintain the markdown ` +
    `format of the readme; it should be able to be displayed on GitHub. ` +
    `Ensure that no evidence of your involvement in the modifications remains; ` +
    `I don't want you to leave any text directly discussing the modifications themselves; ` +
    `all I want is the newly-modified README content. \n` +
    `suggestions text: ${suggestionsText} END SUGGESTIONS \n \n \n` +
    `readme text: ${readmeContent} END README CONTENT`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error('Failed to regenerate README with Gemini');
  }
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