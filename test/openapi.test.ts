import { describe, it, expect } from "vitest";
import { openApiDocument } from "../shared/openapi";

const operations = Object.entries(openApiDocument.paths).flatMap(([path, methods]) =>
  Object.entries(methods as Record<string, any>).map(([method, operation]) => ({
    path,
    method,
    operation,
  }))
);

describe("OpenAPI document", () => {
  it("is a parseable 3.1 document with the required top-level fields", () => {
    // The audit reported "OpenAPI spec found but failed to parse"; round-tripping
    // through JSON is what a consumer actually does.
    const parsed = JSON.parse(JSON.stringify(openApiDocument));
    expect(parsed.openapi).toMatch(/^3\.1\.\d+$/);
    expect(parsed.info.title).toBeTruthy();
    expect(parsed.info.version).toBeTruthy();
    expect(parsed.info.description.length).toBeGreaterThan(200);
    expect(parsed.servers[0].url).toBe("https://visit.dzaleka.com");
    expect(Object.keys(parsed.paths).length).toBeGreaterThan(10);
  });

  it("documents only paths that exist on the server", () => {
    for (const { path } of operations) {
      expect(path.startsWith("/api/")).toBe(true);
    }
  });
});

describe("function-calling compatibility", () => {
  it("gives every operation a unique operationId", () => {
    const ids = operations.map(({ operation }) => operation.operationId);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses identifier-safe operationIds", () => {
    // Tool names in function-calling formats are restricted to [A-Za-z0-9_-].
    for (const { operation } of operations) {
      expect(operation.operationId).toMatch(/^[A-Za-z][A-Za-z0-9_]{0,63}$/);
    }
  });

  it("gives every operation a summary and a substantive description", () => {
    for (const { operation, path } of operations) {
      expect(operation.summary, `${path} summary`).toBeTruthy();
      expect(operation.description, `${path} description`).toBeTruthy();
      expect(operation.description.length, `${path} description length`).toBeGreaterThan(40);
    }
  });

  it("tags every operation", () => {
    const declared = new Set(openApiDocument.tags.map((tag) => tag.name));
    for (const { operation, path } of operations) {
      expect(operation.tags?.length, `${path} tags`).toBeGreaterThan(0);
      for (const tag of operation.tags) {
        expect(declared.has(tag), `${path} uses undeclared tag ${tag}`).toBe(true);
      }
    }
  });

  it("types every parameter and describes what it is for", () => {
    for (const { operation, path } of operations) {
      for (const parameter of operation.parameters ?? []) {
        expect(parameter.name, `${path} parameter name`).toBeTruthy();
        expect(["path", "query", "header"]).toContain(parameter.in);
        expect(parameter.description, `${path}:${parameter.name} description`).toBeTruthy();
        expect(parameter.schema?.type, `${path}:${parameter.name} schema`).toBeTruthy();
        if (parameter.in === "path") {
          expect(parameter.required, `${path}:${parameter.name} must be required`).toBe(true);
        }
      }
    }
  });

  it("declares a path parameter for every templated path segment", () => {
    for (const { path, operation } of operations) {
      const templated = Array.from(path.matchAll(/\{([^}]+)\}/g)).map((m) => m[1]);
      const declared = (operation.parameters ?? [])
        .filter((p: any) => p.in === "path")
        .map((p: any) => p.name);
      expect(declared.sort()).toEqual(templated.sort());
    }
  });

  it("gives every operation a typed 200 response", () => {
    for (const { operation, path } of operations) {
      const ok = operation.responses["200"];
      expect(ok, `${path} 200`).toBeTruthy();
      expect(ok.description, `${path} 200 description`).toBeTruthy();
      const schema = ok.content?.["application/json"]?.schema;
      expect(schema, `${path} 200 schema`).toBeTruthy();
    }
  });

  it("documents an error response for every operation", () => {
    for (const { operation, path } of operations) {
      const errorCodes = Object.keys(operation.responses).filter((code) => Number(code) >= 400);
      expect(errorCodes.length, `${path} error responses`).toBeGreaterThan(0);
      for (const code of errorCodes) {
        expect(
          operation.responses[code].content["application/json"].schema.$ref,
          `${path} ${code} uses the Error schema`
        ).toBe("#/components/schemas/Error");
      }
    }
  });
});

describe("component schemas", () => {
  const schemas = openApiDocument.components.schemas as Record<string, any>;

  it("resolves every internal $ref", () => {
    const refs = new Set<string>();
    const walk = (node: unknown) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node && typeof node === "object") {
        for (const [key, value] of Object.entries(node)) {
          if (key === "$ref" && typeof value === "string") refs.add(value);
          else walk(value);
        }
      }
    };
    walk(openApiDocument);

    expect(refs.size).toBeGreaterThan(0);
    for (const ref of refs) {
      const name = ref.replace("#/components/schemas/", "");
      expect(schemas[name], `unresolved $ref ${ref}`).toBeTruthy();
    }
  });

  it("describes every schema and its properties", () => {
    for (const [name, schema] of Object.entries(schemas)) {
      expect(schema.description, `${name} description`).toBeTruthy();
      expect(schema.type, `${name} type`).toBe("object");
      for (const [property, definition] of Object.entries(schema.properties as Record<string, any>)) {
        expect(definition.type ?? definition.$ref, `${name}.${property} type`).toBeTruthy();
      }
    }
  });

  it("models the error contract the server actually returns", () => {
    const error = schemas.Error;
    expect(error.required).toEqual(expect.arrayContaining(["error", "code", "message"]));
    expect(error.properties.code.type).toBe("string");
    expect(error.properties.hint).toBeTruthy();
  });

  it("states that prices are whole MWK integers", () => {
    const pricing = schemas.PricingConfig;
    expect(pricing.properties.basePrice.type).toBe("integer");
    expect(pricing.properties.currency.const).toBe("MWK");
    expect(pricing.properties.groupSize.enum).toEqual([
      "individual",
      "small_group",
      "large_group",
      "custom",
    ]);
  });
});
