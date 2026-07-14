const GITHUB_API = 'https://api.github.com';

// Substrings/extensions that mark a file as worth reading for analysis.
const FILE_PATTERNS = [
  'readme', '.md', '.markdown', 'license', 'changelog', 'contributing',
  'code_of_conduct',
  'package.json', 'yarn.lock', 'pnpm-lock', 'webpack.config', 'rollup.config',
  'vite.config', 'babel.config', '.eslintrc', 'tsconfig.json', 'jsconfig.json',
  '.prettierrc', 'jest.config',
  'dockerfile', 'docker-compose', 'procfile',
  '.github', '.gitlab-ci', '.travis.yml', 'circle.yml', '.circleci',
  'azure-pipelines',
  'pom.xml', 'build.gradle', 'go.mod', 'cargo.toml', 'composer.json',
  'requirements.txt', 'pipfile', 'setup.py', 'setup.cfg', 'pyproject.toml',
  'gemfile', 'rakefile',
  '.html', '.css', '.scss', '.less', '.svelte', '.vue',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.java', '.kt', '.swift', '.rb', '.php', '.go', '.rs', '.c', '.cpp',
  '.h', '.hpp',
  '.sh', '.bash', '.zsh', '.ps1',
  'index', 'main', 'server', 'cli', 'handler',
  '.spec', '.test',
  '.gitignore', '.env.example', '.env.sample',
  '.txt', '.rst', '.toml', '.yml', '.yaml', '.xml', '.json',
];

const MAX_FILE_BYTES = 200_000;
const MAX_FILES = 60;

function ghHeaders(token) {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Git-Polish',
  };
}

// Derive the same structure flags the old cloud function computed, but from the
// git tree paths alone — no filesystem walk needed.
function analyzeStructure(tree) {
  const structure = {
    hasReadme: false,
    hasLicense: false,
    hasGitignore: false,
    hasTests: false,
    hasDocs: false,
    hasCI: false,
    hasContributing: false,
    hasCodeOfConduct: false,
    hasSecurityPolicy: false,
    languages: new Set(),
    fileCount: 0,
    directoryCount: 0,
  };

  const langByExt = {
    '.js': 'JavaScript/TypeScript', '.ts': 'JavaScript/TypeScript',
    '.jsx': 'JavaScript/TypeScript', '.tsx': 'JavaScript/TypeScript',
    '.py': 'Python', '.java': 'Java', '.cpp': 'C/C++', '.c': 'C/C++',
    '.cs': 'C#', '.php': 'PHP', '.rb': 'Ruby', '.go': 'Go', '.rs': 'Rust',
    '.swift': 'Swift', '.kt': 'Kotlin',
  };

  for (const item of tree) {
    if (item.type === 'tree') {
      structure.directoryCount++;
      const dir = item.path.toLowerCase();
      if (dir.includes('test') || dir.includes('spec')) structure.hasTests = true;
      if (dir.includes('doc')) structure.hasDocs = true;
      if (dir === '.github' || dir.startsWith('.github/')) structure.hasCI = true;
      continue;
    }
    structure.fileCount++;
    const name = item.path.toLowerCase();
    const base = name.split('/').pop();
    if (base.includes('readme')) structure.hasReadme = true;
    if (base.includes('license')) structure.hasLicense = true;
    if (base.includes('gitignore')) structure.hasGitignore = true;
    if (base.includes('contributing')) structure.hasContributing = true;
    if (base.includes('code_of_conduct')) structure.hasCodeOfConduct = true;
    if (base.includes('security')) structure.hasSecurityPolicy = true;
    const dot = base.lastIndexOf('.');
    const ext = dot >= 0 ? base.slice(dot) : '';
    if (langByExt[ext]) structure.languages.add(langByExt[ext]);
  }

  return structure;
}

// Fetch a repo's metadata, key file contents, and structure using the GitHub
// REST API. Returns { repoInfo, files, structure }.
export async function getRepoContext(owner, repo, token) {
  if (!token) throw new Error('GitHub token is required');

  const headers = ghHeaders(token);

  // 1. Repo metadata (also gives us the default branch).
  const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    const text = await repoRes.text().catch(() => '');
    throw new Error(`Failed to fetch repo info (${repoRes.status}): ${text}`);
  }
  const repoInfo = await repoRes.json();
  const branch = repoInfo.default_branch || 'main';

  // 2. Full recursive tree for the default branch.
  const treeRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers }
  );
  if (!treeRes.ok) {
    const text = await treeRes.text().catch(() => '');
    throw new Error(`Failed to fetch repo tree (${treeRes.status}): ${text}`);
  }
  const treeJson = await treeRes.json();
  const tree = treeJson.tree || [];

  const structure = analyzeStructure(tree);

  // 3. Pick the important, reasonably-sized blobs and fetch their contents.
  const candidates = tree
    .filter(
      (f) =>
        f.type === 'blob' &&
        !f.path.includes('node_modules') &&
        (f.size == null || f.size < MAX_FILE_BYTES) &&
        FILE_PATTERNS.some((p) => f.path.toLowerCase().includes(p))
    )
    .slice(0, MAX_FILES);

  const settled = await Promise.all(
    candidates.map(async (f) => {
      try {
        const blobRes = await fetch(f.url, { headers });
        if (!blobRes.ok) return null;
        const blob = await blobRes.json();
        const content = Buffer.from(blob.content || '', 'base64').toString('utf8');
        return { path: f.path, content };
      } catch {
        return null;
      }
    })
  );

  const files = settled.filter(Boolean);

  return { repoInfo, files, structure };
}
