const AWS = require("aws-sdk");

AWS.config.update({region: 'ap-south-1'});
const dynamoDb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

const params = {
  TableName: 'shoppinglist',
};

function generateId() {
  return Math.random().toString().substring(2);
}

const HEADERS = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
};

function buildInitialShoppingList(id, lastUpdated) {
  let newParams = {
    TableName: 'shoppinglist',
    Item: {
      'id': id,
      'pending': ['Milk'],
      'cart': [],
      'lastUpdated': lastUpdated
    }
  };
  return newParams;
}

function writeCallBack() {
  return function (err, data) {
    if (err) {
      console.log("Error in initializing data", err);
    }
  };
}

function readCallBack() {
  return function (err, data) {
    if (err) {
      console.log('Error reading from database');
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
  let id;

  if (typeof event.pathParameters != 'undefined' && event.pathParameters) {
    id = event.pathParameters.id;
    console.log('id: ' + id);
  }

  if (typeof id === 'undefined' || !id) {
    //TODO use uuid
    id = generateId();
    let newParams = buildInitialShoppingList(id, Math.floor(new Date()));
    console.log('initializing database with generated id: ' + id);
    await dynamoDb.put(newParams, writeCallBack()).promise();
  }

  params.Key = {
    'id': id
  };
  let shoppinglist = await dynamoDb.get(params, readCallBack()).promise();

  console.log("Return Shopping List " + JSON.stringify(shoppinglist.Item));
  //TODO build failure payloads
  return buildSuccessPayload(JSON.stringify(shoppinglist.Item));
};
