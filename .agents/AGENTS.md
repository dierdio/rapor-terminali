# Git Workflow Rule
- **Auto-Push**: Whenever you make modifications, additions, or deletions to the codebase in this workspace, you MUST automatically commit and push the changes to the remote repository (https://github.com/dierdio/rapor-terminali) at the end of your task. 
- Do not ask the user for permission to push; do it automatically.
- Use standard commands: `git add .`, `git commit -m "<brief description of changes>"`, and `git push`.

# Version Bumping Rule
- **Auto-Increment Version**: Whenever you make updates to the codebase (especially CSS or JS changes), you MUST automatically increment the application's version number in the relevant HTML files before committing your changes.
- Locate the version parameter in the script tags (e.g., `app.js?v=1.1.0`) and the visual version label at the bottom right corner (e.g., `v1.1.0`).
- Increment the patch version (the last digit) by 1 (e.g., `1.1.0` -> `1.1.1`).
- Ensure the incremented version matches in both the cache-busting script URL and the visual text element.
