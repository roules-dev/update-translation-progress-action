import * as core from "@actions/core"
import * as github from "@actions/github"
import { err, ok } from "./lib/error-handling.js";
import { getAllLocalesCodes, getTranslationProgress } from "./tools/gather-translations-info.js";

async function readRepoReadme(
    octokit: ReturnType<typeof github.getOctokit>, 
    repo: { owner: string; repo: string }, 
    path: string
) {
    const { data: fileData } = await octokit.rest.repos.getContent({
        ...repo,
        path: path,
    })

    if (!("content" in fileData)) {
        return err(Error("README.md is not a file or does not exist."))
    }

    const currentContent = Buffer.from(fileData.content, "base64").toString("utf-8")
    return ok({ fileData, currentContent })
}

async function writeRepoReadme(
    octokit: ReturnType<typeof github.getOctokit>, 
    repo: { owner: string; repo: string },
    path: string,
    content: string,
    sha: string
) {
    try {
        const response = await octokit.rest.repos.createOrUpdateFileContents({
            ...repo,
            path: path,
            message: "chore: update README via Action",
            content: Buffer.from(content).toString("base64"),
            sha: sha
        })

        return ok(response)
    }
    catch (error) {
        return err(error instanceof Error ? error : new Error("Unknown error"))
    }
}

async function getTranslationProgressTable(localesPath: string, defaultLocaleCode = "en-US") {
    const strings = []

    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' })

    for (const code of await getAllLocalesCodes(localesPath)) {
        if (code === defaultLocaleCode) continue

        const simplifiedCode = code.split("-")[0]!

        const progress = await getTranslationProgress(localesPath, code, defaultLocaleCode)
        strings.push(`${displayNames.of(simplifiedCode)} (${code}): ${progress}%`)
    }

    if (strings.length === 0) {
        return "No translations found."
    }

    return strings.join("; ")
}


export async function run() {
    const token = core.getInput("gh-token")
    const octokit = github.getOctokit(token)

    const readmePath = core.getInput("readme-path") || "README.md"

    const localesPath = core.getInput("locales-dir") || "locales"
    const defaultLocaleCode = core.getInput("default-locale") || "en-US"

    try {
        const [readError, result] = await readRepoReadme(octokit, github.context.repo, readmePath) 
        if (readError) throw readError 

        const { fileData, currentContent } = result
        core.info(`Current README length: ${currentContent.length} chars`)

        const translationProgressTable = await getTranslationProgressTable(localesPath, defaultLocaleCode)

        const newContent = `${currentContent}\n\nTranslations progress at ${new Date().toISOString()}:\n${translationProgressTable}`

        const [writeError, _] = await writeRepoReadme(octokit, github.context.repo, readmePath, newContent, fileData.sha)
        if (writeError) throw writeError

        core.info("README.md updated successfully!")

    } catch (error) {
        core.setFailed((error as Error)?.message ?? "Unknown error")
    }
}

run()