import { SharedGroup, SharedUser, UserAccess } from "projects/viescloud-utils/src/lib/model/authenticator.model";
import { DateTime, MatInputDisable, MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputItemSetting, MatInputReadOnly, MatInputRecord, MatInputRequire, MatInputSetting, MatItemSettingType, MatOption, MatTableDisplayLabel, MatTableHide } from "projects/viescloud-utils/src/lib/model/mat.model";
import { DataUtils } from "projects/viescloud-utils/src/lib/util/Data.utils";
import { ReflectionUtils } from "projects/viescloud-utils/src/lib/util/Reflection.utils";

export enum EnsibleItemTypeEnum {
  ANSIBLE = 'ANSIBLE',
  SHELL = 'SHELL',
  TERRAFORM = 'TERRAFORM',
  UNKNOWN = 'UNKNOWN'
}

export enum EnsibleExecuteOptions {
  bash,
  sh,
  zsh,
  fish,
  ksh,
  tcsh,
  dash,
  ash,
  csh,
  elm,
  mksh,
  elvish,
  PowerShell
}


export class EnsibleUser {
  @MatInputDisable()
  id: number = 0;

  @MatInputDisable()
  sub: string = '';

  alias: string = '';

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

  @MatInputItemSetting(MatItemSettingType.TEXT_AREA)
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

export class EnsibleItem extends UserAccess {
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

  path: string = '';

  @MatTableHide()
  cronExpression: string = '';

  @MatTableHide()
  @MatInputRecord()
  variables: Record<string, string> = {'key':'value'} as Record<string, string>;

  @MatTableHide()
  variableList: string[] = [] as string[];

  @MatTableHide()
  dockerContainerTemplate?: EnsibleDockerContainerTemplate = new EnsibleDockerContainerTemplate();

  @MatTableHide()
  webhookConfig: EnsibleWebhookConfig = new EnsibleWebhookConfig();
}

export class EnsiblePlaybookItem extends EnsibleItem {
  @MatTableHide()
  playBookPath: string = '';
  @MatTableHide()
  inventoryPath: string = '';
  @MatTableHide()
  vaultSecretsFilePath: string = '';
  @MatTableHide()
  vaultPasswordFilePath: string = '';

  @MatTableHide()
  verbosity: string = '';
}

export class EnsibleShellItem extends EnsibleItem {
  @MatTableHide()
  type: string = '';
  @MatTableHide()
  code: string = '';
  @MatTableHide()
  codeFilePath: string = '';
  @MatTableHide()
  runCodeFilePath: boolean = false;
}

export class EnsibleProcessLogger {
  @MatTableDisplayLabel('Run Number')
  runNumber: number = 0;

  @MatTableHide()
  log: string = '';

  @MatTableHide()
  itemId: number = 0;

  @MatTableHide()
  executedCommand: string = '';

  @MatTableDisplayLabel('Trigger Date Time', (value: EnsibleProcessLogger) => `${value.triggerDateTime.year}-${value.triggerDateTime.month}-${value.triggerDateTime.day} | ${value.triggerDateTime.hour}:${value.triggerDateTime.minute}:${value.triggerDateTime.second}`)
  triggerDateTime: DateTime = new DateTime();

  @MatTableDisplayLabel('Status')
  status: EnsibleProcessLoggerStatus = EnsibleProcessLoggerStatus.STOP;

  @MatTableHide()
  topic: string = '';

  @MatTableDisplayLabel('Trigger by', (value: EnsibleProcessLogger) => value.triggerBy ?? value.webhookLog?.webhookCommitAuthor ?? 'Unkown')
  triggerBy: string = '';

  @MatTableHide()
  webhookLog: EnsibleWebhookLog = new EnsibleWebhookLog();

  constructor() {
    ReflectionUtils.copyAllParentPrototype(this);
  }
}

export class EnsiblePlaybookLogger extends EnsibleProcessLogger {
  @MatTableHide()
  id: number = 0;

  @MatTableHide()
  verbosity: string = '';
}

export class EnsibleShellLogger extends EnsibleProcessLogger {
  @MatTableHide()
  id: number = 0;
}

export class EnsibleItemTrigger {
  itemId?: string = '';
  outputTopic?: string = '';
  consumeEverything?: boolean = false;
  verbosity?: string = '';
}

export class EnsiblePlayBookTrigger extends EnsibleItemTrigger {
  playbook?: string = '';
  inventory?: string = '';
  vaultSecretsFile?: string = '';
  vaultPasswordFile?: string = '';
  vaultPassword?: string = '';
}

export class EnsibleShellTrigger extends EnsibleItemTrigger {
  type?: string = '';
  code?: string = '';
  codeFilePath?: string = '';
  runCodeFilePath?: boolean = false;
}

export enum EnsibleProcessLoggerStatus {
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

export class EnsibleDockerContainerTemplate extends UserAccess {

