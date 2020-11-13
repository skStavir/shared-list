const AWS = require("aws-sdk");

AWS.config.update({ region: 'ap-south-1' });
const dynamoDb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var ses = new AWS.SES({ region: 'ap-south-1' });

const params = {
    TableName: 'shoppinglist',
};

exports.handler = async(event) => {
    let count = 0;
    console.log("getting item count");

    let out = await dynamoDb.describeTable(params, function(err, data) {
        console.log("query done")
        if (err) {
            console.err(err, err.stack);
            return {};
        } // an error occurred
        else {
            return data;
        } // successful response

    }).promise();

    count = out.Table.ItemCount;
    console.log(count);

    var emailParams = {
        Destination: {
            ToAddresses: ['admin@onenzeros.in'],
        },
        Message: {
            Body: {
                Text: { Data: `Total shoppinglist is : ${count}` },
            },

            Subject: { Data: "Quick shoppinglist stats" },
        },
        Source: "admin@onenzeros.in",
    };

    let emailResult = await ses.sendEmail(emailParams).promise();
    console.log(emailResult);


    const response = {
        statusCode: 200,
        body: out.Table.ItemCount,
    };
    return response;
}
