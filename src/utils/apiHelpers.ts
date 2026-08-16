export function unwrapData<T = any>(payload: any): T {
  return payload?.data ?? payload
}
