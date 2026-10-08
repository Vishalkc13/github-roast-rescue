export async function getGitHubData(username) {
  const response = await fetch(
    `/api/github/${encodeURIComponent(username.trim())}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Unable to fetch GitHub data."
    );
  }

  return data;
}