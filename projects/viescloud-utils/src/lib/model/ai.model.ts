import { DateTime } from "./mat.model";

export interface AiReaderGenerateWavRequest {
    text: string;
}

export interface TTS {
    id?: number;
    text?: string;
    createdTime?: DateTime;
}