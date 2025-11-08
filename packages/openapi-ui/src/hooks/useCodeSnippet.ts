import { useState, useCallback, useMemo } from "react";
import { NormalizedEndpoint } from "../types";
import { useApiSpec } from "./useApiSpec";
import { findEndpointById } from "../parsing/parseOpenApi";

export interface CodeSnippetLanguage {
  id: string;
  name: string;
  extension: string;
}

export interface CodeSnippetOptions {
  /** Target language for code generation */
  language:
    | "curl"
    | "javascript"
    | "typescript"
    | "python"
    | "node"
    | "php"
    | "java"
    | "go";
  /** Include authentication headers/setup */
  includeAuth?: boolean;
  /** Authentication configuration */
  auth?: {
    type: "apiKey" | "bearer" | "basic" | "oauth2";
    apiKey?: { name: string; value: string; in: "header" | "query" };
    bearer?: { token: string };
    basic?: { username: string; password: string };
    oauth2?: { token: string };
  };
  /** Request parameters to include */
  parameters?: {
    pathParams?: Record<string, any>;
    queryParams?: Record<string, any>;
    headers?: Record<string, string>;
    body?: any;
  };
  /** Custom server URL override */
  serverUrl?: string;
  /** Pretty format output */
  formatted?: boolean;
}

export interface CodeSnippetResult {
  code: string;
  language: CodeSnippetLanguage;
  description?: string;
}

/**
 * Hook for generating code snippets for API operations
 */
