export enum MovementEffect {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
  /** The sign comes from the movement itself (a reversal undoes another one). */
  CALCULATED = 'CALCULATED',
}
