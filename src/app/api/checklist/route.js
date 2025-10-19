import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { githubtoken, repo, owner } = await request.json();

    if (!githubtoken || !repo || !owner) {
      return NextResponse.json(
        { error: 'Missing required parameters: githubtoken, repo, owner' },
        { status: 400 }
      );
    }

    // Get the Firebase function URL
    const firebaseFunctionUrl = process.env.FIREBASE_FUNCTION_URL || 'https://us-central1-git-polish.cloudfunctions.net';
    const checklistUrl = `${firebaseFunctionUrl}/generateChecklist`;

    // Call the Firebase function
    const response = await fetch(checklistUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        githubtoken,
        repo,
        owner
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firebase function error:', errorText);
      return NextResponse.json(
        { error: `Firebase function failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