export function useCodeSnippet() {
  const spec = useApiSpec();
  const [lastGenerated, setLastGenerated] = useState<CodeSnippetResult | null>(
    null
  );

  const availableLanguages: CodeSnippetLanguage[] = useMemo(
    () => [
      { id: "curl", name: "cURL", extension: "sh" },
      { id: "javascript", name: "JavaScript (fetch)", extension: "js" },
      { id: "typescript", name: "TypeScript (fetch)", extension: "ts" },
      { id: "python", name: "Python (requests)", extension: "py" },
      { id: "node", name: "Node.js (axios)", extension: "js" },
      { id: "php", name: "PHP (cURL)", extension: "php" },
      { id: "java", name: "Java (OkHttp)", extension: "java" },
      { id: "go", name: "Go (net/http)", extension: "go" },
    ],
    []
  );

  const getBaseUrl = useCallback(
    (serverUrl?: string): string => {
      if (serverUrl) return serverUrl;
      if (spec?.servers && spec.servers.length > 0) {
        return spec.servers[0].url;
      }
      return "https://api.example.com";
    },
    [spec?.servers]
  );

  const buildUrl = useCallback(
    (endpoint: NormalizedEndpoint, options: CodeSnippetOptions): string => {
      const baseUrl = getBaseUrl(options.serverUrl);
      let path = endpoint.path;

      // Replace path parameters
      if (options.parameters?.pathParams) {
        Object.entries(options.parameters.pathParams).forEach(
          ([key, value]) => {
            path = path.replace(`{${key}}`, String(value));
          }
        );
      }

      // Add query parameters
      const url = new URL(path, baseUrl);
      if (options.parameters?.queryParams) {
        Object.entries(options.parameters.queryParams).forEach(
          ([key, value]) => {
            if (value !== undefined && value !== null) {
              url.searchParams.set(key, String(value));
            }
          }
        );
      }

      return url.toString();
    },
    [getBaseUrl]
  );

  const generateAuthHeaders = useCallback(
    (auth?: CodeSnippetOptions["auth"]): Record<string, string> => {
      if (!auth) return {};

      const headers: Record<string, string> = {};

      switch (auth.type) {
        case "apiKey":
          if (auth.apiKey?.in === "header") {
            headers[auth.apiKey.name] = auth.apiKey.value;
          }
          break;
        case "bearer":
          if (auth.bearer?.token) {
            headers["Authorization"] = `Bearer ${auth.bearer.token}`;
          }
          break;
        case "basic":
          if (auth.basic?.username && auth.basic?.password) {
            const credentials = btoa(
              `${auth.basic.username}:${auth.basic.password}`
            );
            headers["Authorization"] = `Basic ${credentials}`;
          }
          break;
        case "oauth2":
          if (auth.oauth2?.token) {
            headers["Authorization"] = `Bearer ${auth.oauth2.token}`;
          }
          break;
      }

      return headers;
    },
    []
  );

  const generateCurl = useCallback(
    (endpoint: NormalizedEndpoint, options: CodeSnippetOptions): string => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toUpperCase();
      const authHeaders = options.includeAuth
        ? generateAuthHeaders(options.auth)
        : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };

      let curl = `curl -X ${method}`;

      // Add headers
      Object.entries(allHeaders).forEach(([key, value]) => {
        curl += ` \\\n  -H "${key}: ${value}"`;
      });

      // Add body for POST/PUT/PATCH requests
      if (
        options.parameters?.body &&
        ["POST", "PUT", "PATCH"].includes(method)
      ) {
        const bodyStr =
          typeof options.parameters.body === "string"
            ? options.parameters.body
            : JSON.stringify(options.parameters.body, null, 2);

        curl += ` \\\n  -H "Content-Type: application/json"`;
        curl += ` \\\n  -d '${bodyStr}'`;
      }

      // Add API key as query param if needed
      if (
        options.includeAuth &&
        options.auth?.type === "apiKey" &&
        options.auth.apiKey?.in === "query"
      ) {
        const separator = url.includes("?") ? "&" : "?";
        curl += ` \\\n  "${url}${separator}${options.auth.apiKey.name}=${options.auth.apiKey.value}"`;
      } else {
        curl += ` \\\n  "${url}"`;
      }

      return curl;
    },
    [buildUrl, generateAuthHeaders]
  );

  const generateJavaScript = useCallback(
    (
      endpoint: NormalizedEndpoint,
      options: CodeSnippetOptions,
      isTypeScript = false
    ): string => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toUpperCase();
      const authHeaders = options.includeAuth
        ? generateAuthHeaders(options.auth)
        : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };

      const hasBody =
        options.parameters?.body && ["POST", "PUT", "PATCH"].includes(method);
      if (hasBody) {
        allHeaders["Content-Type"] = "application/json";
      }

      let code = `// ${endpoint.summary || "API Request"}\n`;

      if (isTypeScript) {
        code += `interface ApiResponse {\n  // Define your response type here\n  [key: string]: any;\n}\n\n`;
      }

      code += `const response`;
      if (isTypeScript) code += `: Response`;
      code += ` = await fetch('${url}', {\n`;
      code += `  method: '${method}',\n`;

      if (Object.keys(allHeaders).length > 0) {
        code += `  headers: {\n`;
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `    '${key}': '${value}',\n`;
        });
        code += `  },\n`;
      }

      if (hasBody && options.parameters?.body) {
        const bodyStr =
          typeof options.parameters.body === "string"
            ? `'${options.parameters.body}'`
            : JSON.stringify(options.parameters.body, null, 4)
                .split("\n")
                .join("\n  ");
        code += `  body: JSON.stringify(${bodyStr}),\n`;
      }

      code += `});\n\n`;
      code += `if (!response.ok) {\n`;
      code += `  throw new Error(\`HTTP error! status: \${response.status}\`);\n`;
      code += `}\n\n`;
      code += `const data`;
      if (isTypeScript) code += `: ApiResponse`;
      code += ` = await response.json();\n`;
      code += `console.log(data);`;

      return code;
    },
    [buildUrl, generateAuthHeaders]
  );

  const generatePython = useCallback(
    (endpoint: NormalizedEndpoint, options: CodeSnippetOptions): string => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toLowerCase();
      const authHeaders = options.includeAuth
        ? generateAuthHeaders(options.auth)
        : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };

      let code = `import requests\nimport json\n\n`;
      code += `# ${endpoint.summary || "API Request"}\n`;
      code += `url = "${url}"\n`;

      if (Object.keys(allHeaders).length > 0) {
        code += `headers = {\n`;
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `    "${key}": "${value}",\n`;
        });
        code += `}\n`;
      }

      const hasBody =
        options.parameters?.body && ["post", "put", "patch"].includes(method);
      if (hasBody && options.parameters?.body) {
        const bodyStr =
          typeof options.parameters.body === "string"
            ? options.parameters.body
            : JSON.stringify(options.parameters.body, null, 2);
        code += `\ndata = ${
          bodyStr.includes("{") ? bodyStr : `"${bodyStr}"`
        }\n`;
      }

      code += `\nresponse = requests.${method}(url`;
      if (Object.keys(allHeaders).length > 0) {
        code += `, headers=headers`;
      }
      if (hasBody) {
        code += `, json=data if isinstance(data, dict) else data`;
      }
      code += `)\n\n`;
      code += `response.raise_for_status()  # Raises an HTTPError for bad responses\n`;
      code += `result = response.json()\n`;
      code += `print(result)`;

      return code;
    },
    [buildUrl, generateAuthHeaders]
  );

  const generateNode = useCallback(
    (endpoint: NormalizedEndpoint, options: CodeSnippetOptions): string => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toLowerCase();
      const authHeaders = options.includeAuth
        ? generateAuthHeaders(options.auth)
        : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };

      let code = `const axios = require('axios');\n\n`;
      code += `// ${endpoint.summary || "API Request"}\n`;
      code += `const config = {\n`;
      code += `  method: '${method}',\n`;
      code += `  url: '${url}',\n`;

      if (Object.keys(allHeaders).length > 0) {
        code += `  headers: {\n`;
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `    '${key}': '${value}',\n`;
        });
        code += `  },\n`;
      }

      const hasBody =
        options.parameters?.body && ["post", "put", "patch"].includes(method);
      if (hasBody && options.parameters?.body) {
        const bodyStr =
          typeof options.parameters.body === "string"
            ? `'${options.parameters.body}'`
            : JSON.stringify(options.parameters.body, null, 2);
        code += `  data: ${bodyStr},\n`;
      }

      code += `};\n\n`;
      code += `axios(config)\n`;
      code += `  .then(response => {\n`;
      code += `    console.log(response.data);\n`;
      code += `  })\n`;
      code += `  .catch(error => {\n`;
      code += `    console.error('Error:', error.response?.data || error.message);\n`;
      code += `  });`;

      return code;
    },
    [buildUrl, generateAuthHeaders]
  );

  const generatePhp = useCallback(
    (endpoint: NormalizedEndpoint, options: CodeSnippetOptions): string => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toUpperCase();
      const authHeaders = options.includeAuth
        ? generateAuthHeaders(options.auth)
        : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };

      let code = `<?php\n\n`;
      code += `// ${endpoint.summary || "API Request"}\n`;
      code += `$url = "${url}";\n`;

      const hasBody =
        options.parameters?.body && ["POST", "PUT", "PATCH"].includes(method);

      code += `$curl = curl_init();\n\n`;
      code += `curl_setopt_array($curl, [\n`;
      code += `    CURLOPT_URL => $url,\n`;
      code += `    CURLOPT_RETURNTRANSFER => true,\n`;
      code += `    CURLOPT_CUSTOMREQUEST => "${method}",\n`;

      if (Object.keys(allHeaders).length > 0 || hasBody) {
        code += `    CURLOPT_HTTPHEADER => [\n`;
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `        "${key}: ${value}",\n`;
        });
        if (hasBody) {
          code += `        "Content-Type: application/json",\n`;
        }
        code += `    ],\n`;
      }

      if (hasBody && options.parameters?.body) {
        const bodyStr =
          typeof options.parameters.body === "string"
            ? options.parameters.body
            : JSON.stringify(options.parameters.body);
        code += `    CURLOPT_POSTFIELDS => '${bodyStr}',\n`;
      }

      code += `]);\n\n`;
      code += `$response = curl_exec($curl);\n`;
      code += `$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);\n`;
      code += `curl_close($curl);\n\n`;
      code += `if ($httpCode >= 200 && $httpCode < 300) {\n`;
      code += `    $data = json_decode($response, true);\n`;
      code += `    print_r($data);\n`;
      code += `} else {\n`;
      code += `    echo "HTTP Error: $httpCode\\n";\n`;
      code += `    echo $response;\n`;
      code += `}`;

      return code;
    },
    [buildUrl, generateAuthHeaders]
  );

  const generateJava = useCallback(
    (endpoint: NormalizedEndpoint, options: CodeSnippetOptions): string => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toUpperCase();
      const authHeaders = options.includeAuth
        ? generateAuthHeaders(options.auth)
        : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };

      let code = `import okhttp3.*;\nimport java.io.IOException;\n\n`;
      code += `public class ApiClient {\n`;
      code += `    public static void main(String[] args) throws IOException {\n`;
      code += `        OkHttpClient client = new OkHttpClient();\n\n`;

      const hasBody =
        options.parameters?.body && ["POST", "PUT", "PATCH"].includes(method);

      if (hasBody && options.parameters?.body) {
        const bodyStr =
          typeof options.parameters.body === "string"
            ? options.parameters.body
            : JSON.stringify(options.parameters.body);
        code += `        RequestBody body = RequestBody.create(\n`;
        code += `            "${bodyStr}",\n`;
        code += `            MediaType.parse("application/json")\n`;
        code += `        );\n\n`;
      }

      code += `        Request.Builder requestBuilder = new Request.Builder()\n`;
      code += `            .url("${url}")\n`;
      code += `            .method("${method}", ${
        hasBody ? "body" : "null"
      });\n\n`;

      if (Object.keys(allHeaders).length > 0) {
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `        requestBuilder.addHeader("${key}", "${value}");\n`;
        });
        code += `\n`;
      }

      code += `        Request request = requestBuilder.build();\n`;
      code += `        Response response = client.newCall(request).execute();\n\n`;
      code += `        if (response.isSuccessful()) {\n`;
      code += `            System.out.println(response.body().string());\n`;
      code += `        } else {\n`;
      code += `            System.err.println("HTTP Error: " + response.code());\n`;
      code += `            System.err.println(response.body().string());\n`;
      code += `        }\n`;
      code += `    }\n`;
      code += `}`;

      return code;
    },
    [buildUrl, generateAuthHeaders]
  );

  const generateGo = useCallback(
    (endpoint: NormalizedEndpoint, options: CodeSnippetOptions): string => {
      const url = buildUrl(endpoint, options);
      const method = endpoint.method.toUpperCase();
      const authHeaders = options.includeAuth
        ? generateAuthHeaders(options.auth)
        : {};
      const customHeaders = options.parameters?.headers || {};
      const allHeaders = { ...authHeaders, ...customHeaders };

      let code = `package main\n\n`;
      code += `import (\n`;
      code += `    "bytes"\n`;
      code += `    "fmt"\n`;
      code += `    "io"\n`;
      code += `    "net/http"\n`;
      if (
        options.parameters?.body &&
        typeof options.parameters.body === "object"
      ) {
        code += `    "encoding/json"\n`;
      }
      code += `)\n\n`;

      code += `func main() {\n`;

      const hasBody =
        options.parameters?.body && ["POST", "PUT", "PATCH"].includes(method);
      if (hasBody && options.parameters?.body) {
        if (typeof options.parameters.body === "object") {
          code += `    data := map[string]interface{}${JSON.stringify(
            options.parameters.body,
            null,
            4
          ).replace(/"/g, "`")}\n`;
          code += `    jsonData, _ := json.Marshal(data)\n`;
          code += `    req, err := http.NewRequest("${method}", "${url}", bytes.NewBuffer(jsonData))\n`;
        } else {
          code += `    body := []byte(\`${options.parameters.body}\`)\n`;
          code += `    req, err := http.NewRequest("${method}", "${url}", bytes.NewBuffer(body))\n`;
        }
      } else {
        code += `    req, err := http.NewRequest("${method}", "${url}", nil)\n`;
      }

      code += `    if err != nil {\n`;
      code += `        panic(err)\n`;
      code += `    }\n\n`;

      if (Object.keys(allHeaders).length > 0 || hasBody) {
        Object.entries(allHeaders).forEach(([key, value]) => {
          code += `    req.Header.Set("${key}", "${value}")\n`;
        });
        if (hasBody) {
          code += `    req.Header.Set("Content-Type", "application/json")\n`;
        }
        code += `\n`;
      }

      code += `    client := &http.Client{}\n`;
      code += `    resp, err := client.Do(req)\n`;
      code += `    if err != nil {\n`;
      code += `        panic(err)\n`;
      code += `    }\n`;
      code += `    defer resp.Body.Close()\n\n`;
      code += `    body, err := io.ReadAll(resp.Body)\n`;
      code += `    if err != nil {\n`;
      code += `        panic(err)\n`;
      code += `    }\n\n`;
      code += `    fmt.Printf("Status: %s\\n", resp.Status)\n`;
      code += `    fmt.Printf("Response: %s\\n", string(body))\n`;
      code += `}`;

      return code;
    },
    [buildUrl, generateAuthHeaders]
  );

  const generateForEndpoint = useCallback(
    (
      endpoint: NormalizedEndpoint,
      options: CodeSnippetOptions
    ): CodeSnippetResult => {
      const language = availableLanguages.find(
        (lang) => lang.id === options.language
      );
      if (!language) {
        throw new Error(`Unsupported language: ${options.language}`);
      }

      let code: string;
      switch (options.language) {
        case "curl":
          code = generateCurl(endpoint, options);
          break;
        case "javascript":
          code = generateJavaScript(endpoint, options, false);
          break;
        case "typescript":
          code = generateJavaScript(endpoint, options, true);
          break;
        case "python":
          code = generatePython(endpoint, options);
          break;
        case "node":
          code = generateNode(endpoint, options);
          break;
        case "php":
          code = generatePhp(endpoint, options);
          break;
        case "java":
          code = generateJava(endpoint, options);
          break;
        case "go":
          code = generateGo(endpoint, options);
          break;
        default:
          throw new Error(
            `Code generation not implemented for language: ${options.language}`
          );
      }

      const result: CodeSnippetResult = {
        code,
        language,
        description: `${
          language.name
        } code for ${endpoint.method.toUpperCase()} ${endpoint.path}`,
      };

      setLastGenerated(result);
      return result;
    },
    [
      availableLanguages,
      generateCurl,
      generateJavaScript,
      generatePython,
      generateNode,
      generatePhp,
      generateJava,
      generateGo,
    ]
  );

  const generate = useCallback(
    (operationId: string, options: CodeSnippetOptions): CodeSnippetResult => {
      if (!spec?.endpoints) {
        throw new Error("No API spec available");
      }
      const endpoint = findEndpointById(spec.endpoints, operationId);
      if (!endpoint) {
        throw new Error(`Operation with ID "${operationId}" not found`);
      }

      return generateForEndpoint(endpoint, options);
    },
    [spec, generateForEndpoint]
  );

  return {
    /** Available programming languages for code generation */
    availableLanguages,
    /** Generate code snippet for an operation by ID */
    generate,
    /** Generate code snippet for a specific endpoint */
    generateForEndpoint,
    /** Last generated code snippet */
    lastGenerated,
    /** Clear the last generated result */
    clearLast: useCallback(() => setLastGenerated(null), []),
  };
}

/**
 * Hook for generating code snippets for a specific endpoint
 */
export function useEndpointCodeSnippet(endpoint: NormalizedEndpoint | null) {
  const codeSnippet = useCodeSnippet();

  const generate = useCallback(
    (options: CodeSnippetOptions): CodeSnippetResult => {
      if (!endpoint) {
        throw new Error("No endpoint provided");
      }
      return codeSnippet.generateForEndpoint(endpoint, options);
    },
    [endpoint, codeSnippet]
  );

  return {
    ...codeSnippet,
    /** Generate code snippet for the specific endpoint */
    generate,
  };
}
