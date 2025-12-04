export type ZodIssue = { path: (string | number)[]; message: string };

export class ZodError extends Error {
  issues: ZodIssue[];

  constructor(issues: ZodIssue[]) {
    super(issues[0]?.message ?? "Invalid input");
    this.issues = issues;
  }
}

function normalizeMessage(message?: string | { message?: string }, fallback = "Invalid input") {
  if (!message) return fallback;
  return typeof message === "string" ? message : message.message ?? fallback;
}

abstract class BaseSchema<T> {
  abstract _parse(
    data: unknown,
    path: (string | number)[]
  ): { success: true; value: T } | { success: false; issues: ZodIssue[] };

  parse(data: unknown): T {
    const result = this._parse(data, []);
    if (result.success) return result.value;
    throw new ZodError(result.issues);
  }

  safeParse(data: unknown): { success: true; data: T } | { success: false; error: ZodError } {
    const result = this._parse(data, []);
    if (result.success) return { success: true, data: result.value };
    return { success: false, error: new ZodError(result.issues) };
  }

  optional(): BaseSchema<T | undefined> {
    return new OptionalSchema(this);
  }

  nullable(): BaseSchema<T | null> {
    return new NullableSchema(this);
  }

  refine(check: (value: T) => boolean, message?: string | { message?: string }): BaseSchema<T> {
    return new RefineSchema(this, check, normalizeMessage(message));
  }

  transform<U>(transformer: (value: T) => U): BaseSchema<U> {
    return new TransformSchema(this, transformer);
  }
}

type SchemaShape = Record<string, BaseSchema<unknown>>;

type InferShape<Shape extends SchemaShape> = {
  [K in keyof Shape]: Shape[K] extends BaseSchema<infer U> ? U : never;
};

class StringSchema extends BaseSchema<string> {
  private readonly minValue?: { value: number; message: string };
  private readonly maxValue?: { value: number; message: string };
  private readonly trimEnabled: boolean;

  constructor(options?: {
    min?: { value: number; message: string };
    max?: { value: number; message: string };
    trim?: boolean;
  }) {
    super();
    this.minValue = options?.min;
    this.maxValue = options?.max;
    this.trimEnabled = options?.trim ?? false;
  }

  _parse(data: unknown, path: (string | number)[]) {
    if (typeof data !== "string") {
      return { success: false as const, issues: [{ path, message: "Expected string" }] };
    }

    const value = this.trimEnabled ? data.trim() : data;

    const issues: ZodIssue[] = [];
    if (this.minValue && value.length < this.minValue.value) {
      issues.push({ path, message: this.minValue.message });
    }
    if (this.maxValue && value.length > this.maxValue.value) {
      issues.push({ path, message: this.maxValue.message });
    }

    if (issues.length) return { success: false as const, issues };

    return { success: true as const, value };
  }

  trim() {
    return new StringSchema({ ...this, trim: true });
  }

  min(length: number, message?: string | { message?: string }) {
    return new StringSchema({
      ...this,
      trim: this.trimEnabled,
      min: { value: length, message: normalizeMessage(message, `Must be at least ${length} characters`) },
      max: this.maxValue,
    });
  }

  max(length: number, message?: string | { message?: string }) {
    return new StringSchema({
      ...this,
      trim: this.trimEnabled,
      min: this.minValue,
      max: { value: length, message: normalizeMessage(message, `Must be at most ${length} characters`) },
    });
  }
}

class NumberSchema extends BaseSchema<number> {
  private readonly intOnly: boolean;
  private readonly positiveOnly: boolean;
  private readonly nonNegative: boolean;
  private readonly minValue?: { value: number; message: string };
  private readonly maxValue?: { value: number; message: string };

  constructor(options?: {
    intOnly?: boolean;
    positiveOnly?: boolean;
    nonNegative?: boolean;
    min?: { value: number; message: string };
    max?: { value: number; message: string };
  }) {
    super();
    this.intOnly = options?.intOnly ?? false;
    this.positiveOnly = options?.positiveOnly ?? false;
    this.nonNegative = options?.nonNegative ?? false;
    this.minValue = options?.min;
    this.maxValue = options?.max;
  }

