const fs = require('fs');
const crypto = require('crypto');
const yaml = require('js-yaml');

module.exports = (app) => {
    app.log.info("GitHub Action and Secret Manager started!");

    app.on("installation.created", async (context) => {
        const repositories = context.payload.repositories;

        for (const repo of repositories) {
            await setupRepository(context, repo);
        }
    });

    app.on("installation_repositories.added", async (context) => {
        const repositories = context.payload.repositories_added;

        for (const repo of repositories) {
            await setupRepository(context, repo);
        }
    });

    app.on("repository_dispatch", async (context) => {
        if (context.payload.action === "setup_actions_and_secrets") {
            const repo = {
                name: context.payload.repository.name
            };
            await setupRepository(context, repo);

            await context.octokit.issues.create({
                owner: context.payload.repository.owner.login,
                repo: context.payload.repository.name,
                title: "GitHub Actions and Secrets Setup Completed",
                body: "The GitHub App has successfully configured actions and secrets for this repository."
            });
        }
    });

    async function setupRepository(context, repo) {
        const owner = context.payload.installation.account.login;
        const repoName = repo.name;

        app.log.info(`Setting up repository ${owner}/${repoName}`);

        try {
            await addWorkflow(context, owner, repoName);
            await addSecrets(context, owner, repoName);

            app.log.info(`Setup completed for ${owner}/${repoName}`);
        } catch (error) {
            app.log.error(`Error setting up ${owner}/${repoName}: ${error.message}`);
        }
    }

    async function addWorkflow(context, owner, repo) {
        const workflowPath = ".github/workflows/ci-pipeline.yml";
        const workflowContent = generateWorkflowFile();

        try {
            try {
                await context.octokit.repos.getContent({
                    owner,
                    repo,
                    path: workflowPath,
                });
                app.log.info(`Workflow file already exists in ${owner}/${repo}`);
                return;
            } catch (error) {
                if (error.status !== 404) throw error;
            }

            await context.octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: workflowPath,
                message: "Add CI workflow via GitHub App",
                content: Buffer.from(workflowContent).toString('base64'),
                branch: "main",
            });

            app.log.info(`Added workflow file to ${owner}/${repo}`);
        } catch (error) {
            app.log.error(`Error adding workflow: ${error.message}`);
            throw error;
        }
    }

    async function addSecrets(context, owner, repo) {
        try {
            const { data: pubKeyData } = await context.octokit.actions.getRepoPublicKey({
                owner,
                repo,
            });

            const secrets = {
                "API_TOKEN": "dummy-api-token-12345",
                "DATABASE_PASSWORD": "dummy-db-password-secure",
                "ENVIRONMENT": "production"
            };

            for (const [name, value] of Object.entries(secrets)) {
                const encryptedValue = encryptSecret(pubKeyData.key, value);

                await context.octokit.actions.createOrUpdateRepoSecret({
                    owner,
                    repo,
                    secret_name: name,
                    encrypted_value: encryptedValue,
                    key_id: pubKeyData.key_id,
                });

                app.log.info(`Added secret ${name} to ${owner}/${repo}`);
            }
        } catch (error) {
            app.log.error(`Error adding secrets: ${error.message}`);
            throw error;
        }
    }

    function encryptSecret(publicKey, secretValue) {
        const publicKeyBuffer = Buffer.from(publicKey, 'base64');
        const messageBytes = Buffer.from(secretValue);
        const encryptedBytes = crypto.publicEncrypt(
            {
                key: publicKeyBuffer,
                padding: crypto.constants.RSA_PKCS1_PADDING
            },
            messageBytes
        );

        return encryptedBytes.toString('base64');
    }

    function generateWorkflowFile() {
        const workflow = {
            name: "CI Pipeline",
            on: {
                push: {
                    branches: ["main"]
                },
                pull_request: {
                    branches: ["main"]
                }
            },
            jobs: {
                build: {
                    "runs-on": "ubuntu-latest",
                    steps: [
                        {
                            name: "Checkout code",
                            uses: "actions/checkout@v3"
                        },
                        {
                            name: "Set up Node.js",
                            uses: "actions/setup-node@v3",
                            with: {
                                "node-version": "16"
                            }
                        },
                        {
                            name: "Install dependencies",
                            run: "npm ci"
                        },
                        {
                            name: "Run tests",
                            run: "npm test",
                            env: {
                                "API_TOKEN": "${{ secrets.API_TOKEN }}",
                                "DATABASE_PASSWORD": "${{ secrets.DATABASE_PASSWORD }}",
                                "ENVIRONMENT": "${{ secrets.ENVIRONMENT }}"
                            }
                        }
                    ]
                }
            }
        };

        return yaml.dump(workflow);
    }
};
