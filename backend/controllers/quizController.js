const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');
const os = require('os');

exports.generateQuizFromRepo = async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) return res.status(400).json({ error: 'Repo URL is required' });

  const tempDir = path.join(os.tmpdir(), `repo-${Date.now()}`);

  try {
    // Clone du dépôt GitHub dans un dossier temporaire
    await simpleGit().clone(repoUrl, tempDir);

    // Lire les fichiers pertinents
    let allCode = '';
    const validExtensions = ['.js', '.ts', '.jsx', '.tsx'];

    async function readFilesRecursively(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await readFilesRecursively(fullPath);
        } else if (validExtensions.some(ext => entry.name.endsWith(ext))) {
          const content = await fs.readFile(fullPath, 'utf8');
          allCode += `\n// ${entry.name}\n` + content;
        }
      }
    }

    await readFilesRecursively(tempDir);

    // Limiter le contenu analysé (2000 tokens ≈ 4000 caractères)
    const limitedCode = allCode.substring(0, 4000);

    // Appel à OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://forkina.tn",
        "X-Title": "FORKINA Quiz"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{
          role: "user",
          content: `Voici un extrait du projet d'un étudiant :\n\n${limitedCode}\n\n
INSTRUCTIONS: Génère directement 5 questions QCM difficiles sur ce code, SANS TEXTE D'INTRODUCTION.
Respecte EXACTEMENT ce format pour chaque question:

1. [Question claire et précise sur la logique ou conception du code]
A. [Option 1]
B. [Option 2]
C. [Option 3]
D. [Option 4]
**Réponse correcte: [Lettre]**
[Explication détaillée]

2. [Question suivante...]

À propos des questions:
- Pose des questions qui testent la compréhension du code (bugs potentiels, effets des instructions, responsabilités d'un composant)
- Ne pose pas de questions simples ou de documentation
- Les questions doivent porter sur le comportement logique, choix de conception ou traitement métier
- Assure-toi que toutes les questions ont exactement 4 options
- Indique TOUJOURS la réponse correcte dans le format exact "**Réponse correcte: X**"
- Fournis une explication pour chaque réponse`
        }]
      })
    });

    const data = await response.json();
    const quiz = data.choices[0].message.content;

    res.json({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Une erreur est survenue lors de la génération du quiz." });
  } finally {
    await fs.remove(tempDir);
  }
};
