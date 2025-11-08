import { useEndpoints } from "../hooks/useEndpoints";
import { NormalizedEndpoint, EndpointListProps } from "../types";
import { groupEndpointsByTag } from "../parsing/parseOpenApi";

/**
 * Headless component for rendering a list of endpoints
 * Supports filtering, grouping, and custom render functions
 */
export function EndpointList({
  endpoints: externalEndpoints,
  filter,
  groupBy,
  children,
  renderGroup,
  className,
  style,
  ...props
}: EndpointListProps) {
  // Use provided endpoints or fetch from context
  const contextEndpoints = useEndpoints({ filter });
  const endpoints = externalEndpoints || contextEndpoints;

  if (!endpoints.length) {
    return null;
  }

  // Handle grouping
  if (groupBy === "tag") {
    const groups = groupEndpointsByTag(endpoints);

    return (
      <div className={className} style={style} {...props}>
        {Object.entries(groups).map(([tagName, tagEndpoints]) => {
          if (renderGroup) {
            return renderGroup(tagName, tagEndpoints);
          }

          return (
            <div key={tagName}>
              <h3>{tagName}</h3>
              {tagEndpoints.map((endpoint, index) => (
                <div key={endpoint.id}>{children?.(endpoint, index)}</div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  if (groupBy === "method") {
    const methodGroups = endpoints.reduce((groups, endpoint) => {
      const method = endpoint.method.toUpperCase();
      if (!groups[method]) {
        groups[method] = [];
      }
      groups[method].push(endpoint);
      return groups;
    }, {} as Record<string, NormalizedEndpoint[]>);

    return (
      <div className={className} style={style} {...props}>
        {Object.entries(methodGroups).map(([method, methodEndpoints]) => {
          if (renderGroup) {
            return renderGroup(method, methodEndpoints);
          }

          return (
            <div key={method}>
              <h3>{method}</h3>
              {methodEndpoints.map((endpoint, index) => (
                <div key={endpoint.id}>{children?.(endpoint, index)}</div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // Default: no grouping
  return (
    <div className={className} style={style} {...props}>
      {endpoints.map((endpoint, index) => (
        <div key={endpoint.id}>{children?.(endpoint, index)}</div>
      ))}
    </div>
  );
}
