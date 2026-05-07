import * as core from "@actions/core";
import * as github from "@actions/github";
import { fileURLToPath } from "url";
import { err, ok } from "./lib/error-handling.js";
import { localeToFlag } from "./lib/locale-to-flag.js";
import { readRepoReadme, writeRepoReadme } from "./lib/read-write-repo.js";
import { getTranslationsProgress } from "./tools/gather-translations-info.js";
import type { Octokit, Repo } from "./types/github.js";


const displayNames = new Intl.DisplayNames(['en'], { type: 'language' })
export async function getTranslationProgressTable(
    octokit: Octokit,
    repo: Repo,
    localesPath: string, 
    defaultLocaleCode = "en-US"
) {
    const [error, translationsProgress] = await getTranslationsProgress(octokit, repo, localesPath, defaultLocaleCode)
    if (error) {
        return err(error)
    }

    const strings: string[] = []

    for (const [code, progress] of translationsProgress) {
        const simplifiedCode = code.split("-")[0]!

        const flag = localeToFlag(code)
        strings.push(`${flag ? `${flag} ` : ""}${displayNames.of(simplifiedCode)} (${code}): ${progress}%`)
    }

    if (strings.length === 0) {
        return err("No translations found.")
    }

    return ok(strings.join("\n"))
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

        const [error, translationProgressTable] = await getTranslationProgressTable(octokit, github.context.repo, localesPath, defaultLocaleCode)
        if (error) throw error

        const newContent = `${currentContent}\n\nTranslations progress at ${new Date().toISOString()}:\n${translationProgressTable}`

        const [writeError, _] = await writeRepoReadme(octokit, github.context.repo, readmePath, newContent, fileData.sha)
        if (writeError) throw writeError

        core.info("README.md updated successfully!")

    } catch (error) {
        core.setFailed((error as Error)?.message ?? "Unknown error")
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    run()
}