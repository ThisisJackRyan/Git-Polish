import { NextResponse } from 'next/server';
import { getRepoContext } from '@/app/lib/repoAnalysis';
import { generateChecklist } from '@/app/lib/ai';

// Reading a whole repo + a Claude generation can run long on large repos.
export const maxDuration = 300;

export async function POST(request) {
  try {
    const { githubtoken, repo, owner } = await request.json();

    if (!githubtoken || !repo || !owner) {
      return NextResponse.json(
        { error: 'Missing required parameters: githubtoken, repo, owner' },
        { status: 400 }
      );
    }

    const { repoInfo, files, structure } = await getRepoContext(owner, repo, githubtoken);
    const checklist = await generateChecklist(files, structure, repoInfo);

    return NextResponse.json({
      checklist,
      repository: {
        name: repoInfo.name,
        description: repoInfo.description,
        language: repoInfo.language,
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
      },
      analysis: {
        hasReadme: structure.hasReadme,
        hasLicense: structure.hasLicense,
        hasTests: structure.hasTests,
        hasDocs: structure.hasDocs,
        hasCI: structure.hasCI,
        languages: Array.from(structure.languages),
        fileCount: structure.fileCount,
      },
    });
  } catch (error) {
    console.error('Checklist generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
