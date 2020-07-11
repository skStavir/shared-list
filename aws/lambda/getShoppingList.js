const AWS = require("aws-sdk");


AWS.config.update({region: 'ap-south-1'});
const dynamoDb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

const params = {
  TableName: 'shoppinglist',
};

exports.handler = async (event) => {
  let id;

  if (typeof event.pathParameters != 'undefined' && event.pathParameters) {
    id = event.pathParameters.id;
  }

  if (typeof id === 'undefined' || !id) {
    //TODO use uuid
    id = Math.random().toString().substring(2);
    let newParams = {
      TableName: 'shoppinglist',
      Item: {
        'id': id,
        'items': ['rice', 'pen'],
        'cart': ['atta', 'pencil'],
      }
    };
    await dynamoDb.put(newParams, function (err, data) {
      if (err) {
        console.log("Error in initializing data", err);
      } else {
        console.log("Successfully initialized data", data);
      }
    }).promise();
  }

  params.Key = {
    'id': id
  };
  let shoppinglist = await dynamoDb.get(params, function (err, data) {
    if (err) {
      return 'Error';
    } else {
      return AWS.DynamoDB.Converter.unmarshall(data.Item);
    }
  }).promise();

  console.log(shoppinglist);
  return {
    'statusCode': 200,
    'body': JSON.stringify(shoppinglist),
    'isBase64Encoded': false
  };
};
