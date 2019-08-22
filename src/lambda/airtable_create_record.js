import Airtable from "airtable";
const { AIRTABLE_API_KEY } = process.env;
const AIRTABLE_API_ENDPOINT = "https://api.airtable.com";

exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);
  const { baseId, record, tableId } = body;

  if (!baseId || !record || !tableId) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'baseId, record, and tableId are required' })
    }
  }

  try {
    await Airtable.configure({
      endpointUrl: AIRTABLE_API_ENDPOINT,
      apiKey: AIRTABLE_API_KEY
    });
    const base = await Airtable.base(baseId);
    const table = await base(tableId);

    /* return {
      statusCode: 200,
      body: JSON.stringify(record)
    }; */

    const response = await table.create(record);

    return {
      statusCode: 200,
      body: JSON.stringify({ response })
    };
  } catch (error) {
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error })
    };
  }
};
