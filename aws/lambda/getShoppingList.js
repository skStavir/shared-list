const AWS = require("aws-sdk");

AWS.config.update({region: 'ap-south-1'});
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


const params = {
  TableName: 'shoppinglist',
  Key: {
    'id': {
      S: '1'
    },
  }
};
exports.handler = async (event) => {
  let shoppinglist = await ddb.getItem(params, function (err, data) {
    if (err) {
      return 'Error';
    } else {
      return JSON.stringify(data.Item);
    }
  }).promise();

  console.log(shoppinglist);
  return shoppinglist;
};
