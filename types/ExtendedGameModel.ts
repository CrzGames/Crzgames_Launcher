import type GameModel from '@/common/core/models/GameModel'

/**
 * @interface ExtendedGameModel
 */
export interface ExtendedGameModel extends GameModel {
  isPaidAndNotOwned?: boolean
  isFreeAndNotOwned?: boolean
  isOwned?: boolean
}
