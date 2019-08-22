import "file-loader?name=normalize.css!../node_modules/normalize.css/normalize.css";
import "file-loader?name=styles.css!./styles.css";

const AIRTABLE_BASE_ID = 'appLrEs4dudqnhXk9';
const MY_NAME = 'Elizabeth Schafer';

const getGithubNotifications = async () => {
  const response = await fetch('/.netlify/functions/github_get_notifications');
  const data = await response.json();
  return data.notifications;
}

const getJiraIssues = async () => {
  const response = await fetch('/.netlify/functions/jira_get_issues');
  const data = await response.json();
  return data.issues;
}

const createAirtableRecord = async (body) => {
  console.log(body);
  const response = await fetch("/.netlify/functions/airtable_create_record", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

const handleGithubToAirtableButtonClick = async () => {
  const notifications = await getGithubNotifications();
  console.log(notifications);
  notifications.forEach((notification) => {
    createAirtableRecord({
      baseId: AIRTABLE_BASE_ID,
      tableId: "Watched Issues",
      record: {
        assignee: notification.reason === 'review_requested' ? MY_NAME : '',
        id: notification.id,
        key: notification.subject.url.split('https://api.github.com/repos/')[1],
        project: notification.repository.full_name,
        reporter: notification.reason === 'author' ? MY_NAME : '',
        source: 'Github',
        // status
        title: notification.subject.title,
        type: notification.subject.type,
        updatedDateTime: notification.updated_at,
      }
    });
  });
};

const handleJiraToAirtableButtonClick = async () => {
  const issues = await getJiraIssues();
  console.log(issues);
  issues.issues.forEach((issue) => {
    console.log(issue);
    createAirtableRecord({
      baseId: AIRTABLE_BASE_ID,
      tableId: "Watched Issues",
      record: {
        assignee: issue.fields.assignee && issue.fields.assignee.displayName,
        id: issue.id,
        key: issue.key,
        project: issue.key.match(/(\w+)-/)[1],
        reporter: issue.fields.reporter && issue.fields.reporter.displayName,
        source: 'Jira',
        status: issue.fields.status.name,
        title: issue.fields.summary,
        type: issue.fields.issuetype.name,
        updatedDateTime: issue.fields.updated,
      }
    });
  });
}

const githubToAirtableButton = document.querySelector('#github-to-airtable');
const jiraToAirtableButton = document.querySelector('#jira-to-airtable');

githubToAirtableButton.addEventListener('click', handleGithubToAirtableButtonClick);
jiraToAirtableButton.addEventListener('click', handleJiraToAirtableButtonClick);
