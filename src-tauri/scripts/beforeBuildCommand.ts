import { execSync } from 'child_process'
import process from 'node:process'

/**
 * Récupère la branche courante ou "main" si c'est un tag
 * @returns {string | undefined} La branche courante ou "main" si c'est un tag ou undefined si non trouvé
 */
const getBranchOrTag: () => string | undefined = (): string | undefined => {
  const { GITHUB_REF } = process.env

  if (GITHUB_REF) {
    // Sur GitHub Actions, GITHUB_REF ressemble souvent à "refs/heads/branchName" ou "refs/tags/xxx"
    const parts: string[] = GITHUB_REF.split('/')
    const refType: string = parts[1]

    if (refType === 'heads') {
      // ex: refs/heads/main => branch = main
      return parts[2]
    } else if (refType === 'tags') {
      // ex: refs/tags/v1.0 => on considère ici que c'est un "main" ou autre
      // à adapter selon ta logique
      return 'main'
    } else {
      console.error(`Unsupported ref type: ${refType}`)
      process.exit(1)
    }
  } else {
    // En local, on exécute git rev-parse pour récupérer la branche
    try {
      return execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    } catch (error) {
      console.error('Unable to determine local git branch:', error)
      process.exit(1)
    }
  }
}

/**
 * Exécute les commandes npm en fonction de la branche courante
 * @returns {void}
 */
const runCommandsNpm: () => void = (): void => {
  const branch: string | undefined = getBranchOrTag()

  if (!branch) {
    console.error('Branch not found')
    process.exit(1)
  }

  console.log(`Current branch or tag: ${branch}`)

  if (branch === 'main') {
    execSync('npm run web:build:static:prod', { stdio: 'inherit' })
  } else if (branch === 'staging') {
    execSync('npm run web:build:static:staging', { stdio: 'inherit' })
  } else {
    // Pour tout autre branche (feat/*, dev, etc.) => build:static:dev
    execSync('npm run web:build:static:dev', { stdio: 'inherit' })
  }
}

runCommandsNpm()
