import type { Octokit, Repo } from "../types/github.js";
import { err, ok } from "./error-handling.js";

export async function readPath(octokit: Octokit, repo: Repo, path: string) {
    const { data } = await octokit.rest.repos.getContent({
        ...repo,
        path: path,
    })

    return data
}

export async function readRepoReadme(
    octokit: Octokit, 
    repo: Repo, 
    path: string
) {
    const fileData = await readPath(octokit, repo, path)

    if (!("content" in fileData)) {
        return err(Error("README.md is not a file or does not exist."))
    }

    const currentContent = Buffer.from(fileData.content, "base64").toString("utf-8")
    return ok({ fileData, currentContent })
}

export async function writeRepoReadme(
    octokit: Octokit, 
    repo: Repo,
    path: string,
    content: string,
    sha: string
) {
    try {
        const response = await octokit.rest.repos.createOrUpdateFileContents({
            ...repo,
            path: path,
            message: "[chore] update translation progress via action",
            content: Buffer.from(content).toString("base64"),
            sha: sha
        })

        return ok(response)
    }
    catch (error) {
        return err(error instanceof Error ? error : new Error("Unknown error"))
    }
}

export async function getAllLocalesCodes(
    octokit: Octokit,
    repo: Repo,
    path: string
) {
    const folderData = await readPath(octokit, repo, path)

    if (!Array.isArray(folderData)) {
        return err(Error("Locales path is not a folder or does not exist."))
    }

    return ok(folderData
        .filter(item => item.type === "file" && item.name.endsWith(".json"))
        .map(item => item.name.replace(".json", ""))
    )
}

export async function loadLocaleFile(    
    octokit: Octokit,
    repo: Repo,
    localesPath: string, 
    localeCode: string
) {
    const fileData = await readPath(octokit, repo, `${localesPath}/${localeCode}.json`)

    if (!("content" in fileData)) {
        return err(Error(`Locale file for code ${localeCode} not found or is not a file.`))
    }

    const content = Buffer.from(fileData.content, "base64").toString("utf-8")
    return ok(JSON.parse(content))
}