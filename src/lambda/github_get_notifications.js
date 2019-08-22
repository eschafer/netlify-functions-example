import fetch from "node-fetch";
const { GITHUB_TOKEN } = process.env;
const GITHUB_API_ENDPOINT = "https://api.github.com/notifications?all=true";

exports.handler = async (event, context) => {
  try {
    const response = await fetch(GITHUB_API_ENDPOINT, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`
      }
    });
    const notifications = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ notifications })
    };
  } catch (error) {
    return {
      statusCode: 422,
      body: String(error)
    };
  }
};
