/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type DeepPartial } from "@type/deep_partial";
import { z } from "zod";

/**
 * Internal recursive implementation of zodDeepPartial.
 *
 * This function traverses a Zod schema and recursively makes all properties optional
 * at every level of nesting. It handles all Zod schema types including objects, arrays,
 * unions, intersections, records, tuples, lazy schemas, discriminated unions, sets,
 * promises, readonly, catch, pipe, nonoptional, and prefault.
 *
 * For discriminated unions, the discriminator field is preserved as required to maintain
 * the discriminator's functionality, while all other fields become optional.
 *
 * @template T - The Zod schema type being processed
 * @param schema - The Zod schema to process
 * @param isTopLevel - Whether this is the top-level call (used to apply strict mode only at root)
 * @returns A new Zod schema with all properties made optional recursively
 *
 * @internal This is an internal function. Use `zodDeepPartial` instead.
 */
function deep_partial_internal<T extends z.core.SomeType>(
  schema: T,
  isTopLevel: boolean = false,
): any {
  // Handle optional schemas by unwrapping and re-applying optional
  if (schema instanceof z.ZodOptional) {
    return deep_partial_internal(schema.unwrap(), false).optional();
  }

  // Handle nullable schemas by unwrapping and re-applying nullable
  if (schema instanceof z.ZodNullable) {
    return deep_partial_internal(schema.unwrap(), false).nullable();
  }

  // Handle default schemas by unwrapping and re-applying default
  if (schema instanceof z.ZodDefault) {
    const inner_result = deep_partial_internal(schema.unwrap(), false);
    return inner_result.default(schema.def.defaultValue);
  }

  // Handle catch schemas by unwrapping and re-applying catch
  if (schema instanceof z.ZodCatch) {
    const inner_result = deep_partial_internal(schema.def.innerType, false);
    return inner_result.catch(schema.def.catchValue);
  }

  // Handle prefault schemas by unwrapping and re-applying prefault
  if (schema instanceof z.ZodPrefault) {
    const inner_result = deep_partial_internal(schema.def.innerType, false);
    return inner_result.prefault(schema.def.defaultValue);
  }

  // Handle nonoptional schemas by unwrapping and re-applying nonoptional
  if (schema instanceof z.ZodNonOptional) {
    const inner_result = deep_partial_internal(schema.def.innerType, false);
    return inner_result.nonoptional();
  }

  // Handle readonly schemas by unwrapping and re-applying readonly
  if (schema instanceof z.ZodReadonly) {
    return deep_partial_internal(schema.def.innerType, false).readonly();
  }

  // Handle object schemas - the most common case
  // Recursively process each property and make them optional
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const new_shape: Record<string, any> = {};

    // Process each property in the object schema
    for (const key in shape) {
      new_shape[key] = deep_partial_internal(shape[key], false).optional();
    }

    // Create new object with processed shape and apply partial()
    let result = z.object(new_shape).partial();

    // Apply strict mode only at top level to prevent unknown properties
    if (isTopLevel) {
      result = result.strict();
    }

    return result;
  }

  // Handle array schemas - recursively process element type
  if (schema instanceof z.ZodArray) {
    return z.array(deep_partial_internal(schema.def.element, false)).optional();
  }

  // Handle map schemas - recursively process both key and value types
  if (schema instanceof z.ZodMap) {
    return z
      .map(
        deep_partial_internal(schema.def.keyType, false),
        deep_partial_internal(schema.def.valueType, false),
      )
      .optional();
  }

  // Handle set schemas - recursively process value type
  if (schema instanceof z.ZodSet) {
    return z.set(deep_partial_internal(schema.def.valueType, false)).optional();
  }

  // Handle promise schemas - recursively process inner type
  if (schema instanceof z.ZodPromise) {
    return z
      .promise(deep_partial_internal(schema.def.innerType, false))
      .optional();
  }

  // Handle union schemas - recursively process each option
  if (schema instanceof z.ZodUnion) {
    return z
      .union(schema.options.map((opt) => deep_partial_internal(opt, false)))
      .optional();
  }

  // Handle intersection schemas - recursively process both left and right sides
  if (schema instanceof z.ZodIntersection) {
    return z
      .intersection(
        deep_partial_internal(schema.def.left, false),
        deep_partial_internal(schema.def.right, false),
      )
      .optional();
  }

  // Handle record schemas - recursively process value type (keys remain unchanged)
  if (schema instanceof z.ZodRecord) {
    return z
      .record(
        deep_partial_internal(schema.def.keyType, false),
        deep_partial_internal(schema.def.valueType, false),
      )
      .optional();
  }

  // Handle tuple schemas - recursively process each item in the tuple
  if (schema instanceof z.ZodTuple) {
    return z
      .tuple(
        schema.def.items.map((item) =>
          deep_partial_internal(item, false),
        ) as any,
      )
      .optional();
  }

  // Handle lazy schemas - recursively process the lazy getter function
  if (schema instanceof z.ZodLazy) {
    return z
      .lazy(() => deep_partial_internal(schema.def.getter(), false))
      .optional();
  }

  // Handle discriminated unions - special case that preserves the discriminator field as required
  // This ensures the union can still be properly discriminated even when other fields are optional
  if (schema instanceof z.ZodDiscriminatedUnion) {
    const options = schema.options.map((option) => {
      if (option instanceof z.ZodObject) {
        const shape = option.shape;
        const new_shape: Record<string, any> = {};

        // Process each field in the discriminated union option
        for (const key in shape) {
          if (key === schema.def.discriminator) {
            // Keep discriminator field required to maintain discriminator functionality
            new_shape[key] = shape[key];
          } else {
            // Make all other fields optional
            new_shape[key] = deep_partial_internal(
              shape[key],
              false,
            ).optional();
          }
        }

        return z.object(new_shape);
      }
      return deep_partial_internal(option, false);
    });

    return z.discriminatedUnion(schema.def.discriminator, options as any);
  }

  // Handle pipe schemas - preserve both input and output types as-is
  // Note: We don't deep-partial the input of pipes because transforms/refinements
  // have specific input requirements. The parent object's .optional() handles optionality.
  if (schema instanceof z.ZodPipe) {
    return schema;
  }

  // Fallback for any other schema types - simply make them optional
  return (schema as any).optional();
}

