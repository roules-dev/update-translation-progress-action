import { pathToFileURL } from "node:url"
import * as z from "zod/mini";
import { err, ok } from "../lib/error-handling.js";

function isRecord(val: unknown): val is Record<string, unknown> {
    const schema = z.record(z.string(), z.unknown())
    const res = schema.safeParse(val)

    return res.success
}

function sameStructure(a: Record<string, unknown>, b: Record<string, unknown>) {
    let testedValidKeysCount = 0

    function sameStructureRec(ref: unknown, tested: unknown, path: string[] = []) {
        if (typeof ref === "string" && typeof tested === "string") {
            testedValidKeysCount += 1
            return
        }

        if (!isRecord(ref) || !isRecord(tested)) return

        for (const key in ref) {
            if (!Object.prototype.hasOwnProperty.call(tested, key)) {
                continue
            }

            sameStructureRec(ref[key], tested[key], [...path, key])
        }
        return
    }

    sameStructureRec(a, b, [])

    return testedValidKeysCount
}

async function loadLocaleFile(localesPath: string, localeCode: string) {
    try {
        const locale = (await import(pathToFileURL(`${localesPath}/${localeCode}.json`).href, {
            with: { type: "json" } 
        })).default

        if (typeof locale !== "object") return undefined
    
        if (!locale) return undefined
        return locale
    } 
    catch {
        return undefined
    }
}

export async function countTotalKeys(locale: Record<string, unknown>) {
    let count = 0

    function countRec(obj: Record<string, unknown>) {
        for (const key in obj) {
            if (typeof obj[key] === "string") {
                count += 1
            }
            else if (isRecord(obj[key])) {
                countRec(obj[key])
            }
        }
    }

    countRec(locale)
    return count
}

export async function verifyTranslation(
    localesPath: string, 
    localeCode: string, 
    defaultLocaleCode = "en-US"
) {
    if (!localeCode) {
        console.error("Please provide a locale code as an argument.")
        process.exit(1)
    }

    const defaultLocale = await loadLocaleFile(localesPath, defaultLocaleCode)
    if (!defaultLocale) {
        return err("Default locale file not found or invalid.")
    }

    const locale = await loadLocaleFile(localesPath, localeCode)
    if (!locale) {
        return err("Locale file not found or invalid.")
    }

    const refKeysCount = await countTotalKeys(defaultLocale)
    const testedValidKeysCount = sameStructure(defaultLocale, locale)


    return ok({
        ref: refKeysCount,
        tested: testedValidKeysCount,
    })
}

