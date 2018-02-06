import React from "react";
import PropTypes from "prop-types";
import warning from "warning";
import invariant from "invariant";
import { createLocation, locationsAreEqual } from "history";
import generatePath from "./generatePath";

/**
 * The public API for updating the location programmatically
 * with a component.
 */
class Redirect extends React.Component {
  static propTypes = {
    computedMatch: PropTypes.object, // private, from <Switch>
    push: PropTypes.bool,
    horizontal: PropTypes.bool,
    from: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
  };

  static defaultProps = {
    push: false
  };

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired
      }).isRequired,
      staticContext: PropTypes.object
    }).isRequired,
    horizontalRouter: PropTypes.shape({
      horizontalRouteId: PropTypes.number,
      prevPath: PropTypes.string
    })
  };

  isStatic() {
    return this.context.router && this.context.router.staticContext;
  }

  componentWillMount() {
    invariant(
      this.context.router,
      "You should not use <Redirect> outside a <Router>"
    );

    if (this.isStatic()) this.perform();
  }

  componentDidMount() {
    if (!this.isStatic()) this.perform();
  }

  componentDidUpdate(prevProps) {
    const prevTo = createLocation(prevProps.to);
    const nextTo = createLocation(this.props.to);

    if (locationsAreEqual(prevTo, nextTo)) {
      warning(
        false,
        `You tried to redirect to the same route you're currently on: ` +
          `"${nextTo.pathname}${nextTo.search}"`
      );
      return;
    }

    this.perform();
  }

  computeTo({ computedMatch, to }) {
    if (computedMatch) {
      if (typeof to === "string") {
        return generatePath(to, computedMatch.params);
      } else {
        return {
          ...to,
          pathname: generatePath(to.pathname, computedMatch.params)
        };
      }
    }

    return to;
  }

  perform() {
    const { history } = this.context.router;
    const { horizontalRouter } = this.context;
    const { push, horizontal } = this.props;
    let to = this.computeTo(this.props);

    warning(
      !(horizontal && !this.context.horizontalRouter),
      "Horizontal Redirect will not work outside a <HorizontalSwitch> component"
    );

    if (horizontalRouter && horizontal) {
      let action = "open";
      if (to === false) {
        to = horizontalRouter.prevPath;
        action = "close";
      }
      if (push) {
        history.push(to, {
          horizontalRoute: true,
          action: action,
          horizontalRouteId: horizontalRouter.horizontalRouteId
        });
      } else {
        history.replace(to, {
          horizontalRoute: true,
          action: action,
          horizontalRouteId: horizontalRouter.horizontalRouteId
        });
      }
    } else {
      if (push) {
        history.push(to);
      } else {
        history.replace(to);
      }
    }
  }

  render() {
    return null;
  }
}

export default Redirect;
