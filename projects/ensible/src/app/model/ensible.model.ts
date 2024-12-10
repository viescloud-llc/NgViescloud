import { MatInputDisable, MatInputHide, MatInputRequire, MatTableDisplayLabel, MatTableHide } from "projects/viescloud-utils/src/lib/model/Mat.model";

export class EnsibleUser {
  @MatInputDisable()
  id: number = 0;

  @MatInputDisable()
  sub: string = '';

  @MatInputRequire()
  username: string = '';

  @MatInputRequire()
  email: string = '';

  @MatTableHide()
  @MatInputHide()
  password: string = '';

  @MatTableDisplayLabel('Groups', (user: EnsibleUser) => user.userGroups.reduce((a, c) => (a? a + ', ' : a) + c.name, ''))
  @MatInputHide()
  userGroups: EnsibleUserGroup[] = [
    new EnsibleUserGroup(),
  ] as EnsibleUserGroup[];
}

export class EnsibleUserGroup {

  @MatInputDisable()
  id: number = 0;

  @MatInputRequire()
  name: string = '';

  description: string = '';
}

export class FSTree {
  root: FSNode = new FSNode();

  /**
   * Traverse all nodes in the tree and call the callback on each node.
   * @param callback A function to process each node.
   */
  forEach(callback: (node: FSNode, parent?: FSNode) => void): void {
    const traverse = (node: FSNode, parent?: FSNode): void => {
      callback(node, parent);
      for(let [key, child] of Object.entries(node.children)) {
        child.parent = node;
        traverse(child, node);
      }
    };

    traverse(this.root);
  }
}

export class FSMetadata {
  path: string = '';
  directory: boolean = false;
  file: boolean = false;
  symbolicLink: boolean = false;
  size: number = 0;
  permissions: PosixFilePermission[] = [PosixFilePermission.OWNER_READ] as PosixFilePermission[];
}

export enum PosixFilePermission {
  OWNER_READ,
  OWNER_WRITE,
  OWNER_EXECUTE,
  GROUP_READ,
  GROUP_WRITE,
  GROUP_EXECUTE,
  OTHERS_READ,
  OTHERS_WRITE,
  OTHERS_EXECUTE
}

export class FSNode {
  metadata: FSMetadata = new FSMetadata();
  children: Map<string, FSNode> = new Map();
  parent?: FSNode;

  getName(): string {
    return this.metadata.path.split('/').pop() || '';
  }
}

export enum FsWriteMode {
  OVERRIDEN = 'OVERRIDEN',
  APPEND_START = 'APPEND_START',
  APPEND_END = 'APPEND_END',
  SKIP = 'SKIP'
}

export class EnsibleFsStatusResponse {
  status: string = '';
  path: string = '';
}

export class EnsibleItem {
  id: number = 0;
  name: string = '';
  githubUrl: string = '';
  triggerOnGithubWebhook: boolean = false;
  gitlabUrl: string = '';
  triggerOnGitlabWebhook: boolean = false;
  playBookPath: string = '';
  inventoryPath: string = '';
  vaultSecretsFilePath: string = '';
  vaultPasswordFilePath: string = '';
  useUserAsPassword: boolean = false;
  path: string = '';
}