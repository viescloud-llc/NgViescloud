import { AfterViewChecked, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthenticatorService } from '../../service/Authenticator.service';
import { VGameService } from '../../service/VGame.service';
import { Lobby } from '../../model/VGame.model';
import { User } from '../../model/Authenticator.model';
import { first } from 'rxjs';

@Component({
  selector: 'app-lobby-dialog',
  templateUrl: './lobby-dialog.component.html',
  styleUrls: ['./lobby-dialog.component.scss']
})
export class LobbyDialog implements OnInit, AfterViewChecked {

  lobby!: Lobby;
  lobbyCopy!: Lobby;
  user!: User;

  validForm: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {lobbyId: string},
    private dialogRef: MatDialogRef<LobbyDialog>,
    private authenticatorService: AuthenticatorService,
    private vgameService: VGameService,
    private cd: ChangeDetectorRef
  ) { }
  ngAfterViewChecked(): void {
    this.cd.detectChanges();
  }

  ngOnInit() {
    this.init();
  }

  init() {
    this.authenticatorService.getCurrentLoginUser().pipe(first()).subscribe(
      res => {
        this.user = res;

        if(this.data.lobbyId) {
          this.vgameService.getLobby(this.data.lobbyId).pipe(first()).subscribe(
            res => {
              this.lobby = res;
              this.lobbyCopy = structuredClone(this.lobby);
            }
          );
        }
        else {
          this.lobby = new Lobby();

          this.lobbyCopy = structuredClone(this.lobby);

        }
      }
    );
  }

  save() {
    if(this.data.lobbyId) {
      this.resetLobbyGame(this.lobby);
      this.vgameService.patchLobby(this.lobby).pipe(first()).subscribe(
        res => {
          this.dialogRef.close(res.id);
        }
      );
    }
    else {
      this.vgameService.postLobby(this.lobby).pipe(first()).subscribe(
        res => {
          this.dialogRef.close(res.id);
        }
      );
    }
  }

  resetLobbyGame(lobby: Lobby) {
    lobby.battleshipGame = {
      maxPlayer:             2,
      currentNumberOfPlayer: 0,
      gridSize:              7,
      maxNumberOfShip:       5
    }
  }

  revert() {
    this.lobby = structuredClone(this.lobbyCopy);
  }

  isValueNotChange(): boolean {
    return JSON.stringify(this.lobby) === JSON.stringify(this.lobbyCopy);
  }

}
