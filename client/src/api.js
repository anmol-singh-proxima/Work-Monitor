const baseUrl = '/api/worklog';

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed. Please try again.');
  }

  return payload;
}

export function getWorklog(date) {
  return request(`/${date}`);
}

export function addSession(date, session) {
  return request(`/${date}`, {
    method: 'POST',
    body: JSON.stringify(session)
  });
}

export function updateSession(date, id, session) {
  return request(`/${date}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(session)
  });
}

export function deleteSession(date, id) {
  return request(`/${date}/${id}`, {
    method: 'DELETE'
  });
}
