import './grid.css';

/**
 * Fixed-width centered container.
 * Applies: .container
 */
export function Container({ children, className = '', style = {} }) {
    return (
        <div className={`container ${className}`} style={style}>
            {children}
        </div>
    );
}

/**
 * Full-width container.
 * Applies: .container-fluid
 */
export function ContainerFluid({ children, className = '', style = {} }) {
    return (
        <div className={`container-fluid ${className}`} style={style}>
            {children}
        </div>
    );
}

/**
 * Flex row with optional gutter class.
 * Applies: .row  +  any extra className you pass.
 *
 * Common extras:  g-0  g-2  g-3  g-4  g-5
 *                 align-items-center  justify-content-between  flex-nowrap
 *
 * Example:
 *   <Row className="g-3 align-items-center"> ... </Row>
 */
export function Row({ children, className = '', style = {} }) {
    return (
        <div className={`row ${className}`} style={style}>
            {children}
        </div>
    );
}

/**
 * Column — pass span classes via className.
 *
 * Examples:
 *   <Col className="col">          equal width
 *   <Col className="col-6">        half  (desktop)
 *   <Col className="col-12 col-md-6"> full → half at md
 *
 * Applies: any col-* class you provide.
 */
export function Col({ children, className = '', style = {} }) {
    return (
        <div className={className} style={style}>
            {children}
        </div>
    );
}
