import warning from "warning";
import invariant from "invariant";
import React from "react";
import PropTypes from "prop-types";

/**
 * The public API for putting history on context.
 */
class Router extends React.Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    children: PropTypes.node
  };

  static contextTypes = {
    router: PropTypes.object
  };

  static childContextTypes = {
    router: PropTypes.object.isRequired,
    horizontalRouter: PropTypes.object
  };

  getChildContext() {
    let context = {
      router: {
        ...this.context.router,
        history: this.props.history,
        route: {
          location: this.props.history.location,
          match: this.state.match
        }
      }
    };
    if (this.state.horizontalRoute) {
      context["horizontalRouter"] = {
        horizontalRouteId: this.state.horizontalRouteId,
        action: this.state.action
      };
    }
    return context;
  }

  state = {
    match: this.computeMatch(this.props.history.location.pathname),
    horizontalRoute: false,
    horizontalRouteId: undefined,
    action: undefined
  };

  computeMatch(pathname) {
    return {
      path: "/",
      url: "/",
      params: {},
      isExact: pathname === "/"
    };
  }

  componentWillMount() {
    const { children, history } = this.props;

    invariant(
      children == null || React.Children.count(children) === 1,
      "A <Router> may have only one child element"
    );

    // Do this here so we can setState when a <Redirect> changes the
    // location in componentWillMount. This happens e.g. when doing
    // server rendering using a <StaticRouter>.
    this.unlisten = history.listen(location => {
      if (location.state && location.state.horizontalRoute) {
        this.setState({
          match: this.computeMatch(history.location.pathname),
          horizontalRoute: true,
          horizontalRouteId: location.state.horizontalRouteId,
          action: location.state.action
        });
      } else {
        this.setState({
          match: this.computeMatch(history.location.pathname),
          horizontalRoute: false,
          horizontalRouteId: undefined,
          action: undefined
        });
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    warning(
      this.props.history === nextProps.history,
      "You cannot change <Router history>"
    );
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const { children } = this.props;
    return children ? React.Children.only(children) : null;
  }
}

export default Router;
