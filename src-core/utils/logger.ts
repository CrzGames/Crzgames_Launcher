/**
 * Options de configuration du logger
 * @type {object}
 * @property {boolean} enabled - Si le logger est activé ou non
 * @property {string} level - Niveau minimum pour afficher les logs
 * @property {string} [context] - Contexte optionnel (ex. : "DownloadManager")
 */
type LoggerOptions = {
  enabled: boolean
  level: 'debug' | 'info' | 'warn' | 'error'
  context?: string
}

/**
 * Classe Logger pour gérer les logs avec différents niveaux et environnements
 */
class Logger {
  /**
   * Options de configuration du logger
   * @type {LoggerOptions}
   */
  private readonly options: LoggerOptions

  /**
   * Niveaux de log avec leur ordre de priorité
   * @type {Record<string, number>}
   */
  private readonly logLevels: Record<string, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  /**
   * Constructeur du logger
   * @param {Partial<LoggerOptions>} options - Options personnalisées pour le logger
   */
  constructor(options: Partial<LoggerOptions> = {}) {
    const env: string = import.meta.env.VITE_NODE_ENV

    // Configuration par défaut selon l'environnement
    this.options = {
      enabled: env === 'development' || env === 'staging', // Activé par défaut en dev/staging
      level: env === 'production' ? 'error' : 'debug', // Seulement erreurs en prod, tout en dev/staging
      ...options, // Override avec les options passées
    }
  }

  /**
   * Vérifie si un niveau de log est autorisé selon la configuration actuelle
   * @param {string} level - Niveau de log à vérifier
   * @returns {boolean} - Si le log doit être affiché
   */
  private isLogLevelAllowed(level: string): boolean {
    // Si le logger est désactivé, aucun log n'est affiché
    if (!this.options.enabled) return false
    // Compare la priorité du niveau demandé avec le niveau minimum configuré
    return this.logLevels[level] >= this.logLevels[this.options.level]
  }

  /**
   * Formate le message avec un timestamp et un contexte optionnel
   * @param {string} level - Niveau du log
   * @param {string} message - Message à logger
   * @returns {string} - Message formaté
   */
  private formatMessage(level: string, message: string): string {
    // Ajoute le timestamp actuel
    const timestamp: string = new Date().toISOString()
    // Ajoute le contexte s'il est défini
    const context: string = this.options.context ? `[${this.options.context}] ` : ''
    // Retourne le message formaté
    return `${timestamp} [${level.toUpperCase()}] ${context}${message}`
  }

  /**
   * Log un message au niveau "debug"
   * @param {string} message - Message à logger
   */
  public debug(message: string): void {
    // Vérifie si le niveau "debug" est autorisé
    if (this.isLogLevelAllowed('debug')) {
      // Affiche le message dans la console avec une couleur grise
      console.log(`%c${this.formatMessage('debug', message)}`, 'color: #888')
    }
  }

  /**
   * Log un message au niveau "info"
   * @param {string} message - Message à logger
   */
  public info(message: string): void {
    // Vérifie si le niveau "info" est autorisé
    if (this.isLogLevelAllowed('info')) {
      // Affiche le message dans la console avec une couleur bleue
      console.info(`%c${this.formatMessage('info', message)}`, 'color: #00f')
    }
  }

  /**
   * Log un message au niveau "warn"
   * @param {string} message - Message à logger
   */
  public warn(message: string): void {
    // Vérifie si le niveau "warn" est autorisé
    if (this.isLogLevelAllowed('warn')) {
      // Affiche le message dans la console avec une couleur jaune
      console.warn(`%c${this.formatMessage('warn', message)}`, 'color: #ff0')
    }
  }

  /**
   * Log un message au niveau "error"
   * @param {string} message - Message à logger
   * @param {Error} [error] - Erreur optionnelle à logger
   */
  public error(message: string, error?: Error): void {
    // Vérifie si le niveau "error" est autorisé
    if (this.isLogLevelAllowed('error')) {
      // Affiche le message dans la console avec une couleur rouge
      console.error(`%c${this.formatMessage('error', message)}`, 'color: #f00')
      // Si une erreur est fournie, affiche également sa stack trace
      if (error) console.error(error.stack)
    }
  }
}

/**
 * Crée une instance de Logger avec un contexte spécifique
 * @param {string} context - Contexte pour identifier la source des logs
 * @returns {Logger} - Instance du logger configurée
 */
export const createLogger: (context: string) => Logger = (context: string): Logger => {
  // Retourne une nouvelle instance avec le contexte spécifié
  return new Logger({ context })
}

// Instance par défaut sans contexte spécifique
export const logger: Logger = new Logger()
