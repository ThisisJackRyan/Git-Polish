
import {getUpdatedDescriptionBasedOnReadMe, updateDescription} from '@/app/services/github'

export async function GET(request, { params }) {
    const { searchParams } = new URL(request.url)
    const { repo } = await params;
    const token = searchParams.get('token')
    const owner = searchParams.get('owner')
    try {
        const description =  await getUpdatedDescriptionBasedOnReadMe(token, repo, owner)

        return  Response.json({description: description})
    }
    catch (err) {
        console.error('Description generation error:', err);
        return Response.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    const { searchParams } = new URL(request.url)
    const { repo } = await params;
    const token = searchParams.get('token')
    const owner = searchParams.get('owner')

    const body = await request.json();

    try {
        const description = await updateDescription(token, repo, owner, body.description)

        return Response.json({description: description})
    }
    catch (err) {
        console.error('Description update error:', err);
        return Response.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }

}