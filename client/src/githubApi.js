const BACKEND_API = "http://localhost:5000";

export async function getGitHubData(username) {
  const response = await fetch(
    `${BACKEND_API}/api/github/${encodeURIComponent(username.trim())}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Unable to fetch GitHub data."
    );
  }

  return data;
}