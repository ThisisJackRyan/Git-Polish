import logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import AdmZip from "adm-zip";
import fs from "fs";
import os from "os";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const GITHUB_API = 'https://api.github.com';

const secretClient = new SecretManagerServiceClient();
const secretName = "projects/378480993455/secrets/gemini-api/versions/latest";

// --- Helper: Extract ZIP to temporary folder ---
function extractZip(zipPath) {
    const extractDir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-"));
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);
    logger.info(`Extracted ZIP to: ${extractDir}`);
    return extractDir;
}

// --- Helper: Collect key files for analysis ---
function collectImportantFiles(baseDir) {
    const importantFiles = [];
    const filePatterns = [
        // docs & metadata
        "readme", "readme.md", ".md", ".markdown", "license", "changelog", "contributing", "contributing.md",
        "code_of_conduct", "code_of_conduct.md",

        // node / js ecosystem
        "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "pnpm-lock.yml", "webpack.config", "rollup.config", "vite.config", "babel.config", ".babelrc", ".eslintrc", "tsconfig.json", "jsconfig.json", ".prettierrc", "prettier.config", "jest.config", "babel.config.json",

        // docker / infra
        "dockerfile", "docker-compose.yml", ".dockerignore", "procfile", "vagrantfile",

        // ci / tooling
        ".github", ".github/workflows", ".gitlab-ci.yml", ".travis.yml", "circle.yml", ".circleci", "azure-pipelines.yml",

        // build systems & package managers
        "pom.xml", "build.gradle", "gradle.properties", "gradlew", "gradlew.bat", "go.mod", "go.sum", "cargo.toml", "cargo.lock", "composer.json",

        // python
        "requirements.txt", "pipfile", "pipfile.lock", "setup.py", "setup.cfg", "pyproject.toml", "manage.py",

        // ruby
        "gemfile", "gemfile.lock", "rakefile",

        // common web / frontend files
        ".html", ".htm", "index.html", ".css", ".scss", ".less", ".svelte", ".vue",

        // source file extensions (many languages)
        ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
        ".py", ".java", ".kt", ".kts", ".swift", ".rb", ".php", ".go", ".rs", ".c", ".cpp", ".h", ".hpp", ".m", ".mm",

        // scripts / shells
        ".sh", ".bash", ".zsh", ".ps1", ".bat",

        // common entry filenames
        "index", "index.js", "index.ts", "index.jsx", "index.tsx", "main", "main.go", "main.rs", "app", "server", "cli", "handler",

        // tests / specs
        "test", ".spec", ".test", "spec",

        // other common config / manifests
        ".gitignore", ".gitattributes", "manifest", "androidmanifest.xml", "androidmanifest.xml", "pom", ".env", ".env.example", ".env.sample",

        // fallback textual formats
        ".txt", ".rst", ".toml", ".yml", ".yaml", ".xml", ".json"
    ];

    function walk(dir) {
        for (const item of fs.readdirSync(dir)) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                walk(fullPath);
            } else if (filePatterns.some(p => item.toLowerCase().includes(p))) {
                if (fs.statSync(fullPath).size < 200_000) { // limit file size
                    const content = fs.readFileSync(fullPath, "utf8");
                    importantFiles.push({ name: item, path: fullPath, content });
                }
            }
        }
    }

    walk(baseDir);
    logger.info(`Collected ${importantFiles.length} important files`);
    return importantFiles;
}

// --- Helper: Analyze repository structure ---
function analyzeRepoStructure(baseDir) {
    const structure = {
        hasReadme: false,
        hasLicense: false,
        hasGitignore: false,
        hasPackageJson: false,
        hasTests: false,
        hasDocs: false,
        hasCI: false,
        hasContributing: false,
        hasCodeOfConduct: false,
        hasSecurityPolicy: false,
        hasIssuesTemplate: false,
        hasPRTemplate: false,
        languages: new Set(),
        frameworks: new Set(),
        fileCount: 0,
        directoryCount: 0
    };

    function analyzeDir(dir, depth = 0) {
        if (depth > 3) return; 
        
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    structure.directoryCount++;
                    
                    const dirName = item.toLowerCase();
                    if (dirName.includes('test') || dirName.includes('spec')) {
                        structure.hasTests = true;
                    }
                    if (dirName.includes('doc')) {
                        structure.hasDocs = true;
                    }
                    if (dirName === '.github') {
                        structure.hasCI = true;
                        try {
                            const githubItems = fs.readdirSync(fullPath);
                            structure.hasIssuesTemplate = githubItems.some(f => f.includes('issue'));
                            structure.hasPRTemplate = githubItems.some(f => f.includes('pull_request'));
                        } catch (e) {
                        }
                    }
                    
                    analyzeDir(fullPath, depth + 1);
                } else {
                    structure.fileCount++;
                    
                    const fileName = item.toLowerCase();
                    const fileExt = path.extname(item).toLowerCase();
                    
                    if (fileName.includes('readme')) structure.hasReadme = true;
                    if (fileName.includes('license')) structure.hasLicense = true;
                    if (fileName.includes('gitignore')) structure.hasGitignore = true;
                    if (fileName.includes('contributing')) structure.hasContributing = true;
                    if (fileName.includes('code_of_conduct')) structure.hasCodeOfConduct = true;
                    if (fileName.includes('security')) structure.hasSecurityPolicy = true;
                    
                    if (fileExt === '.js' || fileExt === '.ts') {
                        structure.languages.add('JavaScript/TypeScript');
                    } else if (fileExt === '.py') {
                        structure.languages.add('Python');
                    } else if (fileExt === '.java') {
                        structure.languages.add('Java');
                    } else if (fileExt === '.cpp' || fileExt === '.c') {
                        structure.languages.add('C/C++');
                    } else if (fileExt === '.cs') {
                        structure.languages.add('C#');
                    } else if (fileExt === '.php') {
                        structure.languages.add('PHP');
                    } else if (fileExt === '.rb') {
                        structure.languages.add('Ruby');
                    } else if (fileExt === '.go') {
                        structure.languages.add('Go');
                    } else if (fileExt === '.rs') {
                        structure.languages.add('Rust');
                    } else if (fileExt === '.swift') {
                        structure.languages.add('Swift');
                    } else if (fileExt === '.kt') {
                        structure.languages.add('Kotlin');
                    }
                }
            }
        } catch (err) {
            logger.warn(`Error analyzing directory ${dir}:`, err.message);
        }
    }

    analyzeDir(baseDir);
    return structure;
}

