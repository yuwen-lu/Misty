declare module 'clarinet' {
    export interface ClarinetParser {
        onerror: (e: Error) => void;
        onopenobject: (key: string) => void;
        onkey: (key: string) => void;
        onvalue: (value: any) => void;
        oncloseobject: () => void;
        onopenarray: () => void;
        onclosearray: () => void;
        onend: () => void;
        write: (chunk: string) => void;
        close: () => void;
    }

    export function parser(): ClarinetParser;
}
