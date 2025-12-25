export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(path, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
        credentials: "include",
        ...options,
        body:
            typeof options.body === "object"
                ? JSON.stringify(options.body)
                : options.body,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        throw new Error(data?.message || data?.Message || res.statusText);
    }

    return data;
}
