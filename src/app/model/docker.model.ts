export class DockerTagsResponse {
    count: number = 0;
    next?: string = '';
    previous?: string = '';
    results: DockerTagsResultResponse[] = [new DockerTagsResultResponse()] as DockerTagsResultResponse[];
}

export class DockerTagsResultResponse {
    id: number = 0;
    name: string = '';
}