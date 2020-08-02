const AWS = require("aws-sdk");

AWS.config.update({region: 'ap-south-1'});
const dynamoDb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

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

//Payload format {id:24, operation:ADD/REMOVE/PICKED/DROPPED item:itemname}

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

function buildBadRequestResponse(message) {
  return {
    'statusCode': 400,
    'body': message,
    'isBase64Encoded': false,
    headers: HEADERS
  };
}

function removeItemFromArray(array, itemToRemove) {
  return array.filter(item => item != itemToRemove)
}

exports.handler = async (event) => {

  console.log("body: " + event.body);

  let payload;
  if (typeof event.body === 'undefined' || !event.body) {
    return buildBadRequestResponse('Invalid payload ' + JSON.stringify(event))
  } else {
    payload = JSON.parse(event.body);
    if (!payload.id) {
      return buildBadRequestResponse('Invalid payload, if of the entry is missing')
    } else if (!payload.action) {
      return buildBadRequestResponse('Invalid payload, action is missing')
    }
  }

  //Get the current version
  const getParams = {
    TableName: 'shoppinglist',
    Key: {
      'id': payload.id
    }
  };
  let lastVersion = await dynamoDb.get(getParams, readCallBack()).promise();
  console.log(`lastVersion ${JSON.stringify(lastVersion)}`);
  if (payload.action == 'ADD') {
    lastVersion.Item.pending.push(payload.item)
  } else if (payload.action == 'REMOVE') {
    lastVersion.Item.pending = removeItemFromArray(lastVersion.Item.pending, payload.item);
  } else if (payload.action == 'PICKED') {
    lastVersion.Item.pending = removeItemFromArray(lastVersion.Item.pending, payload.item);
    lastVersion.Item.cart.push(payload.item);
  } else if (payload.action == 'DROPPED') {
    lastVersion.Item.cart = removeItemFromArray(lastVersion.Item.cart, payload.item);
    lastVersion.Item.pending.push(payload.item);
  } else {
    return buildBadRequestResponse(`Invalid payload, action ${payload.action} is not supported`);
  }
  console.log(`version after update ${JSON.stringify(lastVersion)}`);

  //TODO exception handling
  let writeParams = {
    TableName: 'shoppinglist',
    Item: lastVersion.Item
  };
  await dynamoDb.put(writeParams, writeCallBack()).promise();

  //TODO build failure payloads
  return buildSuccessPayload(JSON.stringify(lastVersion.Item));
};
