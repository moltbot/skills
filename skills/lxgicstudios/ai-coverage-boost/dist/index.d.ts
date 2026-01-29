export declare function analyzeAndGenerateTests(filePath: string): Promise<{
    testCode: string;
    testPath: string;
    uncoveredPaths: string[];
}>;
export declare function writeTestFile(testPath: string, testCode: string): void;
