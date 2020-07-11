const AWS = require("aws-sdk");

AWS.config.update({region: 'ap-south-1'});
const dynamoDb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

const params = {
  TableName: 'shoppinglist',
};

exports.handler = async (event) => {
  params.Key = {
    'id': event.pathParameters.id
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
