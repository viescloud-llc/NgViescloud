export class StringUtils {
    private constructor() { }

    static readBlobAsText(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result as string);
            };

            reader.onerror = () => {
                reject(new Error('Failed to read Blob'));
            };

            reader.readAsText(blob);
        });
    }

    static makeId(length: number): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }

    static getMaxString(str: string, length: number, replaceWith: string = '...'): string {
        if (str.length > length) {
            return str.substring(0, length) + replaceWith;
        }
        return str;
    }
}