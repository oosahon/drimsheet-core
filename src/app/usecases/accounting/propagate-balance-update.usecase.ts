export default function makePropagateBalanceUpdateUseCase() {
  /**
   * When a sub account balance is updated:
   *    - receive the balance adjustment payload
   *    - if a control account exists on the affected account:
   *       - adjust the control account with the delta amount
   *       - trigger an event that balance has been updated
   *    - if no control account exists on the affected account:
   *       - do nothing
   */
}
