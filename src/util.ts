import * as prettier from "prettier/standalone";
import * as cssParser from "prettier/parser-postcss";
import * as babelParser from "prettier/parser-babel";
import * as htmlParser from "prettier/parser-html";
import { File } from "./fileExplorer";


export const getFileExtension = (file: File) => {
    const parts = file.path.split(".");
    return parts[parts.length - 1];
};

export const formatFiles = (files: File[]): File[] => {
    let formated = [...files];

    for (const file of formated) {
        const extension = getFileExtension(file);

        switch (extension) {
            case "tsx":
            case "ts":
            case "jsx":
            case "js":
                // @ts-ignore
                file.content = prettier.format(file.content, {
                    plugins: [babelParser],
                    parser: "babel",
                });
                break;
            case "css":
                // @ts-ignore
                file.content = prettier.format(file.content, {
                    plugins: [cssParser],
                    parser: "css",
                });
                break;
            case "html":
                // @ts-ignore
                file.content = prettier.format(file.content, {
                    plugins: [htmlParser],
                    parser: "html",
                    semi: false,
                    bracketSameLine: true,
                });
                break;
        }
    }

    return formated;
}
