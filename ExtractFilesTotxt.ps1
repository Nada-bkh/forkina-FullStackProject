# Script PowerShell pour extraire le contenu des fichiers spécifiés dans un fichier texte

# Définir le chemin de base du projet
$projectPath = "C:\Users\Admin\Downloads\pii\forkina-FullStackProject-NadaV2"

# Définir le chemin du fichier de sortie
$outputFile = "C:\Users\Admin\Downloads\pii\ExtractedFiles.txt"

# Liste des fichiers à extraire (relatifs au chemin de base)
$files = @(
    # Fichiers backend
    "backend\controllers\projectController.js",
    "backend\controllers\taskController.js",
    "backend\controllers\teamController.js",
    "backend\models\projectModel.js",
    "backend\models\taskModel.js",
    "backend\models\teamModel.js",
    "backend\routes\projectRoutes.js",
    "backend\routes\taskRoutes.js",
    "backend\routes\teamRoutes.js",
    # Fichiers API frontend
    "project\src\api\projectApi.js",
    "project\src\api\taskApi.js",
    "project\src\api\teamApi.js",
    # Fichiers frontend (ProjectDetails, ProjectsManagement, ProjectList pour les trois tableaux de bord)
    "project\src\pages\student\ProjectDetails.jsx",
    "project\src\pages\tutor\ProjectDetails.jsx",
    "project\src\pages\admin\ProjectsManagement.jsx",  # ProjectsManagement pour admin
    "project\src\pages\student\ProjectsList.jsx",
    "project\src\pages\tutor\ProjectsList.jsx",
    "project\src\pages\admin\ProjectsManagement.jsx"  # ProjectsManagement pour admin (liste des projets)
)

# Vider le fichier de sortie s'il existe déjà
if (Test-Path $outputFile) {
    Clear-Content $outputFile
}

# Parcourir chaque fichier et écrire son contenu dans le fichier de sortie
foreach ($file in $files) {
    $fullPath = Join-Path $projectPath $file
    
    # Vérifier si le fichier existe
    if (Test-Path $fullPath) {
        # Ajouter une ligne de séparation avec le nom du fichier
        Add-Content -Path $outputFile -Value "===== Fichier : $file ====="
        
        # Lire et écrire le contenu du fichier
        $content = Get-Content -Path $fullPath -Raw
        Add-Content -Path $outputFile -Value $content
        
        # Ajouter une ligne vide pour séparation
        Add-Content -Path $outputFile -Value "`n"
    }
    else {
        # Ajouter un message si le fichier n'existe pas
        Add-Content -Path $outputFile -Value "===== Fichier : $file ====="
        Add-Content -Path $outputFile -Value "Fichier non trouvé."
        Add-Content -Path $outputFile -Value "`n"
    }
}

Write-Host "Extraction terminée. Le contenu des fichiers a été écrit dans $outputFile"ss