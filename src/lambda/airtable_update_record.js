import Airtable from "airtable";
const { AIRTABLE_API_KEY } = process.env;
const AIRTABLE_API_ENDPOINT = "https://api.airtable.com";

exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);
  const { baseId, record, recordId, tableId } = body;

  if (!baseId || !record || !recordId || !tableId) {
    return {
      statusCode: 422,
      body: JSON.stringify({
        error: "baseId, record, recordId, and tableId are required"
      })
    };
  }

  try {
    await Airtable.configure({
      endpointUrl: AIRTABLE_API_ENDPOINT,
      apiKey: AIRTABLE_API_KEY
    });
    const base = await Airtable.base(baseId);
    const table = await base(tableId);

    const response = await table.update(recordId, record, { typecast: true });

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
