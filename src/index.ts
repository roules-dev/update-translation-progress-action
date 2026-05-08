import * as core from "@actions/core";
import * as github from "@actions/github";
import { fileURLToPath } from "url";
import { err, ok } from "./lib/error-handling.js";
import { localeToFlag } from "./lib/locale-to-flag.js";
import { readRepoReadme, writeRepoReadme } from "./lib/read-write-repo.js";
import { getTranslationsProgress } from "./tools/gather-translations-info.js";
import type { Octokit, Repo } from "./types/github.js";


const languageDisplayNames = new Intl.DisplayNames(['en'], { type: 'language' })
const regionDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' })

async function getTranslationProgressTable(
    octokit: Octokit,
    repo: Repo,
    localesPath: string, 
    defaultLocaleCode = "en-US"
) {
    const [error, translationsProgress] = await getTranslationsProgress(octokit, repo, localesPath, defaultLocaleCode)
    if (error) {
        return err(error)
    }

    const headers: string[] = ["|"]
    const separators: string[] = ["|"]
    const progressValues: string[] = ["|"]

    for (const [code, progress] of translationsProgress) {
        const lang = code.split("-")[0]!
        const region = code.split("-")[1]
        
        const flag = localeToFlag(code)
        const flagString = flag ? `${flag} ` : ""
        const languageName = languageDisplayNames.of(lang) || lang
        const regionName = region ? ` (${regionDisplayNames.of(region) || region})` : ""

        headers.push(` ${flagString}${languageName}${regionName} |`)
        separators.push(" --- |")
        progressValues.push(` ${progress}% |`)
    }

    if (headers.length === 1) {
        return err("No translations found.")
    }

    return ok(`${headers.join("")}\n${separators.join("")}\n${progressValues.join("")}`)
}

const translationProgressSectionRegex = /<!-- Translations - START -->[^<>]+<!-- Translations - END -->/gm

function updateReadmeContent(currentContent: string, newTable: string) {
    return currentContent.replace(
        translationProgressSectionRegex, 
        `<!-- Translations - START -->\n${newTable}\n<!-- Translations - END -->`
    )
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

        const [error, translationProgressTable] = await getTranslationProgressTable(octokit, github.context.repo, localesPath, defaultLocaleCode)
        if (error) throw error

        const newContent = updateReadmeContent(currentContent, translationProgressTable)

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