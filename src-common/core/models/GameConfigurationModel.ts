import { BaseModel } from '#src-common/core/models/BaseModel'

/**
 * @type {object} IGameConfiguration
 * @property {number} id - ID de la configuration du jeu
 * @property {'minimal' | 'recommended'} type - Type de configuration du jeu
 * @property {string} cpu - Processeur
 * @property {string} gpu - Carte graphique
 * @property {string} ram - Mémoire vive
 * @property {string} storage - Stockage
 * @property {string} os - Système d'exploitation
 * @property {boolean | null} internet - Le jeu nécessite une connexion internet ou non
 * @property {string | null} additional_notes - Notes supplémentaires
 */
export type IGameConfiguration = {
  id: number
  type: 'minimal' | 'recommended'
  cpu: string
  gpu: string
  ram: string
  storage: string
  os: string
  internet: boolean | null
  additional_notes: string | null
  created_at: string
  updated_at: string
}

/**
 * @class GameConfigurationModel
 * @augments BaseModel
 */
export default class GameConfigurationModel extends BaseModel implements IGameConfiguration {
  public id: number
  public type: 'minimal' | 'recommended'
  public cpu: string
  public gpu: string
  public ram: string
  public storage: string
  public os: string
  public internet: boolean | null
  public additional_notes: string | null

  /**
   * @class
   * @param {IGameConfiguration} gameConfiguration - La configuration du jeu à créer
   */
  constructor(gameConfiguration: IGameConfiguration) {
    super(gameConfiguration.created_at, gameConfiguration.updated_at)
    this.id = gameConfiguration.id
    this.type = gameConfiguration.type
    this.cpu = gameConfiguration.cpu
    this.gpu = gameConfiguration.gpu
    this.ram = gameConfiguration.ram
    this.storage = gameConfiguration.storage
    this.os = gameConfiguration.os
    this.internet = gameConfiguration.internet
    this.additional_notes = gameConfiguration.additional_notes
  }
}
