import { User, UserProfile, UserRole } from "./Authenticator.model";
import { MatColumn } from "./Mat.model";

export interface Question {
    id?: number;
    question?: string;
    category?: string;
    possibleAnswer?: string[];
    orderBy?: number;
    answer?: Answer;
    selectedAnswer?: string[];
}

export interface Answer {
    id?: number;
    correctAnswer?: string[];
    pointPerCorrectAnswer?: number;
}

export class QuestionRow {

    id?: number;
    question?: string;
    category?: string;
    orderBy?: number;
}

export class Lobby {
    id?: string;
    name?: string;
    description?: string;
    currentGame?: string;
    password?: string;
    currentNumberOfPlayer?: number;
    maxPlayer?: number;
    lobbyInfo?: LobbyGame;
    battleshipGame?: BattleshipGame;
    messages: Message[] = [];

    constructor() {
        this.id = '';
        this.name = '';
        this.description = '';
        this.currentGame = '';
        this.password = '';
        this.currentNumberOfPlayer = 0;
        this.maxPlayer = 2;
        this.messages = [];
        this.lobbyInfo = {
            playerList: [],
            spectatingList: [],
        },
            this.battleshipGame = {
                maxPlayer: 2,
                currentNumberOfPlayer: 0,
                gridSize: 7,
                maxNumberOfShip: 5
            }
    }
}

export interface Message {
    message: string;
    time: Time;
    sendBy: string;
}

export interface BattleshipGame {
    maxPlayer?: number;
    currentNumberOfPlayer?: number;
    gridSize?: number;
    maxNumberOfShip?: number;
    boards?: Board[];
}

export interface Board {
    player?: User;
    currentNumberOfShip?: number;
    matrix?: Array<string[]>;
}

export interface LobbyGame {
    playerList?: User[];
    spectatingList?: User[];
}

export interface Time {
    year: number;
    month: number;
    day: number;
    hours: number;
    minute: number;
    second: number;
    maxDay: number;
}


export class LobbyRow {

    id?: string;
    name?: string;
    description?: string;
    game?: string;
    player?: number;
    max_player?: number;
    password?: boolean;
}