import { join, relative } from "node:path";

type OpenApiDocument = Record<string, unknown>;

const OPENAPI_DIRECTORY = join(import.meta.dir, "..", "openapi");
const OUTPUT_PATH = join(OPENAPI_DIRECTORY, "jupiter.yaml");
const HTTP_METHODS = new Set(["delete", "get", "head", "options", "patch", "post", "put", "trace"]);

function isRecord(value: unknown): value is OpenApiDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, name: string): OpenApiDocument {
  if (!isRecord(value)) {
    throw new TypeError(`${name} must be an object`);
  }

  return value;
}

function toPascalCase(segment: string): string {
  return segment
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase()}${part.slice(1)}`)
    .join("");
}

function tagForPath(sourcePath: string): string {
  const segments = sourcePath.replace(/\.yaml$/, "").split("/");

  if (segments.slice(0, -1).includes(segments.at(-1) ?? "")) {
    segments.pop();
  }

  return segments.map(toPascalCase).join("");
}

function sourceServer(document: OpenApiDocument, sourcePath: string): URL {
  const servers = document.servers;

  if (!Array.isArray(servers) || !isRecord(servers[0]) || typeof servers[0].url !== "string") {
    throw new TypeError(`${sourcePath} must declare at least one server URL`);
  }

  return new URL(servers[0].url);
}

function combinePath(basePath: string, path: string): string {
  const combined = `${basePath.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  return combined === "/" ? combined : combined.replace(/\/{2,}/g, "/");
}

function rewriteSecurityRequirements(value: unknown, namespace: string): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((requirement) => {
    if (!isRecord(requirement)) {
      return requirement;
    }

    return Object.fromEntries(
      Object.entries(requirement).map(([name, scopes]) => [`${namespace}_${name}`, scopes]),
    );
  });
}

function rewriteReferences(value: unknown, namespace: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteReferences(item, namespace));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (key === "$ref" && typeof item === "string") {
        const match = item.match(/^#\/components\/([^/]+)\/([^/]+)$/);

        if (match) {
          return [key, `#/components/${match[1]}/${namespace}_${match[2]}`];
        }

        if (!item.startsWith("#")) {
          throw new TypeError(`Unsupported external reference: ${item}`);
        }
      }

      if (key === "security") {
        return [key, rewriteSecurityRequirements(item, namespace)];
      }

      return [key, rewriteReferences(item, namespace)];
    }),
  );
}

function namespacedComponents(document: OpenApiDocument, namespace: string): OpenApiDocument {
  const components = document.components;

  if (components === undefined) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(asRecord(components, "components")).map(([componentType, entries]) => [
      componentType,
      Object.fromEntries(
        Object.entries(asRecord(entries, `components.${componentType}`)).map(([name, value]) => [
          `${namespace}_${name}`,
          value,
        ]),
      ),
    ]),
  );
}

function operationsForPath(
  pathItem: OpenApiDocument,
  tag: string,
  security: unknown,
  server: URL,
): OpenApiDocument {
  const result: OpenApiDocument = {
    ...pathItem,
    servers: [{ url: server.origin }],
  };

  for (const [method, operation] of Object.entries(result)) {
    if (!HTTP_METHODS.has(method) || !isRecord(operation)) {
      continue;
    }

    result[method] = {
      ...operation,
      tags: [tag],
      ...(operation.security === undefined && security !== undefined ? { security } : {}),
    };
  }

  return result;
}

const sourceFiles: string[] = [];
for await (const file of new Bun.Glob("**/*.yaml").scan({ cwd: OPENAPI_DIRECTORY })) {
  if (file !== "jupiter.yaml") {
    sourceFiles.push(file);
  }
}
sourceFiles.sort();

const paths: OpenApiDocument = {};
const components: OpenApiDocument = {};
const tags: Array<OpenApiDocument> = [];

for (const sourceFile of sourceFiles) {
  const tag = tagForPath(sourceFile);
  const document = asRecord(
    Bun.YAML.parse(await Bun.file(join(OPENAPI_DIRECTORY, sourceFile)).text()),
    sourceFile,
  );
  const normalized = asRecord(rewriteReferences(document, tag), sourceFile);
  const server = sourceServer(document, sourceFile);
  const sourcePaths = asRecord(normalized.paths, `${sourceFile}.paths`);

  tags.push({
    name: tag,
    description: `Operations from ${sourceFile}`,
  });

  for (const [sourcePath, pathItem] of Object.entries(sourcePaths)) {
    const targetPath = combinePath(server.pathname, sourcePath);

    if (paths[targetPath] !== undefined) {
      throw new TypeError(`Duplicate generated path: ${targetPath}`);
    }

    paths[targetPath] = operationsForPath(
      asRecord(pathItem, `${sourceFile}.paths.${sourcePath}`),
      tag,
      normalized.security,
      server,
    );
  }

  for (const [componentType, entries] of Object.entries(namespacedComponents(normalized, tag))) {
    const destination = (components[componentType] ??= {});
    Object.assign(asRecord(destination, `components.${componentType}`), entries);
  }
}

const rootDocument = {
  openapi: "3.0.3",
  info: {
    title: "Jupiter API",
    version: "1.0.0",
    description: "Generated composite Jupiter API specification. Do not edit manually.",
  },
  servers: [
    { url: "https://api.jup.ag", description: "Jupiter API" },
    { url: "https://tx.jup.ag", description: "Jupiter transaction API" },
  ],
  tags,
  paths,
  components,
};

await Bun.write(OUTPUT_PATH, `${JSON.stringify(rootDocument, null, 2)}\n`);

console.log(
  `Prepared ${relative(process.cwd(), OUTPUT_PATH)} from ${sourceFiles.length} source specifications.`,
);
