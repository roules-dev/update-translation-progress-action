import * as z from "zod/mini";

function isRecord(val: unknown): val is Record<string, unknown> {
    const schema = z.record(z.string(), z.unknown())
    const res = schema.safeParse(val)

    return res.success
}

function sameStructure(ref: Record<string, unknown>, tested: Record<string, unknown>) {
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

    sameStructureRec(ref, tested, [])

    return testedValidKeysCount
}

export function countTotalKeys(locale: Record<string, unknown>) {
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

export function verifyTranslation(
    ref: Record<string, unknown>,
    tested: Record<string, unknown>
) {
    return sameStructure(ref, tested)
}

