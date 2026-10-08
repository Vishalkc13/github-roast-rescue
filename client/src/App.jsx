import { useState } from "react";
import {
  Flame,
  Search,
  Star,
  GitFork,
  CheckCircle,
  AlertTriangle,
  Trophy,
} from "lucide-react";

import { getGitHubData } from "./githubApi";

import "./App.css";


function calculateScore(profile, repos) {

  // -------------------------
  // 1. PROFILE SCORE - 10
  // -------------------------

  let profileScore = 0;

  if (profile.name) profileScore += 2;
  if (profile.bio) profileScore += 3;
  if (profile.avatar_url) profileScore += 2;
  if (profile.location) profileScore += 1;
  if (profile.blog) profileScore += 2;


  // -------------------------
  // 2. PROJECT SCORE - 30
  // -------------------------

  let projectScore = 0;

  if (repos.length >= 3) projectScore += 10;
  else if (repos.length >= 1) projectScore += 5;

  const goodRepos = repos.filter(
    (repo) =>
      repo.description &&
      repo.language &&
      !repo.fork
  );

  if (goodRepos.length >= 3) {
    projectScore += 10;
  } else if (goodRepos.length >= 1) {
    projectScore += 5;
  }

  const starredRepos = repos.filter(
    (repo) => repo.stargazers_count > 0
  );

  if (starredRepos.length >= 2) {
    projectScore += 10;
  } else if (starredRepos.length >= 1) {
    projectScore += 5;
  }


  // -------------------------
  // 3. DOCUMENTATION - 20
  // -------------------------

  let documentationScore = 0;

  const describedRepos = repos.filter(
    (repo) => repo.description
  );

  if (describedRepos.length >= 3) {
    documentationScore += 10;
  } else if (describedRepos.length >= 1) {
    documentationScore += 5;
  }

  const topicRepos = repos.filter(
    (repo) =>
      repo.topics &&
      repo.topics.length > 0
  );

  if (topicRepos.length >= 3) {
    documentationScore += 10;
  } else if (topicRepos.length >= 1) {
    documentationScore += 5;
  }


  // -------------------------
  // 4. ACTIVITY - 15
  // -------------------------

  let activityScore = 0;

  const activeRepos = repos.filter((repo) => {

    if (!repo.pushed_at) return false;

    const updatedDate =
      new Date(repo.pushed_at);

    const currentDate =
      new Date();

    const difference =
      currentDate - updatedDate;

    const days =
      difference /
      (1000 * 60 * 60 * 24);

    return days <= 180;

  });

  if (activeRepos.length >= 5) {
    activityScore = 15;
  } else if (activeRepos.length >= 3) {
    activityScore = 10;
  } else if (activeRepos.length >= 1) {
    activityScore = 5;
  }


  // -------------------------
  // 5. PRESENTATION - 15
  // -------------------------

  let presentationScore = 0;

  const demoRepos = repos.filter(
    (repo) => repo.homepage
  );

  if (demoRepos.length >= 2) {
    presentationScore += 10;
  } else if (demoRepos.length >= 1) {
    presentationScore += 5;
  }

  const forkRepos = repos.filter(
    (repo) => repo.fork
  );

  if (
    repos.length > 0 &&
    forkRepos.length < repos.length / 2
  ) {
    presentationScore += 5;
  }


  // -------------------------
  // 6. COMMUNITY - 10
  // -------------------------

  let communityScore = 0;

  if (profile.followers >= 10) {
    communityScore += 5;
  } else if (profile.followers >= 3) {
    communityScore += 3;
  } else if (profile.followers >= 1) {
    communityScore += 1;
  }

  const totalStars = repos.reduce(
    (total, repo) =>
      total + repo.stargazers_count,
    0
  );

  if (totalStars >= 10) {
    communityScore += 5;
  } else if (totalStars >= 3) {
    communityScore += 3;
  } else if (totalStars >= 1) {
    communityScore += 1;
  }


  const totalScore =
    profileScore +
    projectScore +
    documentationScore +
    activityScore +
    presentationScore +
    communityScore;


  return {
    totalScore,
    profileScore,
    projectScore,
    documentationScore,
    activityScore,
    presentationScore,
    communityScore,
  };
}


