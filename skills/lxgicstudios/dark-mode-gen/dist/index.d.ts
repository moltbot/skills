export declare function addDarkMode(filePath: string): Promise<string>;
export declare function processDirectory(dirPath: string): Promise<{
    file: string;
    status: string;
}[]>;
