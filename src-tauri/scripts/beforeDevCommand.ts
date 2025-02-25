import { execSync } from 'child_process'

/**
 * On exécute successivement la commande de build statique dev, puis le run dev
 * Changer les commandes si besoin pour un nouvelle environnement : dev, prod, etc.
 */
const runCommandsNpm: () => void = (): void => {
  execSync('npm run web:build:static:develop', { stdio: 'inherit' })
  execSync('npm run web:run:dev', { stdio: 'inherit' })
}

runCommandsNpm()
