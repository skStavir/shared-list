const AWS = require("aws-sdk");

AWS.config.update({ region: 'ap-south-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

const params = {
    TableName: 'shoppinglist',
    Count: true
};


exports.handler = async(event) => {
    // TODO implement
    dynamoDb.describeTable(params, function(err, data) {
        if (err) {
            console.err(err);
        }
        else {
            var table = data['Table'];
            console.log("items = " + table['ItemCount']);
        }
    });
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
