import { Injectable } from '@angular/core';
import { EnsibleFsStatusResponse, FSNode, FSTree, FsWriteMode } from '../../model/ensible.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { first, Observable, Subject } from 'rxjs';
import { EnsibleFs, EnsibleFsDir, EnsibleRole, EnsibleWorkSpace } from '../../model/ensible.parser.model';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/mat.model';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { ViesService } from 'projects/viescloud-utils/src/lib/service/rest.service';

@Injectable({
  providedIn: 'root'
})
export class EnsibleFsService extends ViesService {

  private onFetchWorkspaceSubject = new Subject<EnsibleWorkSpace>();
  onFetchWorkspace$ = this.onFetchWorkspaceSubject.asObservable();
  inventoriesFileOptions: MatOption<string>[] = [];
  playbooksFileOptions: MatOption<string>[] = [];
  secretsFileOptions: MatOption<string>[] = [];
  passwordFileOptions: MatOption<string>[] = [];
  taskFileOptions: MatOption<string>[] = [];
  groupVarsFileOptions: MatOption<string>[] = [];
  hostVarsFileOptions: MatOption<string>[] = [];
  shellsFileOptions: MatOption<string>[] = [];

  constructor(
    httpClient: HttpClient,
    private rxJSUtils: RxJSUtils
  ) {
    super(httpClient);
  }

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'fs'];
  }

  scanFoler(path: string) {
    let params = new HttpParams().set('path', path);

    return this.httpClient.get<FSTree>(`${this.getPrefixUri()}`, {params: params});
  }

  readFileAsString(path: string): Observable<string> {
    let params = new HttpParams().set('path', path);

    return this.httpClient.get(`${this.getPrefixUri()}/read`, {params: params, responseType: 'text'});
  }

  readFileAsBlob(path: string): Observable<Blob> {
    let params = new HttpParams().set('path', path);

    return this.httpClient.get(`${this.getPrefixUri()}/read/bytes`, {params: params, responseType: 'blob'});
  }

  writeFile(path: string, content: string, writeMode: FsWriteMode = FsWriteMode.OVERRIDEN) {
    let params = new HttpParams().set('path', path)
                                 .set('mode', writeMode);

    return this.httpClient.post<EnsibleFsStatusResponse>(`${this.getPrefixUri()}/write`, content, {params: params});
  }

  writeFileWithBlob(path: string, content: Blob, writeMode: FsWriteMode = FsWriteMode.OVERRIDEN) {
    let params = new HttpParams().set('path', path)
                                 .set('mode', writeMode);

    return this.httpClient.post<EnsibleFsStatusResponse>(`${this.getPrefixUri()}/write/bytes`, content, {params: params});
  }

  copyFile(sourcePath: string, targetPath: string, writeMode: FsWriteMode = FsWriteMode.OVERRIDEN, absolutePath: boolean = false) {
    let params = new HttpParams().set('sourcePath', sourcePath)
                                 .set('targetPath', targetPath)
                                 .set('mode', writeMode)
                                 .set('isAbsolutePath', absolutePath);

    return this.httpClient.put<EnsibleFsStatusResponse>(`${this.getPrefixUri()}/copy`, null, {params: params});
  }

  moveFile(sourcePath: string, targetPath: string, writeMode: FsWriteMode = FsWriteMode.OVERRIDEN, absolutePath: boolean = false) {
    let params = new HttpParams().set('sourcePath', sourcePath)
                                 .set('targetPath', targetPath)
                                 .set('mode', writeMode)
                                 .set('isAbsolutePath', absolutePath);

    return this.httpClient.put<EnsibleFsStatusResponse>(`${this.getPrefixUri()}/move`, null, {params: params});
  }

  deleteFile(path: string) {
    let params = new HttpParams().set('path', path);
    return this.httpClient.delete<EnsibleFsStatusResponse>(`${this.getPrefixUri()}`, {params: params});
  }

  //-----------------------------------Workspace----------------------------------------------

  getWorkspace() {
    return this.httpClient.get<FSTree>(`${this.getPrefixUri()}/workspace`);
  }

  triggerFetchWorkspace(waitLoading: boolean = false) {
    return new Promise<EnsibleWorkSpace>((resolve, reject) => {
      this.parseWorkspace(waitLoading).then(ws => resolve(ws)).catch(err => reject(err));
    })
  }

  async parseWorkspace(waitLoading: boolean = false) {
    return new Promise<EnsibleWorkSpace>((resolve, reject) => {

      this.getWorkspace().pipe(waitLoading ? this.rxJSUtils.waitLoadingDialog() : first()).subscribe({
        next: res => {
          let ws = DataUtils.purgeArray(new EnsibleWorkSpace());
          let workspace = new FSTree();
          workspace.root = res.root;
          this.taskFileOptions.length = 0;
          workspace.forEach((e, p) => {
            let node = this.newFSNode(e);
            let parent = p ? this.newFSNode(p) : undefined;

            this.putRole(parent, ws, node);

            this.putRoleChildNode(parent, ws, '/defaults', 'defaults', node);
            this.putRoleChildNode(parent, ws, '/files', 'files', node);
            this.putRoleChildNode(parent, ws, '/handlers', 'handlers', node);
            this.putRoleChildNode(parent, ws, '/meta', 'meta', node);
            this.putRoleChildNode(parent, ws, '/tasks', 'tasks', node);
            this.putRoleChildNode(parent, ws, '/templates', 'templates', node);
            this.putRoleChildNode(parent, ws, '/vars', 'vars', node);

            this.putWorkspaceFS(parent, node, '/playbooks', () => ws.playbooks, s => ws.isPlaybookExist(s));
            this.putWorkspaceFS(parent, node, '/inventory', () => ws.inventory, s => ws.isInventoryExist(s));
            this.putWorkspaceFS(parent, node, '/passwords', () => ws.passwords, s => ws.isPasswordExist(s));
            this.putWorkspaceFS(parent, node, '/secrets', () => ws.secrets, s => ws.isSecretExist(s));

            this.putWorkspaceFS(parent, node, '/group_vars', () => ws.groupVars, s => ws.isGroupVarsExist(s));
            this.putWorkspaceFS(parent, node, '/host_vars', () => ws.hostVars, s => ws.isHostVarsExist(s));

            this.putWorkspaceFS(parent, node, '/shells', () => ws.shells, s => ws.isShellExist(s));
          });

          this.cacheFilesOption(() => ws.inventory, this.inventoriesFileOptions).then();
          this.cacheFilesOption(() => ws.playbooks, this.playbooksFileOptions).then();
          this.cacheFilesOption(() => ws.secrets, this.secretsFileOptions).then();
          this.cacheFilesOption(() => ws.passwords, this.passwordFileOptions).then();
          this.cacheFilesOption(() => ws.groupVars, this.groupVarsFileOptions).then();
          this.cacheFilesOption(() => ws.hostVars, this.hostVarsFileOptions).then();
          this.cacheFilesOption(() => ws.shells, this.shellsFileOptions).then();
          this.onFetchWorkspaceSubject.next(ws);
          resolve(ws);
        },
        error: err => {
          reject(err);
        }
      })
    })
  }

  private putRoleChildNode(parent: FSNode | undefined, ws: EnsibleWorkSpace, parentFolderPath: string, property: keyof EnsibleRole, node: FSNode) {
    if (parent?.metadata.directory && parent.metadata.path.endsWith(parentFolderPath)) {
      let grandParent = this.newFSNode(parent.parent!);
      let role = ws.getRole(grandParent.getName());
      if (role) {
        if(!role[property] && property !== 'self') {
          role[property] = this.newAnsibleRoleDir(parent!);
        }

        const dir = role[property] as EnsibleFsDir;
        let task = this.newEnsibleFS(node);
        dir.child.push(task);
        this.taskFileOptions.push({ value: task.path, valueLabel: task.name });
      }
    }
  }

  private newAnsibleRoleDir(e: FSNode) {
    let tasks = DataUtils.purgeArray(new EnsibleFsDir());
    tasks.self = new EnsibleFs();
    tasks.self.name = e.getName();
    tasks.self.path = e.metadata.path;
    tasks.self.FSMetadata = e.metadata;
    tasks.child = [];
    return tasks;
  }

  private putRole(p: FSNode | undefined, ws: EnsibleWorkSpace, e: FSNode) {
    if (p?.metadata.directory && p.metadata.path.endsWith('/roles') && !ws.isRoleExist(e.getName())) {
      let role = DataUtils.purgeObject(new EnsibleRole());
      role.self = new EnsibleFs();
      role.self.name = e.getName();
      role.self.path = e.metadata.path;
      role.self.FSMetadata = e.metadata;
      ws.roles.push(role);
    }
  }

  protected putWorkspaceFS(p: FSNode | undefined, e: FSNode, parentPathEndWith: string, producer: () => EnsibleFsDir, checkFn: (name: string) => boolean) {
    if (p?.metadata.directory && p.metadata.path.endsWith(parentPathEndWith)) {
      if(!producer().self.path) {
        let self = new EnsibleFs();
        self.name = p.getName();
        self.path = p.metadata.path;
        self.FSMetadata = p.metadata;
        producer().self = self;
        producer().child = [];
      }

      if(!checkFn(e.getName())) {
        let fs = DataUtils.purgeObject(new EnsibleFs());
        fs.name = e.getName();
        fs.path = e.metadata.path;
        fs.FSMetadata = e.metadata;
        producer().child.push(fs);
      }
    }
  }

  protected async cacheFilesOption(producer: () => EnsibleFsDir, opions: MatOption<string>[]) {
    return new Promise<void>((resolve, reject) => {
      opions.length = 0;
      for (const value of producer().child) {
        opions.push({ value: value.path, valueLabel: value.name });
      }
      resolve();
    })
  }

  protected newFSNode(e: FSNode) {
    let fsNode = new FSNode();
    fsNode.metadata = e.metadata;
    fsNode.children = e.children;
    fsNode.metadata = e.metadata;
    fsNode.parent = e.parent;
    return fsNode;
  }

  protected newEnsibleFS(e: FSNode) {
    let fs = new EnsibleFs();
    fs.name = e.getName();
    fs.path = e.metadata.path;
    fs.FSMetadata = e.metadata;
    return fs;
  }
}
