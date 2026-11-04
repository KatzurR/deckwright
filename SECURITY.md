# Security policy

## Scope

Deckwright is a static web app that runs entirely in your browser:

- there is **no server, no backend and no user account**; the app does not send data anywhere at runtime;
- decks and preferences are stored only in the browser (IndexedDB, localStorage);
- the development and preview servers listen on `localhost` only;
- the data pipeline (`npm run pipeline`) is a developer tool that downloads data from the Open5e API and the official SRD PDFs (verified with SHA-256 checksums); it is not part of the app.

Relevant issues are, for example, code execution through an imported deck file, unsafe handling of user content in rendering or export, problems in the build or the CI workflows, or vulnerable dependencies that affect the shipped app.

## Supported versions

Deckwright has no releases yet. Security fixes go into the `main` branch.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Report them privately through GitHub's private vulnerability reporting:

1. Open the [Security tab](https://github.com/KatzurR/deckwright/security) of the repository.
2. Choose **Report a vulnerability** (direct link: https://github.com/KatzurR/deckwright/security/advisories/new).

Please include the affected version or commit, the browser, the steps to reproduce (for example a minimal deck file) and the impact you expect. The discussion then continues privately in the advisory. Deckwright is a volunteer project, so please allow some time for a reply; the fix is published together with the advisory.