// --- Helper: Generate checklist with Gemini ---
async function generateChecklistWithGemini(files, structure, repoInfo, ai) {
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
- Has Issue Templates: ${structure.hasIssuesTemplate}
- Has PR Templates: ${structure.hasPRTemplate}
- Languages: ${Array.from(structure.languages).join(', ')}
- File Count: ${structure.fileCount}
- Directory Count: ${structure.directoryCount}
`;

    const fileContents = files.slice(0, 20).map(f => `### ${f.path}\n${f.content}`).join("\n\n");

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

Documentation

Code Quality

Project Management

Community

Performance

You should only provide 5 items that cover the most pressing issues.

Each item should have just a short 1-2 sentence description of what to improve.

Priority (High/Medium/Low)

Keep the checklist short, clear, and specific to this repositorys language and purpose.
Output the result as a markdown checklist that can be used to track progress. EACH CHECKBOX SHOULD BE EMPTY FROM THE START.
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    
    return response.text;
}

// --- Main Cloud Function ---
export const generateChecklist = onRequest(async (req, res) => {
    logger.info('generateChecklist started', { method: req.method, path: req.path });

    let ai;
    try {
        const [accessResponse] = await secretClient.accessSecretVersion({ name: secretName });
        const apiKey = process.env.GEMINI_API_KEY || accessResponse.payload.data.toString("utf8");
        ai = new GoogleGenAI({ apiKey });
    } catch (err) {
        logger.error('failed to access secret', err);
        res.status(500).send({ error: 'Failed to load API key' });
        return;
    }

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }

    try {
        const { githubtoken, repo, owner } = req.body;

        if (!githubtoken) {
            res.status(400).send({ error: "No GitHub token found" });
            return;
        }

        if (!repo || !owner) {
            res.status(400).send({ error: "Repository owner and name are required" });
            return;
        }

        const repoApiUrl = `${GITHUB_API}/repos/${owner}/${repo}`;
        logger.info(`Fetching repo info from: ${repoApiUrl}`);
        
        const repoRes = await fetch(repoApiUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${githubtoken}`,
                Accept: "application/vnd.github+json",
                "User-Agent": "Git-Polish",
            },
        });

        if (!repoRes.ok) {
            const respText = await repoRes.text().catch(() => "");
            logger.error(`Failed to fetch repo info: ${repoRes.status} ${repoRes.statusText} - ${respText}`);
            res.status(repoRes.status).send({ error: `Failed to fetch repo info: ${repoRes.statusText}` });
            return;
        }

        const repoInfo = await repoRes.json();
        logger.info(`Repository info fetched: ${repoInfo.name}`);

        const zipApiUrl = `${GITHUB_API}/repos/${owner}/${repo}/zipball`;
        logger.info(`Requesting repo ZIP from: ${zipApiUrl}`);
        
        const zipRes = await fetch(zipApiUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${githubtoken}`,
                Accept: "application/vnd.github+json",
                "User-Agent": "Git-Polish",
            },
            redirect: "follow",
        });

        if (!zipRes.ok) {
            const respText = await zipRes.text().catch(() => "");
            logger.error(`Failed to download repo zip: ${zipRes.status} ${zipRes.statusText} - ${respText}`);
            res.status(zipRes.status).send({ error: `Failed to download repo zip: ${zipRes.statusText}` });
            return;
        }

        const tmpZipPath = path.join(os.tmpdir(), `repo-${Date.now()}.zip`);
        const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
        fs.writeFileSync(tmpZipPath, zipBuffer);
        logger.info(`Repository ZIP downloaded to ${tmpZipPath}`);

        const extractedDir = extractZip(tmpZipPath);

        const structure = analyzeRepoStructure(extractedDir);

        const files = collectImportantFiles(extractedDir);

        const checklist = await generateChecklistWithGemini(files, structure, repoInfo, ai);

        try {
            fs.unlinkSync(tmpZipPath);
            fs.rmSync(extractedDir, { recursive: true, force: true });
        } catch (cleanupErr) {
            logger.warn('Failed to clean up temp files:', cleanupErr.message);
        }

        logger.info('generateChecklist finished successfully');
        res.set('Access-Control-Allow-Origin', '*');
        res.status(200).send({ 
            checklist,
            repository: {
                name: repoInfo.name,
                description: repoInfo.description,
                language: repoInfo.language,
                stars: repoInfo.stargazers_count,
                forks: repoInfo.forks_count
            },
            analysis: {
                hasReadme: structure.hasReadme,
                hasLicense: structure.hasLicense,
                hasTests: structure.hasTests,
                hasDocs: structure.hasDocs,
                hasCI: structure.hasCI,
                languages: Array.from(structure.languages),
                fileCount: structure.fileCount
            }
        });
    } catch (error) {
        logger.error('generateChecklist error', error);
        res.status(500).send({ error: error.message });
    }
});
