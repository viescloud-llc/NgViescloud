import { Injectable } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { FSNode, FSTree } from '../../model/ensible.model';
import { EnsibleFs, EnsibleRole, EnsibleFsDir, EnsibleWorkSpace } from '../../model/ensible.parser.model';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';

@Injectable({
  providedIn: 'root'
})
export class EnsibleWorkspaceService extends EnsibleService {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'ensibles', 'workspaces'];
  }

  getWorkspace() {
    return this.httpClient.get<FSTree>(this.getPrefixUri());
  }

}

@Injectable({
  providedIn: 'root'
})
export class EnsibleWorkspaceParserService extends EnsibleWorkspaceService {

  private onFetchWorkspaceSubject = new Subject<EnsibleWorkSpace>();
  onFetchWorkspace$ = this.onFetchWorkspaceSubject.asObservable();
  inventoriesFileOptions: MatOption<string>[] = [];
  playbooksFileOptions: MatOption<string>[] = [];
  secretsFileOptions: MatOption<string>[] = [];
  passwordFileOptions: MatOption<string>[] = [];
  taskFileOptions: MatOption<string>[] = [];

  triggerFetchWorkspace() {
    this.parseWorkspace().then(ws => {})
  }

  async parseWorkspace() {
    return new Promise<EnsibleWorkSpace>((resolve, reject) => {

      this.getWorkspace().subscribe({
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
            this.putWorkspaceFS(parent, node, '/inventories', () => ws.inventories, s => ws.isInventoryExist(s));
            this.putWorkspaceFS(parent, node, '/passwords', () => ws.passwords, s => ws.isPasswordExist(s));
            this.putWorkspaceFS(parent, node, '/secrets', () => ws.secrets, s => ws.isSecretExist(s));
          });

          this.cacheFilesOption(() => ws.inventories, this.inventoriesFileOptions).then();
          this.cacheFilesOption(() => ws.playbooks, this.playbooksFileOptions).then();
          this.cacheFilesOption(() => ws.secrets, this.secretsFileOptions).then();
          this.cacheFilesOption(() => ws.passwords, this.passwordFileOptions).then();
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
          role[property] = this.newEnsibleRoleDir(parent!);
        }

        const dir = role[property] as EnsibleFsDir;
        let task = this.newEnsibleFS(node);
        dir.child.push(task);
        this.taskFileOptions.push({ value: task.path, valueLabel: task.name });
      }
    }
  }

  private newFSNode(e: FSNode) {
    let fsNode = new FSNode();
    fsNode.metadata = e.metadata;
    fsNode.children = e.children;
    fsNode.metadata = e.metadata;
    fsNode.parent = e.parent;
    return fsNode;
  }

  private newEnsibleFS(e: FSNode) {
    let fs = new EnsibleFs();
    fs.name = e.getName();
    fs.path = e.metadata.path;
    fs.FSMetadata = e.metadata;
    return fs;
  }

  private newEnsibleRoleDir(e: FSNode) {
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

  private putWorkspaceFS(p: FSNode | undefined, e: FSNode, parentPathEndWith: string, producer: () => EnsibleFsDir, checkFn: (name: string) => boolean) {
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

  private async cacheFilesOption(producer: () => EnsibleFsDir, opions: MatOption<string>[]) {
    return new Promise<void>((resolve, reject) => {
      opions.length = 0;
      for (const value of producer().child) {
        opions.push({ value: value.path, valueLabel: value.name });
      }
      resolve();
    })
  }
}
