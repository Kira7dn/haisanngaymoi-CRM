export async function apiGet<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    method: "GET",
  })
  if (!res.ok) {
    throw new Error(`Request failed ${res.status}: ${await safeText(res)}`)
  }
  return (await res.json()) as T
}

async function safeText(res: Response) {
  try {
    return await res.text()
  } catch {
    return "<no-body>"
  }
}
