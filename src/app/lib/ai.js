import { generateText } from 'ai';

// Model is routed through the Vercel AI Gateway via a plain "provider/model"
// string. On Vercel the gateway authenticates automatically via OIDC; for local
// dev set AI_GATEWAY_API_KEY (AI Gateway tab in the Vercel dashboard) or run
// `vercel env pull`. Swap to 'anthropic/claude-opus-4.8' for higher quality.
export const AI_MODEL = 'anthropic/claude-sonnet-4.6';

// Single choke point for every Claude call in the app.
export async function generateWithClaude(prompt) {
  const { text } = await generateText({ model: AI_MODEL, prompt });
  return text;
}

// Default export kept as a generic "ask Claude a question" helper.
export default async function queryClaude(question) {
  return generateWithClaude(question);
}

// Build a full README from the key files of a repository.
export async function generateReadme(files, repoName) {
  const fileSnippets = files
    .map((f) => `### ${f.path}\n${f.content.slice(0, 1000)}`)
    .join('\n\n');

  const prompt = `
You are analyzing a GitHub repository named "${repoName}".
Here are snippets of key files:

${fileSnippets}

You are to write a new README.md file in only markdown.
Follow these instructions:
1. The repository name in H1
2. A one line brief summary in H2
3. A table of contents
4. Links to the different sections; include a few sections highlighting exactly what this repo is
5. The usage of the repo
Do NOT pay super close attention to package.json.
Use it to cross reference what they ACTUALLY USE in the repo.
Do NOT use ANY PLACEHOLDERS! This is a final product.
Do NOT say anything about licensing.
Keep installation steps concise. If it's not clear, do not include them at all.
Return only the README markdown, with no surrounding commentary or code fences.
`;

  return generateWithClaude(prompt);
}

// Summarize an existing README into a short repository description.
export async function summarizeReadme(readmeText) {
  const prompt =
    'You are fed a README.md file below. Summarize the README in 2 sentences ' +
    'max. This is for the description of a GitHub repository. Return only the ' +
    'description text, with no preamble.\n\n' +
    readmeText;

  return generateWithClaude(prompt);
}

// Regenerate a README given the current content plus improvement suggestions.
// Used by the CLI (`git-polish` regen flow).
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

  return generateWithClaude(prompt);
}

// Build a short, actionable improvement checklist for a repository.
export async function generateChecklist(files, structure, repoInfo) {
  const structureInfo = `
Repository Structure Analysis:
- Has README: ${structure.hasReadme}
- Has License: ${structure.hasLicense}
- Has .gitignore: ${structure.hasGitignore}
- Has Tests: ${structure.hasTests}
- Has Documentation: ${structure.hasDocs}
- Has CI/CD: ${structure.hasCI}
- Has Contributing Guide: ${structure.hasContributing}
- Has Code of Conduct: ${structure.hasCodeOfConduct}
- Has Security Policy: ${structure.hasSecurityPolicy}
- Languages: ${Array.from(structure.languages).join(', ')}
- File Count: ${structure.fileCount}
- Directory Count: ${structure.directoryCount}
`;

  const fileContents = files
    .slice(0, 20)
    .map((f) => `### ${f.path}\n${f.content}`)
    .join('\n\n');

  const prompt = `
You are reviewing a GitHub repository to suggest key improvements.

Repository Info:
Name: ${repoInfo.name}
Description: ${repoInfo.description || 'No description provided'}
Language: ${repoInfo.language || 'Unknown'}
Stars: ${repoInfo.stargazers_count || 0}
Forks: ${repoInfo.forks_count || 0}
Size: ${repoInfo.size || 0} KB
Created: ${repoInfo.created_at || 'Unknown'}
Updated: ${repoInfo.updated_at || 'Unknown'}

${structureInfo}

Key Files Content:
${fileContents}

Create a concise, actionable improvement checklist for this repository.
Here are POSSIBLE categories you can choose from:
Documentation, Code Quality, Project Management, Community, Performance.

You should only provide 5 items that cover the most pressing issues.
Each item should have just a short 1-2 sentence description of what to improve.
Include a Priority (High/Medium/Low) for each item.
Keep the checklist short, clear, and specific to this repository's language and purpose.
Output the result as a markdown checklist that can be used to track progress. EACH CHECKBOX SHOULD BE EMPTY FROM THE START.
Return only the markdown checklist, with no surrounding commentary or code fences.
`;

  return generateWithClaude(prompt);
}
