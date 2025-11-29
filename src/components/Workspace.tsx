import React, { useState, useEffect, useMemo } from 'react';
import { FileCode, Folder, ChevronRight, ChevronDown, File, GitCommit, Eye, EyeOff } from 'lucide-react';
import { createHighlighter } from 'shiki';
import type { FileNode } from '../utils/git';
import clsx from 'clsx';
import * as Diff from 'diff';

interface WorkspaceProps {
    files: FileNode[];
    prevFiles?: FileNode[];
    changedFiles?: string[];
    initialFile?: string;
    terminalOutput?: string;
}

export default function Workspace({ files, prevFiles = [], changedFiles = [], initialFile, terminalOutput }: WorkspaceProps) {
    const hiddenFiles = ['OUTPUT.txt', 'OUTPUT.md', 'STEP.md', 'STEPS.md', 'README.md'];

    // Filter out hidden files from changedFiles and files for selection logic
    const visibleChangedFiles = useMemo(() => changedFiles.filter(f => !hiddenFiles.includes(f)), [changedFiles]);
    const visibleFiles = useMemo(() => files.filter(f => !hiddenFiles.includes(f.path)), [files]);

    // Default to the first visible changed file if available, otherwise the first visible file
    const startFile = initialFile || visibleChangedFiles[0] || visibleFiles[0]?.path || null;

    const [selectedFile, setSelectedFile] = useState<string | null>(startFile);
    const [mode, setMode] = useState<'code' | 'diff' | 'terminal'>('diff');
    const [highlightedCode, setHighlightedCode] = useState<string>('');
    const [diffHtml, setDiffHtml] = useState<string>('');
    const [highlighter, setHighlighter] = useState<any>(null);
    const [showAllFiles, setShowAllFiles] = useState(false);

    // Initialize highlighter
    useEffect(() => {
        createHighlighter({
            themes: ['github-light'],
            langs: ['typescript', 'json', 'markdown', 'css', 'html', 'bash'],
        }).then(setHighlighter);
    }, []);

    // Auto-switch to diff mode if file is changed, else code mode
    useEffect(() => {
        if (selectedFile && visibleChangedFiles.includes(selectedFile)) {
            // If it's a new file (not in prevFiles), show code instead of diff
            const isNewFile = !prevFiles.find(f => f.path === selectedFile);
            if (isNewFile) {
                setMode('code');
            } else {
                setMode('diff');
            }
        } else {
            setMode('code');
        }
    }, [selectedFile, visibleChangedFiles, prevFiles]);

    // Generate content based on mode
    useEffect(() => {
        if (mode === 'terminal') return;
        if (!selectedFile || !highlighter) return;

        const file = files.find(f => f.path === selectedFile);
        const prevFile = prevFiles.find(f => f.path === selectedFile);

        const lang = selectedFile.split('.').pop() || 'text';

        if (mode === 'code') {
            if (file && !file.isBinary && file.content) {
                try {
                    const html = highlighter.codeToHtml(file.content, {
                        lang,
                        theme: 'github-light'
                    });
                    setHighlightedCode(html);
                } catch (e) {
                    setHighlightedCode(`<pre>${file.content}</pre>`);
                }
            } else {
                setHighlightedCode('<div class="p-4 text-void/40 italic">Binary file or empty</div>');
            }
        } else if (mode === 'diff') {
            if (!file && !prevFile) {
                setDiffHtml('<div class="p-4 text-void/40 italic">File not found</div>');
                return;
            }

            const oldContent = prevFile?.content || '';
            const newContent = file?.content || '';

            if ((file?.isBinary) || (prevFile?.isBinary)) {
                setDiffHtml('<div class="p-4 text-void/40 italic">Binary file diff not supported</div>');
                return;
            }

            const diff = Diff.createTwoFilesPatch(
                selectedFile,
                selectedFile,
                oldContent,
                newContent,
                'Previous',
                'Current'
            );

            const html = diff.split('\n').map(line => {
                if (line.startsWith('+')) return `<div class="bg-rand-blue/10 text-void border-l-2 border-rand-blue pl-2">${escapeHtml(line)}</div>`;
                if (line.startsWith('-')) return `<div class="bg-alert-red/10 text-void border-l-2 border-alert-red pl-2">${escapeHtml(line)}</div>`;
                if (line.startsWith('@')) return `<div class="bg-surface text-void font-bold py-1 pl-2 my-1 border-y border-void/20">${escapeHtml(line)}</div>`;
                return `<div class="pl-2 text-void/80">${escapeHtml(line)}</div>`;
            }).join('');

            setDiffHtml(`<pre class="font-mono text-xs leading-relaxed">${html}</pre>`);
        }
    }, [selectedFile, mode, highlighter, files, prevFiles]);

    // Build tree structure
    const tree = useMemo(() => {
        const root: any = {};
        const hiddenFiles = ['OUTPUT.txt', 'STEPS.md'];

        files.forEach(file => {
            // Skip hidden files
            if (hiddenFiles.includes(file.path)) {
                return;
            }

            // Filter files if showAllFiles is false
            if (!showAllFiles && !changedFiles.includes(file.path)) {
                return;
            }

            const parts = file.path.split('/');
            let current = root;
            parts.forEach((part, i) => {
                if (!current[part]) {
                    current[part] = i === parts.length - 1 ? { ...file, type: 'file' } : { type: 'folder', children: {} };
                }
                current = current[part].children || current[part];
            });
        });
        return root;
    }, [files, showAllFiles, changedFiles]);

    return (
        <div className="flex h-full bg-paper font-mono text-void">
            {/* File Tree */}
            <div className="w-64 border-r border-void overflow-y-auto bg-paper text-xs flex flex-col">
                <div className="p-2 border-b border-void font-bold uppercase tracking-widest text-center bg-surface flex justify-between items-center">
                    <span>Files</span>
                    <button
                        onClick={() => setShowAllFiles(!showAllFiles)}
                        className="text-void/60 hover:text-void transition-colors"
                        title={showAllFiles ? "Show changed files only" : "Show all files"}
                    >
                        {showAllFiles ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <FileTree
                        node={tree}
                        onSelect={(path: string) => {
                            setSelectedFile(path);
                            if (mode === 'terminal') setMode('code');
                        }}
                        selected={selectedFile}
                        changedFiles={changedFiles}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-paper">
                <div className="border-b border-void px-4 pt-2 flex justify-between items-end bg-surface">
                    <span className="text-xs font-bold uppercase tracking-wider text-void mb-2">
                        {mode === 'terminal' ? 'Terminal Output' : selectedFile}
                    </span>
                    <div className="flex gap-[-1px]">
                        <button
                            onClick={() => setMode('code')}
                            className={clsx(
                                "px-4 py-1 text-[10px] font-bold uppercase tracking-wider border-t border-x border-void transition-all relative top-[1px]",
                                mode === 'code' ? "bg-paper text-void z-10 border-b-paper" : "bg-[#d6d4ce] text-void/60 hover:bg-white border-b-void"
                            )}
                        >
                            Code
                        </button>
                        <button
                            onClick={() => setMode('diff')}
                            className={clsx(
                                "px-4 py-1 text-[10px] font-bold uppercase tracking-wider border-t border-x border-void transition-all relative top-[1px] -ml-[1px]",
                                mode === 'diff' ? "bg-paper text-void z-10 border-b-paper" : "bg-[#d6d4ce] text-void/60 hover:bg-white border-b-void"
                            )}
                        >
                            Diff
                        </button>
                        {terminalOutput && (
                            <button
                                onClick={() => setMode('terminal')}
                                className={clsx(
                                    "px-4 py-1 text-[10px] font-bold uppercase tracking-wider border-t border-x border-void transition-all relative top-[1px] -ml-[1px]",
                                    mode === 'terminal' ? "bg-paper text-void z-10 border-b-paper" : "bg-[#d6d4ce] text-void/60 hover:bg-white border-b-void"
                                )}
                            >
                                Output
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-0">
                    {mode === 'code' && (
                        <div
                            className="text-sm font-mono p-4"
                            dangerouslySetInnerHTML={{ __html: highlightedCode }}
                        />
                    )}
                    {mode === 'diff' && (
                        <div
                            className="text-sm p-4"
                            dangerouslySetInnerHTML={{ __html: diffHtml }}
                        />
                    )}
                    {mode === 'terminal' && terminalOutput && (
                        <div className="bg-void text-terminal-green p-4 min-h-full font-mono text-sm overflow-auto">
                            <pre className="crt-text-shadow">{terminalOutput}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function escapeHtml(unsafe: string) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function FileTree({ node, onSelect, selected, path = '', changedFiles = [] }: any) {
    if (Object.keys(node).length === 0) {
        return <div className="p-2 text-void/40 italic">No files to show</div>;
    }

    return (
        <ul className="pl-2">
            {Object.entries(node).map(([name, item]: [string, any]) => {
                const fullPath = path ? `${path}/${name}` : name;
                const isChanged = changedFiles.includes(fullPath);

                if (item.type === 'folder') {
                    return (
                        <FolderNode key={fullPath} name={name} path={fullPath}>
                            <FileTree node={item.children} onSelect={onSelect} selected={selected} path={fullPath} changedFiles={changedFiles} />
                        </FolderNode>
                    );
                }
                return (
                    <li
                        key={fullPath}
                        className={clsx(
                            "cursor-pointer py-1 px-2 flex items-center gap-2 hover:bg-surface",
                            selected === item.path && "bg-void text-paper font-bold",
                            isChanged && selected !== item.path && "text-rand-blue font-bold"
                        )}
                        onClick={() => onSelect(item.path)}
                    >
                        {/* <FileCode size={14} /> */}
                        <span className="font-mono">{name}</span>
                        {isChanged && <span className="text-[10px] uppercase ml-auto font-bold text-rand-blue">*</span>}
                    </li>
                );
            })}
        </ul>
    );
}

function FolderNode({ name, children }: any) {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <li>
            <div
                className="cursor-pointer py-1 px-2 flex items-center gap-2 font-bold hover:bg-surface"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {/* <Folder size={14} /> */}
                <span className="uppercase tracking-wider text-[10px]">{name}</span>
            </div>
            {isOpen && children}
        </li>
    );
}
