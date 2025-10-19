
import {getUpdatedDescriptionBasedOnReadMe, updateDescription} from '@/app/services/github'

export async function GET(request, { params }) {
    const { searchParams } = new URL(request.url)
    const { repo } = params;
    const token = searchParams.get('token')
    const owner = searchParams.get('owner')
    try {
       

        const description =  await getUpdatedDescriptionBasedOnReadMe(token, repo, owner)

        return  Response.json({description: description})
    }
    catch{
        return Response.json(
            { error: `Internal server error` },
            { status: 500 }
        );
    }
}

export async function PUT(request, contextPromise ) {
    const { searchParams } = new URL(request.url)
    const { params } = await contextPromise;
    const { repo } = params;
    const token = searchParams.get('token')
    const owner = searchParams.get('owner')

    const body = await request.json();

    try {
        const description = await updateDescription(token, repo, owner, body.description)

        return Response.json({description: description})
    }
    catch{
        return Response.json(
            { error: `Internal server error` },
            { status: 500 }
        );
    }

}