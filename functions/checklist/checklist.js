import logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import AdmZip from "adm-zip";
import fs from "fs";
import os from "os";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const GITHUB_API = 'https://api.github.com';

// Secret client is created at module load; secret access happens inside the handler
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
        "README", "package.json", "requirements.txt", "Pipfile", "Cargo.toml", 
        "composer.json", "pom.xml", "build.gradle", ".gitignore", "LICENSE",
        ".github", "docs", "src", "lib", "app", "components", "tests", "test"
    ];

    function walk(dir, depth = 0) {
        // Limit depth to avoid infinite recursion and focus on important files
        if (depth > 5) return;
        
        try {
            for (const item of fs.readdirSync(dir)) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Include important directories and their contents
                    if (filePatterns.some(p => item.toLowerCase().includes(p.toLowerCase()))) {
                        walk(fullPath, depth + 1);
                    }
                } else {
                    // Include important files
                    const fileExt = path.extname(item).toLowerCase();
                    const fileName = item.toLowerCase();
                    
                    if (filePatterns.some(p => fileName.includes(p.toLowerCase())) ||
                        ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.html', '.css', '.scss', '.sass', '.less', '.json', '.yaml', '.yml', '.xml', '.md', '.txt', '.sh', '.bat', '.ps1'].includes(fileExt)) {
                        
                        if (fs.statSync(fullPath).size < 100_000) { // limit file size
                            const content = fs.readFileSync(fullPath, "utf8");
                            importantFiles.push({ 
                                name: item, 
                                path: fullPath.replace(baseDir, ''), 
                                content: content.slice(0, 2000) // Limit content size
                            });
                        }
                    }
                }
            }
        } catch (err) {
            logger.warn(`Error reading directory ${dir}:`, err.message);
        }
    }

    walk(baseDir);
    logger.info(`Collected ${importantFiles.length} important files for checklist analysis`);
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
        if (depth > 3) return; // Limit depth
        
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    structure.directoryCount++;
                    
                    // Check for important directories
                    const dirName = item.toLowerCase();
                    if (dirName.includes('test') || dirName.includes('spec')) {
                        structure.hasTests = true;
                    }
                    if (dirName.includes('doc')) {
                        structure.hasDocs = true;
                    }
                    if (dirName === '.github') {
                        structure.hasCI = true;
                        // Check for templates
                        try {
                            const githubItems = fs.readdirSync(fullPath);
                            structure.hasIssuesTemplate = githubItems.some(f => f.includes('issue'));
                            structure.hasPRTemplate = githubItems.some(f => f.includes('pull_request'));
                        } catch (e) {
                            // Ignore errors
                        }
                    }
                    
                    analyzeDir(fullPath, depth + 1);
                } else {
                    structure.fileCount++;
                    
                    // Check for important files
                    const fileName = item.toLowerCase();
                    const fileExt = path.extname(item).toLowerCase();
                    
                    if (fileName.includes('readme')) structure.hasReadme = true;
                    if (fileName.includes('license')) structure.hasLicense = true;
                    if (fileName.includes('gitignore')) structure.hasGitignore = true;
                    if (fileName.includes('contributing')) structure.hasContributing = true;
                    if (fileName.includes('code_of_conduct')) structure.hasCodeOfConduct = true;
                    if (fileName.includes('security')) structure.hasSecurityPolicy = true;
                    
                    // Detect languages and frameworks
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
You are analyzing a GitHub repository to create a comprehensive improvement checklist.

Repository Information:
- Name: ${repoInfo.name}
- Description: ${repoInfo.description || 'No description provided'}
- Language: ${repoInfo.language || 'Unknown'}
- Stars: ${repoInfo.stargazers_count || 0}
- Forks: ${repoInfo.forks_count || 0}
- Size: ${repoInfo.size || 0} KB
- Created: ${repoInfo.created_at || 'Unknown'}
- Updated: ${repoInfo.updated_at || 'Unknown'}

${structureInfo}

Key Files Content:
${fileContents}

Create a comprehensive, actionable checklist for improving this repository. The checklist should be organized into categories and include specific, actionable items. Focus on:

1. **Documentation & Communication**
   - README quality and completeness
   - Code documentation
   - Contributing guidelines
   - Issue and PR templates

2. **Code Quality & Standards**
   - Code organization and structure
   - Linting and formatting
   - Testing coverage
   - Code review processes

3. **Project Management**
   - License and legal compliance
   - Security considerations
   - CI/CD pipeline
   - Dependency management

4. **Community & Maintenance**
   - Issue management
   - Release management
   - Community guidelines
   - Maintenance practices

5. **Performance & Optimization**
   - Performance considerations
   - Resource optimization
   - Monitoring and logging

For each item, provide:
- A clear, actionable description
- Priority level (High/Medium/Low)
- Brief explanation of why it's important
- Suggested implementation approach

Format the response as a well-structured markdown checklist with checkboxes that can be used to track progress.

Make the checklist specific to this repository's technology stack, size, and apparent purpose. Prioritize items that would have the most impact for this particular repository.
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

    // Construct AI client inside handler
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

    // Handle CORS
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

        // Get repository information from GitHub API
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

        // Download repository ZIP
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

        // Write zip to temp file
        const tmpZipPath = path.join(os.tmpdir(), `repo-${Date.now()}.zip`);
        const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
        fs.writeFileSync(tmpZipPath, zipBuffer);
        logger.info(`Repository ZIP downloaded to ${tmpZipPath}`);

        // Extract ZIP
        const extractedDir = extractZip(tmpZipPath);

        // Analyze repository structure
        const structure = analyzeRepoStructure(extractedDir);

        // Collect important files
        const files = collectImportantFiles(extractedDir);

        // Generate checklist with Gemini
        const checklist = await generateChecklistWithGemini(files, structure, repoInfo, ai);

        // Clean up temp files
        try {
            fs.unlinkSync(tmpZipPath);
            fs.rmSync(extractedDir, { recursive: true, force: true });
        } catch (cleanupErr) {
            logger.warn('Failed to clean up temp files:', cleanupErr.message);
        }

        // Return response
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
