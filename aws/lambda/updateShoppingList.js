const AWS = require("aws-sdk");

AWS.config.update({region: 'us-east-1'});
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
    TableName: 'shared-list',
    Key: {
      'id': payload.id
    }
  };

  let lastUpdated = Math.floor(new Date());

  let shoppingList = await dynamoDb.get(getParams, readCallBack()).promise();

  console.log("clientId " + payload.clientId);
  if (payload.action == 'ADD') {
    console.log(`includes ${shoppingList.Item.pending.includes(payload.item)}`);
    if (!shoppingList.Item.pending.includes(payload.item)) {
      shoppingList.Item.pending.push(payload.item)
    }
  } else if (payload.action == 'REMOVE') {
    shoppingList.Item.pending = removeItemFromArray(shoppingList.Item.pending, payload.item);
  } else if (payload.action == 'PICKED') {
    shoppingList.Item.pending = removeItemFromArray(shoppingList.Item.pending, payload.item);
    shoppingList.Item.cart.push(payload.item);
  } else if (payload.action == 'DROPPED') {
    shoppingList.Item.cart = removeItemFromArray(shoppingList.Item.cart, payload.item);
    shoppingList.Item.pending.push(payload.item);
  } else {
    return buildBadRequestResponse(`Invalid payload, action ${payload.action} is not supported`);
  }

  shoppingList.Item.lastUpdated = lastUpdated;

  //TODO exception handling
  //TODO optimistic locking and retry
  let writeParams = {
    TableName: 'shared-list',
    Item: shoppingList.Item
  };
  await dynamoDb.put(writeParams, writeCallBack()).promise();

  //TODO build failure payloads
  return buildSuccessPayload(JSON.stringify(shoppingList.Item));
};
