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
    const filePatterns = ["README", "package.json", ".py", ".js", ".ts", ".html", "index", ".c", ".cpp", "main", ];

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

// --- Helper: Send file data to Gemini for summarization ---
async function summarizeRepoWithGemini(files, ai) {

    const prompt = `
        You are analyzing a GitHub repository.
        Here are snippets of key files:\n
        ${files.map(f => `### ${f.name}\n${f.content.slice(0, 1000)}`).join("\n\n")}
        You are to make a new ReadMe.md file in only markdown.
        You are to follow these instructions:
        1. The repository name in H1
        2. a one line brief summary in H2
        3. a table of contents
        4. links to the different sections, we want a few different sections highlighting what exactly this repo is
        5. the usage of the repo
        Do NOT pay super close attention to package.json.
        Use it to cross reference what they ACTUALLY USE in the repo.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return(response.text);
}

// --- Main Cloud Function ---
export const readmeGen = onRequest(async (req, res) => {
    logger.info('readmeGen started', { method: req.method, path: req.path });

    // Construct AI client inside handler after resolving the secret key so we
    // don't use top-level await which can crash container startup on platforms
    // that disallow it during build.
    let ai;
    try {
        const [accessResponse] = await secretClient.accessSecretVersion({ name: secretName });
        const apiKey = accessResponse.payload.data.toString("utf8");
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
    let { repoUrl } = req.body;

    const githubtoken = req.body.githubtoken;
    const repo = req.body.repo;
    const owner = req.body.owner;

        if(!githubtoken) {
            res.status(400).send({ error: "No token found" });
            return;
        }

        // Use the GitHub API to fetch the repository zipball (default branch)
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
            res.status(zipRes.status).send({ error: `Failed to download repo zip: ${zipRes.statusText} ${zipRes.status}` });
            return;
        }

        // Write zip to temp file for the rest of the handler to use
        const tmpZipPath = path.join(os.tmpdir(), "repo.zip");
        const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
        fs.writeFileSync(tmpZipPath, zipBuffer);
        logger.info(`Repository ZIP downloaded to ${tmpZipPath}`);

        // If a repoUrl wasn't supplied, point it to the downloaded zip so downstream code can consume it
        if (!repoUrl) {
            repoUrl = tmpZipPath;
        }

        if (!repoUrl) {
            res.status(400).send({ error: "Missing repoUrl" });
            return;
        }

        // Step 2: Extract ZIP
        const extractedDir = extractZip(repoUrl);

        // Step 3: Find key files
        const files = collectImportantFiles(extractedDir);

        // Step 4: Summarize via Gemini
        const summary = await summarizeRepoWithGemini(files, ai);

        // Step 5: Return response
        logger.info('readmeGen finished successfully');
        res.set('Access-Control-Allow-Origin', '*');
        res.status(200).send({ summary });
    } catch (error) {
        logger.error('readmeGen error', error);
        res.status(500).send({ error: error.message });
    }
});

// Export the checklist function
export { generateChecklist } from '../checklist/checklist.js';