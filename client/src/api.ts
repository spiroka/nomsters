export async function fetchNomsters() {
  const response = await fetch('/nomsters', { credentials: 'include' });

  return response.json();
}

export async function fetchProfile() {
  const response = await fetch('/me', { credentials: 'include' });

  return response.json();
}

export async function eat(nomsterId: number) {
  return fetch(`/nomsters/${nomsterId}/eat`, {
    method: 'POST',
    credentials: 'include'
  });
}
