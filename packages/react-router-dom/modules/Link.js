import React from "react";
import PropTypes from "prop-types";
import invariant from "invariant";
import warning from "warning";
import { createLocation } from "history";

const isModifiedEvent = event =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

/**
 * The public API for rendering a history-aware <a>.
 */
class Link extends React.Component {
  static propTypes = {
    onClick: PropTypes.func,
    target: PropTypes.string,
    horizontal: PropTypes.bool,
    dontRenderComponent: PropTypes.bool,
    replace: PropTypes.bool,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    innerRef: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
  };

  static defaultProps = {
    replace: false
  };

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired,
        createHref: PropTypes.func.isRequired
      }).isRequired
    }).isRequired,
    horizontalRouter: PropTypes.shape({
      horizontalRouteId: PropTypes.number,
      prevPath: PropTypes.string
    })
  };

  handleClick = event => {
    if (this.props.onClick) this.props.onClick(event);

    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore everything but left clicks
      !this.props.target && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault();

      const { history } = this.context.router;
      const { horizontalRouter } = this.context;
      const { replace, horizontal } = this.props;
      let { to } = this.props;

      if (horizontalRouter && horizontal) {
        let action = "open";
        if (to === false) {
          to = this.context.horizontalRouter.prevPath;
          action = "close";
        }

        if (replace) {
          history.replace(to, {
            horizontalRoute: true,
            action: action,
            horizontalRouteId: this.context.horizontalRouter.horizontalRouteId
          });
        } else {
          history.push(to, {
            horizontalRoute: true,
            action: action,
            horizontalRouteId: this.context.horizontalRouter.horizontalRouteId
          });
        }
      } else {
        if (replace) {
          history.replace(to);
        } else {
          history.push(to);
        }
      }
    }
  };

  render() {
    const {
      replace,
      to,
      innerRef,
      horizontal,
      dontRenderComponent,
      children,
      ...props
    } = this.props; // eslint-disable-line no-unused-vars

    invariant(
      this.context.router,
      "You should not use <Link> outside a <Router>"
    );

    warning(
      !(horizontal && !this.context.horizontalRouter),
      "Horizontal Link will not work outside a <HorizontalSwitch> component"
    );

    invariant(to !== undefined, 'You must specify the "to" property');

    const { history } = this.context.router;
    const location =
      typeof to === "string"
        ? createLocation(to, null, null, history.location)
        : to;

    const href = history.createHref(location);
    if (React.isValidElement(this.props.children) && dontRenderComponent) {
      return (
        <children.type
          {...children.props}
          onClick={this.handleClick}
          href={href}
          ref={innerRef}
        />
      );
    }
    return (
      <a {...props} onClick={this.handleClick} href={href} ref={innerRef} />
    );
  }
}

export default Link;
