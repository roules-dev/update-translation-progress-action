import { err, ok } from "../lib/error-handling.js"
import { getAllLocalesCodes, loadLocaleFile } from "../lib/read-write-repo.js"
import type { Octokit, Repo } from "../types/github.js"
import { countTotalKeys, verifyTranslation } from "./verify-translation.js"

export async function getTranslationsProgress(
    octokit: Octokit,
    repo: Repo,
    localesPath: string,
    defaultLocaleCode = "en-US"
) {
    const localesProgress: [string, number][] = []

    const [error, codes] = await getAllLocalesCodes(octokit, repo, localesPath)
    if (error) {
        return err(error)
    }

    if (codes.length === 0) return err("No translations found.")
    if (!codes.includes(defaultLocaleCode)) {
        return err(`Default locale (${defaultLocaleCode}) not found.`)
    }
    const [error2, defaultLocale] = await loadLocaleFile(octokit, repo, localesPath, defaultLocaleCode)
    if (error2) {
        return err(error2)
    }
    const defaultLocaleKeysCount = countTotalKeys(defaultLocale)

    for (const code of codes) {
        if (code === defaultLocaleCode) continue

        const [error3, locale] = await loadLocaleFile(octokit, repo, localesPath, code)
        if (error3) {
            console.warn(`Failed to load locale file for ${code}: ${error3 instanceof Error ? error3.message : error3}`)
            continue
        }

        const localeValidKeysCount = verifyTranslation(defaultLocale, locale)

        const progress = Math.round((localeValidKeysCount / defaultLocaleKeysCount) * 100)
        localesProgress.push([code, progress])
    }

    if (localesProgress.length === 0) {
        return err("No translations found.")
    }

    return ok(localesProgress)
}