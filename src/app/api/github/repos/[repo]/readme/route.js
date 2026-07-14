import { getRepoContext } from '@/app/lib/repoAnalysis';
import { generateReadme } from '@/app/lib/ai';

// Reading a whole repo + a Claude generation can run long on large repos.
export const maxDuration = 300;

export async function GET(request, { params }) {
    const { searchParams } = new URL(request.url)
    const { repo } = await params;
    const token = searchParams.get('token')
    const owner = searchParams.get('owner')

    try {
        const { repoInfo, files } = await getRepoContext(owner, repo, token);
        const summary = await generateReadme(files, repoInfo.name);

        return Response.json({
          success: true,
          summary,
        });
    } catch (err) {
        console.error('README generation error:', err);
        return Response.json({
          success: false,
          error: err.message
        }, { status: 500 });
    }
}


export async function PUT(request, { params }) {
  const { repo } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const owner = searchParams.get("owner");

    if (!token) throw new Error("GitHub token is required");

    const body = await request.json();
    const path = "README.md";

    // Step 1: Try to get existing file (to grab sha)
    const getResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    let sha = null;
    if (getResp.ok) {
      const fileData = await getResp.json();
      sha = fileData.sha;
    }

    // Step 2: PUT request with sha if updating
    const putResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: body.message || (sha ? "Update README" : "Create README"),
        // Client sends raw markdown; base64-encode here so UTF-8 content
        // (em-dashes, curly quotes, emoji) survives — btoa() in the browser
        // throws InvalidCharacterError on any non-Latin1 character.
        content: Buffer.from(body.content ?? "", "utf8").toString("base64"),
        sha: sha || undefined,
      }),
    });

    if (!putResp.ok) {
      const errorText = await putResp.text();
      throw new Error(`Failed to update README: ${errorText}`);
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}