  @MatInputHide()
  id: number = 0;

  @MatInputRequire()
  name: string = '';

  @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
  description: string = '';

  @MatInputRequire()
  @MatInputDisplayLabel('Docker image', 'e.g nginx, redis, ubuntu:latest')
  repository: string = '';

  @MatInputDisplayLabel('Registry url', 'e.g https://hub.docker.com/_/ubuntu')
  @MatInputItemSetting(MatItemSettingType.AUTO_FILL_HTTPS, true)
  @MatInputItemSetting(MatItemSettingType.SHOW_GOTO_BUTTON, true)
  registryUrl: string = '';

  @MatTableHide()
  @MatInputItemSetting(MatItemSettingType.LIST_SHOW_ADD_ITEM_BUTTON, true)
  @MatInputDisplayLabel('Extra parameters', 'e.g --user 99:100 -it')
  extraParameters: string[] = [''] as string[];

  @MatTableHide()
  @MatInputItemSetting(MatItemSettingType.LIST_SHOW_ADD_ITEM_BUTTON, true)
  @MatInputDisplayLabel('Post arguments', 'e.g bash, sh, cmd')
  postArguments: string[] = [''] as string[];

  @MatTableHide()
  @MatInputRequire()
  @MatInputItemSetting(MatItemSettingType.RECORD, true)
  @MatInputItemSetting(MatItemSettingType.LIST_SHOW_ADD_ITEM_BUTTON, true)
  @MatInputItemSetting(MatItemSettingType.LIST_SHOW_REMOVE_ITEM_BUTTON, true)
  @MatInputDisplayLabel('Environment variables')
  environmentVariables: Record<string, string> = {'key':'value'} as Record<string, string>;

  @MatTableHide()
  @MatInputEnum(EnsibleExecuteOptions)
  @MatInputRequire()
  @MatInputDisplayLabel('Execute with')
  executeWith: string = '';

  @MatTableHide()
  @MatInputDisplayLabel('Privileged')
  privileged: boolean = false;

  @MatTableHide()
  @MatInputDisplayLabel('Skip run if docker is not running')
  skipRunIfDockerNotRunning: boolean = false;

  @MatTableHide()
  @MatInputDisplayLabel('Skip run if container is not ready')
  skipRunIfContainerNotReady: boolean = false;

  @MatTableHide()
  @MatInputDisplayLabel('Rebuild container for each run')
  rebuildContainerEachRun: boolean = false;

  @MatTableHide()
  @MatInputDisplayLabel('Bind docker socket to container')
  bindDockerSocket: boolean = false;
}

export class EnsibleDockerContainer {
  id: string = '';
  name: string = '';
  image: string = '';
  command: string = '';
  status: string = '';
  created: string = '';
}

export class EnsibleOpenIDProvider {

  @MatInputHide()
  id:                    number = 0;

  @MatInputHide()
  @MatTableHide()
  ownerUserId:           string = "";

  @MatInputHide()
  @MatTableHide()
  sharedUsers:           SharedUser[] = [new SharedUser()] as SharedUser[];

  @MatInputHide()
  @MatTableHide()
  sharedGroups:          SharedGroup[] = [new SharedGroup()] as SharedGroup[];

  @MatInputDisplayLabel('Name', 'e.g Google, Facebook, Twitter')
  name:                  string = "";

  @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
  @MatTableHide()
  description:           string = "";

  @MatInputDisplayLabel('Client ID', 'e.g 123456789.apps.googleusercontent.com')
  @MatInputRequire()
  @MatTableHide()
  clientId:              string = "";

  @MatInputDisplayLabel('Client Secret', 'e.g 123456789.apps.googleusercontent.com')
  @MatInputRequire()
  @MatTableHide()
  clientSecret:          string = "";

  @MatInputDisplayLabel('Authorization Endpoint', 'e.g https://accounts.google.com/o/oauth2/auth')
  @MatInputRequire()
  @MatTableHide()
  authorizationEndpoint: string = "";

  @MatInputDisplayLabel('Token Endpoint', 'e.g https://accounts.google.com/o/oauth2/token')
  @MatInputRequire()
  @MatTableHide()
  tokenEndpoint:         string = "";

  @MatInputDisplayLabel('User Info Endpoint', 'e.g https://www.googleapis.com/oauth2/v1/userinfo')
  @MatInputRequire()
  @MatTableHide()
  userInfoEndpoint:      string = "";

  @MatInputDisplayLabel('End Session Endpoint', 'e.g https://accounts.google.com/o/oauth2/revoke')
  @MatTableHide()
  endSessionEndpoint:    string = "";

  @MatInputHide()
  @MatTableHide()
  usernameMapping:       string = "";

