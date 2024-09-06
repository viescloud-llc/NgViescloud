import { DateTime } from "./Mat.model";

export interface AiReaderGenerateWavRequest {
    text: string;
}

export interface TTS {
    id?: number;
    text?: string;
    createdTime?: DateTime;
}