  _parse(data: unknown, path: (string | number)[]) {
    if (typeof data !== "number" || Number.isNaN(data)) {
      return { success: false as const, issues: [{ path, message: "Expected number" }] };
    }

    const value = data;
    const issues: ZodIssue[] = [];

    if (this.intOnly && !Number.isInteger(value)) {
      issues.push({ path, message: "Expected integer" });
    }
    if (this.positiveOnly && value <= 0) {
      issues.push({ path, message: "Must be greater than 0" });
    }
    if (this.nonNegative && value < 0) {
      issues.push({ path, message: "Must be greater than or equal to 0" });
    }
    if (this.minValue && value < this.minValue.value) {
      issues.push({ path, message: this.minValue.message });
    }
    if (this.maxValue && value > this.maxValue.value) {
      issues.push({ path, message: this.maxValue.message });
    }

    if (issues.length) return { success: false as const, issues };
    return { success: true as const, value };
  }

  int() {
    return new NumberSchema({
      ...this,
      intOnly: true,
      positiveOnly: this.positiveOnly,
      nonNegative: this.nonNegative,
      min: this.minValue,
      max: this.maxValue,
    });
  }

  positive(message?: string | { message?: string }) {
    return new NumberSchema({
      ...this,
      intOnly: this.intOnly,
      positiveOnly: true,
      nonNegative: this.nonNegative,
      max: this.maxValue,
      min: { value: 1, message: normalizeMessage(message, "Must be greater than 0") },
    });
  }

  nonnegative(message?: string | { message?: string }) {
    return new NumberSchema({
      ...this,
      intOnly: this.intOnly,
      positiveOnly: this.positiveOnly,
      nonNegative: true,
      min: { value: 0, message: normalizeMessage(message, "Must be greater than or equal to 0") },
      max: this.maxValue,
    });
  }

  min(value: number, message?: string | { message?: string }) {
    return new NumberSchema({
      ...this,
      intOnly: this.intOnly,
      positiveOnly: this.positiveOnly,
      nonNegative: this.nonNegative,
      min: { value, message: normalizeMessage(message, `Must be at least ${value}`) },
      max: this.maxValue,
    });
  }

  max(value: number, message?: string | { message?: string }) {
    return new NumberSchema({
      ...this,
      intOnly: this.intOnly,
      positiveOnly: this.positiveOnly,
      nonNegative: this.nonNegative,
      min: this.minValue,
      max: { value, message: normalizeMessage(message, `Must be at most ${value}`) },
    });
  }
}

class BooleanSchema extends BaseSchema<boolean> {
  _parse(data: unknown, path: (string | number)[]) {
    if (typeof data !== "boolean") {
      return { success: false as const, issues: [{ path, message: "Expected boolean" }] };
    }
    return { success: true as const, value: data };
  }
}

class NullSchema extends BaseSchema<null> {
  _parse(data: unknown, path: (string | number)[]) {
    if (data === null) return { success: true as const, value: null };
    return { success: false as const, issues: [{ path, message: "Expected null" }] };
  }
}

class UndefinedSchema extends BaseSchema<undefined> {
  _parse(data: unknown, path: (string | number)[]) {
    if (data === undefined) return { success: true as const, value: undefined };
    return { success: false as const, issues: [{ path, message: "Expected undefined" }] };
  }
}

class ArraySchema<T> extends BaseSchema<T[]> {
  constructor(
    private readonly element: BaseSchema<T>,
    private readonly mustBeNonEmpty = false,
    private readonly nonEmptyMessage = "Array must not be empty"
  ) {
    super();
  }

  _parse(data: unknown, path: (string | number)[]) {
    if (!Array.isArray(data)) {
      return { success: false as const, issues: [{ path, message: "Expected array" }] };
    }

    const values: T[] = [];
    const issues: ZodIssue[] = [];
    data.forEach((item, index) => {
      const result = this.element._parse(item, [...path, index]);
      if (result.success) {
        values.push(result.value);
      } else {
        issues.push(...result.issues);
      }
    });

    if (this.mustBeNonEmpty && values.length === 0) {
      issues.push({ path, message: this.nonEmptyMessage });
    }

    if (issues.length) return { success: false as const, issues };
    return { success: true as const, value: values };
  }

  nonempty(message?: string | { message?: string }) {
    return new ArraySchema(
      this.element,
      true,
      normalizeMessage(message, "Array must contain at least one element")
    );
  }
}

