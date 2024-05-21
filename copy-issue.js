const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const octokit = github.getOctokit(token);

    const context = github.context;
    const issue = context.payload.issue;

    if (!issue) {
      core.setFailed('This action can only be triggered by issue events.');
      return;
    }

    // Extract issue link from the issue body
    const issueBody = issue.body;
    const issueLinkRegex = /(https:\/\/github\.com\/[^\/]+\/[^\/]+\/issues\/\d+)/;
    const match = issueLinkRegex.exec(issueBody);

    if (!match) {
      core.setFailed('No issue link found in the issue body.');
      return;
    }

    const linkedIssueUrl = match[1];
    const [, owner, repo, issueNumber] = linkedIssueUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/);

    // Get the linked issue
    const { data: linkedIssue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    });

    // Create a new issue in the current repository
    const { data: newIssue } = await octokit.issues.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: `Copy of ${linkedIssue.title}`,
      body: linkedIssue.body
    });

    core.info(`Created issue #${newIssue.number}: ${newIssue.title}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
