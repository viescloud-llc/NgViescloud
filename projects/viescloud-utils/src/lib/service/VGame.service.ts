import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Lobby, Message, Question } from '../model/VGame.model';
import { SettingService } from './Setting.service';
import HttpClientUtils from '../model/HttpClientUtils.model';

@Injectable({
  providedIn: 'root'
})
export class VGameService {

  private prefix = "vgame"

  constructor(
    private httpClient: HttpClient,
    private settingService: SettingService,
  ) { }

  // Question
  public getAnyMatchQuestions(question: Question): Observable<Question[]> {
    let params = HttpClientUtils.toHttpParams(question);
    return this.httpClient.get<Question[]>(`${this.settingService.getGatewayUrl()}/${this.prefix}/questions/match_any`, { params: params });
  }

  public getAllMatchQuestions(question: Question): Observable<Question[]> {
    let params = HttpClientUtils.toHttpParams(question);
    return this.httpClient.get<Question[]>(`${this.settingService.getGatewayUrl()}/${this.prefix}/questions/match_all`, { params: params });
  }

  public getAnyMatchQuestionsWithMatchCase(question: Question, matchCase: string): Observable<Question[]> {
    let params = HttpClientUtils.toHttpParams(question);
    return this.httpClient.get<Question[]>(`${this.settingService.getGatewayUrl()}/${this.prefix}/questions/match_any/${matchCase}`, { params: params });
  }

  public getAllMatchQuestionsWithMatchCase(question: Question, matchCase: string): Observable<Question[]> {
    let params = HttpClientUtils.toHttpParams(question);
    return this.httpClient.get<Question[]>(`${this.settingService.getGatewayUrl()}/${this.prefix}/questions/match_all/${matchCase}`, { params: params });
  }

  public getQuestions(): Observable<Question[]> {
    return this.httpClient.get<Question[]>(`${this.settingService.getGatewayUrl()}/${this.prefix}/questions`);
  }

  public getQuestion(id: number): Observable<Question> {
    return this.httpClient.get<Question>(`${this.settingService.getGatewayUrl()}/${this.prefix}/questions/${id}`);
  }

  public postQuestion(question: Question): Observable<Question> {
    return this.httpClient.post<Question>(`${this.settingService.getGatewayUrl()}/${this.prefix}/questions`, question);
  }

  public putQuestion(question: Question): Observable<Question> {
    return this.httpClient.put<Question>(`${this.settingService.getGatewayUrl()}/${this.prefix}/questions/${question.id}`, question);
  }

  public patchQuestion(question: Question): Observable<Question> {
    return this.httpClient.patch<Question>(`${this.settingService.getGatewayUrl()}/${this.prefix}/questions/${question.id}`, question);
  }

  public deleteQuestion(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.settingService.getGatewayUrl()}/${this.prefix}/questions/${id}`);
  }

  // Lobby
  public joinLobby(lobbyId: string): Observable<Lobby> {
    return this.httpClient.post<Lobby>(`${this.settingService.getGatewayUrl()}/${this.prefix}/lobbies/join/${lobbyId}`, null);
  }

  public joinLobbyWithPassword(lobbyId: string, password: string): Observable<Lobby> {
    return this.httpClient.post<Lobby>(`${this.settingService.getGatewayUrl()}/${this.prefix}/lobbies/join/${lobbyId}`, { password: password });
  }

  public leaveLobby(lobbyId: string): Observable<Lobby> {
    return this.httpClient.post<Lobby>(`${this.settingService.getGatewayUrl()}/${this.prefix}/lobbies/leave/${lobbyId}`, null);
  }

  public sendMessage(lobbyId: string, message: string): Observable<Lobby> {
    return this.httpClient.post<Lobby>(`${this.settingService.getGatewayUrl()}/${this.prefix}/lobbies/chat/${lobbyId}`, { message: message });
  }

  public kickPlayer(lobbyId: string, userId: number) {
    return this.httpClient.post<Lobby>(`${this.settingService.getGatewayUrl()}/${this.prefix}/lobbies/kick/${lobbyId}/${userId}`, null);
  }

  //-------------------

  public getLobbies(): Observable<Lobby[]> {
    return this.httpClient.get<Lobby[]>(`${this.settingService.getGatewayUrl()}/${this.prefix}/lobbies`);
  }

  public getLobby(id: string): Observable<Lobby> {
    return this.httpClient.get<Lobby>(`${this.settingService.getGatewayUrl()}/${this.prefix}/lobbies/${id}`);
  }

  public postLobby(lobby: Lobby): Observable<Lobby> {
    return this.httpClient.post<Lobby>(`${this.settingService.getGatewayUrl()}/${this.prefix}/lobbies`, lobby);
  }

  public putLobby(lobby: Lobby): Observable<Lobby> {
    return this.httpClient.put<Lobby>(`${this.settingService.getGatewayUrl()}/${this.prefix}/lobbies/${lobby.id}`, lobby);
  }

  public patchLobby(lobby: Lobby): Observable<Lobby> {
    return this.httpClient.patch<Lobby>(`${this.settingService.getGatewayUrl()}/${this.prefix}/lobbies/${lobby.id}`, lobby);
  }

  public deleteLobby(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.settingService.getGatewayUrl()}/${this.prefix}/lobbies/${id}`);
  }
}