class ObjectSchema<Shape extends SchemaShape> extends BaseSchema<InferShape<Shape>> {
  constructor(private readonly shape: Shape) {
    super();
  }

  _parse(data: unknown, path: (string | number)[]) {
    if (!data || typeof data !== "object") {
      return { success: false as const, issues: [{ path, message: "Expected object" }] };
    }

    const result: Record<string, unknown> = {};
    const issues: ZodIssue[] = [];

    for (const key of Object.keys(this.shape)) {
      const schema = this.shape[key];
      const value = (data as Record<string, unknown>)[key];
      const parsed = schema._parse(value, [...path, key]);
      if (parsed.success) {
        result[key] = parsed.value;
      } else {
        issues.push(...parsed.issues);
      }
    }

    if (issues.length) return { success: false as const, issues };
    return { success: true as const, value: result as InferShape<Shape> };
  }
}

type UnionSchemas = BaseSchema<unknown>[];
type InferUnionOutput<Schemas extends UnionSchemas> = Schemas[number] extends BaseSchema<infer U> ? U : never;

class UnionSchema<Schemas extends UnionSchemas> extends BaseSchema<InferUnionOutput<Schemas>> {
  constructor(private readonly schemas: Schemas) {
    super();
  }

  _parse(data: unknown, path: (string | number)[]) {
    const issueGroups: ZodIssue[][] = [];

    for (const schema of this.schemas) {
      const result = schema._parse(data, path);
      if (result.success) {
        return { success: true as const, value: result.value };
      }
      issueGroups.push(result.issues);
    }

    return { success: false as const, issues: issueGroups.flat() };
  }
}

class PreprocessSchema<T> extends BaseSchema<T> {
  constructor(
    private readonly processor: (data: unknown) => unknown,
    private readonly inner: BaseSchema<T>
  ) {
    super();
  }

  _parse(data: unknown, path: (string | number)[]) {
    const processed = this.processor(data);
    return this.inner._parse(processed, path);
  }
}

class OptionalSchema<T> extends BaseSchema<T | undefined> {
  constructor(private readonly inner: BaseSchema<T>) {
    super();
  }

  _parse(data: unknown, path: (string | number)[]) {
    if (data === undefined) return { success: true as const, value: undefined };
    return this.inner._parse(data, path);
  }
}

class NullableSchema<T> extends BaseSchema<T | null> {
  constructor(private readonly inner: BaseSchema<T>) {
    super();
  }

  _parse(data: unknown, path: (string | number)[]) {
    if (data === null) return { success: true as const, value: null };
    return this.inner._parse(data, path);
  }
}

class RefineSchema<T> extends BaseSchema<T> {
  constructor(
    private readonly inner: BaseSchema<T>,
    private readonly check: (value: T) => boolean,
    private readonly message: string
  ) {
    super();
  }

  _parse(data: unknown, path: (string | number)[]) {
    const result = this.inner._parse(data, path);
    if (!result.success) return result;

    if (!this.check(result.value)) {
      return { success: false as const, issues: [{ path, message: this.message }] };
    }

    return { success: true as const, value: result.value };
  }
}

class TransformSchema<T, U> extends BaseSchema<U> {
  constructor(private readonly inner: BaseSchema<T>, private readonly transformer: (value: T) => U) {
    super();
  }

  _parse(data: unknown, path: (string | number)[]) {
    const result = this.inner._parse(data, path);
    if (!result.success) return result as { success: false; issues: ZodIssue[] };

    const transformed = this.transformer(result.value);
    return { success: true as const, value: transformed };
  }
}

export const z = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  object: <Shape extends SchemaShape>(shape: Shape) => new ObjectSchema(shape),
  array: <T>(schema: BaseSchema<T>) => new ArraySchema(schema),
  union: <Schemas extends UnionSchemas>(schemas: Schemas) => new UnionSchema(schemas),
  preprocess: <T>(processor: (data: unknown) => unknown, schema: BaseSchema<T>) =>
    new PreprocessSchema(processor, schema),
  null: () => new NullSchema(),
  undefined: () => new UndefinedSchema(),
};

export type infer<T> = T extends BaseSchema<infer U> ? U : never;
