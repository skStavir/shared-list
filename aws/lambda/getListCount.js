const AWS = require("aws-sdk");

AWS.config.update({ region: 'ap-south-1' });
const dynamoDb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

const params = {
    TableName: 'shoppinglist',
};

exports.handler = async(event) => {
    console.log("getting item count");
    
    let out = await dynamoDb.describeTable(params, function(err, data) {
        console.log("query done")
        if (err) {
            console.log(err, err.stack);
            return err;
        } // an error occurred
        else {
            console.log("data" + data);
            return data;
        } // successful response

    }).promise();
    
    console.log(out.Table.ItemCount);
    const response = {
        statusCode: 200,
        body: out.Table.ItemCount,
    };
    return response;
}
