import { MatTableDisplayLabel } from "../../lib/model/mat.model";

export class DockerTagsResponse {
    count: number = 0;
    next?: string = '';
    previous?: string = '';
    results: DockerTagsResultResponse[] = [new DockerTagsResultResponse()] as DockerTagsResultResponse[];
}

export class DockerTagsResultResponse {
    id: number = 0;

    @MatTableDisplayLabel('Tag')
    name: string = '';
}