/**
 * Recursively makes all properties in a Zod schema optional at all levels.
 *
 * This is the main entry point for creating deeply partial Zod schemas. It transforms
 * a Zod schema so that every property, at every level of nesting, becomes optional.
 * This is useful for:
 * - Creating partial update schemas
 * - Handling incomplete data structures
 * - Building flexible API request/response validators
 * - Implementing patch operations
 *
 * The function preserves type safety and works with all Zod schema types including:
 * - Objects (with nested objects)
 * - Arrays
 * - Unions
 * - Intersections
 * - Records
 * - Tuples
 * - Lazy/recursive schemas
 * - Discriminated unions (preserves discriminator as required)
 *
 * @template T - The Zod schema type
 * @param schema - The Zod schema to make deeply partial
 * @returns A new Zod schema where all properties are optional at all levels
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 * import { zodDeepPartial } from "zod-deep-partial";
 *
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.email(),
 *   profile: z.object({
 *     bio: z.string(),
 *     avatar: z.url(),
 *   }),
 * });
 *
 * const partialUserSchema = zodDeepPartial(userSchema);
 *
 * // All of these are now valid:
 * partialUserSchema.parse({});
 * partialUserSchema.parse({ name: "John" });
 * partialUserSchema.parse({ profile: { bio: "Developer" } });
 * ```
 */
export function build_deep_partial_schema<T extends z.core.SomeType>(
  schema: T,
): DeepPartial<T> {
  return deep_partial_internal(schema, true);
}
