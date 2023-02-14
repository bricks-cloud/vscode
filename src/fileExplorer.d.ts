/// <reference types="node" />
import vscode from "vscode";
import fs from "fs";
export interface File {
    content: string;
    path: string;
}
export declare class FileExplorer {
    private readonly bricksFileSystem;
    constructor(context: vscode.ExtensionContext, bricksFileSystem: FileSystemProvider);
    private openResource;
}
export declare class FileStat implements vscode.FileStat {
    private fsStat;
    constructor(fsStat: fs.Stats);
    get type(): vscode.FileType;
    get isFile(): boolean | undefined;
    get isDirectory(): boolean | undefined;
    get isSymbolicLink(): boolean | undefined;
    get size(): number;
    get ctime(): number;
    get mtime(): number;
}
interface Entry {
    uri: vscode.Uri;
    type: vscode.FileType;
}
export declare class FileSystemProvider implements vscode.TreeDataProvider<Entry>, vscode.FileSystemProvider {
    private _onDidChangeFile;
    private storageUri;
    private _onDidChangeTreeData;
    readonly onDidChangeTreeData: vscode.Event<Entry | undefined | null | void>;
    constructor(storageUri: vscode.Uri);
    get onDidChangeFile(): vscode.Event<vscode.FileChangeEvent[]>;
    refresh(): void;
    watch(uri: vscode.Uri, options: {
        recursive: boolean;
        excludes: string[];
    }): vscode.Disposable;
    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat>;
    _stat(path: string): Promise<vscode.FileStat>;
    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]>;
    _readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]>;
    createDirectory(uri: vscode.Uri): void | Thenable<void>;
    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array>;
    writeFile(uri: vscode.Uri, content: Uint8Array, options: {
        create: boolean;
        overwrite: boolean;
    }): void | Thenable<void>;
    _writeFile(uri: vscode.Uri, content: Uint8Array, options: {
        create: boolean;
        overwrite: boolean;
    }): Promise<void>;
    delete(uri: vscode.Uri, options: {
        recursive: boolean;
    }): void | Thenable<void>;
    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: {
        overwrite: boolean;
    }): void | Thenable<void>;
    _rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: {
        overwrite: boolean;
    }): Promise<void>;
    getChildren(element?: Entry): Promise<Entry[]>;
    getTreeItem(element: Entry): vscode.TreeItem;
}
export {};