function getScoreMessage(score) {

  if (score >= 90) {
    return {
      title: "Recruiter Magnet 🚀",
      text: "Your GitHub is looking seriously impressive.",
    };
  }

  if (score >= 75) {
    return {
      title: "Looking Good 🔥",
      text: "You've got a solid portfolio. A few improvements could make it stand out.",
    };
  }

  if (score >= 60) {
    return {
      title: "Needs Some Work ⚡",
      text: "There is good potential here, but recruiters may notice some weak spots.",
    };
  }

  if (score >= 40) {
    return {
      title: "Portfolio Under Construction 🚧",
      text: "Your GitHub has potential, but it needs serious cleanup.",
    };
  }

  return {
    title: "We Need To Talk 💀",
    text: "Your GitHub needs some love before you send it to recruiters.",
  };
}


function App() {

  const [username, setUsername] =
    useState("");

  const [profile, setProfile] =
    useState(null);

  const [repos, setRepos] =
    useState([]);

  const [score, setScore] =
    useState(null);
  const [analysis, setAnalysis] = useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [previousScore, setPreviousScore] = useState(null);



  async function handleRoast() {

    if (!username.trim()) {
      setError("Enter a GitHub username.");
      return;
    }

    setLoading(true);
    setError("");

    setProfile(null);
    setRepos([]);
    // setScore(null);
    setAnalysis(null);

    try {

      // -------------------------
      // 1. GET GITHUB DATA
      // -------------------------

      const data = await getGitHubData(
        username.trim()
      );

      const profileData = data.profile;
      const reposData = data.repos;


      // -------------------------
      // 2. CALCULATE HEALTH SCORE
      // -------------------------

      const calculatedScore =
        calculateScore(profileData, reposData);

      if (score) {
        setPreviousScore(score.totalScore);
      } else {
        setPreviousScore(null);
      }

      setProfile(profileData);
      setRepos(reposData);
      setScore(calculatedScore);


      // -------------------------
      // 3. PREPARE DATA FOR AI
      // -------------------------

      // Only send the first 10 repositories
      // and only the information Gemini needs.

      const aiRepos =
        reposData.slice(0, 10).map((repo) => ({
          name: repo.name || "",
          description: repo.description || "",
          language: repo.language || "",
          stargazers_count:
            repo.stargazers_count || 0,
          forks_count:
            repo.forks_count || 0,
          fork: Boolean(repo.fork),
          homepage: repo.homepage || "",
          topics:
            Array.isArray(repo.topics)
              ? repo.topics
              : [],
          pushed_at: repo.pushed_at || "",
          created_at: repo.created_at || "",
        }));


      const aiProfile = {
        login: profileData.login || "",
        name: profileData.name || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        blog: profileData.blog || "",
        followers: profileData.followers || 0,
        following: profileData.following || 0,
        public_repos:
          profileData.public_repos || 0,
        public_gists:
          profileData.public_gists || 0,
      };


      // -------------------------
      // 4. SEND DATA TO GEMINI AI
      // -------------------------

      const aiResponse = await fetch(
        "http://localhost:5000/api/roast",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            profile: aiProfile,
            repos: aiRepos,
            score: calculatedScore,
          }),
        }
      );


      // -------------------------
      // 5. READ AI RESPONSE
      // -------------------------

      const contentType =
        aiResponse.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {

        const text =
          await aiResponse.text();

        throw new Error(
          text ||
          "Server returned an invalid response."
        );
      }


      const aiData =
        await aiResponse.json();


      if (!aiResponse.ok) {

        throw new Error(
          aiData.error ||
          "AI analysis failed."
        );
      }


      // -------------------------
      // 6. SAVE AI ANALYSIS
      // -------------------------

      setAnalysis(aiData);

    }

    catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Something went wrong."
      );

    }

    finally {

      setLoading(false);

    }
  }


  const scoreMessage =
    score
      ? getScoreMessage(
        score.totalScore
      )
      : null;

  const scoreImprovement =
    previousScore !== null && score
      ? score.totalScore - previousScore
      : null;

  return (

    <div className="app">


      {/* HERO */}

      <section className="hero">

        <div className="badge">

          <Flame size={16} />

          AI GitHub Portfolio Coach

        </div>


        <h1>

          Your GitHub isn't

          <span>
            {" "}recruiter ready.
          </span>

        </h1>


        <p>

          Enter your GitHub username.
          We'll analyze your profile,
          find the weak spots, and tell
          you exactly how to fix them.

        </p>


        <div className="search-box">

          <Search size={20} />

          <input

            type="text"

            placeholder="Enter GitHub username..."

            value={username}

            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }

            onKeyDown={(e) => {

              if (
                e.key === "Enter"
              ) {
                handleRoast();
              }

            }}

          />


          <button
            onClick={handleRoast}
          >

            {loading
              ? "Analyzing..."
              : "Roast Me 🔥"}

          </button>

        </div>


        {error && (

          <p className="error">
            {error}
          </p>

        )}

      </section>


      {/* RESULTS */}

      {profile && score && (

        <section className="results">


          {/* PROFILE */}

          <div className="profile-card">

            <img
              src={profile.avatar_url}
              alt={profile.login}
              className="avatar"
            />


            <div>

              <h2>

                {profile.name ||
                  profile.login}

              </h2>


              <p className="username">

                @{profile.login}

              </p>


              <p>

                {profile.bio ||
                  "No bio added."}

              </p>

            </div>

          </div>


          {/* HEALTH SCORE */}

          <div className="score-card">

            <div className="score-icon">
              <Trophy size={32} />
            </div>

            <div className="score-content">
              <div className="score-label">
                GITHUB HEALTH SCORE
              </div>

              <div className="score-number">
                {score.totalScore}
                <span>/100</span>
              </div>

              <h2>
                {scoreMessage.title}
              </h2>

              <p>
                {scoreMessage.text}
              </p>
            </div>

            {/* ADD THE NEW CODE HERE */}

            {scoreImprovement !== null && (
              <div className="score-improvement">
                <div>
                  <span>Previous</span>
                  <strong>{previousScore}</strong>
                </div>

                <div className="improvement-arrow">
                  →
                </div>

                <div>
                  <span>Current</span>
                  <strong>{score.totalScore}</strong>
                </div>

                <div
                  className={
                    scoreImprovement >= 0
                      ? "improvement-positive"
                      : "improvement-negative"
                  }
                >
                  {scoreImprovement >= 0 ? "+" : ""}
                  {scoreImprovement} points
                  {scoreImprovement >= 0 ? " ↑" : " ↓"}
                </div>
              </div>
            )}

          </div>


          {/* SCORE BREAKDOWN */}

          <h2 className="section-title">

            Score Breakdown

          </h2>


          <div className="score-grid">


            <ScoreItem
              name="Profile"
              score={score.profileScore}
              max={10}
            />


            <ScoreItem
              name="Projects"
              score={score.projectScore}
              max={30}
            />


            <ScoreItem
              name="Documentation"
              score={score.documentationScore}
              max={20}
            />


            <ScoreItem
              name="Activity"
              score={score.activityScore}
              max={15}
            />


            <ScoreItem
              name="Presentation"
              score={score.presentationScore}
              max={15}
            />


            <ScoreItem
              name="Community"
              score={score.communityScore}
              max={10}
            />

          </div>


          {/* QUICK STATS */}

          <div className="stats">

            <div className="stat">

              <strong>
                {profile.public_repos}
              </strong>

              <span>
                Repositories
              </span>

            </div>


            <div className="stat">

              <strong>
                {profile.followers}
              </strong>

              <span>
                Followers
              </span>

            </div>


            <div className="stat">

              <strong>
                {profile.following}
              </strong>

              <span>
                Following
              </span>

            </div>


            <div className="stat">

              <strong>

                {repos.reduce(
                  (total, repo) =>
                    total +
                    repo.stargazers_count,
                  0
                )}

              </strong>

              <span>
                Total Stars
              </span>

            </div>

          </div>


          {/* REPOSITORIES */}

          <h2 className="section-title">

            Repository Analysis

          </h2>


          <div className="repo-grid">

            {repos.map((repo) => (

              <div
                className="repo-card"
                key={repo.id}
              >

                <h3>
                  {repo.name}
                </h3>


                <p>

                  {repo.description ||

                    "No description. That's already a problem. 😅"}

                </p>


                <div className="repo-info">

                  <span>

                    <Star size={15} />

                    {repo.stargazers_count}

                  </span>


                  <span>

                    <GitFork size={15} />

                    {repo.forks_count}

                  </span>


                  <span>

                    {repo.language ||
                      "Unknown"}

                  </span>

                </div>


                <div className="repo-status">

                  {repo.description ? (

                    <span className="good">

                      <CheckCircle
                        size={15}
                      />

                      Description added

                    </span>

                  ) : (

                    <span className="bad">

                      <AlertTriangle
                        size={15}
                      />

                      Missing description

                    </span>

                  )}

                </div>

              </div>

            ))}

          </div>


          {/* AI ANALYSIS */}

{analysis && (

  <>

    <section className="ai-analysis">

      {/* ROAST */}

      <div className="ai-card roast-card">

        <h2>
          🔥 Your GitHub Roast
        </h2>

        <p>
          {analysis.roast}
        </p>

      </div>


      {/* RECRUITER VERDICT */}

      <div className="ai-card">

        <h2>
          👔 Recruiter 30-Second Test
        </h2>

        <div className="rating">

          {analysis.recruiterVerdict.rating}

        </div>

        <p>
          {analysis.recruiterVerdict.summary}
        </p>

      </div>


      {/* STRENGTHS */}

      <div className="ai-card">

        <h2>
          💪 What's Working
        </h2>

        <ul>

          {analysis.strengths.map(
            (strength, index) => (

              <li key={index}>
                {strength}
              </li>

            )
          )}

        </ul>

      </div>


      {/* PROBLEMS */}

      <div className="ai-card">

        <h2>
          🚨 Top Problems
        </h2>

        {analysis.topProblems.map(
          (problem, index) => (

            <div
              className="problem"
              key={index}
            >

              <h3>

                {problem.severity}
                {" — "}
                {problem.problem}

              </h3>

              <p>
                {problem.impact}
              </p>

            </div>

          )
        )}

      </div>


      {/* RESCUE PLAN */}

      <div className="ai-card">

        <h2>
          🚑 Rescue Plan
        </h2>

        {analysis.rescuePlan.map(
          (item) => (

            <div
              className="rescue-item"
              key={item.priority}
            >

              <h3>

                #{item.priority}{" "}
                {item.action}

              </h3>

              <p>
                {item.reason}
              </p>

              <small>
                ⏱ {item.estimatedTime}
              </small>

            </div>

          )
        )}

      </div>


      {/* QUICK WINS */}

      <div className="ai-card">

        <h2>
          ⚡ Quick Wins
        </h2>

        <ul>

          {analysis.quickWins.map(
            (win, index) => (

              <li key={index}>
                {win}
              </li>

            )
          )}

        </ul>

      </div>

    </section>


    {/* ROAST AGAIN */}

    {!loading && (

      <div className="roast-again">

        <div className="roast-again-content">

          <div className="roast-again-icon">
            🔥
          </div>

          <div className="roast-again-text">

            <h3>
              Made some improvements?
            </h3>

            <p>
              Push your changes to GitHub and
              run the roast again to see what changed.
            </p>

          </div>

        </div>

        <button onClick={handleRoast}>
          🔥 Roast Again
        </button>

      </div>

    )}

  </>

)}


        </section>

      )}

      {/* {profile && !loading && (
        <div className="roast-again">
          <button onClick={handleRoast}>
            🔥 Roast Again
          </button>

          <p>
            Fixed something on GitHub? Let's see if your score improved.
          </p>
        </div>
      )} */}


      {/* FEATURES */}

      {!profile &&
        !loading && (

          <section className="features">

            <div className="feature">

              <h3>
                🔥 Honest Roast
              </h3>

              <p>
                Get brutally honest but
                useful feedback about
                your GitHub profile.
              </p>

            </div>


            <div className="feature">

              <h3>
                👀 Recruiter Test
              </h3>

              <p>
                See what a recruiter might
                notice in the first 30 seconds.
              </p>

            </div>


            <div className="feature">

              <h3>
                🚀 Rescue Plan
              </h3>

              <p>
                Get actionable steps to
                improve your GitHub portfolio.
              </p>

            </div>

          </section>

        )}


    </div>

  );
}


/* SCORE COMPONENT */

function ScoreItem({
  name,
  score,
  max
}) {

  const percentage =
    (score / max) * 100;


  return (

    <div className="score-item">

      <div className="score-item-header">

        <span>
          {name}
        </span>

        <strong>
          {score}/{max}
        </strong>

      </div>


      <div className="progress">

        <div
          className="progress-fill"
          style={{
            width: `${percentage}%`
          }}
        />

      </div>

    </div>

  );

}


export default App;