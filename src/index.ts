import * as core from "@actions/core"
import * as github from "@actions/github"

export async function run() {
    const token = core.getInput("gh-token")
    const octokit = github.getOctokit(token)

    const readmePath = core.getInput("readme-path") || "README.md"

    try {
        const { data: fileData } = await octokit.rest.repos.getContent({
            ...github.context.repo,
            path: readmePath,
        })

        if (!("content" in fileData)) {
            throw new Error("README.md is not a file or does not exist.")
        }

        const currentContent = Buffer.from(fileData.content, "base64").toString("utf-8")
        core.info(`Current README length: ${currentContent.length} chars`)

        const newContent = `${currentContent}\n\n*Updated by GitHub Action on ${new Date().toISOString()}*`


        await octokit.rest.repos.createOrUpdateFileContents({
            ...github.context.repo,
            path: readmePath,
            message: "chore: update README via Action",
            content: Buffer.from(newContent).toString("base64"),
            sha: fileData.sha
        })

        core.info("README.md updated successfully!")

        const time = new Date().toTimeString()
        core.setOutput("time", time)

    } catch (error) {
        core.setFailed((error as Error)?.message ?? "Unknown error")
    }
}

run()