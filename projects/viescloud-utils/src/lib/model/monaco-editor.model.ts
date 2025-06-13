interface LanguageMap {
    [key: string]: string;
  }

export const MonacoLanguages: LanguageMap = {
    ABAP: 'abap',
    ActionScript: 'actionscript',
    Ada: 'ada',
    Bash: 'bash',
    C: 'c',
    CSharp: 'csharp',
    Cpp: 'cpp',
    CSS: 'css',
    Dart: 'dart',
    Go: 'go',
    GraphQL: 'graphql',
    HTML: 'html',
    Java: 'java',
    JavaScript: 'javascript',
    JSON: 'json',
    Julia: 'julia',
    Kotlin: 'kotlin',
    LESS: 'less',
    Lua: 'lua',
    Markdown: 'markdown',
    ObjectiveC: 'objective-c',
    PHP: 'php',
    PostCSS: 'postcss',
    PowerShell: 'powershell',
    Prolog: 'prolog',
    Python: 'python',
    R: 'r',
    Ruby: 'ruby',
    Rust: 'rust',
    Sass: 'sass',
    Scala: 'scala',
    SQL: 'sql',
    Shell: 'shell',
    Solidity: 'solidity',
    TypeScript: 'typescript',
    VisualBasic: 'visual-basic',
    Vue: 'vue',
    XML: 'xml',
    YAML: 'yaml',
};

export const MonacoLanguageExtensions: LanguageMap = {
    '.abap': 'abap',
    '.as': 'actionscript',
    '.asc': 'actionscript',
    '.ada': 'ada',
    '.bash': 'bash',
    '.bat': 'bash',  // Batch file
    '.c': 'c',
    '.cc': 'cpp',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.css': 'css',
    '.dart': 'dart',
    '.go': 'go',
    '.graphql': 'graphql',
    '.html': 'html',
    '.htm': 'html',
    '.java': 'java',
    '.js': 'javascript',
    '.json': 'json',
    '.jsx': 'javascript',
    '.julia': 'julia',
    '.kt': 'kotlin',
    '.less': 'less',
    '.lua': 'lua',
    '.md': 'markdown',
    '.m': 'objective-c',  // Objective-C
    '.mm': 'objective-c', // Objective-C++
    '.php': 'php',
    '.postcss': 'postcss',
    '.ps1': 'powershell',  // PowerShell
    '.py': 'python',
    '.r': 'r',
    '.rb': 'ruby',
    '.rs': 'rust',
    '.sass': 'sass',
    '.scss': 'sass',
    '.scala': 'scala',
    '.sql': 'sql',
    '.sh': 'shell',
    '.sol': 'solidity',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.vb': 'visual-basic',
    '.vue': 'vue',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',

    'abap': 'abap',
    'as': 'actionscript',
    'asc': 'actionscript',
    'ada': 'ada',
    'bash': 'bash',
    'bat': 'bash',  // Batch file
    'c': 'c',
    'cc': 'cpp',
    'cpp': 'cpp',
    'cs': 'csharp',
    'css': 'css',
    'dart': 'dart',
    'go': 'go',
    'graphql': 'graphql',
    'html': 'html',
    'htm': 'html',
    'java': 'java',
    'js': 'javascript',
    'json': 'json',
    'jsx': 'javascript',
    'julia': 'julia',
    'kt': 'kotlin',
    'less': 'less',
    'lua': 'lua',
    'md': 'markdown',
    'm': 'objective-c',  // Objective-C
    'mm': 'objective-c', // Objective-C++
    'php': 'php',
    'postcss': 'postcss',
    'ps1': 'powershell',  // PowerShell
    'py': 'python',
    'r': 'r',
    'rb': 'ruby',
    'rs': 'rust',
    'sass': 'sass',
    'scss': 'sass',
    'scala': 'scala',
    'sql': 'sql',
    'sh': 'shell',
    'sol': 'solidity',
    'ts': 'typescript',
    'tsx': 'typescript',
    'vb': 'visual-basic',
    'vue': 'vue',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml'
};

export const MonacoLanguageTabSizes: Record<string, number> = {
    abap: 2,
    actionscript: 2,
    ada: 3,
    bash: 2,
    c: 4,
    csharp: 4,
    cpp: 4,
    css: 2,
    dart: 2,
    go: 2,
    graphql: 2,
    html: 2,
    java: 4,
    javascript: 2,
    json: 2,
    julia: 4,
    kotlin: 4,
    less: 2,
    lua: 2,
    markdown: 2,
    'objective-c': 2,
    php: 4,
    postcss: 2,
    powershell: 4,
    prolog: 4,
    python: 4,
    r: 2,
    ruby: 2,
    rust: 4,
    sass: 2,
    scala: 2,
    sql: 2,
    shell: 2,
    solidity: 4,
    typescript: 2,
    'visual-basic': 4,
    vue: 2,
    xml: 2,
    yaml: 2,
};

export class MonacoLanguage {
    static from(str: string) {
        let found1 = MonacoLanguages[str];
        let found2 = MonacoLanguageExtensions[str];
        if(found1) {
            return found1;
        }
        if(found2) {
            return found2;
        }
        return str.replaceAll('.', '');
    }

    static getTabSizeForLanguage(input: string): number {
        const normalizedInput = input.trim().toLowerCase();
    
        // Try to get the language ID from the extension map
        const languageIdFromExtension = MonacoLanguageExtensions[normalizedInput];
    
        // If input is like "file.ts", try to extract the extension first
        const extMatch = normalizedInput.match(/\.[^.]+$/);
        const extension = extMatch ? extMatch[0] : '';
    
        const languageId =
            languageIdFromExtension ||
            MonacoLanguageExtensions[extension] ||
            MonacoLanguages[normalizedInput as keyof typeof MonacoLanguages] ||
            normalizedInput;
    
        return MonacoLanguageTabSizes[languageId] ?? 4; // default to 4 if not found
    }
}