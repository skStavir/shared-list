const AWS = require("aws-sdk");


AWS.config.update({region: 'ap-south-1'});
const dynamoDb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

const params = {
  TableName: 'shoppinglist',
};


function writeCallBack() {
  return function (err, data) {
    if (err) {
      console.log("Error in updating data", err);
      return {
        'statuCode': 500,
        'body': JSON.stringify(err)
      };
    } else {
      console.log("Successfully updated data", data);
      return {
        'statuCode': 500
      };
    }
  };
}

function readCallBack() {
  return function (err, data) {
    if (err) {
      return 'Error';
    } else {
      return AWS.DynamoDB.Converter.unmarshall(data.Item);
    }
  };
}

function buildSuccessPayload(shoppinglist) {
  return {
    'statusCode': 200,
    'body': JSON.stringify(shoppinglist),
    'isBase64Encoded': false
  };
}

exports.handler = async (event) => {
  let payload = event.payload;

  if (typeof event.payload != 'undefined' || !event.payload || !event.payload.id) {
    return {
      'statuCode': 400,
      'body': 'Invalid payload ' + JSON.stringify(event.payload)
    }
  }

  let updateResponse = await dynamoDb.put(event.payload, writeCallBack()).promise();
  if (updateResponse.statuCode != 200) {
    return updateResponse;
  }


  params.Key = {
    'id': event.payload.id
  };
  let shoppinglist = await dynamoDb.get(params, readCallBack()).promise();

  console.log(shoppinglist);
  //TODO build failure payloads
  return buildSuccessPayload(shoppinglist);
};
