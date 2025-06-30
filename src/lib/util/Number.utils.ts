export class NumberUtils {
    private constructor() { }

    static getRandomInteger(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getRandomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }
}