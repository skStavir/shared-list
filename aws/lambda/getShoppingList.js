const AWS = require("aws-sdk");

AWS.config.update({region: 'ap-south-1'});
const ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});


const params = {
  TableName: 'shoppinglist',
  Key: {
    'id': '1',
  }
};
exports.handler = async (event) => {
  let shoppinglist = await ddb.get(params, function (err, data) {
    if (err) {
      return 'Error';
    } else {
      return AWS.DynamoDB.Converter.unmarshall(data.Item);
    }
  }).promise();

  console.log(shoppinglist);
  return shoppinglist;
};
