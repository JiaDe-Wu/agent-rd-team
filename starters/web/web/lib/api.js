// Company web template: calling the API. On an error it throws an Error whose message is the API's plain-English explanation.
async function call(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data?.error?.message || `The request failed (${res.status})`)
    err.status = res.status
    err.code = data?.error?.code
    throw err
  }
  return data
}

export const api = {
  get: (path) => call('GET', path),
  post: (path, body = {}) => call('POST', path, body),
  put: (path, body = {}) => call('PUT', path, body),
  del: (path) => call('DELETE', path),
}
