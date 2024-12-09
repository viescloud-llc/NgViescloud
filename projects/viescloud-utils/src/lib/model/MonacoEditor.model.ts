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
}