import { EndpointItemProps } from "../types";

/**
 * Headless component for rendering a single endpoint item
 * Provides default structure but allows complete customization via render props
 */
export function EndpointItem({
  endpoint,
  children,
  renderMethod,
  renderPath,
  renderSummary,
  className,
  style,
  ...props
}: EndpointItemProps) {
  return (
    <div
      className={className}
      style={style}
      data-method={endpoint.method}
      data-endpoint-id={endpoint.id}
      {...props}
    >
      {renderMethod ? (
        renderMethod(endpoint.method)
      ) : (
        <span>{endpoint.method.toUpperCase()}</span>
      )}

      {renderPath ? renderPath(endpoint.path) : <span>{endpoint.path}</span>}

      {renderSummary
        ? renderSummary(endpoint.summary)
        : endpoint.summary && <span>{endpoint.summary}</span>}

      {children}
    </div>
  );
}
