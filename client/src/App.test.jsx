import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";
import { getGitHubData } from "./githubApi";

vi.mock("./githubApi", () => ({
  getGitHubData: vi.fn(),
}));

describe("GitHub Roast & Rescue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an error when the username is empty", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: /roast me/i })
    );

    expect(
      await screen.findByText("Enter a GitHub username.")
    ).toBeInTheDocument();

    expect(getGitHubData).not.toHaveBeenCalled();
  });

  it("fetches GitHub data for the entered username", async () => {
    getGitHubData.mockResolvedValue({
      profile: {
        login: "octocat",
        name: "Octocat",
        bio: "Test developer",
        avatar_url: "https://example.com/avatar.png",
        location: "Earth",
        blog: "",
        followers: 5,
        following: 2,
        public_repos: 1,
        public_gists: 0,
      },
      repos: [],
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({
        roast: "Your portfolio could use more details.",
        recruiterVerdict: {
          rating: "MAYBE",
          summary: "Add stronger project documentation.",
        },
        strengths: ["Profile is available"],
        topProblems: [],
        rescuePlan: [],
        quickWins: ["Add a project README"],
      }),
    });

    render(<App />);

    fireEvent.change(
      screen.getByPlaceholderText("Enter GitHub username..."),
      { target: { value: "octocat" } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: /roast me/i })
    );

    expect(
      await screen.findByText("Octocat")
    ).toBeInTheDocument();

    expect(getGitHubData).toHaveBeenCalledWith("octocat");

    expect(
      await screen.findByText("Your portfolio could use more details.")
    ).toBeInTheDocument();
  });
});