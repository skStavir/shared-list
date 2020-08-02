const AWS = require("aws-sdk");

AWS.config.update({region: 'ap-south-1'});
const dynamoDb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

const params = {
  TableName: 'shoppinglist',
};

const HEADERS = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
};

function writeCallBack() {
  return function (err, data) {
    if (err) {
      console.log("Error in updating data", err);
    }
  };
}

function readCallBack() {
  return function (err, data) {
    if (err) {
      console.log('Error');
    }
  };
}

function buildSuccessPayload(shoppinglist) {
  return {
    'statusCode': 200,
    'body': shoppinglist,
    'isBase64Encoded': false,
    headers: HEADERS
  };
}

exports.handler = async (event) => {

  console.log("body: " + event.body);

  let payload;
  if (typeof event.body === 'undefined' || !event.body) {

    return {
      'statuCode': 400,
      'body': 'Invalid payload ' + JSON.stringify(event),
      'isBase64Encoded': false,
      headers: HEADERS
    }
  } else {
    payload = JSON.parse(event.body);
    if (!payload.id) {
      return {
        'statuCode': 400,
        'body': 'Invalid payload, if of the entry is missing',
        'isBase64Encoded': false,
        headers: HEADERS
      }
    }
  }

  //TODO exception handling
  let writeParams = {
    TableName: 'shoppinglist',
    Item: payload
  };
  await dynamoDb.put(writeParams, writeCallBack()).promise();

  params.Key = {
    'id': payload.id
  };
  let shoppinglist = await dynamoDb.get(params, readCallBack()).promise();

  console.log('Data after update' + JSON.stringify(shoppinglist.Item));
  //TODO build failure payloads
  return buildSuccessPayload(JSON.stringify(shoppinglist.Item));
};
