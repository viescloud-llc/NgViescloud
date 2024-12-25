import { DateTime, MatInputDisable, MatInputHide, MatInputRequire, MatOption, MatTableDisplayLabel, MatTableHide } from "projects/viescloud-utils/src/lib/model/Mat.model";

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

  @MatTableHide()
  githubUrl: string = '';
  @MatTableHide()
  triggerOnGithubWebhook: boolean = false;
  @MatTableHide()
  gitlabUrl: string = '';
  @MatTableHide()
  triggerOnGitlabWebhook: boolean = false;
  @MatTableHide()
  playBookPath: string = '';
  @MatTableHide()
  inventoryPath: string = '';
  @MatTableHide()
  vaultSecretsFilePath: string = '';
  @MatTableHide()
  vaultPasswordFilePath: string = '';
  @MatTableHide()
  useUserAsPassword: boolean = false;

  path: string = '';

  @MatTableHide()
  verbosity: string = '';

  @MatTableHide()
  cronExpression: string = '';
}

export class EnsiblePlayBookLogger {

  @MatTableDisplayLabel('Run Number')
  runNumber: number = 0;

  @MatTableHide()
  id: number = 0;

  @MatTableHide()
  log: string = '';

  @MatTableDisplayLabel('Item ID')
  itemId: number = 0;

  @MatTableHide()
  executedCommand: string = '';

  @MatTableHide()
  triggerDateTime: DateTime = new DateTime();

  @MatTableDisplayLabel('Status')
  status: EnsiblePlaybookStatus = EnsiblePlaybookStatus.STOP;

  @MatTableHide()
  topic: string = '';
}

export class EnsiblePlayBookTrigger {
  playbook?: string = '';
  inventory?: string = '';
  vaultSecretsFile?: string = '';
  vaultPasswordFile?: string = '';
  vaultPassword?: string = '';
  itemId?: string = '';
  outputTopic?: string = '';
  consumeEverything?: boolean = false;
  verbosity?: string = '';
}

export enum EnsiblePlaybookStatus {
  START = 'START',
  STOP = 'STOP',
  SUCCESS = 'SUCCESS',
  FAILURE = "FAILURE",
  RUNNING = 'RUNNING'
}

export const VERPOSITY_OPTIONS: MatOption<string>[] = [
  {
    value: '',
    valueLabel: 'Minimal'
  },
  {
    value: 'v',
    valueLabel: 'Normal'
  },
  {
    value: 'vv',
    valueLabel: 'Verbose'
  },
  {
    value: 'vvv',
    valueLabel: 'More verbose'
  },
  {
    value: 'vvvv',
    valueLabel: 'Debug'
  },
  {
    value: 'vvvvv',
    valueLabel: 'Connection Debug'
  },
  {
    value: 'vvvvvv',
    valueLabel: 'WinRM Debug'
  }
];
