import fetch from "node-fetch";
const { JIRA_TOKEN, JIRA_EMAIL } = process.env;
const JIRA_API_ENDPOINT = "https://vitalsource.atlassian.net/rest/api/3/search?jql=watcher%20%3D%20currentUser%28%29%20AND%20resolution%20%3D%20Unresolved%20ORDER%20BY%20priority%20DESC%2C%20updated%20DESC";

exports.handler = async (event, context) => {
  const buf = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`, 'ascii');

  try {
    const response = await fetch(JIRA_API_ENDPOINT, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${buf.toString('base64')}`
      }
    });
    const issues = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ issues })
    };
  } catch (error) {
    return {
      statusCode: 422,
      body: String(error)
    };
  }
};