  @MatInputHide()
  @MatTableHide()
  emailMapping:          string = "";

  @MatInputHide()
  @MatTableHide()
  aliasMapping:          string = "";

  @MatInputHide()
  @MatTableHide()
  groupMappings:         EnsibleUserGroup[] = [new EnsibleUserGroup()] as EnsibleUserGroup[];

  @MatTableHide()
  @MatInputDisplayLabel('Auto update user info on login if user exist (not recommended)')
  autoUpdateUserInfo:    boolean = false;
}

export class EnsibleWebhookConfig {
  webhookAddRepositoryName = false;
  webhookAddRepositoryOwnerOrOrganization = false;
  webhookAddRepositoryUrl = false;
  webhookAddRepositoryDefaultBranch = false;

  webhookAddCommitShaOrId = false;
  webhookAddCommitMessage = false;
  webhookAddCommitAuthor = false;
  webhookAddCommitTimeStamp = false;
  webhookAddFilesChanged = false;
  webhookAddDiffStatistic = false;

  webhookAddBranchName = false;
  webhookAddBaseBranch = false;
  webhookAddIsDefaultBranch = false;

  webhookAddEventType = false;
  webhookAddEventId = false;
  webhookAddEventTriggeredWorkflowOrPipelineName = false;

  webhookAddPullOrMergeNumberOrId = false;
  webhookAddPullOrMergeTitle = false;
  webhookAddPullOrMergeDescription = false;
  webhookAddPullOrMergeState = false;
  webhookAddPullOrMergeLabels = false;
  webhookAddPullOrMergeReviewers = false;
  webhookAddPullOrMergeApprovialCount = false;

  webhookAddTagName = false;
  webhookAddTagMessage = false;
  webhookAddTagNameAndEmail = false;

  webhookAddTriggeredUsername = false;
  webhookAddTriggeredUserEmail = false;
  webhookAddTriggeredUserPermissionOrRole = false;

  //---------------------------------------------------------------------

  webhookVariableRepositoryName = '';
  webhookVariableRepositoryOwnerOrOrganization = '';
  webhookVariableRepositoryUrl = '';
  webhookVariableRepositoryDefaultBranch = '';

  webhookVariableCommitShaOrId = '';
  webhookVariableCommitMessage = '';
  webhookVariableCommitAuthor = '';
  webhookVariableCommitTimeStamp = '';
  webhookVariableFilesChanged = '';
  webhookVariableDiffStatistic = '';

  webhookVariableBranchName = '';
  webhookVariableBaseBranch = '';
  webhookVariableIsDefaultBranch = '';

  webhookVariableEventType = '';
  webhookVariableEventId = '';
  webhookVariableEventTriggeredWorkflowOrPipelineName = '';

  webhookVariablePullOrMergeNumberOrId = '';
  webhookVariablePullOrMergeTitle = '';
  webhookVariablePullOrMergeDescription = '';
  webhookVariablePullOrMergeState = '';
  webhookVariablePullOrMergeLabels = '';
  webhookVariablePullOrMergeReviewers = '';
  webhookVariablePullOrMergeApprovialCount = '';

  webhookVariableTagName = '';
  webhookVariableTagMessage = '';
  webhookVariableTagNameAndEmail = '';

  webhookVariableTriggeredUsername = '';
  webhookVariableTriggeredUserEmail = '';
  webhookVariableTriggeredUserPermissionOrRole = '';

  webhookDefaultEmptyValue = 'null';
}

export class EnsibleWebhookLog {
  webhookRepositoryName = '';
  webhookRepositoryOwnerOrOrganization = '';
  webhookRepositoryUrl = '';
  webhookRepositoryDefaultBranch = '';

  webhookCommitShaOrId = '';
  webhookCommitMessage = '';
  webhookCommitAuthor = '';
  webhookCommitTimeStamp: DateTime = new DateTime();
  webhookFilesChanged = '';
  webhookDiffStatistic = '';

  webhookBranchName = '';
  webhookBaseBranch = '';
  webhookIsDefaultBranch = '';

  webhookEventType = '';
  webhookEventId = '';
  webhookEventTriggeredWorkflowOrPipelineName = '';

  webhookPullOrMergeNumberOrId = '';
  webhookPullOrMergeTitle = '';
  webhookPullOrMergeDescription = '';
  webhookPullOrMergeState = '';
  webhookPullOrMergeLabels = '';
  webhookPullOrMergeReviewers = '';
  webhookPullOrMergeApprovialCount = '';

  webhookTagName = '';
  webhookTagMessage = '';
  webhookTagNameAndEmail = '';

  webhookTriggeredUsername = '';
  webhookTriggeredUserEmail = '';
  webhookTriggeredUserPermissionOrRole = '';
}