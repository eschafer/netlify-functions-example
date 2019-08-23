const fetch = require('node-fetch').default;
const AIRTABLE_BASE_ID = "appLrEs4dudqnhXk9";
const MY_NAME = "Elizabeth Schafer";
const { API_URL } = process.env;

const getGithubNotifications = async () => {
  try {
    const response = await fetch(`${API_URL}/.netlify/functions/github_get_notifications`);
    const data = await response.json();
    return data.notifications;
  } catch (error) {
    console.log(error)
  }
};

const getJiraIssues = async () => {
  const response = await fetch(`${API_URL}/.netlify/functions/jira_get_issues`);
  const data = await response.json();
  return data.issues;
};

const getAirtableRecord = async body => {
  try {
    const response = await fetch(`${API_URL}/.netlify/functions/airtable_get_record`, {
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
  console.log('createAirtableRecord', body);
  try {
    const response = await fetch(`${API_URL}/.netlify/functions/airtable_create_record`, {
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

const updateAirtableRecord = async body => {
  console.log('updateAirtableRecord', body);
  try {
    const response = await fetch(`${API_URL}/.netlify/functions/airtable_update_record`, {
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

const githubToAirtable = async () => {
  console.log('requesting data...');
  const notifications = await getGithubNotifications();

  await asyncForEach(notifications, async notification => {
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
      updatedDateTime: new Date(notification.updated_at).toISOString()
    };

    if (airtableRecord) {
      if (new Date(airtableRecord.fields.updatedDateTime).toISOString() !== new Date(notification.updated_at).toISOString()) {
        await updateAirtableRecord({
          baseId: AIRTABLE_BASE_ID,
          tableId: "Watched Issues",
          recordId: airtableRecord.id,
          record: recordData
        });
      }
    } else {
      await createAirtableRecord({
        baseId: AIRTABLE_BASE_ID,
        tableId: "Watched Issues",
        record: recordData
      });
    }
  });
  console.log('done!');
};

const jiraToAirtable = async () => {
  console.log('requesting data...');
  const issues = await getJiraIssues();
  
  await asyncForEach(issues.issues, async (issue) => {
    const airtableRecord = await getAirtableRecord({
      baseId: AIRTABLE_BASE_ID,
      tableId: "Watched Issues",
      formula: `id = ${issue.id}`
    });

    const recordData = {
      assignee: issue.fields.assignee && issue.fields.assignee.displayName,
      id: issue.id,
      key: issue.key,
      project: issue.key.match(/(\w+)-/)[1],
      reporter: issue.fields.reporter && issue.fields.reporter.displayName,
      source: "Jira",
      status: issue.fields.status.name,
      title: issue.fields.summary,
      type: issue.fields.issuetype.name,
      updatedDateTime: new Date(issue.fields.updated).toISOString()
    };

    if (airtableRecord) {
      if (new Date(airtableRecord.fields.updatedDateTime).toISOString() !== new Date(issue.fields.updated).toISOString()) {
        updateAirtableRecord({
          baseId: AIRTABLE_BASE_ID,
          tableId: "Watched Issues",
          recordId: airtableRecord.id,
          record: recordData,
        });
      }
    } else {
      createAirtableRecord({
        baseId: AIRTABLE_BASE_ID,
        tableId: "Watched Issues",
        record: recordData,
      });
    }
  });

  console.log('done!');
};


exports.handler = async (event, context) => {
  await githubToAirtable();
  // await jiraToAirtable();

  return {
    statusCode: 200,
    body: "Hello, World"
  };
};
