import "file-loader?name=normalize.css!../node_modules/normalize.css/normalize.css";
import "file-loader?name=styles.css!./styles.css";

const AIRTABLE_BASE_ID = "appLrEs4dudqnhXk9";
const MY_NAME = "Elizabeth Schafer";

const getGithubNotifications = async () => {
  console.log('getGithubNotifications');
  try {
    const response = await fetch("/.netlify/functions/github_get_notifications");
    const data = await response.json();
    return data.notifications;
  } catch (error) {
    // console.log(error)
  }
};

const getJiraIssues = async () => {
  console.log('getJiraIssues');
  const response = await fetch("/.netlify/functions/jira_get_issues");
  const data = await response.json();
  return data.issues;
};

const getAirtableRecord = async body => {
  console.log('getAirtableRecord');
  try {
    const response = await fetch("/.netlify/functions/airtable_get_record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const { record } = await response.json();
    return record;
  } catch (error) {
    console.log(error);
  }
};

const createAirtableRecord = async body => {
  console.log('createAirtableRecord');
  const response = await fetch("/.netlify/functions/airtable_create_record", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
};

const updateAirtableRecord = async body => {
  console.log('updateAirtableRecord');
  try {
    const response = await fetch("/.netlify/functions/airtable_update_record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.log(error);
  }
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const handleGithubToAirtableButtonClick = async () => {
  const notifications = await getGithubNotifications();

  asyncForEach(notifications, async notification => {
    const airtableRecord = await getAirtableRecord({
      baseId: AIRTABLE_BASE_ID,
      tableId: "Watched Issues",
      formula: `id = ${notification.id}`
    });

    const recordData = {
      assignee:
        notification.reason === "review_requested" ||
        notification.reason === "mention"
          ? MY_NAME
          : "",
      id: notification.id,
      key: notification.subject.url.split("https://api.github.com/repos/")[1],
      project: notification.repository.full_name,
      reporter: notification.reason === "author" ? MY_NAME : "",
      source: "Github",
      // status
      title: notification.subject.title,
      type: notification.subject.type,
      updatedDateTime: notification.updated_at
    };

    console.log(airtableRecord);
    console.log(recordData);
    if (airtableRecord) {
      console.log('update...')
      await updateAirtableRecord({
        baseId: AIRTABLE_BASE_ID,
        tableId: "Watched Issues",
        recordId: airtableRecord.id,
        record: recordData
      });
    } else {
      console.log('create...');
      await createAirtableRecord({
        baseId: AIRTABLE_BASE_ID,
        tableId: "Watched Issues",
        record: recordData
      });
    }
  });
};

const handleJiraToAirtableButtonClick = async () => {
  const issues = await getJiraIssues();
  issues.issues.forEach(issue => {
    createAirtableRecord({
      baseId: AIRTABLE_BASE_ID,
      tableId: "Watched Issues",
      record: {
        assignee: issue.fields.assignee && issue.fields.assignee.displayName,
        id: issue.id,
        key: issue.key,
        project: issue.key.match(/(\w+)-/)[1],
        reporter: issue.fields.reporter && issue.fields.reporter.displayName,
        source: "Jira",
        status: issue.fields.status.name,
        title: issue.fields.summary,
        type: issue.fields.issuetype.name,
        updatedDateTime: issue.fields.updated
      }
    });
  });
};

const githubToAirtableButton = document.querySelector("#github-to-airtable");
const jiraToAirtableButton = document.querySelector("#jira-to-airtable");

githubToAirtableButton.addEventListener(
  "click",
  handleGithubToAirtableButtonClick
);
jiraToAirtableButton.addEventListener("click", handleJiraToAirtableButtonClick);
