export async function GET(request, { params }) {
    const { searchParams } = new URL(request.url)
    const { repo } = params;
    const token = searchParams.get('token')
    const owner = searchParams.get('owner')

    try {
        const res = await fetch('https://us-central1-gitpolish.cloudfunctions.net/readmeGen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ githubtoken: token, repo: repo, owner: owner })
        });

        if (!res.ok) {
          // prefer to inspect body on error
          const text = await res.text();
          throw new Error(`Request failed (${res.status}): ${text}`);
        }

        const data = await res.json(); // parse JSON body
        
        // Return the data as JSON response
        return Response.json({ 
          success: true, 
          summary: data.summary,
          data: data 
        });
    } catch (err) {
        console.error('Fetch error:', err);
        return Response.json({ 
          success: false, 
          error: err.message 
        }, { status: 500 });
    }
}


export async function PUT(request, contextPromise) {
  const { params } = await contextPromise;
  const { repo } = params;

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
        content: body.content, // must be Base64-encoded
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