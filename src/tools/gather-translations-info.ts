import fs from "fs/promises"
import { verifyTranslation } from "./verify-translation.js"

export async function getAllLocalesCodes(localesPath: string) {
    if (!await fs.stat(localesPath).then(stat => stat.isDirectory()).catch(() => false)) {
        return []
    }
    
    const files = await fs.readdir(localesPath)
    return files
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(".json", ""))
}

export async function getTranslationProgress(
    localesPath: string, 
    localeCode: string, 
    defaultLocaleCode = "en-US"
) {
    const [error, result] = await verifyTranslation(localesPath, localeCode, defaultLocaleCode)
    if (error) {
        return null
    }

    const { ref, tested } = result
    return Math.round((tested / ref) * 100)
}