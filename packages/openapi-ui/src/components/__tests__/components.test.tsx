import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApiProvider } from "../../context/ApiProvider";
import { EndpointList } from "../EndpointList";
import { EndpointItem } from "../EndpointItem";
import { MethodBadge } from "../MethodBadge";
import { mockOpenApiSpec } from "../../test/mockData";

describe("MethodBadge", () => {
  it("should render method badge with correct text", () => {
    render(<MethodBadge method="get" />);
    expect(screen.getByText("GET")).toBeInTheDocument();
  });

  it("should render custom children", () => {
    render(<MethodBadge method="post">Custom Text</MethodBadge>);
    expect(screen.getByText("Custom Text")).toBeInTheDocument();
  });

  it("should apply className and data-method attribute", () => {
    render(<MethodBadge method="delete" className="custom-class" />);
    const element = screen.getByText("DELETE");
    expect(element).toHaveClass("custom-class");
    expect(element).toHaveAttribute("data-method", "delete");
  });
});

describe("EndpointItem", () => {
  const mockEndpoint = {
    id: "test-endpoint",
    method: "get" as const,
    path: "/test",
    summary: "Test endpoint",
    description: "A test endpoint",
    operationId: "testEndpoint",
    tags: ["test"],
    parameters: [],
    responses: [],
    deprecated: false,
  };

  it("should render endpoint with default renderers", () => {
    render(<EndpointItem endpoint={mockEndpoint} />);
    expect(screen.getByText("GET")).toBeInTheDocument();
    expect(screen.getByText("/test")).toBeInTheDocument();
    expect(screen.getByText("Test endpoint")).toBeInTheDocument();
  });

  it("should use custom render props", () => {
    render(
      <EndpointItem
        endpoint={mockEndpoint}
        renderMethod={(method) => <span>Method: {method}</span>}
        renderPath={(path) => <span>Path: {path}</span>}
        renderSummary={(summary) => <span>Summary: {summary}</span>}
      />
    );

    expect(screen.getByText("Method: get")).toBeInTheDocument();
    expect(screen.getByText("Path: /test")).toBeInTheDocument();
    expect(screen.getByText("Summary: Test endpoint")).toBeInTheDocument();
  });

  it("should apply className and data attributes", () => {
    const { container } = render(
      <EndpointItem endpoint={mockEndpoint} className="custom-endpoint" />
    );

    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass("custom-endpoint");
    expect(element).toHaveAttribute("data-method", "get");
    expect(element).toHaveAttribute("data-endpoint-id", "test-endpoint");
  });
});

describe("ApiProvider and EndpointList integration", () => {
  it("should render all endpoints from spec", () => {
    render(
      <ApiProvider spec={mockOpenApiSpec}>
        <EndpointList>
          {(endpoint) => (
            <div key={endpoint.id} data-testid="endpoint-item">
              {endpoint.summary}
            </div>
          )}
        </EndpointList>
      </ApiProvider>
    );

    const endpointItems = screen.getAllByTestId("endpoint-item");
    expect(endpointItems).toHaveLength(5); // Based on our mock spec
  });

  it("should filter endpoints correctly", () => {
    render(
      <ApiProvider spec={mockOpenApiSpec}>
        <EndpointList filter={(endpoint) => endpoint.method === "get"}>
          {(endpoint) => (
            <div key={endpoint.id} data-testid="get-endpoint">
              {endpoint.summary}
            </div>
          )}
        </EndpointList>
      </ApiProvider>
    );

    const getEndpoints = screen.getAllByTestId("get-endpoint");
    expect(getEndpoints).toHaveLength(3); // GET /users, GET /users/{id}, GET /posts
  });

  it("should group endpoints by tag", () => {
    render(
      <ApiProvider spec={mockOpenApiSpec}>
        <EndpointList
          groupBy="tag"
          renderGroup={(tagName, endpoints) => (
            <div key={tagName}>
              <h3 data-testid="tag-header">{tagName}</h3>
              {endpoints.map((endpoint) => (
                <div key={endpoint.id} data-testid={`${tagName}-endpoint`}>
                  {endpoint.summary}
                </div>
              ))}
            </div>
          )}
        />
      </ApiProvider>
    );

    expect(screen.getByText("users")).toBeInTheDocument();
    expect(screen.getByText("posts")).toBeInTheDocument();

    const userEndpoints = screen.getAllByTestId("users-endpoint");
    expect(userEndpoints).toHaveLength(4);

    const postEndpoints = screen.getAllByTestId("posts-endpoint");
    expect(postEndpoints).toHaveLength(1);
  });

  it("should handle empty endpoint list", () => {
    const emptySpec = {
      ...mockOpenApiSpec,
      paths: {},
    };

    const { container } = render(
      <ApiProvider spec={emptySpec}>
        <EndpointList>
          {(endpoint) => <div key={endpoint.id}>{endpoint.summary}</div>}
        </EndpointList>
      </ApiProvider>
    );

    // EndpointList returns null when there are no endpoints
    expect(container.firstChild).toBeNull();
  });
});
