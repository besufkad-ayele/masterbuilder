/**
 * Remove keys whose value is undefined so Firestore never rejects the write.
 * Firestore throws: "Unsupported field value: undefined"
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
}

export function stripUndefinedDeep<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((item) => stripUndefinedDeep(item)) as T;
    }

    if (value !== null && typeof value === "object" && !(value instanceof Date)) {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, stripUndefinedDeep(v)]);
        return Object.fromEntries(entries) as T;
    }

    return value;
}
