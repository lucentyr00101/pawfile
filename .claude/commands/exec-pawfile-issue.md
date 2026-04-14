Given the GitHub issue URL: $ARGUMENTS

Follow these steps exactly:

1. **Fetch the issue details** using the gh CLI:
   ```
   gh issue view <issue-number> --repo lucentyr00101/pawfile
   ```
   Extract the issue number from the URL provided.

2. **Find the linked branch** using:
   ```
   gh issue develop <issue-number> --repo lucentyr00101/pawfile --list
   ```

3. **Run git fetch** to update remote refs:
   ```
   git fetch
   ```

4. **Checkout the linked branch**:
   - If a linked branch exists in the remote, check it out:
     ```
     git checkout <branch-name>
     ```
   - If **no branch is available in the remote**, create a new branch based on `origin/develop` (not local `develop`):
     ```
     git checkout -b <branch-name> origin/develop
     ```
     Name the branch using the issue number and title slug (e.g. `38-create-delete-pet-api-route`).

5. **Read the issue description** thoroughly — understand the task, fields, requirements, and any constraints mentioned.

6. **Start planning the implementation** using the Plan agent (EnterPlanMode). Break down the work into concrete steps based on what the issue describes, referencing existing code in the repo for context and consistency (models, conventions, file structure, etc.).
