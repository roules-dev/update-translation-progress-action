# Update Translation Progress action
- runs a script that reads locales files and displays the translation progress in the readme file


## Inputs
### `gh-token`
**Required** The GitHub token for authentication.
### `readme-path`
The path to the README file to update.
> Default: `README.md`
### `locales-dir`
The directory where locale files are stored.
> Default: `locales` (relative to the repository root)
### `reference-locale`
The reference locale to compare against (e.g., "en").
> Default: `en-US`


## Usage
### Example workflow
```yaml
on:
  push:
    branches:
      - main

jobs:
  update-translations-progress:
    name: Display translations progress inside readme.md
    runs-on: ubuntu-latest

    steps:
      - name: update translations step
        id: hello
        uses: roules-dev/update-translation-progress-action@main
        with:
          gh-token: ${{ secrets.GITHUB_TOKEN }}
          readme-path: readme.md

```
### Set up
#### Pre-requisites
Your repository must have the following files:
- A markdown file where the translations progress will be displayed. (e.g., `./README.md`)
- A directory where locale files are stored. (e.g., `./locales`)
    - A JSON file for each locale. (e.g., `./locales/en-US.json`) (note: for the best results, use `RFC 5646` locale codes)


> [!IMPORTANT]
> This action will only work if the locale files have a structure like the following:
> ```json
> {
>     "key1": "value1",
>     "key2": "value2",
>     "someGroup": {
>         "key4": "value3",
>     }
> }
> ```
> you can have as many levels of nesting as you like, but you cannot have arrays, and the values must be strings.

#### Configuration

> [!IMPORTANT]
> Make sure to have the paths to the readme file and the locales JSON files set up correctly in the action inputs.

After setting up the action in your repository, edit the readme file by adding the following comments:
```md
<!-- Translations - START -->
<!-- Translations - END -->
```
wherever you want the translations progress to be displayed.
I suggest also adding a comment like : `<!-- DO NOT EDIT - update translation progress action marker -->` befor the markers, to warn users that this section should not be edited manually.


## Example output
| 🇺🇸 English (United States) | 🇫🇷 French (France) | 🇪🇸 Spanish (Spain) | 🇩🇪 German | 🇧🇷 Portuguese (Brazil) | 🇪🇸 Spanish (Latin America) |
| --- | --- | --- | --- | --- | --- |
| 100% | 81% | 77% | 49% | 20% | 38% |

## Example output :
