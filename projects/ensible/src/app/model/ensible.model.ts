export class EnsibleUser {
    id: number = 0;
    sub: string = '';
    username: string = '';
    email: string = '';
    userGroups: EnsibleUserGroup[] = [new EnsibleUserGroup()] as EnsibleUserGroup[];
}

export class EnsibleUserGroup {
    id: number = 0;
    name: string = '';
    description: string = '';
}