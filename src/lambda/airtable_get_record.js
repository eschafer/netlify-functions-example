import Airtable from "airtable";
const { AIRTABLE_API_KEY } = process.env;
const AIRTABLE_API_ENDPOINT = "https://api.airtable.com";

exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);
  const { baseId, formula, tableId } = body;

  if (!baseId || !formula || !tableId) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'baseId, formula, and tableId are required' })
    }
  }

  await Airtable.configure({
    endpointUrl: AIRTABLE_API_ENDPOINT,
    apiKey: AIRTABLE_API_KEY
  });
  const base = await Airtable.base(baseId);
  const table = await base(tableId);

  const query = await table.select({
    view: 'All',
    filterByFormula: formula
  });

  try {
    const response = await new Promise((resolve, reject) => {
      query.firstPage(function(err, records) {
        if (err) {
          if (err.statusCode === 422) {
            resolve(err);
            return;
          }
          reject(err);
        }
        resolve({
          statusCode: 200,
          record: records[0],
        });
      });
    });

    return {
      statusCode: response.statusCode,
      body: JSON.stringify({
        record: response.record
      })
    };
  } catch (error) {
    console.log('error', error);
    return {
      statusCode: 404,
      body: JSON.stringify({
        error
      })
    };
  }
};
