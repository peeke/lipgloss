import { Transition } from '../../../../src/index';

export const listenOnce = (target, event, fn) => {
  const _fn = function() {
    fn.apply(null, arguments);
    target.removeEventListener(event, _fn);
  };
  return target.addEventListener(event, _fn);
};

/**
 * Extended Transition
 */
export class AnimationTransition extends Transition {

    /**
     *
     */
    async exit() {
        super.exit();
        await new Promise(resolve => listenOnce(this._view, 'animationend', resolve));
    }

    /**
     *
     * @param {String} html - HTML to load in the view
     */
    async enter(node) {
        super.enter(node);
        await new Promise(resolve => listenOnce(this._view, 'animationend', resolve));
    }

}

export default AnimationTransition;
